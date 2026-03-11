import React, { useState, useRef, useEffect } from "react";
import { DEMOS } from "../data";
import type { DensityPreset } from "../hooks/usePlayground";

const DENSITY_INFO: Record<DensityPreset, { lineHeight: string; gap: string; fontSize: string }> = {
    tight: { lineHeight: "1.2", gap: "4px", fontSize: "14px" },
    comfortable: { lineHeight: "1.5", gap: "8px", fontSize: "16px" },
    relaxed: { lineHeight: "1.8", gap: "16px", fontSize: "18px" },
};

interface HeaderProps {
    selectedDemoId: string;
    mode: "pageless" | "paginated";
    density: DensityPreset;
    onSelectDemo: (id: string) => void;
    onSetMode: (m: "pageless" | "paginated") => void;
    onSetDensity: (d: DensityPreset) => void;
    onPageSetup: () => void;
    onViewJSON: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    selectedDemoId,
    mode,
    density,
    onSelectDemo,
    onSetMode,
    onSetDensity,
    onPageSetup,
    onViewJSON,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const infoRef = useRef<HTMLDivElement>(null);

    // Close popover on outside click
    useEffect(() => {
        if (!infoOpen) return;
        const handler = (e: MouseEvent) => {
            if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
                setInfoOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [infoOpen]);

    const info = DENSITY_INFO[density];

    return (
        <header className="pg-header">
            {/* Logo */}
            <div className="pg-header-left">
                <h1 className="pg-title">
                    <span className="pg-logo">K</span>
                    Kanava Editor
                </h1>

                {/* Demo Tabs */}
                <nav className="pg-demo-tabs">
                    {DEMOS.map((d) => (
                        <button
                            key={d.id}
                            className={`pg-demo-tab ${selectedDemoId === d.id ? "active" : ""}`}
                            onClick={() => onSelectDemo(d.id)}
                        >
                            <span className="pg-demo-tab-icon">{d.icon}</span>
                            {d.title}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Controls */}
            <div className="pg-header-right">
                {/* Density Switcher */}
                <div className="pg-density-group" ref={infoRef}>
                    <div className="pg-mode-toggle pg-density-toggle">
                        {(["tight", "comfortable", "relaxed"] as DensityPreset[]).map((d) => (
                            <button
                                key={d}
                                className={`pg-mode-btn ${density === d ? "active" : ""}`}
                                onClick={() => onSetDensity(d)}
                                title={`${d.charAt(0).toUpperCase() + d.slice(1)} density`}
                            >
                                {d === "tight" ? "⊟" : d === "comfortable" ? "⊞" : "⊡"}
                            </button>
                        ))}
                    </div>
                    <button
                        className="pg-density-info-btn"
                        onClick={() => setInfoOpen((v) => !v)}
                        title="Density values"
                    >
                        ℹ
                    </button>
                    {infoOpen && (
                        <div className="pg-density-popover">
                            <div className="pg-density-popover-title">
                                {density.charAt(0).toUpperCase() + density.slice(1)} Density
                            </div>
                            <table className="pg-density-table">
                                <tbody>
                                    <tr><td>Line Height</td><td>{info.lineHeight}</td></tr>
                                    <tr><td>Block Gap</td><td>{info.gap}</td></tr>
                                    <tr><td>Font Size</td><td>{info.fontSize}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Mode Toggle */}
                <div className="pg-mode-toggle">
                    <button
                        className={`pg-mode-btn ${mode === "pageless" ? "active" : ""}`}
                        onClick={() => onSetMode("pageless")}
                    >
                        Pageless
                    </button>
                    <button
                        className={`pg-mode-btn ${mode === "paginated" ? "active" : ""}`}
                        onClick={() => onSetMode("paginated")}
                    >
                        Paginated
                    </button>
                </div>

                <button className="pg-setup-btn" onClick={onPageSetup} title="Page Setup">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>

                <button className="pg-json-btn" onClick={onViewJSON}>
                    {"{ }"}  JSON
                </button>
            </div>
        </header>
    );
};
