import { defineBlock } from "../extensions/defineBlock.js";
import { setDividerAttrs } from "../commands/divider.js";
import { deleteCurrentBlock } from "../commands/block.js";
import { NodeSelection } from "prosemirror-state";

/**
 * Divider / horizontal rule — atom block with customizable appearance.
 *
 * Attrs:
 * - `color`: CSS color string (default: null → inherits from CSS variable)
 * - `thickness`: line thickness in px (default: 2)
 * - `width`: percentage of container width, 10–100 (default: 100)
 * - `lineStyle`: "solid" | "dashed" | "dotted" | "double" (default: "solid")
 */
export const Divider = defineBlock({
  name: "divider",
  label: "Divider",
  icon: "—",
  description: "Horizontal line separator",
  group: "layout",
  spec: {
    group: "blockBody",
    atom: true,
    selectable: true,
    draggable: false,
    attrs: {
      color: { default: null },
      thickness: { default: 2 },
      width: { default: 100 },
      lineStyle: { default: "solid" },
    },
    parseDOM: [
      {
        tag: "hr",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            color: el.getAttribute("data-color") || null,
            thickness: parseInt(el.getAttribute("data-thickness") || "2", 10),
            width: parseInt(el.getAttribute("data-width") || "100", 10),
            lineStyle: el.getAttribute("data-line-style") || "solid",
          };
        },
      },
    ],
    toDOM(node) {
      const a = node.attrs;
      const styleParts: string[] = [];
      // Expose visual attributes as CSS custom properties so the
      // stylesheet can draw and vertically center the divider line.
      styleParts.push(`--kanava-divider-style: ${a.lineStyle || "solid"}`);
      styleParts.push(`--kanava-divider-thickness: ${a.thickness || 2}px`);
      if (a.color) styleParts.push(`--kanava-divider-color: ${a.color}`);
      if (a.width < 100) styleParts.push(`width: ${a.width}%`);
      const dataAttrs: Record<string, string> = {};
      if (a.color) dataAttrs["data-color"] = a.color;
      if (a.thickness !== 2) dataAttrs["data-thickness"] = String(a.thickness);
      if (a.width !== 100) dataAttrs["data-width"] = String(a.width);
      if (a.lineStyle !== "solid") dataAttrs["data-line-style"] = a.lineStyle;
      return [
        "hr",
        {
          class: "kanava-divider",
          style: styleParts.join("; "),
          ...dataAttrs,
        },
      ];
    },
  },

  toolbar: [
    {
      key: "divider-style",
      label: "Line style",
      type: "dropdown",
      items: [
        {
          key: "style-solid",
          label: "Solid",
          command: setDividerAttrs({ lineStyle: "solid" }),
          isActive: (state) => {
            if (!(state.selection instanceof NodeSelection)) return false;
            const node = state.selection.node;
            if (node.type.name === "blockNode") {
              const child = node.firstChild;
              return child?.type.name === "divider" && (child.attrs.lineStyle || "solid") === "solid";
            }
            return node.type.name === "divider" && (node.attrs.lineStyle || "solid") === "solid";
          },
        },
        {
          key: "style-dashed",
          label: "Dashed",
          command: setDividerAttrs({ lineStyle: "dashed" }),
          isActive: (state) => {
            if (!(state.selection instanceof NodeSelection)) return false;
            const node = state.selection.node;
            if (node.type.name === "blockNode") return node.firstChild?.attrs.lineStyle === "dashed";
            return node.attrs.lineStyle === "dashed";
          },
        },
        {
          key: "style-dotted",
          label: "Dotted",
          command: setDividerAttrs({ lineStyle: "dotted" }),
          isActive: (state) => {
            if (!(state.selection instanceof NodeSelection)) return false;
            const node = state.selection.node;
            if (node.type.name === "blockNode") return node.firstChild?.attrs.lineStyle === "dotted";
            return node.attrs.lineStyle === "dotted";
          },
        },
        {
          key: "style-double",
          label: "Double",
          command: setDividerAttrs({ lineStyle: "double" }),
          isActive: (state) => {
            if (!(state.selection instanceof NodeSelection)) return false;
            const node = state.selection.node;
            if (node.type.name === "blockNode") return node.firstChild?.attrs.lineStyle === "double";
            return node.attrs.lineStyle === "double";
          },
        },
      ],
    },
    {
      key: "divider-thickness",
      label: "Thickness",
      type: "input",
      inputConfig: {
        inputType: "number",
        placeholder: "2",
        width: 50,
        getValue: (state) => {
          if (!(state.selection instanceof NodeSelection)) return "2";
          const node = state.selection.node;
          if (node.type.name === "blockNode") {
            return String(node.firstChild?.attrs.thickness ?? 2);
          }
          return String(node.attrs.thickness ?? 2);
        },
        onCommit: (value: string) => {
          const n = Math.max(1, Math.min(parseInt(value, 10) || 2, 20));
          return setDividerAttrs({ thickness: n });
        },
      },
    },
    {
      key: "divider-color",
      label: "Divider color",
      icon: "palette",
      type: "button",
      // No command — handled by the React FormatBar as a custom action
    },
    { key: "divider-sep", label: "", type: "separator" },
    {
      key: "divider-delete",
      label: "Delete divider",
      icon: "delete",
      type: "button",
      command: deleteCurrentBlock,
    },
  ],
});
