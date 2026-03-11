import React from "react";
import {
    type CropState,
    type CropShapeType,
    ASPECT_RATIOS,
    CROP_SHAPES,
    isFullCrop,
} from "./types.js";

/* ── CropPanel ─────────────────────────────────────────────── */

interface CropPanelProps {
    crop: CropState;
    cropShape: CropShapeType;
    setCropShape: (shape: CropShapeType) => void;
    aspectRatio: number | null;
    setAspectRatio: (ratio: number | null) => void;
    /** Tracked reset — pushes a history snapshot before resetting crop/shape/ratio. */
    onResetCrop: () => void;
}

/**
 * Crop controls — shape selector, aspect ratio presets, reset button.
 * Drag interaction is handled by the parent ImageEditorModal.
 */
export const CropPanel: React.FC<CropPanelProps> = ({
    crop, cropShape, setCropShape,
    aspectRatio, setAspectRatio, onResetCrop,
}) => {
    const full = isFullCrop(crop);

    return (
        <div className="kanava-ie-crop-controls">
            {/* Shape selector */}
            <div className="kanava-ie-section-label">Shape</div>
            <div className="kanava-ie-shape-row">
                {CROP_SHAPES.map((s) => (
                    <button
                        key={s.id}
                        className={`kanava-ie-preset-btn ${cropShape === s.id ? "kanava-ie-preset-active" : ""}`}
                        onClick={() => setCropShape(s.id)}
                        title={s.label}
                        type="button"
                    >
                        {s.icon} {s.label}
                    </button>
                ))}
            </div>

            {/* Aspect ratio presets */}
            <div className="kanava-ie-section-label">Aspect Ratio</div>
            <div className="kanava-ie-aspect-ratios">
                {ASPECT_RATIOS.map((ar) => (
                    <button
                        key={ar.label}
                        className={`kanava-ie-preset-btn ${aspectRatio === ar.value ? "kanava-ie-preset-active" : ""}`}
                        onClick={() => setAspectRatio(ar.value)}
                        type="button"
                    >
                        {ar.label}
                    </button>
                ))}
            </div>

            {/* Reset + info */}
            <div className="kanava-ie-crop-info">
                <button
                    className="kanava-ie-reset-btn"
                    onClick={onResetCrop}
                    disabled={full}
                    type="button"
                >
                    Reset
                </button>
                <span className="kanava-ie-info">
                    {full ? "No crop" : `${crop.width.toFixed(0)}% × ${crop.height.toFixed(0)}%`}
                </span>
            </div>
        </div>
    );
};

CropPanel.displayName = "CropPanel";
