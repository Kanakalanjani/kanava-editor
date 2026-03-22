import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { FixedToolbar, BlockPicker, DocumentTree, DocumentStatsDisplay } from "@kanava/editor-react";
import type { KanavaEditor, KanavaSelectionInfo, KanavaDocument, PaginationConfig } from "@kanava/editor-react";
import { getPageStyleCSS } from "@kanava/editor";
import { useReactToPrint } from "react-to-print";
import {
    FileText, FolderOpen, Download, LayoutTemplate,
    PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose,
    Settings, List, Pencil, Eye, Printer,
} from "lucide-react";
import "@kanava/editor/styles/editor.css";
import "./styles.css";

import { ResumeEditor } from "./components/ResumeEditor";
import { LayoutSidebar } from "./components/LayoutSidebar";
import { FloatingPanel } from "./components/FloatingPanel";
import { TemplatePicker } from "./components/TemplatePicker";
import type { ResumeTemplate } from "./data/templates";
import { SAMPLE_RESUME } from "./data/sampleResume";

const STORAGE_KEY = "kanava-resume-doc";
const SAVE_DEBOUNCE_MS = 1000;

const DEFAULT_PAGINATION: PaginationConfig = {
    pageSize: "Letter",
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
};

function loadFromStorage(): KanavaDocument | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as KanavaDocument;
    } catch { /* ignore corrupt data */ }
    return null;
}

function saveToStorage(doc: KanavaDocument): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch { /* quota exceeded — silently ignore */ }
}

export const App: React.FC = () => {
    const [editor, setEditor] = useState<KanavaEditor | null>(null);
    const [selectionInfo, setSelectionInfo] = useState<KanavaSelectionInfo | null>(null);
    const [paginationConfig, setPaginationConfig] = useState<PaginationConfig>(DEFAULT_PAGINATION);
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const [rightTab, setRightTab] = useState<"settings" | "outline">("settings");
    const [mode, setMode] = useState<"edit" | "preview">("edit");
    const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const pageStyle = useMemo(() => getPageStyleCSS(paginationConfig), [paginationConfig]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle,
        documentTitle: "Resume",
    });

    // Load saved document or fall back to sample
    const [initialContent] = useState<KanavaDocument>(() => loadFromStorage() ?? SAMPLE_RESUME);

    const handleEditorRef = useCallback((instance: KanavaEditor | null) => {
        setEditor(instance);
    }, []);

    const handleSelectionChange = useCallback((info: KanavaSelectionInfo) => {
        setSelectionInfo(info);
    }, []);

    // Debounced auto-save on content change
    const handleContentChange = useCallback((doc: KanavaDocument) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => saveToStorage(doc), SAVE_DEBOUNCE_MS);
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    // JSON export — download as file
    const handleExportJSON = useCallback(() => {
        if (!editor) return;
        const doc = editor.getDocument();
        const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.json";
        a.click();
        URL.revokeObjectURL(url);
    }, [editor]);

    // JSON import — upload from file
    const handleImportJSON = useCallback(() => {
        if (!editor) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const doc = JSON.parse(text) as KanavaDocument;
                if (!doc.blocks || !Array.isArray(doc.blocks)) return;
                editor.setDocument(doc);
                saveToStorage(doc);
            } catch { /* invalid JSON — ignore */ }
        };
        input.click();
    }, [editor]);

    const handleTemplateSelect = useCallback((template: ResumeTemplate) => {
        if (!editor) return;
        editor.setDocument(template.document);
        saveToStorage(template.document);
        setTemplatePickerOpen(false);
    }, [editor]);

    return (
        <div className="rb-app">
            {/* Header */}
            <header className="rb-header">
                <div className="rb-header-left">
                    <span className="rb-logo"><FileText size={20} /></span>
                    <span className="rb-app-name">ResumeCraft</span>
                    <span className="rb-doc-name">My Resume</span>
                </div>
                <div className="rb-header-center">
                    <FixedToolbar editor={editor} />
                </div>
                <div className="rb-header-right">
                    <button
                        className="rb-header-btn"
                        onClick={handleImportJSON}
                        title="Import JSON"
                    >
                        <FolderOpen size={15} />
                    </button>
                    <button
                        className="rb-header-btn"
                        onClick={handleExportJSON}
                        title="Export JSON"
                    >
                        <Download size={15} />
                    </button>
                    <button
                        className="rb-header-btn"
                        onClick={() => handlePrint()}
                        title="Print / Save as PDF"
                    >
                        <Printer size={15} />
                    </button>
                    <button
                        className="rb-header-btn"
                        onClick={() => setTemplatePickerOpen(true)}
                        title="Choose Template"
                    >
                        <LayoutTemplate size={15} />
                    </button>
                </div>
            </header>

            {/* Tab bar */}
            <div className="rb-tabs">
                <button
                    className={"rb-tab" + (mode === "edit" ? " rb-tab-active" : "")}
                    onClick={() => setMode("edit")}
                >
                    <Pencil size={13} /> Edit
                </button>
                <button
                    className={"rb-tab" + (mode === "preview" ? " rb-tab-active" : "")}
                    onClick={() => setMode("preview")}
                >
                    <Eye size={13} /> Preview
                </button>
            </div>

            {/* Main Content */}
            <div className="rb-main">
                {mode === "edit" && (
                    <FloatingPanel
                        side="left"
                        openIcon={<PanelLeftOpen size={18} />}
                        closeIcon={<PanelLeftClose size={18} />}
                        open={leftPanelOpen}
                        onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
                    >
                        <BlockPicker editor={editor} />
                    </FloatingPanel>
                )}

                <ResumeEditor
                    content={initialContent}
                    paginationConfig={paginationConfig}
                    onEditorRef={handleEditorRef}
                    onSelectionChange={handleSelectionChange}
                    onContentChange={handleContentChange}
                    preview={mode === "preview"}
                    printRef={printRef}
                />

                {mode === "edit" && (
                    <FloatingPanel
                        side="right"
                        openIcon={<PanelRightOpen size={18} />}
                        closeIcon={<PanelRightClose size={18} />}
                        open={rightPanelOpen}
                        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
                    >
                        <div className="rb-panel-tabs">
                            <button
                                className={"rb-panel-tab" + (rightTab === "settings" ? " rb-panel-tab-active" : "")}
                                onClick={() => setRightTab("settings")}
                                type="button"
                            >
                                <Settings size={14} /> Settings
                            </button>
                            <button
                                className={"rb-panel-tab" + (rightTab === "outline" ? " rb-panel-tab-active" : "")}
                                onClick={() => setRightTab("outline")}
                                type="button"
                            >
                                <List size={14} /> Outline
                            </button>
                        </div>
                        {rightTab === "settings" ? (
                            <LayoutSidebar
                                editor={editor}
                                selectionInfo={selectionInfo}
                                paginationConfig={paginationConfig}
                                onPaginationChange={setPaginationConfig}
                            />
                        ) : (
                            <DocumentTree editor={editor} />
                        )}
                    </FloatingPanel>
                )}
            </div>

            {/* Footer with doc stats */}
            <footer className="rb-footer">
                <DocumentStatsDisplay editor={editor} className="rb-doc-stats" />
            </footer>

            {templatePickerOpen && (
                <TemplatePicker
                    onSelect={handleTemplateSelect}
                    onClose={() => setTemplatePickerOpen(false)}
                />
            )}
        </div>
    );
};
