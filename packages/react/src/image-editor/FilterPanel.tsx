import React from "react";
import { IMAGE_FILTERS } from "@kanava/editor";

/* ── FilterPanel ───────────────────────────────────────────── */

interface FilterPanelProps {
    imageSrc: string;
    selectedFilter: string;
    setSelectedFilter: (name: string) => void;
    filterIntensity: number;
    setFilterIntensity: (val: number) => void;
    onIntensityStart?: () => void;
}

const FILTER_PRESETS = Object.keys(IMAGE_FILTERS);

/**
 * Filter presets grid with preview thumbnails + intensity slider.
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
    imageSrc, selectedFilter, setSelectedFilter,
    filterIntensity, setFilterIntensity, onIntensityStart,
}) => (
    <div className="kanava-ie-filter-controls">
        <div className="kanava-ie-filter-grid">
            {FILTER_PRESETS.map((name) => {
                const cssFilter = IMAGE_FILTERS[name];
                return (
                    <button
                        key={name}
                        className={`kanava-ie-filter-thumb ${selectedFilter === name ? "kanava-ie-filter-active" : ""}`}
                        onClick={() => setSelectedFilter(name)}
                        type="button"
                    >
                        <img
                            src={imageSrc}
                            alt={name}
                            className="kanava-ie-filter-img"
                            style={{ filter: cssFilter === "none" ? undefined : cssFilter }}
                            draggable={false}
                        />
                        <span className="kanava-ie-filter-label">
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                        </span>
                    </button>
                );
            })}
        </div>
        {selectedFilter !== "none" && (
            <div className="kanava-ie-slider-row">
                <span className="kanava-ie-slider-label">Intensity</span>
                <input
                    type="range"
                    className="kanava-ie-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={filterIntensity}
                    onPointerDown={onIntensityStart}
                    onChange={(e) => setFilterIntensity(Number(e.target.value))}
                />
                <span className="kanava-ie-degree">{filterIntensity}%</span>
            </div>
        )}
    </div>
);

FilterPanel.displayName = "FilterPanel";
