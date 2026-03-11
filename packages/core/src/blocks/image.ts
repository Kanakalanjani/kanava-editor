import { defineBlock } from "../extensions/defineBlock.js";
import type { ToolbarItem } from "../extensions/defineBlock.js";
import { setImageAlignment, setImageAlt, setImageWidth } from "../commands/image.js";
import { deleteCurrentBlock } from "../commands/block.js";
import { NodeSelection } from "prosemirror-state";

/**
 * CSS filter presets shipped with the image block.
 * Consumers can use these or define their own as raw CSS filter strings.
 */
export const IMAGE_FILTERS: Record<string, string> = {
  none: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(80%)",
  brightness: "brightness(120%)",
  contrast: "contrast(120%)",
  blur: "blur(2px)",
  vintage: "sepia(40%) contrast(110%) brightness(90%)",
};

/**
 * Image block — atom (non-editable content), with src/alt/dimensions/caption/alignment/filter/rotation.
 */
export const Image = defineBlock({
  name: "image",
  label: "Image",
  icon: "🖼",
  description: "Embed an image",
  group: "media",
  spec: {
    group: "blockBody",
    atom: true,
    attrs: {
      src: { default: null },
      alt: { default: "" },
      width: { default: null },
      height: { default: null },
      caption: { default: "" },
      filter: { default: "none" },
      filterIntensity: { default: 100 }, // 0-100 percentage
      adjustments: { default: null },    // { brightness, contrast, saturation } (0-200 scale, 100 = normal)
      alignment: { default: "center" },
      cropData: { default: null }, // { x, y, width, height } percentages (0-100)
      cropShape: { default: "rect" }, // "rect" | "circle" | "rounded"
      rotation: { default: 0 },   // degrees (0-359)
    },
    parseDOM: [
      {
        tag: "img[src]",
        getAttrs(dom) {
          const el = dom as HTMLImageElement;
          const figure = el.closest("figure");
          return {
            src: el.getAttribute("src"),
            alt: el.getAttribute("alt") || "",
            width: el.getAttribute("width")
              ? Number(el.getAttribute("width"))
              : null,
            height: el.getAttribute("height")
              ? Number(el.getAttribute("height"))
              : null,
            caption: figure?.querySelector("figcaption")?.textContent || "",
            filter: el.style.filter || "none",
            filterIntensity: figure?.getAttribute("data-filter-intensity")
              ? Number(figure.getAttribute("data-filter-intensity"))
              : 100,
            adjustments: figure?.getAttribute("data-adjustments")
              ? JSON.parse(figure.getAttribute("data-adjustments")!)
              : null,
            alignment: figure?.getAttribute("data-alignment") || "center",
            cropData: figure?.getAttribute("data-crop")
              ? JSON.parse(figure.getAttribute("data-crop")!)
              : null,
            cropShape: figure?.getAttribute("data-crop-shape") || "rect",
            rotation: figure?.getAttribute("data-rotation")
              ? Number(figure.getAttribute("data-rotation"))
              : 0,
          };
        },
      },
    ],
    toDOM(node) {
      // Build CSS filter string from preset + intensity + adjustments
      const filterParts: string[] = [];
      const filterKey = node.attrs.filter;
      if (filterKey && filterKey !== "none") {
        const preset = IMAGE_FILTERS[filterKey] ?? filterKey;
        const intensity = (node.attrs.filterIntensity ?? 100) / 100;
        if (preset !== "none" && intensity > 0) {
          // Scale numeric values in the preset by intensity
          const scaled = preset.replace(
            /\(([\d.]+)(%|px|deg)?\)/g,
            (_m: string, val: string, unit: string) =>
              `(${(parseFloat(val) * intensity).toFixed(1)}${unit || ""})`
          );
          filterParts.push(scaled);
        }
      }
      const adj = node.attrs.adjustments;
      if (adj) {
        if (adj.brightness != null && adj.brightness !== 100) filterParts.push(`brightness(${adj.brightness}%)`);
        if (adj.contrast != null && adj.contrast !== 100) filterParts.push(`contrast(${adj.contrast}%)`);
        if (adj.saturation != null && adj.saturation !== 100) filterParts.push(`saturate(${adj.saturation}%)`);
      }
      const filterStyle = filterParts.length ? `filter: ${filterParts.join(" ")}` : undefined;
      const crop = node.attrs.cropData;
      const cropStyle = crop
        ? `object-view-box: inset(${crop.y}% ${100 - crop.x - crop.width}% ${100 - crop.y - crop.height}% ${crop.x}%)`
        : undefined;
      const rotation = node.attrs.rotation || 0;
      const rotationStyle = rotation ? `transform: rotate(${rotation}deg); transform-origin: center center` : undefined;
      // Shape crop styles
      const shape = node.attrs.cropShape || "rect";
      const shapeStyle = shape === "circle"
        ? "clip-path: circle(50%); aspect-ratio: 1"
        : shape === "rounded"
          ? "border-radius: 16px; overflow: hidden"
          : undefined;
      const imgStyle = [filterStyle, cropStyle, rotationStyle, shapeStyle].filter(Boolean).join("; ") || undefined;
      return [
        "figure",
        {
          class: `kanava-image kanava-image-align-${node.attrs.alignment || "center"}`,
          "data-alignment": node.attrs.alignment || "center",
          ...(crop ? { "data-crop": JSON.stringify(crop) } : {}),
          ...(shape !== "rect" ? { "data-crop-shape": shape } : {}),
          ...(rotation ? { "data-rotation": String(rotation) } : {}),
          ...(node.attrs.filterIntensity !== 100 ? { "data-filter-intensity": String(node.attrs.filterIntensity) } : {}),
          ...(adj ? { "data-adjustments": JSON.stringify(adj) } : {}),
        },
        [
          "img",
          {
            src: node.attrs.src,
            alt: node.attrs.alt,
            ...(node.attrs.width ? { width: String(node.attrs.width) } : {}),
            ...(node.attrs.height ? { height: String(node.attrs.height) } : {}),
            ...(imgStyle ? { style: imgStyle } : {}),
          },
        ],
      ];
    },
  },

  toolbar: [
    {
      key: "image-align",
      label: "Alignment",
      icon: "alignCenter",
      type: "dropdown",
      items: [
        {
          key: "align-left",
          label: "Left",
          icon: "alignLeft",
          command: setImageAlignment("left"),
          isActive: (state) => {
            if (!(state.selection instanceof NodeSelection)) return false;
            return state.selection.node.attrs.alignment === "left";
          },
        },
        {
          key: "align-center",
          label: "Center",
          icon: "alignCenter",
          command: setImageAlignment("center"),
          isActive: (state) => {
            if (!(state.selection instanceof NodeSelection)) return false;
            return state.selection.node.attrs.alignment === "center";
          },
        },
        {
          key: "align-right",
          label: "Right",
          icon: "alignRight",
          command: setImageAlignment("right"),
          isActive: (state) => {
            if (!(state.selection instanceof NodeSelection)) return false;
            return state.selection.node.attrs.alignment === "right";
          },
        },
      ],
    },
    {
      key: "image-edit",
      label: "Edit Image",
      icon: "editImage",
      type: "button",
      // command is a no-op — the React layer handles imageEdit event emission
    },
    { key: "image-sep-1", label: "", type: "separator" },
    {
      key: "image-alt",
      label: "Alt text",
      icon: "altText",
      type: "input",
      inputConfig: {
        inputType: "text",
        placeholder: "Alt text…",
        width: 120,
        getValue: (state) => {
          if (!(state.selection instanceof NodeSelection)) return "";
          return state.selection.node.attrs.alt || "";
        },
        onCommit: (value: string) => setImageAlt(value),
      },
    },
    {
      key: "image-width",
      label: "Width",
      icon: "width",
      type: "input",
      inputConfig: {
        inputType: "number",
        placeholder: "Auto",
        width: 70,
        getValue: (state) => {
          if (!(state.selection instanceof NodeSelection)) return "";
          const w = state.selection.node.attrs.width;
          return w ? String(w) : "";
        },
        onCommit: (value: string) => {
          const n = parseInt(value, 10);
          return setImageWidth(n > 0 ? n : null);
        },
      },
    },
    {
      key: "image-delete",
      label: "Delete image",
      icon: "delete",
      type: "button",
      command: deleteCurrentBlock,
    },
  ],

  contextMenu: [],
});
