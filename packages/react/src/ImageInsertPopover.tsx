import React, { useEffect, useState, useRef, useCallback } from "react";
import type { KanavaEditor } from "@kanava/editor";
import type { ImageInsertEventPayload } from "@kanava/editor";
import { LinkIcon, UploadIcon } from "./icons/index.js";
import "./image-insert-popover.css";

/* ------------------------------------------------------------------ */
/*  ImageInsertPopover                                                  */
/* ------------------------------------------------------------------ */

export interface ImageInsertPopoverProps {
    editor: KanavaEditor | null;
    /** Maximum file size in bytes. Default: 10 MB. */
    maxFileSize?: number;
}

type InsertTab = "url" | "upload";

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Floating popover anchored below an empty image block.
 * Appears when the editor emits an `imageInsert` event.
 * Provides URL input and file upload / drag-drop / paste tabs.
 */
export const ImageInsertPopover: React.FC<ImageInsertPopoverProps> = ({
    editor,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
}) => {
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<{ rect: DOMRect; pos: number } | null>(null);
    const [activeTab, setActiveTab] = useState<InsertTab>("url");
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const popoverRef = useRef<HTMLDivElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Subscribe to imageInsert events from core
    useEffect(() => {
        if (!editor) return;
        const unsub = editor.on("imageInsert", (payload: ImageInsertEventPayload) => {
            const rect = payload.dom.getBoundingClientRect();
            setAnchor({ rect, pos: payload.pos });
            setUrl("");
            setError("");
            setPreview(null);
            setActiveTab("url");
            setUploading(false);
            setOpen(true);
        });
        return unsub;
    }, [editor]);

    // Auto-focus URL input when popover opens
    useEffect(() => {
        if (open && activeTab === "url") {
            setTimeout(() => urlInputRef.current?.focus(), 50);
        }
    }, [open, activeTab]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open]);

    // Paste handler — listen for paste while popover is open
    useEffect(() => {
        if (!open) return;
        const onPaste = (e: ClipboardEvent) => {
            if (!popoverRef.current?.contains(document.activeElement)) return;
            const file = getFirstImageFile(e.clipboardData?.files);
            if (file) {
                e.preventDefault();
                processFile(file);
            }
        };
        document.addEventListener("paste", onPaste);
        return () => document.removeEventListener("paste", onPaste);
    }, [open, editor, anchor, maxFileSize]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Helpers ────────────────────────────────────────────
    const getFirstImageFile = (files?: FileList | null): File | null => {
        if (!files) return null;
        for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith("image/")) return files[i];
        }
        return null;
    };

    const insertSrc = useCallback((src: string) => {
        if (!editor || !anchor) return;
        const node = editor.pmView.state.doc.nodeAt(anchor.pos);
        if (node && !node.attrs.src) {
            const tr = editor.pmView.state.tr.setNodeMarkup(anchor.pos, undefined, {
                ...node.attrs,
                src,
            });
            editor.pmView.dispatch(tr);
        }
        editor.focus();
        setOpen(false);
    }, [editor, anchor]);

    const processFile = useCallback(async (file: File) => {
        if (!editor || !anchor) return;
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }
        if (file.size > maxFileSize) {
            const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
            setError(`File too large (max ${sizeMB} MB)`);
            return;
        }

        // Show thumbnail preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        const uploadFn = (editor as any)?.options?.onImageUpload as
            ((file: File) => Promise<string>) | undefined;

        setUploading(true);
        setError("");

        try {
            let src: string;
            if (uploadFn) {
                src = await uploadFn(file);
            } else {
                src = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
            insertSrc(src);
        } catch {
            setError("Upload failed. Please try again.");
            setUploading(false);
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }, [editor, anchor, maxFileSize, insertSrc]);

    // ── Insert from URL ────────────────────────────────────
    const handleUrlSubmit = useCallback(() => {
        if (!editor || !anchor || !url.trim()) return;
        try {
            new URL(url.trim());
        } catch {
            setError("Please enter a valid URL");
            return;
        }
        insertSrc(url.trim());
    }, [editor, anchor, url, insertSrc]);

    // ── Upload file (from file picker) ─────────────────────
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [processFile]);

    // ── Drop zone handlers ────────────────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = getFirstImageFile(e.dataTransfer?.files);
        if (file) processFile(file);
    }, [processFile]);

    if (!open || !anchor) return null;

    // Position below the empty image block
    const style: React.CSSProperties = {
        position: "fixed",
        top: anchor.rect.bottom + 8,
        left: anchor.rect.left + (anchor.rect.width / 2),
        transform: "translateX(-50%)",
        zIndex: 10000,
    };

    // If popover would go off-screen bottom, show above
    if (anchor.rect.bottom + 200 > window.innerHeight) {
        style.top = undefined;
        style.bottom = window.innerHeight - anchor.rect.top + 8;
    }

    return (
        <div ref={popoverRef} className="kanava-iip" role="dialog" aria-label="Insert image" style={style}>
            {/* Tab bar */}
            <div className="kanava-iip-tabs" role="tablist">
                <button
                    className={`kanava-iip-tab ${activeTab === "url" ? "kanava-iip-tab-active" : ""}`}
                    onClick={() => setActiveTab("url")}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "url"}
                >
                    <LinkIcon size={14} /> Embed URL
                </button>
                <button
                    className={`kanava-iip-tab ${activeTab === "upload" ? "kanava-iip-tab-active" : ""}`}
                    onClick={() => setActiveTab("upload")}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "upload"}
                >
                    <UploadIcon size={14} /> Upload
                </button>
            </div>

            {/* URL tab */}
            {activeTab === "url" && (
                <div className="kanava-iip-body">
                    <div className="kanava-iip-url-row">
                        <input
                            ref={urlInputRef}
                            type="url"
                            className="kanava-iip-url-input"
                            placeholder="Paste image URL…"
                            aria-label="Image URL"
                            value={url}
                            onChange={(e) => { setUrl(e.target.value); setError(""); }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleUrlSubmit(); }}
                        />
                        <button
                            className="kanava-iip-submit"
                            onClick={handleUrlSubmit}
                            disabled={!url.trim()}
                            type="button"
                        >
                            Insert
                        </button>
                    </div>
                    {error && <div className="kanava-iip-error">{error}</div>}
                </div>
            )}

            {/* Upload tab with drag-drop zone */}
            {activeTab === "upload" && (
                <div className="kanava-iip-body">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="kanava-iip-file-input"
                        onChange={handleFileChange}
                    />
                    {!preview ? (
                        <div
                            className={`kanava-iip-dropzone ${uploading ? "kanava-iip-dropzone-disabled" : ""} ${dragOver ? "kanava-iip-dropzone-dragover" : ""}`}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {uploading ? "Uploading…" : "Drop an image here, or click to browse"}
                            <span className="kanava-iip-dropzone-hint">
                                You can also paste from clipboard
                            </span>
                        </div>
                    ) : (
                        <div className="kanava-iip-preview">
                            <img src={preview} alt="Preview" />
                            {uploading && <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>Uploading…</div>}
                        </div>
                    )}
                    {error && <div className="kanava-iip-error">{error}</div>}
                </div>
            )}
        </div>
    );
};

ImageInsertPopover.displayName = "ImageInsertPopover";
