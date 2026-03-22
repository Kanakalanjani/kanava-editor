import React, { useCallback } from "react";
import {
    KanavaEditor,
    NumberStepper,
    type KanavaSelectionInfo,
    type PaginationConfig,
} from "@kanava/editor-react";
import {
    setLineHeight,
    setBlockSpacing,
    resetBlockFormatting,
    type DocumentStyle,
} from "@kanava/editor";
import { Settings, RotateCcw } from "lucide-react";

interface LayoutSidebarProps {
    editor: KanavaEditor | null;
    selectionInfo: KanavaSelectionInfo | null;
    paginationConfig: PaginationConfig;
    onPaginationChange: (config: PaginationConfig) => void;
}

export const LayoutSidebar: React.FC<LayoutSidebarProps> = ({
    editor,
    selectionInfo,
    paginationConfig,
    onPaginationChange,
}) => {
    const margins = paginationConfig.margins ?? { top: 72, bottom: 72, left: 72, right: 72 };
    const docStyle = editor?.getDocumentStyle() ?? {};

    const updateMargin = useCallback(
        (side: "top" | "bottom" | "left" | "right", value: number) => {
            onPaginationChange({
                ...paginationConfig,
                margins: { ...margins, [side]: value },
            });
        },
        [paginationConfig, margins, onPaginationChange],
    );

    const updateDocStyle = useCallback(
        (partial: Partial<DocumentStyle>) => {
            if (!editor) return;
            editor.setDocumentStyle(partial);
        },
        [editor],
    );

    const handleBlockLineHeight = useCallback(
        (value: number) => {
            if (!editor) return;
            editor.exec(setLineHeight(value));
            editor.focus();
        },
        [editor],
    );

    const handleBlockSpacingBottom = useCallback(
        (value: number) => {
            if (!editor) return;
            editor.exec(setBlockSpacing(0, value));
            editor.focus();
        },
        [editor],
    );

    const handleResetFormatting = useCallback(() => {
        if (!editor) return;
        editor.exec(resetBlockFormatting());
        editor.focus();
    }, [editor]);

    const blockType = selectionInfo?.blockType ?? "—";
    const blockLabel = blockType.charAt(0).toUpperCase() + blockType.slice(1);

    // Read block-level overrides from blockNodeAttrs
    const blockNodeAttrs = selectionInfo?.blockNodeAttrs;
    const blockLineHeight = blockNodeAttrs?.lineHeight ?? null;
    const blockSpacingBottom = blockNodeAttrs?.spacingBottom ?? 0;
    const hasBlockOverrides = blockLineHeight != null || blockSpacingBottom > 0 ||
        (blockNodeAttrs?.textAlign && blockNodeAttrs.textAlign !== "left") ||
        blockNodeAttrs?.backgroundColor != null ||
        blockNodeAttrs?.paddingTop > 0 || blockNodeAttrs?.paddingBottom > 0 ||
        blockNodeAttrs?.paddingLeft > 0 || blockNodeAttrs?.paddingRight > 0;

    return (
        <div className="rb-layout-sidebar">
            <div className="rb-sidebar-header">
                <span className="rb-sidebar-icon"><Settings size={16} /></span>
                <span>Layout Precision</span>
            </div>
            <p className="rb-sidebar-sub">Fine-tune spacing &amp; structure</p>

            {/* ── Document Defaults ── */}
            <section className="rb-sidebar-section">
                <h4 className="rb-sidebar-label">Document Defaults</h4>

                <div className="rb-sidebar-row">
                    <span className="rb-sidebar-row-label">Line Height</span>
                    <NumberStepper
                        value={docStyle.lineHeight ?? 1.6}
                        min={1.0}
                        max={2.5}
                        step={0.1}
                        onChange={(v) => updateDocStyle({ lineHeight: v })}
                    />
                </div>

                <div className="rb-sidebar-row">
                    <span className="rb-sidebar-row-label">Paragraph Gap</span>
                    <NumberStepper
                        value={docStyle.paragraphGap ?? 2}
                        min={0}
                        max={32}
                        step={2}
                        onChange={(v) => updateDocStyle({ paragraphGap: v })}
                    />
                    <span className="rb-sidebar-unit">px</span>
                </div>

                <div className="rb-sidebar-row">
                    <span className="rb-sidebar-row-label">Font Size</span>
                    <NumberStepper
                        value={docStyle.fontSize ?? 16}
                        min={8}
                        max={48}
                        step={1}
                        onChange={(v) => updateDocStyle({ fontSize: v })}
                    />
                    <span className="rb-sidebar-unit">px</span>
                </div>
            </section>

            {/* ── Selected Block ── */}
            <section className="rb-sidebar-section">
                <h4 className="rb-sidebar-label">Selected Block</h4>
                <div className="rb-sidebar-value">{blockLabel}</div>

                <div className="rb-sidebar-row">
                    <span className="rb-sidebar-row-label">Line Height</span>
                    <NumberStepper
                        value={blockLineHeight ?? docStyle.lineHeight ?? 1.6}
                        min={1.0}
                        max={2.5}
                        step={0.1}
                        onChange={handleBlockLineHeight}
                    />
                    {blockLineHeight != null && <span className="rb-sidebar-override">override</span>}
                </div>

                <div className="rb-sidebar-row">
                    <span className="rb-sidebar-row-label">Spacing After</span>
                    <NumberStepper
                        value={blockSpacingBottom}
                        min={0}
                        max={48}
                        step={2}
                        onChange={handleBlockSpacingBottom}
                    />
                    <span className="rb-sidebar-unit">px</span>
                    {blockSpacingBottom > 0 && <span className="rb-sidebar-override">override</span>}
                </div>

                {hasBlockOverrides && (
                    <button
                        className="rb-sidebar-reset-btn"
                        onClick={handleResetFormatting}
                        title="Clear all block-level formatting overrides"
                        type="button"
                    >
                        <RotateCcw size={12} /> Reset Block Formatting
                    </button>
                )}
            </section>

            {/* ── Page Margins ── */}
            <section className="rb-sidebar-section">
                <h4 className="rb-sidebar-label">Page Margins</h4>
                <div className="rb-margin-grid">
                    <div className="rb-margin-item">
                        <span>Top</span>
                        <NumberStepper
                            value={margins.top}
                            min={18}
                            max={144}
                            step={6}
                            onChange={(v) => updateMargin("top", v)}
                        />
                    </div>
                    <div className="rb-margin-item">
                        <span>Bottom</span>
                        <NumberStepper
                            value={margins.bottom}
                            min={18}
                            max={144}
                            step={6}
                            onChange={(v) => updateMargin("bottom", v)}
                        />
                    </div>
                    <div className="rb-margin-item">
                        <span>Left</span>
                        <NumberStepper
                            value={margins.left}
                            min={18}
                            max={144}
                            step={6}
                            onChange={(v) => updateMargin("left", v)}
                        />
                    </div>
                    <div className="rb-margin-item">
                        <span>Right</span>
                        <NumberStepper
                            value={margins.right}
                            min={18}
                            max={144}
                            step={6}
                            onChange={(v) => updateMargin("right", v)}
                        />
                    </div>
                </div>
            </section>

            {/* Page Size */}
            <section className="rb-sidebar-section">
                <h4 className="rb-sidebar-label">Paper Size</h4>
                <div className="rb-sidebar-value">Letter (8.5 × 11 in)</div>
            </section>
        </div>
    );
};
