import React, { useCallback, useMemo, useState } from "react";
import type { KanavaEditor, BlockDefinition } from "@kanava/editor";
import { insertBlockAfter } from "@kanava/editor";

/**
 * Describes a block type that can be inserted.
 */
interface BlockTypeEntry {
  type: string;
  label: string;
  icon: string;
  description: string;
  group: string;
  attrs?: Record<string, any>;
}

/**
 * Category metadata for the block picker.
 */
interface Category {
  key: string;
  label: string;
}

/**
 * Ordered categories for display.
 */
const CATEGORIES: Category[] = [
  { key: "text", label: "Text" },
  { key: "list", label: "Lists" },
  { key: "layout", label: "Layout" },
  { key: "media", label: "Media" },
  { key: "advanced", label: "Advanced" },
];

/**
 * Default order within each category.
 */
const INTRA_GROUP_ORDER: Record<string, string[]> = {
  text: ["paragraph", "heading:1", "heading:2", "heading:3", "quote", "codeBlock"],
  list: ["bulletListItem", "numberedListItem", "checklistItem"],
  layout: ["divider", "columnLayout"],
  media: ["image"],
  advanced: ["toggle", "callout"],
};

/**
 * Build BlockTypeEntry list from editor's block definitions, grouped by category.
 */
function buildBlockEntries(blockDefs: readonly BlockDefinition[]): BlockTypeEntry[] {
  const defMap = new Map<string, BlockDefinition>();
  for (const def of blockDefs) {
    defMap.set(def.name, def);
  }

  const entries: BlockTypeEntry[] = [];
  const added = new Set<string>();

  for (const cat of CATEGORIES) {
    const order = INTRA_GROUP_ORDER[cat.key] ?? [];
    for (const key of order) {
      if (key.startsWith("heading:")) {
        const level = parseInt(key.split(":")[1], 10);
        const def = defMap.get("heading");
        if (def) {
          entries.push({
            type: "heading",
            label: `Heading ${level}`,
            icon: `H${level}`,
            description: `Level ${level} heading`,
            group: cat.key,
            attrs: { level },
          });
          added.add(key);
        }
      } else {
        const def = defMap.get(key);
        if (def) {
          entries.push({
            type: def.name,
            label: def.label ?? def.name,
            icon: def.icon ?? "□",
            description: def.description ?? "",
            group: cat.key,
          });
          added.add(def.name);
        }
      }
    }

    // Add blocks with this group not in the explicit order
    for (const def of blockDefs) {
      if (def.group === cat.key && !added.has(def.name)) {
        entries.push({
          type: def.name,
          label: def.label ?? def.name,
          icon: def.icon ?? "□",
          description: def.description ?? "",
          group: cat.key,
        });
        added.add(def.name);
      }
    }
  }

  // Remaining blocks without a recognized group
  for (const def of blockDefs) {
    if (!added.has(def.name) && def.spec?.group?.includes("blockBody")) {
      entries.push({
        type: def.name,
        label: def.label ?? def.name,
        icon: def.icon ?? "□",
        description: def.description ?? "",
        group: "other",
      });
    }
  }

  return entries;
}

export interface BlockPickerProps {
  editor: KanavaEditor | null;
  className?: string;
}

/**
 * Block Picker sidebar — displays available block types grouped by category
 * with search filtering. Click to insert after the current block.
 */
export const BlockPicker: React.FC<BlockPickerProps> = ({
  editor,
  className,
}) => {
  const [search, setSearch] = useState("");

  const blockEntries = useMemo(() => {
    if (!editor) return [];
    return buildBlockEntries(editor.blockDefs);
  }, [editor]);

  const filtered = useMemo(() => {
    if (!search.trim()) return blockEntries;
    const q = search.toLowerCase();
    return blockEntries.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q)
    );
  }, [blockEntries, search]);

  // Group filtered entries by category
  const grouped = useMemo(() => {
    const map = new Map<string, BlockTypeEntry[]>();
    for (const entry of filtered) {
      const existing = map.get(entry.group);
      if (existing) {
        existing.push(entry);
      } else {
        map.set(entry.group, [entry]);
      }
    }
    return map;
  }, [filtered]);

  const handleInsert = useCallback(
    (entry: BlockTypeEntry) => {
      if (!editor) return;
      const cmd = insertBlockAfter(entry.type, entry.attrs);
      cmd(editor.pmState, editor.pmView.dispatch, editor.pmView);
      editor.focus();
    },
    [editor]
  );

  const renderCategory = (catKey: string, label: string) => {
    const items = grouped.get(catKey);
    if (!items || items.length === 0) return null;
    return (
      <div key={catKey} className="kanava-bp-category">
        <div className="kanava-bp-category-label">{label}</div>
        {items.map((entry, i) => (
          <button
            key={`${entry.type}-${i}`}
            className="kanava-bp-item"
            role="option"
            onMouseDown={(e) => {
              e.preventDefault();
              handleInsert(entry);
            }}
            title={entry.description || entry.label}
            type="button"
          >
            <span className="kanava-bp-icon">{entry.icon}</span>
            <span className="kanava-bp-text">
              <span className="kanava-bp-label">{entry.label}</span>
              {entry.description && (
                <span className="kanava-bp-desc">{entry.description}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`kanava-block-picker ${className || ""}`}>
      <div className="kanava-bp-search">
        <input
          type="text"
          className="kanava-bp-search-input"
          placeholder="Search blocks..."
          aria-label="Search blocks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
      <div className="kanava-bp-list" role="listbox" aria-label="Available block types">
        {CATEGORIES.map((cat) => renderCategory(cat.key, cat.label))}
        {renderCategory("other", "Other")}
        {filtered.length === 0 && (
          <div className="kanava-bp-empty">No blocks match &ldquo;{search}&rdquo;</div>
        )}
      </div>
    </div>
  );
};

BlockPicker.displayName = "KanavaBlockPicker";
