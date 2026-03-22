import React, { useRef, useEffect, useCallback } from "react";

interface FloatingPanelProps {
    side: "left" | "right";
    openIcon: React.ReactNode;
    closeIcon: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    width?: number;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
    side,
    openIcon,
    closeIcon,
    open,
    onToggle,
    children,
    width = 280,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const handleClickOutside = useCallback(
        (e: MouseEvent) => {
            if (!open) return;
            const target = e.target as Node;
            if (panelRef.current?.contains(target)) return;
            if (triggerRef.current?.contains(target)) return;
            onToggle();
        },
        [open, onToggle],
    );

    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (open && e.key === "Escape") onToggle();
        },
        [open, onToggle],
    );

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [handleClickOutside, handleEscape]);

    return (
        <>
            <button
                ref={triggerRef}
                className={`rb-floating-trigger rb-floating-trigger-${side}`}
                onClick={onToggle}
                type="button"
            >
                {open ? closeIcon : openIcon}
            </button>
            <div
                ref={panelRef}
                className={
                    `rb-floating-panel rb-floating-panel-${side}` +
                    (open ? " rb-floating-panel-open" : "")
                }
                style={{ width }}
            >
                {children}
            </div>
        </>
    );
};
