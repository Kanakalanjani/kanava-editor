import React from "react";
import type { EditState } from "./types.js";
import { ASPECT_RATIOS, CROP_SHAPES, DEFAULT_CROP, isFullCrop } from "./types.js";

/* ── TransformPanel ────────────────────────────────────────── */

interface TransformPanelProps {
    state: EditState;
    commit: (changes: Partial<EditState>) => void;
    update: (changes: Partial<EditState>) => void;
    snapshot: () => void;
    aspectRatio: number | null;
    setAspectRatio: (ratio: number | null) => void;
}

/**
 * Combined crop + rotation controls.
 * Crop: shape selector, aspect ratio presets.
 * Rotation: preset buttons (0°/90°/180°/270°) + free-angle slider.
 */
export const TransformPanel: React.FC<TransformPanelProps> = ({
    state, commit, update, snapshot,
    aspectRatio, setAspectRatio,
}) => {
    const { crop, cropShape, rotation } = state;
    const noTransform = isFullCrop(crop) && cropShape === "rect" && rotation === 0;

    return (
        <div className="kanava-ie-transform-controls">
            {/* ── Crop ─────────────────────────── */}
            <div className="kanava-ie-section-label">Shape</div>
            <div className="kanava-ie-shape-row">
                {CROP_SHAPES.map((s) => (
                    <button
                        key={s.id}
                        className={`kanava-ie-preset-btn ${cropShape === s.id ? "kanava-ie-preset-active" : ""}`}
                        onClick={() => commit({ cropShape: s.id })}
                        title={s.label}
                        type="button"
                    >
                        {s.icon} {s.label}
                    </button>
                ))}
            </div>

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

            <div className="kanava-ie-section-divider" />

            {/* ── Rotation ─────────────────────── */}
            <div className="kanava-ie-section-label">Rotation</div>
            <div className="kanava-ie-rotate-presets">
                {[0, 90, 180, 270].map((deg) => (
                    <button
                        key={deg}
                        className={`kanava-ie-preset-btn ${rotation === deg ? "kanava-ie-preset-active" : ""}`}
                        onClick={() => commit({ rotation: deg })}
                        type="button"
                    >
                        {deg}°
                    </button>
                ))}
            </div>
            <div className="kanava-ie-slider-row">
                <span className="kanava-ie-slider-label">Angle</span>
                <input
                    type="range"
                    className="kanava-ie-slider"
                    min={0}
                    max={359}
                    step={1}
                    value={rotation}
                    onPointerDown={() => snapshot()}
                    onChange={(e) => update({ rotation: Number(e.target.value) })}
                />
                <span className="kanava-ie-degree">{rotation}°</span>
            </div>

            <div className="kanava-ie-section-divider" />

            {/* ── Info + Reset ─────────────────── */}
            <div className="kanava-ie-crop-info">
                <button
                    className="kanava-ie-reset-btn"
                    onClick={() => {
                        commit({ crop: DEFAULT_CROP, cropShape: "rect", rotation: 0 });
                        setAspectRatio(null);
                    }}
                    disabled={noTransform}
                    type="button"
                >
                    Reset Transform
                </button>
                <span className="kanava-ie-info">
                    {isFullCrop(crop) ? "No crop" : `${crop.width.toFixed(0)}% × ${crop.height.toFixed(0)}%`}
                    {rotation > 0 ? ` · ${rotation}°` : ""}
                </span>
            </div>
        </div>
    );
};

TransformPanel.displayName = "TransformPanel";
