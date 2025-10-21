// Atera Compact Calculator Frontend Script
(function () {
    const utils = window.ateraCompactCalculatorUtils || {};
    const ATERA_SEAT_RATE = 149;

    // Check if we are in the WordPress block editor
    const isEditor = () => {
        if (typeof document === 'undefined' || !document.body) {
            return false;
        }

        return document.body.classList.contains('block-editor-page');
    };
    // Get the API URL from the container's data attributes or use defaults
    const getApiUrl = (container) => {
        const endpoint = container.getAttribute('data-config-endpoint') || '/atera/v1/calculator-config';
        const root = window.wpApiSettings && window.wpApiSettings.root ? window.wpApiSettings.root : '/wp-json/';
        const normalisedRoot = root.endsWith('/') ? root.slice(0, -1) : root;

        // If the endpoint is a full URL, return it as is
        if (endpoint.startsWith('http')) {
            return endpoint;
        }

        return `${normalisedRoot}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    };

    const normaliseSlider = utils.normaliseSlider || ((slider) => slider);
    const formatMarkValue = utils.formatMarkValue || ((slider, mark) => mark);
    const applyRangeGradient = utils.applyRangeGradient || (() => {});

    // Format currency values
    const formatCurrency = utils.formatCurrency || ((amount, options) => {
        const settings = options || {};
        const prefix = typeof settings.prefix === 'string' ? settings.prefix : '';
        const numericAmount = Number(amount) || 0;
        return `${prefix}${numericAmount.toLocaleString('en-US', { maximumFractionDigits: settings.maximumFractionDigits || 0 })}`;
    });

    // Calculate savings and costs
    const calculateFigures = (values) => (
        utils.calculateFigures ? utils.calculateFigures(values, ATERA_SEAT_RATE) : { savings: 0, ateraAnnual: 0, currentAnnual: 0 }
    );

    // Build a slider field
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

    // Initialise the calculator
    const initialiseCalculator = (container, config) => {
        if (!container || !config || !Array.isArray(config.sliders)) {
            return;
        }

        const panel = container.querySelector('[data-calculator-panel]');
        if (!panel) {
            return;
        }

        panel.innerHTML = '';

        // Build sliders and bind events
        const sliderBindings = config.sliders.map((slider) => {
            const { wrapper, input } = buildSliderField(slider);
            panel.appendChild(wrapper);
            return {
                slider,
                input,
            };
        });

        // If no sliders, clear panel and exit
        if (!sliderBindings.length) {
            panel.innerHTML = '';
            return;
        }

        const containerPrefix = container.getAttribute('data-currency-prefix') || '$';
        const prefix = typeof config.prefix === 'string' ? config.prefix : containerPrefix;

        // Set currency prefix on container
        container.setAttribute('data-currency-prefix', prefix);

        const savingsNode = container.querySelector('[data-display-savings]');
        const ateraCostNode = container.querySelector('[data-display-atera-cost]');
        const currentCostNode = container.querySelector('[data-display-current-cost]');

        // Update output values based on slider inputs
        const updateOutputs = () => {
            const values = {};
            sliderBindings.forEach(({ slider, input }) => {
                values[slider.id] = input.value;
                applyRangeGradient(input, slider);
            });

            const figures = calculateFigures(values);

            // Update display nodes
            if (savingsNode) {
                savingsNode.textContent = formatCurrency(figures.savings, { prefix, maximumFractionDigits: 0 });
            }
            // Update Atera and current cost nodes
            if (ateraCostNode) {
                ateraCostNode.textContent = formatCurrency(figures.ateraAnnual, { prefix, maximumFractionDigits: 0 });
            }
            // Update current cost node
            if (currentCostNode) {
                currentCostNode.textContent = formatCurrency(figures.currentAnnual, { prefix, maximumFractionDigits: 0 });
            }
        };

        // Bind events to sliders
        sliderBindings.forEach(({ input }) => {
            input.addEventListener('input', updateOutputs);
            input.addEventListener('change', updateOutputs);
        });

        // Initial output update
        updateOutputs();
    };

    // Fetch configuration from the API
    const fetchConfig = (container) =>
        fetch(getApiUrl(container), {
            credentials: 'same-origin',
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(response)))
            .then((data) => {
                const sliders = (data?.sliders || [])
                    .map(normaliseSlider)
                    .filter(Boolean);
                const prefix = typeof data?.prefix === 'string' ? data.prefix : null;

                if (!sliders.length) {
                    return null;
                }

                return { sliders, prefix };
            })
            .catch(() => null);

    const bootstrap = () => {
        if (isEditor()) {
            return;
        }

        // Initialise all calculators on the page
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

                // Initialize the calculator with the fetched config
                initialiseCalculator(calculator, config);
            });
        });
    };

    // Run bootstrap on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        // DOMContentLoaded already fired
        bootstrap();
    }
})();
