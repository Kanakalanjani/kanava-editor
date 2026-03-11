import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ChevronDownIcon } from "./icons/index.js";
import "./components.css";

/* ------------------------------------------------------------------ */
/*  FontPicker                                                          */
/* ------------------------------------------------------------------ */

export interface FontOption {
  label: string;
  value: string;
}

export interface FontPickerProps {
  /** Currently selected font value. */
  value: string;
  /** Called when a font is selected. Empty string = default. */
  onChange: (fontValue: string) => void;
  /** Available font options. Falls back to built-in list. */
  fonts?: FontOption[];
  /** Extra CSS class. */
  className?: string;
}

const DEFAULT_FONTS: FontOption[] = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Impact", value: "Impact, sans-serif" },
];

/**
 * Searchable font dropdown — each option rendered in its own font.
 */
export const FontPicker: React.FC<FontPickerProps> = ({
  value,
  onChange,
  fonts = DEFAULT_FONTS,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Auto-focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return fonts;
    const q = search.toLowerCase();
    return fonts.filter((f) => f.label.toLowerCase().includes(q));
  }, [fonts, search]);

  const selectedLabel = useMemo(() => {
    const found = fonts.find((f) => f.value === value);
    return found?.label || "Default";
  }, [fonts, value]);

  const handleSelect = useCallback((fontValue: string) => {
    onChange(fontValue);
    setIsOpen(false);
    setSearch("");
  }, [onChange]);

  return (
    <div ref={containerRef} className={`kanava-font-picker ${className || ""}`}>
      <button
        className="kanava-fp-trigger"
        onClick={() => setIsOpen((v) => !v)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{ fontFamily: value || "inherit" }}
      >
        {selectedLabel}
        <span className="kanava-fp-caret"><ChevronDownIcon size={10} /></span>
      </button>
      {isOpen && (
        <div className="kanava-fp-dropdown" role="listbox" aria-label="Font family">
          <input
            ref={searchRef}
            className="kanava-fp-search"
            type="text"
            placeholder="Search fonts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search fonts"
            onMouseDown={(e) => e.stopPropagation()}
          />
          <div className="kanava-fp-list">
            {filtered.map((font) => (
              <button
                key={font.value || "default"}
                className={`kanava-fp-option ${value === font.value ? "kanava-fp-option-active" : ""}`}
                style={{ fontFamily: font.value || "inherit" }}
                onClick={() => handleSelect(font.value)}
                role="option"
                aria-selected={value === font.value}
                type="button"
              >
                {font.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="kanava-fp-empty">No fonts match</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

FontPicker.displayName = "KanavaFontPicker";
