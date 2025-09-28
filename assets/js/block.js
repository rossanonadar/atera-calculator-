(function (wp) {
    const { __ } = wp.i18n;
    const { registerBlockType } = wp.blocks;
    const { useState, useMemo, useEffect, Fragment } = wp.element;
    const { useBlockProps, RichText, InspectorControls } = wp.blockEditor;
    const { PanelBody, TextControl, Notice } = wp.components;
    const apiFetch = wp.apiFetch;

    const FALLBACK_CONFIG = {
        sliders: [
            {
                id: 'technicians',
                label: __('How many technicians are in your company?', 'atera'),
                min: 0,
                max: 20,
                step: 1,
                default: 10,
                marks: [0, 5, 10, 15, 20],
                format: { type: 'number' },
            },
            {
                id: 'endpoints',
                label: __('How many endpoints do you manage?', 'atera'),
                min: 0,
                max: 2500,
                step: 100,
                default: 1200,
                marks: [0, 500, 1000, 1500, 2000, 2500],
                format: { type: 'number', thousands: true },
            },
            {
                id: 'endpointRate',
                label: __('How much are you charged per endpoint per month?', 'atera'),
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

    const normaliseSlider = (slider) => {
        if (!slider || typeof slider !== 'object') {
            return null;
        }

        const base = {
            id: slider.id,
            label: slider.label,
            min: Number(slider.min) || 0,
            max: Number(slider.max) || 0,
            step: Number(slider.step) || 1,
            default: slider.default !== undefined ? Number(slider.default) : Number(slider.min) || 0,
            marks: Array.isArray(slider.marks) ? slider.marks : [],
            format: slider.format || { type: 'number' },
        };

        if (!base.id) {
            return null;
        }

        if (base.marks.length === 0) {
            base.marks = [base.min, base.max];
        }

        return base;
    };

    const resolveConfig = (payload) => {
        if (!payload || !Array.isArray(payload.sliders)) {
            return FALLBACK_CONFIG;
        }

        const sliders = payload.sliders
            .map(normaliseSlider)
            .filter(Boolean);

        return sliders.length ? { sliders } : FALLBACK_CONFIG;
    };

    const getDefaultsFromConfig = (config) => {
        const defaults = {};
        config.sliders.forEach((slider) => {
            defaults[slider.id] = slider.default;
        });
        return defaults;
    };

    const formatSliderValue = (slider, rawValue) => {
        const value = Number(rawValue) || 0;
        const format = slider.format || { type: 'number' };

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

    const renderScale = (slider) =>
        wp.element.createElement(
            'div',
            { className: 'atera-compact-calculator__scale', 'aria-hidden': 'true' },
            (Array.isArray(slider.marks) ? slider.marks : []).map((mark, index) =>
                wp.element.createElement(
                    'span',
                    { key: `${slider.id}-mark-${index}` },
                    typeof mark === 'number' ? formatSliderValue(slider, mark) : mark
                )
            )
        );

    registerBlockType('atera/compact-calculator', {
        apiVersion: 2,
        title: __('Atera Compact Calculator', 'atera'),
        description: __('Savings estimator with sliders and summary card that mirrors the Atera compact calculator design.', 'atera'),
        icon: 'calculator',
        category: 'widgets',
        supports: {
            html: false,
        },
        attributes: {
            title: {
                type: 'string',
                source: 'html',
                selector: '.atera-compact-calculator__title',
                default: __('Calculate how much you save with Atera', 'atera'),
            },
        },
        edit: (props) => {
            const { attributes, setAttributes } = props;
            const [config, setConfig] = useState(FALLBACK_CONFIG);
            const [controls, setControls] = useState(getDefaultsFromConfig(FALLBACK_CONFIG));
            const [loadingConfig, setLoadingConfig] = useState(true);
            const [configError, setConfigError] = useState(null);

            useEffect(() => {
                let isMounted = true;

                if (!apiFetch) {
                    setLoadingConfig(false);
                    return () => {};
                }

                apiFetch({ path: '/atera/v1/calculator-config' })
                    .then((response) => {
                        if (!isMounted) {
                            return;
                        }
                        const resolved = resolveConfig(response);
                        setConfig(resolved);
                        setControls(getDefaultsFromConfig(resolved));
                        setConfigError(null);
                    })
                    .catch(() => {
                        if (!isMounted) {
                            return;
                        }
                        setConfigError(__('Unable to load calculator settings. Using defaults.', 'atera'));
                    })
                    .finally(() => {
                        if (!isMounted) {
                            return;
                        }
                        setLoadingConfig(false);
                    });

                return () => {
                    isMounted = false;
                };
            }, []);

            const sliderMap = useMemo(() => {
                const map = {};
                config.sliders.forEach((slider) => {
                    map[slider.id] = slider;
                });
                return map;
            }, [config]);

            const figures = useMemo(() => calculateFigures(controls), [controls]);

            const handleSliderChange = (id) => (event) => {
                const value = event && event.target ? event.target.value : event;
                setControls((prev) => ({
                    ...prev,
                    [id]: value,
                }));
            };

            const blockProps = useBlockProps({ className: 'atera-compact-calculator' });

            return (
                wp.element.createElement(
                    Fragment,
                    null,
                    wp.element.createElement(
                        InspectorControls,
                        null,
                        wp.element.createElement(
                            PanelBody,
                            {
                                title: __('Display', 'atera'),
                                initialOpen: true,
                            },
                            wp.element.createElement(TextControl, {
                                label: __('Title', 'atera'),
                                value: attributes.title,
                                onChange: (value) => setAttributes({ title: value }),
                            }),
                            configError &&
                                wp.element.createElement(Notice, {
                                    status: 'warning',
                                    isDismissible: false,
                                }, configError)
                        )
                    ),
                    wp.element.createElement(
                        'div',
                        blockProps,
                        wp.element.createElement(
                            'div',
                            { className: 'atera-compact-calculator__layout' },
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__column atera-compact-calculator__column--intro' },
                                wp.element.createElement(RichText, {
                                    tagName: 'h2',
                                    className: 'atera-compact-calculator__title',
                                    value: attributes.title,
                                    onChange: (value) => setAttributes({ title: value }),
                                    placeholder: __('Add block title…', 'atera'),
                                })
                            ),
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__column atera-compact-calculator__column--panel' },
                                wp.element.createElement(
                                    'div',
                                    { className: 'atera-compact-calculator__panel' },
                                    wp.element.createElement(
                                        'h3',
                                        { className: 'atera-compact-calculator__panel-heading' },
                                        __('Adjust the scales below to see your savings', 'atera')
                                    ),
                                    loadingConfig &&
                                        wp.element.createElement(
                                            'p',
                                            { className: 'atera-compact-calculator__loading' },
                                            __('Loading slider settings…', 'atera')
                                        ),
                                    config.sliders.map((slider) => {
                                        const currentValue = controls[slider.id];
                                        const formattedValue = formatSliderValue(slider, currentValue);

                                        return wp.element.createElement(
                                           'div',
                                           {
                                               key: slider.id,
                                                className: 'atera-compact-calculator__slider-field',
                                                'data-slider': slider.id,
                                           },
                                            wp.element.createElement(
                                                'div',
                                                { className: 'atera-compact-calculator__slider-heading' },
                                                wp.element.createElement(
                                                    'span',
                                                    { className: 'atera-compact-calculator__slider-label' },
                                                    slider.label
                                                ),
                                                wp.element.createElement(
                                                    'span',
                                                    { className: 'atera-compact-calculator__slider-value' },
                                                    formattedValue
                                                )
                                            ),
                                            wp.element.createElement('input', {
                                                type: 'range',
                                                className: 'atera-compact-calculator__range',
                                                min: slider.min,
                                                max: slider.max,
                                                step: slider.step,
                                                value: currentValue,
                                                onChange: handleSliderChange(slider.id),
                                            }),
                                            renderScale(slider)
                                        );
                                    })
                                )
                            ),
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__column atera-compact-calculator__column--summary' },
                                wp.element.createElement(
                                    'div',
                                    { className: 'atera-compact-calculator__summary-card' },
                                    wp.element.createElement(
                                        'div',
                                        { className: 'atera-compact-calculator__summary-kicker' },
                                        __('You save', 'atera')
                                    ),
                                    wp.element.createElement(
                                        'div',
                                        { className: 'atera-compact-calculator__summary-total' },
                                        new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                            maximumFractionDigits: 0,
                                        }).format(figures.savings)
                                    ),
                                    wp.element.createElement(
                                        'p',
                                        { className: 'atera-compact-calculator__summary-subtext' },
                                        __('annually — estimated based on Atera’s Pro Plan', 'atera')
                                    ),
                                    wp.element.createElement(
                                        'div',
                                        { className: 'atera-compact-calculator__summary-cta' },
                                        __('Start free trial', 'atera')
                                    ),
                                    wp.element.createElement(
                                        'div',
                                        { className: 'atera-compact-calculator__summary-breakdown' },
                                        wp.element.createElement(
                                            'div',
                                            { className: 'atera-compact-calculator__summary-breakdown-header' },
                                            __('Average annual cost', 'atera')
                                        ),
                                        wp.element.createElement(
                                            'div',
                                            { className: 'atera-compact-calculator__summary-breakdown-row' },
                                            wp.element.createElement('span', null, __('Atera', 'atera')),
                                            wp.element.createElement(
                                                'span',
                                                null,
                                                new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    maximumFractionDigits: 0,
                                                }).format(figures.ateraAnnual)
                                            )
                                        ),
                                        wp.element.createElement(
                                            'div',
                                            { className: 'atera-compact-calculator__summary-breakdown-row' },
                                            wp.element.createElement('span', null, __('Current provider', 'atera')),
                                            wp.element.createElement(
                                                'span',
                                                null,
                                                new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    maximumFractionDigits: 0,
                                                }).format(figures.currentAnnual)
                                            )
                                        )
                                    ),
                                    wp.element.createElement(
                                        'p',
                                        { className: 'atera-compact-calculator__summary-note' },
                                        __('Prices are shown in US Dollars', 'atera')
                                    )
                                )
                            )
                        )
                    )
                )
            );
        },
        save: (props) => {
            const { attributes } = props;
            const blockProps = useBlockProps.save({
                className: 'atera-compact-calculator',
                'data-config-endpoint': '/atera/v1/calculator-config',
            });

            return (
                wp.element.createElement(
                    'div',
                    blockProps,
                    wp.element.createElement(
                        'div',
                        { className: 'atera-compact-calculator__layout' },
                        wp.element.createElement(
                            'div',
                            { className: 'atera-compact-calculator__column atera-compact-calculator__column--intro' },
                            wp.element.createElement(RichText.Content, {
                                tagName: 'h2',
                                className: 'atera-compact-calculator__title',
                                value: attributes.title,
                            })
                        ),
                        wp.element.createElement(
                            'div',
                            { className: 'atera-compact-calculator__column atera-compact-calculator__column--panel' },
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__panel' },
                                wp.element.createElement(
                                    'h3',
                                    { className: 'atera-compact-calculator__panel-heading' },
                                    __('Adjust the scales below to see your savings', 'atera')
                                ),
                                FALLBACK_CONFIG.sliders.map((slider) =>
                                    wp.element.createElement(
                                        'div',
                                        {
                                            className: 'atera-compact-calculator__slider-field',
                                            key: slider.id,
                                            'data-slider': slider.id,
                                        },
                                        wp.element.createElement(
                                            'div',
                                            { className: 'atera-compact-calculator__slider-heading' },
                                            wp.element.createElement(
                                                'span',
                                                { className: 'atera-compact-calculator__slider-label' },
                                                slider.label
                                            ),
                                            wp.element.createElement(
                                                'span',
                                                {
                                                    className: 'atera-compact-calculator__slider-value',
                                                    [`data-display-${slider.id}`]: true,
                                                },
                                                formatSliderValue(slider, slider.default)
                                            )
                                        ),
                                        wp.element.createElement('input', {
                                            type: 'range',
                                            className: 'atera-compact-calculator__range',
                                            min: slider.min,
                                            max: slider.max,
                                            step: slider.step,
                                            value: slider.default,
                                            [`data-input-${slider.id}`]: true,
                                        }),
                                        renderScale(slider)
                                    )
                                )
                            )
                        ),
                        wp.element.createElement(
                            'div',
                            { className: 'atera-compact-calculator__column atera-compact-calculator__column--summary' },
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__summary-card' },
                                wp.element.createElement(
                                    'div',
                                    { className: 'atera-compact-calculator__summary-kicker' },
                                    __('You save', 'atera')
                                ),
                                wp.element.createElement(
                                    'div',
                                    {
                                        className: 'atera-compact-calculator__summary-total',
                                        'data-display-savings': true,
                                    },
                                    '$0'
                                ),
                                wp.element.createElement(
                                    'p',
                                    { className: 'atera-compact-calculator__summary-subtext' },
                                    __('annually — estimated based on Atera’s Pro Plan', 'atera')
                                ),
                                wp.element.createElement(
                                    'a',
                                    {
                                        href: '#start-trial',
                                        className: 'atera-compact-calculator__summary-cta',
                                    },
                                    __('Start free trial', 'atera')
                                ),
                                wp.element.createElement(
                                    'div',
                                    { className: 'atera-compact-calculator__summary-breakdown' },
                                    wp.element.createElement(
                                        'div',
                                        { className: 'atera-compact-calculator__summary-breakdown-header' },
                                        __('Average annual cost', 'atera')
                                    ),
                                    wp.element.createElement(
                                        'div',
                                        { className: 'atera-compact-calculator__summary-breakdown-row' },
                                        wp.element.createElement('span', null, __('Atera', 'atera')),
                                        wp.element.createElement(
                                            'span',
                                            { 'data-display-atera-cost': true },
                                            '$0'
                                        )
                                    ),
                                    wp.element.createElement(
                                        'div',
                                        { className: 'atera-compact-calculator__summary-breakdown-row' },
                                        wp.element.createElement('span', null, __('Current provider', 'atera')),
                                        wp.element.createElement(
                                            'span',
                                            { 'data-display-current-cost': true },
                                            '$0'
                                        )
                                    )
                                ),
                                wp.element.createElement(
                                    'p',
                                    { className: 'atera-compact-calculator__summary-note' },
                                    __('Prices are shown in US Dollars', 'atera')
                                )
                            )
                        )
                    )
                )
            );
        },
    });
})(window.wp);
