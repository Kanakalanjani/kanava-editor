import React, { useState, useEffect, useCallback } from "react";
import type { KanavaDocument } from "@kanava/editor-react";
import { X, Trash2 } from "lucide-react";

const SAVES_KEY = "kanava-resume-saves";
const MAX_SAVES = 20;

export interface SavedVersion {
    name: string;
    timestamp: number;
    doc: KanavaDocument;
}

function loadSaves(): SavedVersion[] {
    try {
        const raw = localStorage.getItem(SAVES_KEY);
        if (raw) return JSON.parse(raw) as SavedVersion[];
    } catch { /* ignore */ }
    return [];
}

function persistSaves(saves: SavedVersion[]): void {
    try {
        localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    } catch { /* quota exceeded */ }
}

interface SaveManagerProps {
    onLoad: (doc: KanavaDocument) => void;
    onSave: () => KanavaDocument | null;
    onClose: () => void;
}

export const SaveManager: React.FC<SaveManagerProps> = ({ onLoad, onSave, onClose }) => {
    const [saves, setSaves] = useState<SavedVersion[]>(() => loadSaves());
    const [saveName, setSaveName] = useState("");

    // Sync from storage
    useEffect(() => {
        setSaves(loadSaves());
    }, []);

    const handleSave = useCallback(() => {
        const doc = onSave();
        if (!doc) return;
        const name = saveName.trim() || `Save ${new Date().toLocaleString()}`;
        const entry: SavedVersion = { name, timestamp: Date.now(), doc };
        const updated = [entry, ...saves].slice(0, MAX_SAVES);
        setSaves(updated);
        persistSaves(updated);
        setSaveName("");
    }, [saveName, saves, onSave]);

    const handleLoad = useCallback((save: SavedVersion) => {
        onLoad(save.doc);
        onClose();
    }, [onLoad, onClose]);

    const handleDelete = useCallback((index: number) => {
        const updated = saves.filter((_, i) => i !== index);
        setSaves(updated);
        persistSaves(updated);
    }, [saves]);

    return (
        <div className="rb-template-overlay" onClick={onClose}>
            <div className="rb-template-modal rb-save-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rb-template-header">
                    <h2 className="rb-template-title">Saved Versions</h2>
                    <button className="rb-template-close" onClick={onClose}><X size={18} /></button>
                </div>

                {/* Save current */}
                <div className="rb-save-form">
                    <input
                        className="rb-save-input"
                        type="text"
                        placeholder="Version name (optional)"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                    />
                    <button className="rb-header-btn rb-header-btn-primary" onClick={handleSave}>
                        Save Current
                    </button>
                </div>

                {/* Saved list */}
                <div className="rb-save-list">
                    {saves.length === 0 && (
                        <div className="rb-save-empty">No saved versions yet.</div>
                    )}
                    {saves.map((save, i) => (
                        <div key={save.timestamp} className="rb-save-item">
                            <div className="rb-save-info">
                                <span className="rb-save-name">{save.name}</span>
                                <span className="rb-save-time">
                                    {new Date(save.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div className="rb-save-actions">
                                <button
                                    className="rb-header-btn"
                                    onClick={() => handleLoad(save)}
                                >
                                    Load
                                </button>
                                <button
                                    className="rb-header-btn rb-save-delete"
                                    onClick={() => handleDelete(i)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
