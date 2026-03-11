/**
 * React hooks for consuming Kanava editor state.
 * @see packages/docs/guide-react-integration.md
 */
import { useRef, useCallback, useSyncExternalStore, useMemo } from "react";
import type {
  KanavaEditor,
  KanavaSelectionInfo,
  KanavaDocument,
  Command,
} from "@kanava/editor";
import {
  getToolbarState,
  subscribeToolbarState,
  type ToolbarState,
  getFindReplaceState,
  subscribeFindReplace,
  type FindReplaceState,
} from "@kanava/editor";

/**
 * Hook to access the Kanava editor instance via a ref.
 */
export function useKanavaEditor() {
  const editorRef = useRef<KanavaEditor | null>(null);
  return editorRef;
}

/**
 * Hook that subscribes to toolbar state changes and returns the
 * current `ToolbarState`. Uses `useSyncExternalStore` for
 * tear-free, concurrent-safe reads.
 *
 * Returns `null` when the editor is not available or the
 * `toolbarStatePlugin` is not installed.
 *
 * @example
 * ```tsx
 * const toolbar = useToolbarState(editor);
 * if (!toolbar) return null;
 * // toolbar.activeMarks, toolbar.blockToolbarItems, etc.
 * ```
 */
export function useToolbarState(editor: KanavaEditor | null): ToolbarState | null {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) return () => {};
      return subscribeToolbarState(editor.pmState, callback);
    },
    [editor],
  );

  const getSnapshot = useCallback((): ToolbarState | null => {
    if (!editor) return null;
    const ts = getToolbarState(editor.pmState);
    return ts;
  }, [editor]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Hook that subscribes to selection changes and returns current selection info.
 */
export function useSelectionInfo(editor: KanavaEditor | null): KanavaSelectionInfo | null {
  const infoRef = useRef<KanavaSelectionInfo | null>(null);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) return () => {};
      listenersRef.current.add(callback);
      const unsub = editor.on("selectionChange", (info) => {
        infoRef.current = info;
        listenersRef.current.forEach((cb) => cb());
      });
      return () => {
        listenersRef.current.delete(callback);
        unsub();
      };
    },
    [editor]
  );

  const getSnapshot = useCallback(() => infoRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Hook that returns whether a specific mark is active.
 */
export function useIsMarkActive(
  editor: KanavaEditor | null,
  markName: string
): boolean {
  const info = useSelectionInfo(editor);
  return info?.activeMarks.includes(markName) ?? false;
}

/* ── New hooks ─────────────────────────────────────────────── */

/**
 * Hook that returns the editor's document as a KanavaDocument JSON tree.
 * Re-renders on every document change (debounced).
 *
 * @param editor - The editor instance.
 * @param debounceMs - Debounce interval in ms (default 100). Set to 0 for immediate.
 */
export function useEditorJSON(
  editor: KanavaEditor | null,
  debounceMs = 100,
): KanavaDocument | null {
  const docRef = useRef<KanavaDocument | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) return () => {};
      listenersRef.current.add(callback);
      const unsub = editor.on("change", (doc) => {
        if (debounceMs <= 0) {
          docRef.current = doc;
          listenersRef.current.forEach((cb) => cb());
        } else {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            docRef.current = doc;
            listenersRef.current.forEach((cb) => cb());
          }, debounceMs);
        }
      });
      // Initialize with current document
      docRef.current = editor.getDocument();
      return () => {
        listenersRef.current.delete(callback);
        if (timerRef.current) clearTimeout(timerRef.current);
        unsub();
      };
    },
    [editor, debounceMs],
  );

  const getSnapshot = useCallback(() => docRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Hook that returns whether the editor is focused.
 */
export function useEditorFocused(editor: KanavaEditor | null): boolean {
  const focusedRef = useRef(false);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) return () => {};
      listenersRef.current.add(callback);
      const unsubFocus = editor.on("focus", () => {
        focusedRef.current = true;
        listenersRef.current.forEach((cb) => cb());
      });
      const unsubBlur = editor.on("blur", () => {
        focusedRef.current = false;
        listenersRef.current.forEach((cb) => cb());
      });
      // Initialize with current focus state
      focusedRef.current = editor.pmView?.hasFocus() ?? false;
      return () => {
        listenersRef.current.delete(callback);
        unsubFocus();
        unsubBlur();
      };
    },
    [editor],
  );

  const getSnapshot = useCallback(() => focusedRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Info about the block at the current selection.
 */
export interface BlockAtSelection {
  type: string;
  attrs: Record<string, any>;
  pos: number;
}

/**
 * Hook that returns info about the block (blockBody) at the current cursor position.
 * Returns null if the editor is not available or no block is found.
 */
export function useBlockAtSelection(editor: KanavaEditor | null): BlockAtSelection | null {
  const blockRef = useRef<BlockAtSelection | null>(null);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) return () => {};
      listenersRef.current.add(callback);
      const unsub = editor.on("selectionChange", () => {
        const state = editor.pmView.state;
        const { $from } = state.selection;
        let found: BlockAtSelection | null = null;
        for (let d = $from.depth; d >= 0; d--) {
          const node = $from.node(d);
          if (node.type.spec.group?.includes("blockBody")) {
            found = {
              type: node.type.name,
              attrs: { ...node.attrs },
              pos: $from.before(d),
            };
            break;
          }
        }
        blockRef.current = found;
        listenersRef.current.forEach((cb) => cb());
      });
      return () => {
        listenersRef.current.delete(callback);
        unsub();
      };
    },
    [editor],
  );

  const getSnapshot = useCallback(() => blockRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Result of useEditorCommand — provides execute and canExecute for a ProseMirror command.
 */
export interface EditorCommandResult {
  /** Execute the command. No-op if canExecute is false. */
  execute: () => void;
  /** Whether the command can currently be applied. */
  canExecute: boolean;
}

/**
 * Hook that wraps a ProseMirror Command into a reactive `{ execute, canExecute }` pair.
 * Re-evaluates `canExecute` on every selection or document change.
 *
 * @example
 * ```tsx
 * const bold = useEditorCommand(editor, toggleBold(editor.schema));
 * <button disabled={!bold.canExecute} onClick={bold.execute}>B</button>
 * ```
 */
export function useEditorCommand(
  editor: KanavaEditor | null,
  command: Command | null,
): EditorCommandResult {
  const canRef = useRef(false);
  const listenersRef = useRef(new Set<() => void>());

  const checkCan = useCallback(() => {
    if (!editor || !command) {
      canRef.current = false;
      return;
    }
    canRef.current = command(editor.pmView.state, undefined, editor.pmView);
  }, [editor, command]);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) return () => {};
      listenersRef.current.add(callback);
      checkCan();
      const unsub = editor.on("selectionChange", () => {
        checkCan();
        listenersRef.current.forEach((cb) => cb());
      });
      return () => {
        listenersRef.current.delete(callback);
        unsub();
      };
    },
    [editor, checkCan],
  );

  const getSnapshot = useCallback(() => canRef.current, []);
  const canExecute = useSyncExternalStore(subscribe, getSnapshot);

  const execute = useCallback(() => {
    if (!editor || !command) return;
    command(editor.pmView.state, editor.pmView.dispatch, editor.pmView);
    editor.focus();
  }, [editor, command]);

  return useMemo(() => ({ execute, canExecute }), [execute, canExecute]);
}

