(function () {
    const FALLBACK_CONFIG = {
        sliders: [
            {
                id: 'technicians',
                min: 0,
                max: 20,
                step: 1,
                default: 10,
                marks: [0, 5, 10, 15, 20],
                format: { type: 'number' },
            },
            {
                id: 'endpoints',
                min: 0,
                max: 2500,
                step: 100,
                default: 1200,
                marks: [0, 500, 1000, 1500, 2000, 2500],
                format: { type: 'number', thousands: true },
            },
            {
                id: 'endpointRate',
                min: 1,
                max: 20,
                step: 1,
                default: 7,
                marks: [1, 3, 5, 7, 20],
                format: { type: 'currency', currency: 'USD' },
            },
        ],
    };

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

    const formatSliderValue = (slider, rawValue) => {
        const value = Number(rawValue) || 0;
        const format = slider && slider.format ? slider.format : { type: 'number' };

        if (format.type === 'currency') {
            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: format.currency || 'USD',
                    maximumFractionDigits: 0,
                }).format(value);
            } catch (error) {
                return `$${value.toLocaleString()}`;
            }
        }

        if (format.thousands) {
            return value.toLocaleString();
        }

        return value;
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

    const applySliderAttributes = (fieldWrapper, slider) => {
        if (!fieldWrapper) {
            return;
        }

        const input = fieldWrapper.querySelector(`[data-input-${slider.id}]`);
        if (input) {
            input.min = slider.min;
            input.max = slider.max;
            input.step = slider.step;
            input.value = slider.default;
        }

        const scale = fieldWrapper.querySelector('.atera-compact-calculator__scale');
        if (scale && Array.isArray(slider.marks)) {
            scale.innerHTML = slider.marks
                .map((mark) => {
                    const label = typeof mark === 'number' ? formatSliderValue(slider, mark) : mark;
                    return `<span>${label}</span>`;
                })
                .join('');
        }
    };

    const initialiseCalculator = (container, config) => {
        if (!container || !config || !Array.isArray(config.sliders)) {
            return;
        }

        const sliderBindings = config.sliders
            .map((slider) => {
                const fieldWrapper = container.querySelector(
                    `.atera-compact-calculator__slider-field[data-slider="${slider.id}"]`
                );

                const input = container.querySelector(`[data-input-${slider.id}]`);

                applySliderAttributes(fieldWrapper, slider);

                if (!input) {
                    return null;
                }

                return {
                    slider,
                    input,
                };
            })
            .filter(Boolean);

        if (!sliderBindings.length) {
            return;
        }

        const savingsNode = container.querySelector('[data-display-savings]');
        const ateraCostNode = container.querySelector('[data-display-atera-cost]');
        const currentCostNode = container.querySelector('[data-display-current-cost]');

        const updateOutputs = () => {
            const values = {};
            sliderBindings.forEach(({ slider, input }) => {
                values[slider.id] = input.value;
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
            ['input', 'change'].forEach((eventName) => {
                input.addEventListener(eventName, updateOutputs);
            });
        });

        updateOutputs();
    };

    const fetchConfig = (container) =>
        fetch(getApiUrl(container), {
            credentials: 'same-origin',
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(response)))
            .then((data) => {
                if (!data || !Array.isArray(data.sliders)) {
                    return FALLBACK_CONFIG;
                }
                return data;
            })
            .catch(() => FALLBACK_CONFIG);

    const bootstrap = () => {
        if (isEditor()) {
            return;
        }

        document.querySelectorAll('.atera-compact-calculator').forEach((calculator) => {
            fetchConfig(calculator).then((config) => initialiseCalculator(calculator, config));
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
