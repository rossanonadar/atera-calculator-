(function (wp) {
    const { __ } = wp.i18n;
    const { registerBlockType } = wp.blocks;
    const { useState, useEffect, useMemo, Fragment } = wp.element;
    const { useBlockProps, RichText, InspectorControls } = wp.blockEditor;
    const { PanelBody, TextControl, Notice, Spinner } = wp.components;
    const apiFetch = wp.apiFetch;

    const ATERA_SEAT_RATE = 149;

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

    const getRangeGradient = (slider, rawValue) => {
        if (!slider) {
            return undefined;
        }

        const range = slider.max - slider.min;
        const numericValue = Number(rawValue);
        const clamped = Number.isFinite(numericValue)
            ? Math.min(Math.max(numericValue, slider.min), slider.max)
            : slider.min;
        const progress = range > 0 ? ((clamped - slider.min) / range) * 100 : 0;
        const safeProgress = Math.max(0, Math.min(100, progress));

        return `linear-gradient(90deg, #f5c26b 0%, #e7a55b ${safeProgress}%, #e3dbd9 ${safeProgress}%, #e3dbd9 100%)`;
    };

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
                default: __('Calculate how much you save with <br>Atera', 'atera'),
            },
        },
        edit: (props) => {
            const { attributes, setAttributes } = props;
            const [config, setConfig] = useState(null);
            const [controls, setControls] = useState({});
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);

            useEffect(() => {
                let mounted = true;

                if (!apiFetch) {
                    setLoading(false);
                    setError(__('API utilities unavailable.', 'atera'));
                    return () => {};
                }

                apiFetch({ path: '/atera/v1/calculator-config' })
                    .then((response) => {
                        if (!mounted) {
                            return;
                        }

                        const sliders = (response?.sliders || [])
                            .map(normaliseSlider)
                            .filter(Boolean);

                        if (!sliders.length) {
                            throw new Error('invalid-config');
                        }

                        const nextConfig = { sliders };
                        const defaults = {};
                        sliders.forEach((slider) => {
                            defaults[slider.id] = slider.default;
                        });

                        setConfig(nextConfig);
                        setControls(defaults);
                        setError(null);
                    })
                    .catch(() => {
                        if (!mounted) {
                            return;
                        }
                        setConfig(null);
                        setControls({});
                        setError(__('Unable to load calculator settings from the REST endpoint.', 'atera'));
                    })
                    .finally(() => {
                        if (!mounted) {
                            return;
                        }
                        setLoading(false);
                    });

                return () => {
                    mounted = false;
                };
            }, []);

            const figures = useMemo(() => calculateFigures(controls), [controls]);

            const handleSliderChange = (id) => (event) => {
                const value = event?.target?.value ?? event;
                setControls((prev) => ({
                    ...prev,
                    [id]: value,
                }));
            };

            const blockProps = useBlockProps({ className: 'atera-compact-calculator' });

            const renderSliders = () => {
                if (!config) {
                    return null;
                }

                return config.sliders.map((slider) => {
                    const value = controls[slider.id] ?? slider.default;

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
                            )
                        ),
                        wp.element.createElement('input', {
                            type: 'range',
                            className: 'atera-compact-calculator__range',
                            min: slider.min,
                            max: slider.max,
                            step: slider.step,
                            value,
                            style: { background: getRangeGradient(slider, value) },
                            onChange: handleSliderChange(slider.id),
                            onInput: handleSliderChange(slider.id),
                            'data-input-id': slider.id,
                        }),
                        wp.element.createElement(
                            'div',
                            { className: 'atera-compact-calculator__scale' },
                            (slider.marks || []).map((mark, index) =>
                                wp.element.createElement(
                                    'span',
                                    { key: `${slider.id}-mark-${index}` },
                                    formatMarkValue(slider, mark)
                                )
                            )
                        )
                    );
                });
            };

            const panelChildren = () => {
                if (loading) {
                    return wp.element.createElement(
                        'p',
                        { className: 'atera-compact-calculator__loading' },
                        wp.element.createElement(Spinner, null),
                        ' ',
                        __('Loading slider settings…', 'atera')
                    );
                }

                if (error) {
                    return wp.element.createElement(
                        Notice,
                        {
                            status: 'error',
                            isDismissible: false,
                        },
                        error
                    );
                }

                return renderSliders();
            };

            return wp.element.createElement(
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
                        })
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
                                panelChildren()
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
                                )
                            )
                        )
                    ),
                    wp.element.createElement(
                        'p',
                        { className: 'atera-compact-calculator__note' },
                        __('Prices are shown in US Dollars', 'atera')
                    )
                )
            );
        },
        save: () => null,
    });
})(window.wp);
