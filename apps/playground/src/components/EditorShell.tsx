import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
    KanavaEditorComponent,
    BlockPicker,
    DocumentTree,
    FormatBar,
    ContextMenu,
    SeparatorMenu,
    ImageInsertPopover,
    KanavaEditor,
    PageSizePresets,
    type KanavaDocument,
    type KanavaSelectionInfo,
    type PaginationConfig,
    type PageSizeName,
} from "@kanava/editor-react";

interface EditorShellProps {
    mode: "pageless" | "paginated";
    content: KanavaDocument;
    paginationConfig: PaginationConfig;
    editor: KanavaEditor | null;
    onEditorRef: (instance: KanavaEditor | null) => void;
    onSelectionChange: (info: KanavaSelectionInfo) => void;
    onImageUpload: (file: File) => Promise<string>;
}

export const EditorShell: React.FC<EditorShellProps> = ({
    mode,
    content,
    paginationConfig,
    editor,
    onEditorRef,
    onSelectionChange,
    onImageUpload,
}) => {
    const editorRef = useCallback(
        (instance: KanavaEditor | null) => {
            onEditorRef(instance);
        },
        [onEditorRef],
    );

    // Resolve the pagination config into concrete pixel dimensions for pageSize
    const pageSize = useMemo(() => {
        const ps = paginationConfig.pageSize;
        if (typeof ps === "string") {
            return PageSizePresets[ps as PageSizeName];
        }
        return ps;
    }, [paginationConfig.pageSize]);

    // Build a stable key that forces remount when mode, demo, or page size changes
    const editorKey = useMemo(() => {
        const sizeHash = JSON.stringify(paginationConfig.pageSize);
        return `${mode}-${content.blocks[0]?.id ?? "empty"}-${sizeHash}`;
    }, [mode, content, paginationConfig.pageSize]);

    // Update pagination config at runtime when margins change (without remounting)
    const marginsJson = JSON.stringify(paginationConfig.margins);
    const prevMarginsRef = useRef(marginsJson);
    useEffect(() => {
        if (!editor) return;
        if (prevMarginsRef.current === marginsJson) return;
        prevMarginsRef.current = marginsJson;
        editor.setPaginationConfig({ margins: paginationConfig.margins });
    }, [editor, marginsJson, paginationConfig.margins]);

    return (
        <div className="pg-main">
            {/* Block Picker — sticky sidebar */}
            <aside className="pg-block-picker-wrap">
                <BlockPicker editor={editor} className="pg-block-picker" />
            </aside>

            {/* Editor Canvas */}
            <div className="pg-canvas-scroll">
                <div className="pg-canvas">
                    <KanavaEditorComponent
                        key={editorKey}
                        editorRef={editorRef}
                        initialContent={content}
                        mode={mode}
                        placeholder="Start writing..."
                        onSelectionChange={onSelectionChange}
                        onImageUpload={onImageUpload}
                        pageSize={mode === "paginated" ? pageSize : undefined}
                        pagination={mode === "paginated" ? paginationConfig : undefined}
                    />
                    <FormatBar editor={editor} />
                    <ContextMenu editor={editor} />
                    <SeparatorMenu editor={editor} />
                    <ImageInsertPopover editor={editor} />
                </div>
            </div>

            {/* Document Tree — right sidebar */}
            <aside className="pg-document-tree-wrap">
                <DocumentTree editor={editor} />
            </aside>
        </div>
    );
};
