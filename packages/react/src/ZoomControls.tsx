/**
 * ZoomControls — minimal zoom in/out/reset widget.
 *
 * Usage:
 *   <ZoomControls editor={editor} />
 */
import React from "react";
import type { KanavaEditor } from "@kanava/editor";
import { useZoom } from "./hooks.js";
import type { ZoomState } from "./hooks.js";
import { ZoomInIcon, ZoomOutIcon } from "./icons/index.js";
import "./components.css";

export interface ZoomControlsProps {
  editor: KanavaEditor | null;
  /** Additional CSS class */
  className?: string;
}

export function ZoomControls({ editor, className }: ZoomControlsProps) {
  const { zoom, zoomIn, zoomOut, resetZoom } = useZoom(editor);
  const pct = Math.round(zoom * 100);

  return (
    <div
      className={`kanava-zoom-controls${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="Zoom controls"
    >
      <button
        className="kanava-zoom-btn"
        onClick={zoomOut}
        disabled={pct <= 25}
        title="Zoom Out"
        aria-label="Zoom out"
      >
        <ZoomOutIcon size={16} />
      </button>
      <button
        className="kanava-zoom-level"
        onClick={resetZoom}
        title="Reset Zoom"
        aria-label={`Zoom level ${pct}%, click to reset`}
      >
        {pct}%
      </button>
      <button
        className="kanava-zoom-btn"
        onClick={zoomIn}
        disabled={pct >= 300}
        title="Zoom In"
        aria-label="Zoom in"
      >
        <ZoomInIcon size={16} />
      </button>
    </div>
  );
}
