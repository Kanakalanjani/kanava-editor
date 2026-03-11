import { useState, useCallback, useRef } from "react";
import type { EditState } from "./types.js";

const MAX_HISTORY = 50;

export interface ImageEditorStateAPI {
    /** Current working state (drives all UI). */
    state: EditState;
    /**
     * Discrete change — pushes the current state to the undo stack,
     * clears the redo stack, then applies the partial changes.
     * Use for button clicks, preset selections, etc.
     */
    commit: (changes: Partial<EditState>) => void;
    /**
     * Continuous change — applies changes without touching history.
     * Use during drag / slider interaction for live preview.
     */
    update: (changes: Partial<EditState>) => void;
    /**
     * Save the current state as an undo point without changing it.
     * Call once before starting a continuous interaction (drag, slider).
     */
    snapshot: () => void;
    /** Undo to previous undo point. */
    undo: () => void;
    /** Redo to next redo point. */
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    /** Reset entire state and clear all history (e.g. opening a new image). */
    reset: (initial: EditState) => void;
}

/**
 * Centralized state + undo/redo for the image editor modal.
 *
 * Uses a two-stack model (undo stack + redo stack) with an explicit
 * working state. History changes are always explicit — no "sync"
 * effects — which eliminates the race condition where a history
 * listener would overwrite a freshly committed change.
 */
export function useImageEditorState(initial: EditState): ImageEditorStateAPI {
    const [state, _setState] = useState<EditState>(initial);
    const stateRef = useRef<EditState>(initial);
    stateRef.current = state;

    const undoRef = useRef<EditState[]>([]);
    const redoRef = useRef<EditState[]>([]);

    const pushUndo = (s: EditState) => {
        const stack = [...undoRef.current, s];
        undoRef.current = stack.length > MAX_HISTORY
            ? stack.slice(stack.length - MAX_HISTORY)
            : stack;
        redoRef.current = [];
    };

    const commit = useCallback((changes: Partial<EditState>) => {
        pushUndo(stateRef.current);
        const next = { ...stateRef.current, ...changes };
        stateRef.current = next;
        _setState(next);
    }, []);

    const update = useCallback((changes: Partial<EditState>) => {
        const next = { ...stateRef.current, ...changes };
        stateRef.current = next;
        _setState(next);
    }, []);

    const snapshot = useCallback(() => {
        pushUndo(stateRef.current);
    }, []);

    const undo = useCallback(() => {
        if (undoRef.current.length === 0) return;
        redoRef.current = [...redoRef.current, stateRef.current];
        const prev = undoRef.current[undoRef.current.length - 1];
        undoRef.current = undoRef.current.slice(0, -1);
        stateRef.current = prev;
        _setState(prev);
    }, []);

    const redo = useCallback(() => {
        if (redoRef.current.length === 0) return;
        undoRef.current = [...undoRef.current, stateRef.current];
        const next = redoRef.current[redoRef.current.length - 1];
        redoRef.current = redoRef.current.slice(0, -1);
        stateRef.current = next;
        _setState(next);
    }, []);

    const reset = useCallback((init: EditState) => {
        undoRef.current = [];
        redoRef.current = [];
        stateRef.current = init;
        _setState(init);
    }, []);

    return {
        state,
        commit,
        update,
        snapshot,
        undo,
        redo,
        canUndo: undoRef.current.length > 0,
        canRedo: redoRef.current.length > 0,
        reset,
    };
}
