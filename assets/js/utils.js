(function (global) {
    const utils = {};

    utils.toNumber = (value, fallback) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : fallback;
    };

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

    utils.formatMarkValue = (slider, mark) => {
        if (typeof mark !== 'number') {
            return mark;
        }

        const format = slider && slider.format ? slider.format : { type: 'number' };

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

    utils.applyRangeGradient = (input, slider) => {
        if (!input || !slider) {
            return;
        }

        const gradient = utils.getRangeGradient(slider, input.value);
        if (gradient) {
            input.style.background = gradient;
        }
    };

    global.ateraCompactCalculatorUtils = utils;
})(window);
