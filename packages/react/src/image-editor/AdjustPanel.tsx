import React from "react";
import type { AdjustmentsState } from "./types.js";

/* ── AdjustPanel ───────────────────────────────────────────── */

interface AdjustPanelProps {
    adjustments: AdjustmentsState;
    onAdjust: (adj: AdjustmentsState) => void;
    onSliderStart: () => void;
    onReset: () => void;
}

/**
 * Brightness / Contrast / Saturation sliders with reset.
 */
export const AdjustPanel: React.FC<AdjustPanelProps> = ({
    adjustments, onAdjust, onSliderStart, onReset,
}) => (
    <div className="kanava-ie-adjust-controls">
        {(["brightness", "contrast", "saturation"] as const).map((key) => (
            <div className="kanava-ie-slider-row" key={key}>
                <span className="kanava-ie-slider-label">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
                <input
                    type="range"
                    className="kanava-ie-slider"
                    min={0}
                    max={200}
                    step={1}
                    value={adjustments[key]}
                    onPointerDown={onSliderStart}
                    onChange={(e) =>
                        onAdjust({ ...adjustments, [key]: Number(e.target.value) })
                    }
                />
                <span className="kanava-ie-degree">{adjustments[key]}%</span>
            </div>
        ))}
        <button
            className="kanava-ie-reset-btn"
            onClick={onReset}
            type="button"
        >
            Reset Adjustments
        </button>
    </div>
);

AdjustPanel.displayName = "AdjustPanel";
