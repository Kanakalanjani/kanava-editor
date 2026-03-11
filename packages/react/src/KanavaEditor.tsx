import React, { useEffect, useRef, useCallback } from "react";
import {
  KanavaEditor as KanavaEditorCore,
  type KanavaDocument,
  type KanavaEditorOptions,
  type KanavaSelectionInfo,
  type BlockDefinition,
  type MarkDefinition,
} from "@kanava/editor";

export interface KanavaEditorProps {
  /** Initial content for the editor */
  initialContent?: KanavaDocument;
  /** Called when content changes */
  onChange?: (doc: KanavaDocument) => void;
  /** Called when selection changes */
  onSelectionChange?: (info: KanavaSelectionInfo) => void;
  /** Called when editor gains focus */
  onFocus?: () => void;
  /** Called when editor loses focus */
  onBlur?: () => void;
  /** Whether the editor is editable */
  editable?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Layout mode */
  mode?: "pageless" | "paginated";
  /** Page dimensions for paginated mode (legacy — prefer `pagination`) */
  pageSize?: { width: number; height: number };
  /** Full pagination configuration for paginated mode */
  pagination?: import("@kanava/editor").PaginationConfig;
  /** Layout density mode */
  layoutMode?: "standard" | "compact";
  /** Enable canvas mode interaction model (click-to-select, double-click-to-edit) */
  canvasMode?: boolean;
  /** CSS class name for the container */
  className?: string;
  /** Ref callback to access the editor instance */
  editorRef?: React.Ref<KanavaEditorCore | null>;
  /** Custom block definitions (defaults to built-in blocks) */
  blocks?: BlockDefinition[];
  /** Custom mark definitions (defaults to built-in marks) */
  marks?: MarkDefinition[];
  /** Called when an image is pasted/dropped. Return the uploaded image URL. */
  onImageUpload?: (file: File) => Promise<string>;
}

/**
 * React component wrapper for the Kanava editor.
 */
export const KanavaEditorComponent: React.FC<KanavaEditorProps> = ({
  initialContent,
  onChange,
  onSelectionChange,
  onFocus,
  onBlur,
  editable = true,
  placeholder,
  mode = "pageless",
  pageSize,
  layoutMode,
  canvasMode,
  className,
  editorRef,
  blocks,
  marks,
  onImageUpload,
  pagination,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<KanavaEditorCore | null>(null);
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onFocusRef = useRef(onFocus);
  const onBlurRef = useRef(onBlur);

  // Keep callback refs up to date
  onChangeRef.current = onChange;
  onSelectionChangeRef.current = onSelectionChange;
  onFocusRef.current = onFocus;
  onBlurRef.current = onBlur;

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = new KanavaEditorCore({
      element: containerRef.current,
      content: initialContent,
      editable,
      placeholder,
      mode,
      pageSize,
      pagination,
      layoutMode,
      canvasMode,
      blocks,
      marks,
      onImageUpload,
      onChange: (doc) => onChangeRef.current?.(doc),
      onSelectionChange: (info) => onSelectionChangeRef.current?.(info),
    });

    // Subscribe to focus/blur
    const unFocus = editor.on("focus", () => onFocusRef.current?.());
    const unBlur = editor.on("blur", () => onBlurRef.current?.());

    editorInstanceRef.current = editor;

    // Forward ref
    if (editorRef) {
      if (typeof editorRef === "function") {
        editorRef(editor);
      } else {
        (editorRef as React.MutableRefObject<KanavaEditorCore | null>).current = editor;
      }
    }

    return () => {
      unFocus();
      unBlur();
      editor.destroy();
      editorInstanceRef.current = null;
      if (editorRef) {
        if (typeof editorRef === "function") {
          editorRef(null);
        } else {
          (editorRef as React.MutableRefObject<KanavaEditorCore | null>).current = null;
        }
      }
    };
    // Only re-create editor if mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Sync editable prop
  useEffect(() => {
    editorInstanceRef.current?.setEditable(editable);
  }, [editable]);

  return (
    <div
      ref={containerRef}
      className={`kanava-editor-container ${className || ""}`}
    />
  );
};

KanavaEditorComponent.displayName = "KanavaEditor";
