import { useState, useCallback } from "react";
import type { KanavaSelectionInfo, PaginationConfig, PageSizeName, DocumentStyle } from "@kanava/editor-react";
import { KanavaEditor, PageSizePresets } from "@kanava/editor-react";
import { DEMOS, type DemoEntry } from "../data";

export type DensityPreset = NonNullable<DocumentStyle["density"]>;

export interface PlaygroundState {
    editor: KanavaEditor | null;
    mode: "pageless" | "paginated";
    density: DensityPreset;
    selectedDemo: DemoEntry;
    paginationConfig: PaginationConfig;
    jsonOutput: string;
    selectionInfo: KanavaSelectionInfo | null;
    pageSetupOpen: boolean;
}

export interface PlaygroundActions {
    setEditor: (e: KanavaEditor | null) => void;
    setMode: (m: "pageless" | "paginated") => void;
    setDensity: (d: DensityPreset) => void;
    selectDemo: (id: string) => void;
    setPaginationConfig: (c: PaginationConfig) => void;
    showJSON: () => void;
    hideJSON: () => void;
    handleSelectionChange: (info: KanavaSelectionInfo) => void;
    handleImageUpload: (file: File) => Promise<string>;
    setPageSetupOpen: (open: boolean) => void;
}

export function usePlayground(): PlaygroundState & PlaygroundActions {
    const [editor, setEditorRaw] = useState<KanavaEditor | null>(null);
    const [selectedDemoId, setSelectedDemoId] = useState(DEMOS[0].id);
    const [mode, setModeRaw] = useState<"pageless" | "paginated">(DEMOS[0].defaultMode);
    const [paginationConfig, setPaginationConfig] = useState<PaginationConfig>({
        pageSize: "Letter",
    });
    const [jsonOutput, setJsonOutput] = useState("");
    const [selectionInfo, setSelectionInfo] = useState<KanavaSelectionInfo | null>(null);
    const [pageSetupOpen, setPageSetupOpen] = useState(false);
    const [density, setDensityRaw] = useState<DensityPreset>("comfortable");

    const selectedDemo = DEMOS.find((d) => d.id === selectedDemoId) ?? DEMOS[0];

    const setEditor = useCallback((e: KanavaEditor | null) => {
        setEditorRaw(e);
    }, []);

    const setMode = useCallback((m: "pageless" | "paginated") => {
        setModeRaw(m);
    }, []);

    const setDensity = useCallback((d: DensityPreset) => {
        setDensityRaw(d);
        if (editor) {
            editor.setDocumentStyle({ density: d });
        }
    }, [editor]);

    const selectDemo = useCallback((id: string) => {
        const demo = DEMOS.find((d) => d.id === id);
        if (demo) {
            setSelectedDemoId(id);
            setModeRaw(demo.defaultMode);
        }
    }, []);

    const showJSON = useCallback(() => {
        if (editor) {
            const doc = editor.getDocument();
            setJsonOutput(JSON.stringify(doc, null, 2));
        }
    }, [editor]);

    const hideJSON = useCallback(() => setJsonOutput(""), []);

    const handleSelectionChange = useCallback((info: KanavaSelectionInfo) => {
        setSelectionInfo(info);
    }, []);

    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    }, []);

    return {
        editor,
        mode,
        density,
        selectedDemo,
        paginationConfig,
        jsonOutput,
        selectionInfo,
        pageSetupOpen,
        setEditor,
        setMode,
        setDensity,
        selectDemo,
        setPaginationConfig,
        showJSON,
        hideJSON,
        handleSelectionChange,
        handleImageUpload,
        setPageSetupOpen,
    };
}
