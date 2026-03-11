import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import "./components.css";

/* ------------------------------------------------------------------ */
/*  ColorPicker                                                         */
/* ------------------------------------------------------------------ */

export interface ColorPickerProps {
  /** Current color value (hex string or empty for default). */
  value: string;
  /** Called when a color is selected. Empty string = remove / default. */
  onChange: (color: string) => void;
  /** Color presets to display. Falls back to built-in palette. */
  presets?: string[];
  /** Allow custom hex input. Default: true. */
  allowCustom?: boolean;
  /** Accessible label. */
  label?: string;
  /** Extra CSS class. */
  className?: string;
}

const DEFAULT_PRESETS = [
  "",        // default / remove
  "#e74c3c", "#e67e22", "#f1c40f", "#27ae60",
  "#2980b9", "#8e44ad", "#e91e8c", "#7f8c8d",
  "#1a1a1a", "#555555", "#999999", "#cccccc",
];

/* ── Color conversion helpers ────────────────────────────── */

function hexToHSV(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  const s = max === 0 ? 0 : d / max;
  return [h * 360, s * 100, max * 100];
}

function hsvToHex(h: number, s: number, v: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function normalizeHex(hex: string): string {
  hex = hex.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  return "";
}

/** Pure-hue hex at full saturation/value for the gradient background. */
function hueToHex(h: number): string {
  return hsvToHex(h, 100, 100);
}

/* ── Saturation/Value gradient panel ─────────────────────── */

const SatValPanel: React.FC<{
  hue: number;
  sat: number;
  val: number;
  onSatValChange: (s: number, v: number) => void;
}> = ({ hue, sat, val, onSatValChange }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    onSatValChange((x / rect.width) * 100, 100 - (y / rect.height) * 100);
  }, [onSatValChange]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    pick(e);
    const onMove = (me: MouseEvent) => { if (dragging.current) pick(me); };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pick]);

  return (
    <div
      ref={panelRef}
      className="kanava-cp-satval"
      style={{ background: hueToHex(hue) }}
      onMouseDown={onMouseDown}
    >
      <div className="kanava-cp-satval-white" />
      <div className="kanava-cp-satval-black" />
      <div
        className="kanava-cp-cursor"
        style={{ left: `${sat}%`, top: `${100 - val}%` }}
      />
    </div>
  );
};

/* ── Hue slider ──────────────────────────────────────────── */

const HueSlider: React.FC<{
  hue: number;
  onHueChange: (h: number) => void;
}> = ({ hue, onHueChange }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback((e: { clientX: number }) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    onHueChange((x / rect.width) * 360);
  }, [onHueChange]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    pick(e);
    const onMove = (me: MouseEvent) => { if (dragging.current) pick(me); };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pick]);

  return (
    <div ref={barRef} className="kanava-cp-hue" onMouseDown={onMouseDown}>
      <div className="kanava-cp-hue-thumb" style={{ left: `${(hue / 360) * 100}%` }} />
    </div>
  );
};

/* ── EyeDropper (browser API, progressive) ───────────────── */

const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

/* ── Main ColorPicker ────────────────────────────────────── */

/**
 * Full-featured color picker with saturation/brightness gradient,
 * hue slider, hex input, eyedropper, and preset swatches.
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  allowCustom = true,
  label = "Color",
  className,
}) => {
  // Parse initial HSV from the current hex value
  const initHSV = useMemo((): [number, number, number] => {
    const n = normalizeHex(value);
    return n ? hexToHSV(n) : [0, 100, 100];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [hue, setHue] = useState(initHSV[0]);
  const [sat, setSat] = useState(initHSV[1]);
  const [val, setVal] = useState(initHSV[2]);
  const [hexInput, setHexInput] = useState(value || "");

  // Sync HSV → hex on internal changes (but not when editing hex input)
  const internalChange = useRef(false);

  const currentHex = useMemo(() => hsvToHex(hue, sat, val), [hue, sat, val]);

  // When HSV changes from gradient/slider interaction, update hex input + emit
  useEffect(() => {
    if (internalChange.current) {
      internalChange.current = false;
      return;
    }
    setHexInput(currentHex);
  }, [currentHex]);

  const handleSatValChange = useCallback((s: number, v: number) => {
    setSat(s);
    setVal(v);
    onChange(hsvToHex(hue, s, v));
  }, [hue, onChange]);

  const handleHueChange = useCallback((h: number) => {
    setHue(h);
    onChange(hsvToHex(h, sat, val));
  }, [sat, val, onChange]);

  const handleHexSubmit = useCallback(() => {
    const n = normalizeHex(hexInput);
    if (n) {
      const [h, s, v] = hexToHSV(n);
      internalChange.current = true;
      setHue(h); setSat(s); setVal(v);
      onChange(n);
    }
  }, [hexInput, onChange]);

  const handlePreset = useCallback((color: string) => {
    if (!color) {
      onChange("");
      return;
    }
    const n = normalizeHex(color);
    if (n) {
      const [h, s, v] = hexToHSV(n);
      internalChange.current = true;
      setHue(h); setSat(s); setVal(v);
      setHexInput(n);
      onChange(n);
    }
  }, [onChange]);

  const handleEyeDropper = useCallback(async () => {
    if (!hasEyeDropper) return;
    try {
      const dropper = new (window as any).EyeDropper();
      const result = await dropper.open();
      const hex = result.sRGBHex as string;
      const n = normalizeHex(hex);
      if (n) {
        const [h, s, v] = hexToHSV(n);
        internalChange.current = true;
        setHue(h); setSat(s); setVal(v);
        setHexInput(n);
        onChange(n);
      }
    } catch { /* user cancelled */ }
  }, [onChange]);

  return (
    <div className={`kanava-color-picker ${className || ""}`} role="listbox" aria-label={label}>
      {/* Saturation / Value gradient */}
      {allowCustom && (
        <>
          <SatValPanel hue={hue} sat={sat} val={val} onSatValChange={handleSatValChange} />
          <HueSlider hue={hue} onHueChange={handleHueChange} />
          <div className="kanava-cp-controls">
            <div
              className="kanava-cp-preview"
              style={{ background: currentHex }}
            />
            <input
              className="kanava-cp-input"
              type="text"
              placeholder="#hex"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleHexSubmit(); }}
              onBlur={handleHexSubmit}
              aria-label="Hex color code"
            />
            {hasEyeDropper && (
              <button
                className="kanava-cp-eyedropper"
                onClick={handleEyeDropper}
                title="Pick color from screen"
                type="button"
                aria-label="Eyedropper"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 22 1-1h3l9-9"/>
                  <path d="M3 21v-3l9-9"/>
                  <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9"/>
                  <path d="m15 6 3 3"/>
                </svg>
              </button>
            )}
          </div>
        </>
      )}

      {/* Preset swatches */}
      <div className="kanava-cp-grid">
        {presets.map((color, i) => (
          <button
            key={color || `default-${i}`}
            className={`kanava-cp-swatch ${value === color ? "kanava-cp-swatch-active" : ""}`}
            style={{
              background: color || "transparent",
              border: color ? "1px solid rgba(0,0,0,0.1)" : "1px dashed #ccc",
            }}
            title={color || "Default"}
            onClick={() => handlePreset(color)}
            role="option"
            aria-selected={value === color}
            aria-label={color || "Default"}
            type="button"
          />
        ))}
      </div>
    </div>
  );
};

ColorPicker.displayName = "KanavaColorPicker";
