import React from "react";
import { ChevronDownIcon } from "./icons/index.js";

/* ── SelectDropdown ────────────────────────────────────────── */

export interface SelectOption<T extends string = string> {
    label: string;
    value: T;
}

export interface SelectDropdownProps<T extends string = string> {
    value: T | null;
    options: SelectOption<T>[];
    onChange: (v: T) => void;
    placeholder?: string;
    width?: number | string;
}

export function SelectDropdown<T extends string = string>({
    value, options, onChange, placeholder = "—", width,
}: SelectDropdownProps<T>) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const current = options.find((o) => o.value === value);

    return (
        <div
            ref={ref}
            className={"kanava-select-dropdown" + (open ? " kanava-sd-open" : "")}
            style={width !== undefined ? { width } : undefined}
        >
            <button
                className="kanava-sd-trigger"
                onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
                title={current?.label ?? placeholder}
            >
                <span className="kanava-sd-label">{current?.label ?? placeholder}</span>
                <span className="kanava-sd-arrow"><ChevronDownIcon size={10} /></span>
            </button>
            {open && (
                <div className="kanava-sd-menu">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            className={"kanava-sd-item" + (opt.value === value ? " kanava-sd-active" : "")}
                            onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                        >{opt.label}</button>
                    ))}
                </div>
            )}
        </div>
    );
}