/**
 * Hook that subscribes to the find & replace plugin state.
 */
export function useFindReplaceState(
  editor: KanavaEditor | null,
): FindReplaceState | null {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) return () => {};
      return subscribeFindReplace(editor.pmState, callback);
    },
    [editor],
  );

  const getSnapshot = useCallback((): FindReplaceState | null => {
    if (!editor) return null;
    return getFindReplaceState(editor.pmState);
  }, [editor]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/* ------------------------------------------------------------------ */
/*  useZoom                                                             */
/* ------------------------------------------------------------------ */

export interface ZoomState {
  /** Current zoom level (1 = 100%) */
  zoom: number;
  setZoom: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

/**
 * Hook that subscribes to the editor's zoom level.
 */
export function useZoom(editor: KanavaEditor | null): ZoomState {
  const zoomRef = useRef(editor?.getZoom() ?? 1);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) return () => {};
      return editor.on("zoomChange", (level) => {
        zoomRef.current = level;
        callback();
      });
    },
    [editor],
  );

  const getSnapshot = useCallback(() => zoomRef.current, []);
  const zoom = useSyncExternalStore(subscribe, getSnapshot);

  const setZoom = useCallback(
    (level: number) => editor?.setZoom(level),
    [editor],
  );
  const zoomIn = useCallback(() => editor?.zoomIn(), [editor]);
  const zoomOut = useCallback(() => editor?.zoomOut(), [editor]);
  const resetZoom = useCallback(() => editor?.resetZoom(), [editor]);

  return useMemo(
    () => ({ zoom, setZoom, zoomIn, zoomOut, resetZoom }),
    [zoom, setZoom, zoomIn, zoomOut, resetZoom],
  );
}
