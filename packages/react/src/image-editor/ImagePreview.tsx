import React, { useState, useCallback, useRef, useEffect } from "react";
import { IMAGE_FILTERS } from "@kanava/editor";
import type { CropState, AdjustmentsState, CropShapeType, ActiveTab } from "./types.js";

/* ── ImagePreview ──────────────────────────────────────────── */

interface ImagePreviewProps {
    src: string;
    alt: string;
    previewRef: React.RefObject<HTMLDivElement>;
    activeTab: ActiveTab;
    rotation: number;
    selectedFilter: string;
    filterIntensity: number;
    adjustments: AdjustmentsState;
    crop: CropState;
    cropShape: CropShapeType;
    onCropMouseDown: (type: string, e: React.MouseEvent) => void;
    onImageLoad?: (naturalWidth: number, naturalHeight: number) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.25;

/**
 * Live preview of the image with CSS filters applied.
 * In crop mode, renders the crop overlay, mask, grid lines, and drag handles.
 * Supports zoom (mouse wheel) and pan (drag when zoomed) for precision editing.
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
    src, alt, previewRef, activeTab, rotation,
    selectedFilter, filterIntensity, adjustments,
    crop, cropShape, onCropMouseDown, onImageLoad,
}) => {
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const panDragging = useRef<{ startX: number; startY: number; startPan: { x: number; y: number } } | null>(null);

    // Reset zoom/pan when image source changes (new image opened)
    useEffect(() => {
        setZoom(MIN_ZOOM);
        setPan({ x: 0, y: 0 });
    }, [src]);

    const isZoomed = zoom > MIN_ZOOM;

    // Mouse wheel → zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom((prev) => {
            const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
            const next = Math.round((prev + delta) * 100) / 100;
            const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
            // Reset pan when zooming back to 1x
            if (clamped <= MIN_ZOOM) {
                setPan({ x: 0, y: 0 });
            }
            return clamped;
        });
    }, []);

    // Double-click → reset to fit
    const handleDoubleClick = useCallback(() => {
        setZoom(MIN_ZOOM);
        setPan({ x: 0, y: 0 });
    }, []);

    // Pan drag (only when zoomed)
    const handlePanMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isZoomed) return;
        // Don't intercept crop handle clicks
        const target = e.target as HTMLElement;
        if (target.classList.contains("kanava-ie-crop-handle") ||
            target.classList.contains("kanava-ie-crop-region")) return;
        e.preventDefault();
        panDragging.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPan: { ...pan },
        };
    }, [isZoomed, pan]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const drag = panDragging.current;
            if (!drag) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            setPan({ x: drag.startPan.x + dx, y: drag.startPan.y + dy });
        };
        const onMouseUp = () => { panDragging.current = null; };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, []);
    // Compute live CSS filter string
    const filterStyle = React.useMemo(() => {
        const parts: string[] = [];
        if (selectedFilter && selectedFilter !== "none") {
            const preset = IMAGE_FILTERS[selectedFilter] ?? selectedFilter;
            const intensity = (filterIntensity ?? 100) / 100;
            if (preset !== "none" && intensity > 0) {
                const scaled = preset.replace(
                    /\(([\d.]+)(%|px|deg)?\)/g,
                    (_m: string, val: string, unit: string) =>
                        `(${(parseFloat(val) * intensity).toFixed(1)}${unit || ""})`
                );
                parts.push(scaled);
            }
        }
        if (adjustments.brightness !== 100) parts.push(`brightness(${adjustments.brightness}%)`);
        if (adjustments.contrast !== 100) parts.push(`contrast(${adjustments.contrast}%)`);
        if (adjustments.saturation !== 100) parts.push(`saturate(${adjustments.saturation}%)`);
        return parts.join(" ") || undefined;
    }, [selectedFilter, filterIntensity, adjustments]);

    // Crop shape border-radius for overlay
    const cropBorderRadius = cropShape === "circle" ? "50%"
        : cropShape === "rounded" ? "16px"
            : undefined;

    // Image transform combining zoom, pan, and rotation
    const imageTransform = React.useMemo(() => {
        const parts: string[] = [];
        if (isZoomed) {
            parts.push(`scale(${zoom})`);
            parts.push(`translate(${pan.x / zoom}px, ${pan.y / zoom}px)`);
        }
        if (activeTab === "transform") {
            parts.push(`rotate(${rotation}deg)`);
        }
        return parts.length > 0 ? parts.join(" ") : undefined;
    }, [isZoomed, zoom, pan, activeTab, rotation]);

    return (
        <div
            className={`kanava-ie-preview${isZoomed ? " kanava-ie-preview-zoomed" : ""}`}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handlePanMouseDown}
        >
            {/*
             * img-wrapper shrinks to the exact rendered image size.
             * All crop overlays live inside so their % coordinates
             * map 1-to-1 to image pixels — fixing letterbox/pillarbox misalignment.
             */}
            <div className="kanava-ie-img-wrapper" ref={previewRef}>
                <img
                    src={src}
                    alt={alt || ""}
                    className="kanava-ie-preview-img"
                    style={{
                        transform: imageTransform,
                        filter: filterStyle,
                    }}
                    draggable={false}
                    onLoad={(e) => {
                        const img = e.currentTarget;
                        onImageLoad?.(img.naturalWidth, img.naturalHeight);
                    }}
                />

                {/* Crop overlay (only in crop tab) */}
                {activeTab === "transform" && (
                    <>
                        {/* Dark mask with hole cut for crop region */}
                        <div className="kanava-ie-crop-mask">
                            <svg className="kanava-ie-crop-mask-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <mask id="kanava-crop-mask">
                                        <rect width="100" height="100" fill="white" />
                                        {cropShape === "circle" ? (
                                            <ellipse
                                                cx={crop.x + crop.width / 2}
                                                cy={crop.y + crop.height / 2}
                                                rx={crop.width / 2}
                                                ry={crop.height / 2}
                                                fill="black"
                                            />
                                        ) : (
                                            <rect
                                                x={crop.x}
                                                y={crop.y}
                                                width={crop.width}
                                                height={crop.height}
                                                rx={cropShape === "rounded" ? 2.5 : 0}
                                                fill="black"
                                            />
                                        )}
                                    </mask>
                                </defs>
                                <rect width="100" height="100" fill="rgba(0,0,0,0.45)" mask="url(#kanava-crop-mask)" />
                            </svg>
                        </div>

                        {/* Interactive crop region */}
                        <div
                            className="kanava-ie-crop-region"
                            style={{
                                left: `${crop.x}%`,
                                top: `${crop.y}%`,
                                width: `${crop.width}%`,
                                height: `${crop.height}%`,
                                borderRadius: cropBorderRadius,
                            }}
                            onMouseDown={(e) => onCropMouseDown("move", e)}
                        >
                            {/* Rule-of-thirds grid */}
                            <div className="kanava-ie-crop-grid">
                                <div className="kanava-ie-crop-grid-h" style={{ top: "33.33%" }} />
                                <div className="kanava-ie-crop-grid-h" style={{ top: "66.66%" }} />
                                <div className="kanava-ie-crop-grid-v" style={{ left: "33.33%" }} />
                                <div className="kanava-ie-crop-grid-v" style={{ left: "66.66%" }} />
                            </div>
                        </div>

                        {/* Corner + edge handles */}
                        {(["nw", "ne", "sw", "se", "n", "s", "e", "w"] as const).map((handle) => {
                            const style = getHandlePosition(handle, crop);
                            return (
                                <div
                                    key={handle}
                                    className={`kanava-ie-crop-handle kanava-ie-h-${handle}`}
                                    style={style}
                                    onMouseDown={(e) => onCropMouseDown(handle, e)}
                                />
                            );
                        })}
                    </>
                )}
            </div>

            {/* Zoom indicator — in outer container so it doesn't affect wrapper size */}
            {isZoomed && (
                <div className="kanava-ie-zoom-indicator" onDoubleClick={handleDoubleClick}>
                    {Math.round(zoom * 100)}%
                </div>
            )}
        </div>
    );
};

