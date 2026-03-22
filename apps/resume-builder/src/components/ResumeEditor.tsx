import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    KanavaEditorComponent,
    FormatBar,
    ContextMenu,
    SeparatorMenu,
    KanavaEditor,
    PageSizePresets,
    type KanavaDocument,
    type KanavaSelectionInfo,
    type PaginationConfig,
} from "@kanava/editor-react";

interface ResumeEditorProps {
    content: KanavaDocument;
    paginationConfig: PaginationConfig;
    onEditorRef: (instance: KanavaEditor | null) => void;
    onSelectionChange: (info: KanavaSelectionInfo) => void;
    onContentChange?: (doc: KanavaDocument) => void;
    preview?: boolean;
    printRef?: React.Ref<HTMLDivElement>;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
    content,
    paginationConfig,
    onEditorRef,
    onSelectionChange,
    onContentChange,
    preview = false,
    printRef,
}) => {
    const editorRef = useCallback(
        (instance: KanavaEditor | null) => {
            onEditorRef(instance);
        },
        [onEditorRef],
    );

    const pageSize = useMemo(() => {
        const ps = paginationConfig.pageSize;
        if (typeof ps === "string") {
            return PageSizePresets[ps as keyof typeof PageSizePresets];
        }
        return ps;
    }, [paginationConfig.pageSize]);

    const editorKey = useMemo(() => {
        const sizeHash = JSON.stringify(paginationConfig.pageSize);
        return `resume-${content.blocks[0]?.id ?? "empty"}-${sizeHash}`;
    }, [content, paginationConfig.pageSize]);

    const [editor, setEditor] = useState<KanavaEditor | null>(null);

    const handleRef = useCallback(
        (instance: KanavaEditor | null) => {
            setEditor(instance);
            editorRef(instance);
        },
        [editorRef],
    );

    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        return URL.createObjectURL(file);
    }, []);

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
        <div className="rb-canvas-scroll">
            <div className="rb-canvas" ref={printRef}>
                <KanavaEditorComponent
                    key={editorKey}
                    editorRef={handleRef}
                    initialContent={content}
                    mode="paginated"
                    layoutMode="compact"
                    canvasMode
                    placeholder="Start writing your resume..."
                    onChange={onContentChange}
                    onSelectionChange={onSelectionChange}
                    onImageUpload={handleImageUpload}
                    pageSize={pageSize}
                    pagination={paginationConfig}
                    editable={!preview}
                />
                {!preview && <FormatBar editor={editor} />}
                {!preview && <ContextMenu editor={editor} />}
                {!preview && <SeparatorMenu editor={editor} />}
            </div>
        </div>
    );
};
