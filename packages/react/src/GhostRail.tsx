/**
 * GhostRail — Breadcrumb tooltip for ghost rail hierarchy indicators.
 *
 * Listens for `kanava:ghost-rail-hover` CustomEvent dispatched by the
 * ghostRailPlugin. Shows a breadcrumb path like "Column Layout > Column 1 > Paragraph"
 * when the user hovers a nested block and ghost rails are visible.
 *
 * @see packages/docs/architecture-columnLayout.md
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import type { KanavaEditor, GhostRailAncestor } from "@kanava/editor";

export interface GhostRailProps {
    editor: KanavaEditor | null;
    className?: string;
}

interface TooltipState {
    ancestors: GhostRailAncestor[];
    x: number;
    y: number;
}

export const GhostRail: React.FC<GhostRailProps> = ({ editor, className }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<TooltipState | null>(null);

    const hide = useCallback(() => setState(null), []);

    // Listen for ghost rail hover events
    useEffect(() => {
        if (!editor) return;
        const dom = editor.pmView.dom;

        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const ancestors: GhostRailAncestor[] = detail.ancestors;

            if (!ancestors || ancestors.length === 0) {
                setState(null);
                return;
            }

            // Position the tooltip near the top-left of the editor DOM, offset
            // by the leftmost rail depth to avoid overlapping handles
            const container = dom.closest(".kanava-editor-container") || dom.parentElement;
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            const editorRect = dom.getBoundingClientRect();

            setState({
                ancestors,
                x: editorRect.left - containerRect.left - 12,
                y: editorRect.top - containerRect.top - 28,
            });
        };

        dom.addEventListener("kanava:ghost-rail-hover", handler);
        return () => dom.removeEventListener("kanava:ghost-rail-hover", handler);
    }, [editor]);

    // Hide on Escape
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") hide();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [hide]);

    if (!state || state.ancestors.length === 0) return null;

    const breadcrumb = state.ancestors.map((a) => a.label).join(" › ");

    return (
        <div
            ref={tooltipRef}
            className={`kanava-ghost-rail-breadcrumb ${className ?? ""}`}
            style={{
                position: "absolute",
                left: state.x,
                top: state.y,
                pointerEvents: "none",
            }}
        >
            {breadcrumb}
        </div>
    );
};
