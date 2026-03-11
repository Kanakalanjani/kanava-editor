import React, { useEffect, useState, useRef, useCallback } from "react";
import type { KanavaEditor } from "@kanava/editor";
import type { ImageEditEventPayload } from "@kanava/editor";
import { IMAGE_FILTERS } from "@kanava/editor";
import "./image-editor.css";

import type { CropState, ActiveTab, EditState } from "./types.js";
import { DEFAULT_CROP, DEFAULT_ADJUSTMENTS, DEFAULT_EDIT_STATE, isFullCrop } from "./types.js";
import { useImageEditorState } from "./useImageEditorState.js";
import { ImagePreview } from "./ImagePreview.js";
import { TransformPanel } from "./TransformPanel.js";
import { FilterPanel } from "./FilterPanel.js";
import { AdjustPanel } from "./AdjustPanel.js";
import {
    CropIcon, FilterIcon, AdjustmentsIcon, CloseIcon, UndoIcon, RedoIcon,
} from "../icons/index.js";

const FILTER_NAMES = Object.keys(IMAGE_FILTERS);

/* ── ImageEditorModal ──────────────────────────────────────── */

export interface ImageEditorModalProps {
    editor: KanavaEditor | null;
}

/**
 * Modal dialog for editing an image.
 * Three tabs: Transform (crop + rotate), Filters, Adjust.
 * Opens when the editor emits an `imageEdit` event.
 *
 * State is managed by `useImageEditorState` — a two-stack undo/redo
 * hook with explicit commit/update/snapshot. No sync effects means
 * no race conditions between history restoration and live state updates.
 */
