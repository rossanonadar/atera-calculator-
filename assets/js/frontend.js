(function () {
    const isEditor = () => {
        if (!document || !document.body) {
            return false;
        }

        return document.body.classList.contains('block-editor-page');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const calculateAnnual = (technicians, hoursPerWeek, hourlyRate) => {
        const techs = Number(technicians) || 0;
        const hours = Number(hoursPerWeek) || 0;
        const rate = Number(hourlyRate) || 0;

        return techs * hours * rate * 52;
    };

    const initialiseCalculator = (container) => {
        if (!container) {
            return;
        }

        const technicianInput = container.querySelector('[data-role="technicians"]');
        const hoursInput = container.querySelector('[data-role="hours-per-week"]');
        const rateInput = container.querySelector('[data-role="hourly-rate"]');
        const resultNode = container.querySelector('[data-role="result"]');

        if (!technicianInput || !hoursInput || !rateInput || !resultNode) {
            return;
        }

        const setInitialValue = (input, dataKey) => {
            const defaultValue = container.getAttribute(dataKey);
            if (defaultValue !== null && defaultValue !== undefined && defaultValue !== '') {
                input.value = defaultValue;
            }
        };

        setInitialValue(technicianInput, 'data-default-technicians');
        setInitialValue(hoursInput, 'data-default-hours');
        setInitialValue(rateInput, 'data-default-rate');

        const updateResult = () => {
            const annual = calculateAnnual(
                technicianInput.value,
                hoursInput.value,
                rateInput.value
            );

            resultNode.textContent = formatCurrency(annual);
        };

        ['input', 'change'].forEach((eventName) => {
            technicianInput.addEventListener(eventName, updateResult);
            hoursInput.addEventListener(eventName, updateResult);
            rateInput.addEventListener(eventName, updateResult);
        });

        updateResult();
    };

    const bootstrap = () => {
        if (isEditor()) {
            return;
        }

        document
            .querySelectorAll('.atera-compact-calculator')
            .forEach((calculator) => initialiseCalculator(calculator));
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
