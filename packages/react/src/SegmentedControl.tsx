import React from "react";

/* ── SegmentedControl ──────────────────────────────────────── */

export interface SegmentedOption<T extends string = string> {
    value: T;
    label?: string;
    icon?: React.ReactNode;
    title?: string;
}

export interface SegmentedControlProps<T extends string = string> {
    value: T | null;
    options: SegmentedOption<T>[];
    onChange: (v: T) => void;
}

export function SegmentedControl<T extends string = string>({
    value, options, onChange,
}: SegmentedControlProps<T>) {
    return (
        <div className="kanava-segmented-control">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    className={"kanava-sc-btn" + (opt.value === value ? " kanava-sc-active" : "")}
                    title={opt.title ?? opt.label ?? opt.value}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onChange(opt.value);
                    }}
                >
                    {opt.icon ?? opt.label ?? opt.value}
                </button>
            ))}
        </div>
    );
}
