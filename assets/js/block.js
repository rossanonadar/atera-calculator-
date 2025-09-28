(function (wp) {
    const { __ } = wp.i18n;
    const { registerBlockType } = wp.blocks;
    const { useState, useMemo } = wp.element;
    const { useBlockProps, RichText } = wp.blockEditor;

    const INITIAL_INPUTS = {
        technicians: 10,
        hoursPerWeek: 5,
        hourlyRate: 75,
    };

    const calculateAnnual = (values) => {
        const technicians = Number(values.technicians) || 0;
        const hoursPerWeek = Number(values.hoursPerWeek) || 0;
        const hourlyRate = Number(values.hourlyRate) || 0;

        return technicians * hoursPerWeek * hourlyRate * 52;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    registerBlockType('atera/compact-calculator', {
        apiVersion: 2,
        title: __('Atera Compact Calculator', 'atera'),
        description: __('Interactive calculator that highlights potential savings with Atera.', 'atera'),
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
            const [inputs, setInputs] = useState(INITIAL_INPUTS);
            const blockProps = useBlockProps({ className: 'atera-compact-calculator' });

            const annualSavings = useMemo(() => calculateAnnual(inputs), [inputs]);

            const updateInput = (field) => (event) => {
                const value = event && event.target ? event.target.value : event;
                setInputs((prev) => ({
                    ...prev,
                    [field]: value,
                }));
            };

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
                            wp.element.createElement(RichText, {
                                tagName: 'h3',
                                className: 'atera-compact-calculator__title',
                                value: attributes.title,
                                onChange: (value) => setAttributes({ title: value }),
                                placeholder: __('Add block title…', 'atera'),
                            }),
                            wp.element.createElement(
                                'p',
                                { className: 'atera-compact-calculator__helper' },
                                __('Adjust the inputs on the right to preview the savings calculation shown on the site.', 'atera')
                            )
                        ),
                        wp.element.createElement(
                            'div',
                            { className: 'atera-compact-calculator__column atera-compact-calculator__column--form' },
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__field' },
                                wp.element.createElement(
                                    'label',
                                    { className: 'atera-compact-calculator__label' },
                                    __('Number of technicians', 'atera')
                                ),
                                wp.element.createElement('input', {
                                    type: 'number',
                                    min: '0',
                                    className: 'atera-compact-calculator__input',
                                    value: inputs.technicians,
                                    onChange: updateInput('technicians'),
                                })
                            ),
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__field' },
                                wp.element.createElement(
                                    'label',
                                    { className: 'atera-compact-calculator__label' },
                                    __('Hours saved per technician each week', 'atera')
                                ),
                                wp.element.createElement('input', {
                                    type: 'number',
                                    min: '0',
                                    className: 'atera-compact-calculator__input',
                                    value: inputs.hoursPerWeek,
                                    onChange: updateInput('hoursPerWeek'),
                                })
                            ),
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__field' },
                                wp.element.createElement(
                                    'label',
                                    { className: 'atera-compact-calculator__label' },
                                    __('Average hourly cost', 'atera')
                                ),
                                wp.element.createElement('div', { className: 'atera-compact-calculator__input-group' },
                                    wp.element.createElement(
                                        'span',
                                        { className: 'atera-compact-calculator__input-prefix' },
                                        '$'
                                    ),
                                    wp.element.createElement('input', {
                                        type: 'number',
                                        min: '0',
                                        className: 'atera-compact-calculator__input atera-compact-calculator__input--with-prefix',
                                        value: inputs.hourlyRate,
                                        onChange: updateInput('hourlyRate'),
                                    })
                                )
                            ),
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__results' },
                                wp.element.createElement(
                                    'div',
                                    { className: 'atera-compact-calculator__results-label' },
                                    __('Estimated annual savings', 'atera')
                                ),
                                wp.element.createElement(
                                    'div',
                                    { className: 'atera-compact-calculator__results-value' },
                                    formatCurrency(annualSavings)
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
                'data-default-technicians': INITIAL_INPUTS.technicians,
                'data-default-hours': INITIAL_INPUTS.hoursPerWeek,
                'data-default-rate': INITIAL_INPUTS.hourlyRate,
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
                                tagName: 'h3',
                                className: 'atera-compact-calculator__title',
                                value: attributes.title,
                            })
                        ),
                        wp.element.createElement(
                            'div',
                            { className: 'atera-compact-calculator__column atera-compact-calculator__column--form' },
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__field' },
                                wp.element.createElement(
                                    'label',
                                    { className: 'atera-compact-calculator__label' },
                                    __('Number of technicians', 'atera')
                                ),
                                wp.element.createElement('input', {
                                    type: 'number',
                                    min: '0',
                                    className: 'atera-compact-calculator__input',
                                    value: INITIAL_INPUTS.technicians,
                                    'data-role': 'technicians',
                                })
                            ),
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__field' },
                                wp.element.createElement(
                                    'label',
                                    { className: 'atera-compact-calculator__label' },
                                    __('Hours saved per technician each week', 'atera')
                                ),
                                wp.element.createElement('input', {
                                    type: 'number',
                                    min: '0',
                                    className: 'atera-compact-calculator__input',
                                    value: INITIAL_INPUTS.hoursPerWeek,
                                    'data-role': 'hours-per-week',
                                })
                            ),
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__field' },
                                wp.element.createElement(
                                    'label',
                                    { className: 'atera-compact-calculator__label' },
                                    __('Average hourly cost', 'atera')
                                ),
                                wp.element.createElement('div', { className: 'atera-compact-calculator__input-group' },
                                    wp.element.createElement(
                                        'span',
                                        { className: 'atera-compact-calculator__input-prefix' },
                                        '$'
                                    ),
                                    wp.element.createElement('input', {
                                        type: 'number',
                                        min: '0',
                                        className: 'atera-compact-calculator__input atera-compact-calculator__input--with-prefix',
                                        value: INITIAL_INPUTS.hourlyRate,
                                        'data-role': 'hourly-rate',
                                    })
                                )
                            ),
                            wp.element.createElement(
                                'div',
                                { className: 'atera-compact-calculator__results' },
                                wp.element.createElement(
                                    'div',
                                    { className: 'atera-compact-calculator__results-label' },
                                    __('Estimated annual savings', 'atera')
                                ),
                                wp.element.createElement(
                                    'div',
                                    {
                                        className: 'atera-compact-calculator__results-value',
                                        'data-role': 'result',
                                    },
                                    '$0'
                                )
                            )
                        )
                    )
                )
            );
        },
    });
})(window.wp);
