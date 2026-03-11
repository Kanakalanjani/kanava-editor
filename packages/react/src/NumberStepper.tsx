import React from "react";

/* ── NumberStepper ─────────────────────────────────────────── */

export interface NumberStepperProps {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    label?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
    value, onChange, min = 0, max = 999, step = 1, suffix = "", label,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
    };

    return (
        <div className="kanava-number-stepper" title={label}>
            <button
                className="kanava-ns-btn"
                onMouseDown={(e) => { e.preventDefault(); onChange(Math.max(min, value - step)); }}
                tabIndex={-1}
                aria-label="Decrease"
            >−</button>
            <input
                className="kanava-ns-input"
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={handleChange}
                onMouseDown={(e) => e.stopPropagation()}
            />
            {suffix && <span className="kanava-ns-suffix">{suffix}</span>}
            <button
                className="kanava-ns-btn"
                onMouseDown={(e) => { e.preventDefault(); onChange(Math.min(max, value + step)); }}
                tabIndex={-1}
                aria-label="Increase"
            >+</button>
        </div>
    );
};

NumberStepper.displayName = "NumberStepper";
