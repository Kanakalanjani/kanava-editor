/* ── Shared types and constants for the Image Editor ──────── */

export interface CropState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface AdjustmentsState {
    brightness: number;
    contrast: number;
    saturation: number;
}

export type ActiveTab = "transform" | "filters" | "adjust";

export type CropShapeType = "rect" | "circle" | "rounded";

export const ASPECT_RATIOS = [
    { label: "Free", value: null },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "3:2", value: 3 / 2 },
    { label: "2:3", value: 2 / 3 },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
] as const;

export const CROP_SHAPES: { id: CropShapeType; label: string; icon: string }[] = [
    { id: "rect", label: "Rectangle", icon: "▭" },
    { id: "circle", label: "Circle", icon: "○" },
    { id: "rounded", label: "Rounded", icon: "▢" },
];

export const DEFAULT_CROP: CropState = { x: 0, y: 0, width: 100, height: 100 };
export const DEFAULT_ADJUSTMENTS: AdjustmentsState = { brightness: 100, contrast: 100, saturation: 100 };

export function isFullCrop(crop: CropState): boolean {
    return crop.x === 0 && crop.y === 0 && crop.width === 100 && crop.height === 100;
}

/** Full snapshot of all edits — used by undo/redo history. */
export interface EditState {
    crop: CropState;
    cropShape: CropShapeType;
    rotation: number;
    filter: string;
    filterIntensity: number;
    adjustments: AdjustmentsState;
}

export const DEFAULT_EDIT_STATE: EditState = {
    crop: DEFAULT_CROP,
    cropShape: "rect",
    rotation: 0,
    filter: "none",
    filterIntensity: 100,
    adjustments: DEFAULT_ADJUSTMENTS,
};