ImagePreview.displayName = "ImagePreview";

/* ── Handle position helper ──────────────────────────────── */

function getHandlePosition(
    handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w",
    crop: CropState,
): React.CSSProperties {
    const l = crop.x;
    const t = crop.y;
    const r = crop.x + crop.width;
    const b = crop.y + crop.height;
    const cx = l + crop.width / 2;
    const cy = t + crop.height / 2;

    // All handles are positioned absolutely within .kanava-ie-preview
    const base: React.CSSProperties = { position: "absolute", zIndex: 3 };

    switch (handle) {
        case "nw": return { ...base, left: `${l}%`, top: `${t}%`, transform: "translate(-50%, -50%)" };
        case "ne": return { ...base, left: `${r}%`, top: `${t}%`, transform: "translate(-50%, -50%)" };
        case "sw": return { ...base, left: `${l}%`, top: `${b}%`, transform: "translate(-50%, -50%)" };
        case "se": return { ...base, left: `${r}%`, top: `${b}%`, transform: "translate(-50%, -50%)" };
        case "n": return { ...base, left: `${cx}%`, top: `${t}%`, transform: "translate(-50%, -50%)" };
        case "s": return { ...base, left: `${cx}%`, top: `${b}%`, transform: "translate(-50%, -50%)" };
        case "e": return { ...base, left: `${r}%`, top: `${cy}%`, transform: "translate(-50%, -50%)" };
        case "w": return { ...base, left: `${l}%`, top: `${cy}%`, transform: "translate(-50%, -50%)" };
    }
}
