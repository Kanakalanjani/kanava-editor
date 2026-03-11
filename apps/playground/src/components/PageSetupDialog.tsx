import React, { useState, useEffect } from "react";
import type { PaginationConfig, PageSizeName } from "@kanava/editor-react";
import { PageSizePresets } from "@kanava/editor-react";

interface PageSetupDialogProps {
    open: boolean;
    config: PaginationConfig;
    onApply: (config: PaginationConfig) => void;
    onClose: () => void;
}

const PAGE_SIZE_OPTIONS: { label: string; value: PageSizeName }[] = [
    { label: 'Letter (8.5" × 11")', value: "Letter" },
    { label: "A4 (210 × 297 mm)", value: "A4" },
    { label: 'Legal (8.5" × 14")', value: "Legal" },
];

const PX_PER_INCH = 96;

function pxToInch(px: number): string {
    return (px / PX_PER_INCH).toFixed(2);
}

function inchToPx(inch: string): number {
    return Math.round(parseFloat(inch) * PX_PER_INCH);
}

export const PageSetupDialog: React.FC<PageSetupDialogProps> = ({
    open,
    config,
    onApply,
    onClose,
}) => {
    const [pageSize, setPageSize] = useState<PageSizeName>(
        typeof config.pageSize === "string" ? config.pageSize : "Letter",
    );
    const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
    const [marginTop, setMarginTop] = useState(pxToInch(config.margins?.top ?? 72));
    const [marginBottom, setMarginBottom] = useState(pxToInch(config.margins?.bottom ?? 72));
    const [marginLeft, setMarginLeft] = useState(pxToInch(config.margins?.left ?? 96));
    const [marginRight, setMarginRight] = useState(pxToInch(config.margins?.right ?? 96));

    // Sync with incoming config when dialog opens
    useEffect(() => {
        if (open) {
            setPageSize(typeof config.pageSize === "string" ? config.pageSize : "Letter");
            setMarginTop(pxToInch(config.margins?.top ?? 72));
            setMarginBottom(pxToInch(config.margins?.bottom ?? 72));
            setMarginLeft(pxToInch(config.margins?.left ?? 96));
            setMarginRight(pxToInch(config.margins?.right ?? 96));
        }
    }, [open, config]);

    if (!open) return null;

    const handleApply = () => {
        const preset = PageSizePresets[pageSize];
        const dims =
            orientation === "landscape"
                ? { width: preset.height, height: preset.width }
                : preset;

        onApply({
            pageSize: dims,
            margins: {
                top: inchToPx(marginTop),
                bottom: inchToPx(marginBottom),
                left: inchToPx(marginLeft),
                right: inchToPx(marginRight),
            },
        });
        onClose();
    };

    return (
        <div className="pg-dialog-backdrop" onClick={onClose}>
            <div className="pg-dialog" onClick={(e) => e.stopPropagation()}>
                <h3 className="pg-dialog-title">Page Setup</h3>

                {/* Paper Size */}
                <div className="pg-dialog-field">
                    <label>Paper Size</label>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as PageSizeName)}
                    >
                        {PAGE_SIZE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Orientation */}
                <div className="pg-dialog-field">
                    <label>Orientation</label>
                    <div className="pg-dialog-orientation">
                        <button
                            className={`pg-orient-btn ${orientation === "portrait" ? "active" : ""}`}
                            onClick={() => setOrientation("portrait")}
                        >
                            <span className="pg-orient-icon portrait" />
                            Portrait
                        </button>
                        <button
                            className={`pg-orient-btn ${orientation === "landscape" ? "active" : ""}`}
                            onClick={() => setOrientation("landscape")}
                        >
                            <span className="pg-orient-icon landscape" />
                            Landscape
                        </button>
                    </div>
                </div>

                {/* Margins */}
                <div className="pg-dialog-field">
                    <label>Margins (inches)</label>
                    <div className="pg-dialog-margins">
                        <div className="pg-margin-input">
                            <span>Top</span>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={marginTop}
                                onChange={(e) => setMarginTop(e.target.value)}
                            />
                        </div>
                        <div className="pg-margin-input">
                            <span>Bottom</span>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={marginBottom}
                                onChange={(e) => setMarginBottom(e.target.value)}
                            />
                        </div>
                        <div className="pg-margin-input">
                            <span>Left</span>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={marginLeft}
                                onChange={(e) => setMarginLeft(e.target.value)}
                            />
                        </div>
                        <div className="pg-margin-input">
                            <span>Right</span>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={marginRight}
                                onChange={(e) => setMarginRight(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pg-dialog-actions">
                    <button className="pg-dialog-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="pg-dialog-apply" onClick={handleApply}>
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};
