(function (global) {
    // Utility functions for the Atera Compact Calculator
    const utils = {};

    // Convert a value to a number, with a fallback
    // Returns the numeric value or the fallback if conversion fails
    utils.toNumber = (value, fallback) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : fallback;
    };

    // Normalise a slider configuration object
    // Ensures all necessary properties are present and correctly typed
    // Returns null if the input is invalid
    utils.normaliseSlider = (slider) => {
        if (!slider || typeof slider !== 'object' || !slider.id) {
            return null;
        }

        const min = utils.toNumber(slider.min, 0);
        const max = utils.toNumber(slider.max, min);
        const step = utils.toNumber(slider.step, 1) || 1;
        const defaultValue = slider.default !== undefined ? utils.toNumber(slider.default, min) : min;

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

    // Format a mark value based on the slider's format settings
    // Returns the formatted mark as a string
    // Supports currency and number formatting
    utils.formatMarkValue = (slider, mark) => {
        if (typeof mark !== 'number') {
            return mark;
        }

        const format = slider && slider.format ? slider.format : { type: 'number' };

        // Handle different formatting types
        // Currency formatting
        if (format.type === 'currency') {
            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: format.currency || 'USD',
                    maximumFractionDigits: format.maximumFractionDigits ?? 0,
                }).format(mark);
            } catch (error) {
                // Fallback if Intl.NumberFormat fails
                return `$${mark.toLocaleString()}`;
            }
        }
        // Default number formatting
        if (format.thousands) {
            return mark.toLocaleString();
        }
        // Plain number
        return mark;
    };

    // Calculate savings and annual costs
    // Returns an object with savings, Atera annual cost, and current annual cost
    utils.calculateFigures = (values, seatRate) => {
        const technicians = utils.toNumber(values && values.technicians, 0);
        const endpoints = utils.toNumber(values && values.endpoints, 0);
        const endpointRate = utils.toNumber(values && values.endpointRate, 0);
        const seat = utils.toNumber(seatRate, 0);

        const currentAnnual = endpoints * endpointRate * 12;
        const ateraAnnual = technicians * seat * 12;
        const savings = Math.max(currentAnnual - ateraAnnual, 0);

        return {
            savings,
            ateraAnnual,
            currentAnnual,
        };
    };

    // Generate a CSS gradient for a range input based on its value
    // Returns the gradient string
    utils.getRangeGradient = (slider, rawValue) => {
        if (!slider) {
            return undefined;
        }

        const range = slider.max - slider.min;
        const numericValue = utils.toNumber(rawValue, slider.min);
        const clamped = range > 0
            ? Math.min(Math.max(numericValue, slider.min), slider.max)
            : slider.min;
        const progress = range > 0 ? ((clamped - slider.min) / range) * 100 : 0;
        const safeProgress = Math.max(0, Math.min(100, progress));

        return `linear-gradient(90deg, #f5c26b 0%, #e7a55b ${safeProgress}%, #e3dbd9 ${safeProgress}%, #e3dbd9 100%)`;
    };

    // Apply the range gradient to an input element
    // Sets the background style of the input
    utils.applyRangeGradient = (input, slider) => {
        if (!input || !slider) {
            return;
        }

        const gradient = utils.getRangeGradient(slider, input.value);
        if (gradient) {
            input.style.background = gradient;
        }
    };
    // Format currency values with optional prefix and fraction digits
    // Returns the formatted currency string
    utils.formatCurrency = (amount, options) => {
        const settings = options || {};
        const prefix = typeof settings.prefix === 'string' ? settings.prefix : '';
        const maximumFractionDigits = Number.isFinite(settings.maximumFractionDigits)
            ? settings.maximumFractionDigits
            : 0;

        const numericAmount = utils.toNumber(amount, 0);

        return `${prefix}${Number(numericAmount).toLocaleString('en-US', {
            maximumFractionDigits,
        })}`;
    };

    // Expose the utilities globally
    // Allows access to the utility functions from other scripts
    global.ateraCompactCalculatorUtils = utils;
})(window);
