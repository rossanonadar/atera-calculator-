(function () {
    const ATERA_SEAT_RATE = 149;

    const isEditor = () => {
        if (typeof document === 'undefined' || !document.body) {
            return false;
        }

        return document.body.classList.contains('block-editor-page');
    };

    const getApiUrl = (container) => {
        const endpoint = container.getAttribute('data-config-endpoint') || '/atera/v1/calculator-config';
        const root = window.wpApiSettings && window.wpApiSettings.root ? window.wpApiSettings.root : '/wp-json/';
        const normalisedRoot = root.endsWith('/') ? root.slice(0, -1) : root;

        if (endpoint.startsWith('http')) {
            return endpoint;
        }

        return `${normalisedRoot}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    };

    const normaliseSlider = (slider) => {
        if (!slider || typeof slider !== 'object' || !slider.id) {
            return null;
        }

        const min = Number(slider.min) || 0;
        const max = Number(slider.max) || 0;
        const step = Number(slider.step) || 1;
        const defaultValue = slider.default !== undefined ? Number(slider.default) : min;

        return {
            id: slider.id,
            label: slider.label || slider.id,
            min,
            max,
            step,
            default: defaultValue,
            marks: Array.isArray(slider.marks) ? slider.marks : [],
            format: slider.format || { type: 'number' },
        };
    };

    const formatMarkValue = (slider, mark) => {
        if (typeof mark !== 'number') {
            return mark;
        }

        const format = slider.format || { type: 'number' };

        if (format.type === 'currency') {
            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: format.currency || 'USD',
                    maximumFractionDigits: format.maximumFractionDigits ?? 0,
                }).format(mark);
            } catch (error) {
                return `$${mark.toLocaleString()}`;
            }
        }

        if (format.thousands) {
            return mark.toLocaleString();
        }

        return mark;
    };

    const setRangeGradient = (input, slider) => {
        if (!input || !slider) {
            return;
        }

        const range = slider.max - slider.min;
        const numericValue = Number(input.value);
        const clamped = Number.isFinite(numericValue)
            ? Math.min(Math.max(numericValue, slider.min), slider.max)
            : slider.min;
        const progress = range > 0 ? ((clamped - slider.min) / range) * 100 : 0;
        const safeProgress = Math.max(0, Math.min(100, progress));

        input.style.background = `linear-gradient(90deg, #f5c26b 0%, #e7a55b ${safeProgress}%, #e3dbd9 ${safeProgress}%, #e3dbd9 100%)`;
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount || 0);

    const calculateFigures = (values) => {
        const technicians = Number(values.technicians) || 0;
        const endpoints = Number(values.endpoints) || 0;
        const endpointRate = Number(values.endpointRate) || 0;

        const currentAnnual = endpoints * endpointRate * 12;
        const ateraAnnual = technicians * ATERA_SEAT_RATE * 12;
        const savings = Math.max(currentAnnual - ateraAnnual, 0);

        return {
            savings,
            ateraAnnual,
            currentAnnual,
        };
    };

    const buildSliderField = (slider) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'atera-compact-calculator__slider-field';
        wrapper.setAttribute('data-slider', slider.id);

        const heading = document.createElement('div');
        heading.className = 'atera-compact-calculator__slider-heading';
        const label = document.createElement('span');
        label.className = 'atera-compact-calculator__slider-label';
        label.textContent = slider.label;
        heading.appendChild(label);

        const input = document.createElement('input');
        input.type = 'range';
        input.className = 'atera-compact-calculator__range';
        input.min = slider.min;
        input.max = slider.max;
        input.step = slider.step;
        input.value = slider.default;
        input.setAttribute(`data-input-${slider.id}`, 'true');
        setRangeGradient(input, slider);

        const scale = document.createElement('div');
        scale.className = 'atera-compact-calculator__scale';
        slider.marks.forEach((mark) => {
            const markNode = document.createElement('span');
            markNode.textContent = formatMarkValue(slider, mark);
            scale.appendChild(markNode);
        });

        wrapper.appendChild(heading);
        wrapper.appendChild(input);
        wrapper.appendChild(scale);

        return { wrapper, input };
    };

    const initialiseCalculator = (container, config) => {
        if (!container || !config || !Array.isArray(config.sliders)) {
            return;
        }

        const panel = container.querySelector('[data-calculator-panel]');
        if (!panel) {
            return;
        }

        panel.innerHTML = '';

        const sliderBindings = config.sliders.map((slider) => {
            const { wrapper, input } = buildSliderField(slider);
            panel.appendChild(wrapper);
            return {
                slider,
                input,
            };
        });

        if (!sliderBindings.length) {
            panel.innerHTML = '';
            return;
        }

        const savingsNode = container.querySelector('[data-display-savings]');
        const ateraCostNode = container.querySelector('[data-display-atera-cost]');
        const currentCostNode = container.querySelector('[data-display-current-cost]');

        const updateOutputs = () => {
            const values = {};
            sliderBindings.forEach(({ slider, input }) => {
                values[slider.id] = input.value;
                setRangeGradient(input, slider);
            });

            const figures = calculateFigures(values);

            if (savingsNode) {
                savingsNode.textContent = formatCurrency(figures.savings);
            }
            if (ateraCostNode) {
                ateraCostNode.textContent = formatCurrency(figures.ateraAnnual);
            }
            if (currentCostNode) {
                currentCostNode.textContent = formatCurrency(figures.currentAnnual);
            }
        };

        sliderBindings.forEach(({ input }) => {
            input.addEventListener('input', updateOutputs);
            input.addEventListener('change', updateOutputs);
        });

        updateOutputs();
    };

    const fetchConfig = (container) =>
        fetch(getApiUrl(container), {
            credentials: 'same-origin',
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(response)))
            .then((data) => {
                const sliders = (data?.sliders || [])
                    .map(normaliseSlider)
                    .filter(Boolean);

                if (!sliders.length) {
                    return null;
                }

                return { sliders };
            })
            .catch(() => null);

    const bootstrap = () => {
        if (isEditor()) {
            return;
        }

        document.querySelectorAll('.atera-compact-calculator').forEach((calculator) => {
            const panel = calculator.querySelector('[data-calculator-panel]');

            fetchConfig(calculator).then((config) => {
                if (!config) {
                    if (panel) {
                        panel.innerHTML = '<p class="atera-compact-calculator__loading">' +
                            'Unable to load calculator settings.</p>';
                    }
                    return;
                }

                initialiseCalculator(calculator, config);
            });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
