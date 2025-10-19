(function () {
    const utils = window.ateraCompactCalculatorUtils || {};
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

    const normaliseSlider = utils.normaliseSlider || ((slider) => slider);
    const formatMarkValue = utils.formatMarkValue || ((slider, mark) => mark);
    const applyRangeGradient = utils.applyRangeGradient || (() => {});

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount || 0);

    const calculateFigures = (values) => (
        utils.calculateFigures ? utils.calculateFigures(values, ATERA_SEAT_RATE) : { savings: 0, ateraAnnual: 0, currentAnnual: 0 }
    );

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
        applyRangeGradient(input, slider);

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
                applyRangeGradient(input, slider);
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