export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ editor }) => {
    const [open, setOpen] = useState(false);
    const [imageAttrs, setImageAttrs] = useState<Record<string, any>>({});
    const [imagePos, setImagePos] = useState(0);
    const [activeTab, setActiveTab] = useState<ActiveTab>("transform");
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);
    const [imageAspect, setImageAspect] = useState(1);

    const es = useImageEditorState(DEFAULT_EDIT_STATE);

    // Stable ref to latest state — allows effects and callbacks to read
    // the freshest state without re-running when state changes.
    const stateRef = useRef(es.state);
    stateRef.current = es.state;

    const previewRef = useRef<HTMLDivElement>(null);

    // Crop drag ref
    const cropDragging = useRef<{
        type: string;
        startX: number;
        startY: number;
        startCrop: CropState;
    } | null>(null);

    // ── Open via imageEdit event ───────────────────────────
    useEffect(() => {
        if (!editor) return;
        const unsub = editor.on("imageEdit", (payload: ImageEditEventPayload) => {
            setImageAttrs(payload.attrs);
            setImagePos(payload.pos);

            const initial: EditState = {
                rotation: payload.attrs.rotation || 0,
                crop: payload.attrs.cropData
                    ? { ...payload.attrs.cropData }
                    : DEFAULT_CROP,
                cropShape: payload.attrs.cropShape || "rect",
                filter: payload.attrs.filter || "none",
                filterIntensity: payload.attrs.filterIntensity ?? 100,
                adjustments: payload.attrs.adjustments
                    ? { ...payload.attrs.adjustments }
                    : DEFAULT_ADJUSTMENTS,
            };
            es.reset(initial);
            setAspectRatio(null);
            setImageAspect(1);
            setActiveTab("transform");
            setOpen(true);
        });
        return unsub;
    }, [editor, es.reset]);

    // ── Apply / Cancel ─────────────────────────────────────
    const handleApply = useCallback(() => {
        if (!editor) return;
        const s = stateRef.current;
        const full = isFullCrop(s.crop);
        const newCropData = full ? null : { ...s.crop };
        const newRotation = s.rotation % 360;
        const isDefaultAdj =
            s.adjustments.brightness === 100 &&
            s.adjustments.contrast === 100 &&
            s.adjustments.saturation === 100;

        const node = editor.pmView.state.doc.nodeAt(imagePos);
        if (!node) { setOpen(false); return; }

        const tr = editor.pmView.state.tr.setNodeMarkup(imagePos, undefined, {
            ...node.attrs,
            cropData: newCropData,
            rotation: newRotation,
            filter: s.filter,
            filterIntensity: s.filterIntensity,
            adjustments: isDefaultAdj ? null : { ...s.adjustments },
            cropShape: s.cropShape,
        });
        editor.pmView.dispatch(tr);
        editor.focus();
        setOpen(false);
    }, [editor, imagePos]);

    const handleCancel = useCallback(() => setOpen(false), []);

    const handleImageLoad = useCallback((nw: number, nh: number) => {
        if (nh > 0) setImageAspect(nw / nh);
    }, []);

    // ── Crop drag interaction ──────────────────────────────
    const handleCropMouseDown = useCallback(
        (type: string, e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            es.snapshot();
            cropDragging.current = {
                type,
                startX: e.clientX,
                startY: e.clientY,
                startCrop: { ...stateRef.current.crop },
            };
        },
        [es.snapshot],
    );

    useEffect(() => {
        if (!open) return;

        const onMouseMove = (e: MouseEvent) => {
            const drag = cropDragging.current;
            if (!drag || !previewRef.current) return;

            const s = stateRef.current;
            const visualRatio = s.cropShape === "circle" ? 1 : aspectRatio;
            const effectiveRatio = visualRatio != null ? (visualRatio / imageAspect) : null;

            const rect = previewRef.current.getBoundingClientRect();
            const dx = ((e.clientX - drag.startX) / rect.width) * 100;
            const dy = ((e.clientY - drag.startY) / rect.height) * 100;
            const sc = drag.startCrop;

            let newCrop: CropState;

            if (drag.type === "move") {
                newCrop = {
                    x: Math.max(0, Math.min(100 - sc.width, sc.x + dx)),
                    y: Math.max(0, Math.min(100 - sc.height, sc.y + dy)),
                    width: sc.width,
                    height: sc.height,
                };
            } else {
                newCrop = { ...sc };
                const t = drag.type;

                if (t.includes("w")) {
                    const newX = Math.max(0, Math.min(sc.x + sc.width - 5, sc.x + dx));
                    newCrop.width = sc.width + (sc.x - newX);
                    newCrop.x = newX;
                }
                if (t.includes("e") || t === "se" || t === "ne") {
                    newCrop.width = Math.max(5, Math.min(100 - sc.x, sc.width + dx));
                }
                if (t.includes("n")) {
                    const newY = Math.max(0, Math.min(sc.y + sc.height - 5, sc.y + dy));
                    newCrop.height = sc.height + (sc.y - newY);
                    newCrop.y = newY;
                }
                if (t.includes("s") || t === "se" || t === "sw") {
                    newCrop.height = Math.max(5, Math.min(100 - sc.y, sc.height + dy));
                }

                // Enforce aspect ratio
                if (effectiveRatio) {
                    const desiredH = newCrop.width / effectiveRatio;
                    if (newCrop.y + desiredH <= 100) {
                        newCrop.height = desiredH;
                    } else {
                        newCrop.height = 100 - newCrop.y;
                        newCrop.width = newCrop.height * effectiveRatio;
                    }
                    if (newCrop.x + newCrop.width > 100) {
                        newCrop.width = 100 - newCrop.x;
                        newCrop.height = newCrop.width / effectiveRatio;
                    }
                }
            }

            es.update({ crop: newCrop });
        };

        const onMouseUp = () => { cropDragging.current = null; };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [open, aspectRatio, es.update, imageAspect]);

    // Auto-adjust crop when aspect ratio or crop shape changes
    useEffect(() => {
        if (!open) return;
        const s = stateRef.current;
        const visualRatio = s.cropShape === "circle" ? 1 : aspectRatio;
        const effectiveRatio = visualRatio != null ? (visualRatio / imageAspect) : null;
        if (!effectiveRatio) return;

        const prev = s.crop;
        const maxW = 100 - prev.x;
        const maxH = 100 - prev.y;
        let w = prev.width;
        let h = w / effectiveRatio;
        if (h > maxH) { h = maxH; w = h * effectiveRatio; }
        if (w > maxW) { w = maxW; h = w / effectiveRatio; }
        es.update({ crop: { x: prev.x, y: prev.y, width: w, height: h } });
    }, [open, aspectRatio, es.state.cropShape, es.update, imageAspect]);

    // ── Keyboard shortcuts ─────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;

            if (e.key === "Escape") { e.preventDefault(); handleCancel(); return; }
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleApply(); return; }

            // Undo / Redo
            if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); es.undo(); return; }
            if ((e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
                (e.key === "y" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); es.redo(); return; }

            const s = stateRef.current;

            // Rotate 90° CW / CCW
            if (e.key === "r" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                es.commit({ rotation: (s.rotation + 90) % 360 });
                return;
            }
            if (e.key === "R" && e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                es.commit({ rotation: (s.rotation - 90 + 360) % 360 });
                return;
            }

            // Reset current tab: 0
            if (e.key === "0" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (activeTab === "transform") {
                    es.commit({ crop: DEFAULT_CROP, cropShape: "rect", rotation: 0 });
                } else if (activeTab === "filters") {
                    es.commit({ filter: "none", filterIntensity: 100 });
                } else if (activeTab === "adjust") {
                    es.commit({ adjustments: DEFAULT_ADJUSTMENTS });
                }
                return;
            }

            // Remove crop: Backspace
            if (e.key === "Backspace" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                es.commit({ crop: DEFAULT_CROP });
                return;
            }

            // Previous / next filter: [ / ]
            if (e.key === "[" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const idx = FILTER_NAMES.indexOf(s.filter);
                es.commit({ filter: FILTER_NAMES[idx <= 0 ? FILTER_NAMES.length - 1 : idx - 1] });
                return;
            }
            if (e.key === "]" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const idx = FILTER_NAMES.indexOf(s.filter);
                es.commit({ filter: FILTER_NAMES[idx >= FILTER_NAMES.length - 1 ? 0 : idx + 1] });
                return;
            }

            // Before/after toggle: Space (hold)
            if (e.key === " " && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setShowOriginal(true);
                return;
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === " ") setShowOriginal(false);
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("keyup", onKeyUp);
        };
    }, [open, activeTab, handleApply, handleCancel, es.undo, es.redo, es.commit, es.snapshot]);

    if (!open || !imageAttrs.src) return null;

    const { crop, cropShape, rotation, filter: selectedFilter, filterIntensity, adjustments } = es.state;

    const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
        { id: "transform", label: "Transform", icon: <CropIcon size={16} /> },
        { id: "filters", label: "Filters", icon: <FilterIcon size={16} /> },
        { id: "adjust", label: "Adjust", icon: <AdjustmentsIcon size={16} /> },
    ];

    return (
        <div className="kanava-ie-backdrop" onMouseDown={handleCancel}>
            <div
                className="kanava-ie-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Edit Image"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="kanava-ie-header">
                    <h3 className="kanava-ie-title">Edit Image</h3>
                    <button className="kanava-ie-close" onClick={handleCancel} title="Close" type="button" aria-label="Close">
                        <CloseIcon size={16} />
                    </button>
                </div>

                {/* Tab bar */}
                <div className="kanava-ie-tabs" role="tablist">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`kanava-ie-tab ${activeTab === tab.id ? "kanava-ie-tab-active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Preview area with crop overlay */}
                <ImagePreview
                    src={imageAttrs.src}
                    alt={imageAttrs.alt}
                    previewRef={previewRef}
                    activeTab={activeTab}
                    rotation={showOriginal ? 0 : rotation}
                    selectedFilter={showOriginal ? "none" : selectedFilter}
                    filterIntensity={showOriginal ? 100 : filterIntensity}
                    adjustments={showOriginal ? DEFAULT_ADJUSTMENTS : adjustments}
                    crop={showOriginal ? DEFAULT_CROP : crop}
                    cropShape={cropShape}
                    onCropMouseDown={handleCropMouseDown}
                    onImageLoad={handleImageLoad}
                />

                {/* Controls area — render active panel */}
                <div className="kanava-ie-controls" role="tabpanel">
                    {activeTab === "transform" && (
                        <TransformPanel
                            state={es.state}
                            commit={es.commit}
                            update={es.update}
                            snapshot={es.snapshot}
                            aspectRatio={aspectRatio}
                            setAspectRatio={setAspectRatio}
                        />
                    )}
                    {activeTab === "filters" && (
                        <FilterPanel
                            imageSrc={imageAttrs.src}
                            selectedFilter={selectedFilter}
                            setSelectedFilter={(f) => es.commit({ filter: f })}
                            filterIntensity={filterIntensity}
                            setFilterIntensity={(v) => es.update({ filterIntensity: v })}
                            onIntensityStart={() => es.snapshot()}
                        />
                    )}
                    {activeTab === "adjust" && (
                        <AdjustPanel
                            adjustments={adjustments}
                            onAdjust={(adj) => es.update({ adjustments: adj })}
                            onSliderStart={() => es.snapshot()}
                            onReset={() => es.commit({ adjustments: DEFAULT_ADJUSTMENTS })}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="kanava-ie-footer">
                    <div className="kanava-ie-footer-left">
                        <button
                            className="kanava-ie-undo-btn"
                            onClick={es.undo}
                            disabled={!es.canUndo}
                            title="Undo (Ctrl+Z)"
                            type="button"
                            aria-label="Undo"
                        ><UndoIcon size={16} /></button>
                        <button
                            className="kanava-ie-redo-btn"
                            onClick={es.redo}
                            disabled={!es.canRedo}
                            title="Redo (Ctrl+Shift+Z)"
                            type="button"
                            aria-label="Redo"
                        ><RedoIcon size={16} /></button>
                        {showOriginal && (
                            <span className="kanava-ie-original-badge">Original</span>
                        )}
                    </div>
                    <div className="kanava-ie-footer-right">
                        <button className="kanava-ie-cancel-btn" onClick={handleCancel} type="button">
                            Cancel
                        </button>
                        <button className="kanava-ie-apply-btn" onClick={handleApply} type="button">
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

ImageEditorModal.displayName = "ImageEditorModal";
