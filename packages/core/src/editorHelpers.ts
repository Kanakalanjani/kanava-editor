/**
 * Editor helper utilities — density presets, empty doc creation, command chain.
 * Extracted from editor.ts for modularity.
 */

import { EditorState, Transaction, type Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { Schema } from "prosemirror-model";
import type { DocumentStyle } from "./api/types.js";

/**
 * Built-in density presets for document styling.
 * Explicit values in DocumentStyle override these defaults.
 */
export const DENSITY_PRESETS: Record<NonNullable<DocumentStyle["density"]>, Required<Omit<DocumentStyle, "density" | "fontFamily">>> = {
    tight: { lineHeight: 1.2, paragraphGap: 4, fontSize: 14 },
    comfortable: { lineHeight: 1.5, paragraphGap: 8, fontSize: 16 },
    relaxed: { lineHeight: 1.8, paragraphGap: 16, fontSize: 18 },
};

/**
 * Create a default empty document.
 */
export function createEmptyDoc(schema: Schema) {
    return schema.nodes.doc.create(
        null,
        schema.nodes.blockGroup.create(
            null,
            schema.nodes.blockNode.create(
                { id: "" },
                schema.nodes.paragraph.create()
            )
        )
    );
}

/**
 * A fluent builder for chaining multiple ProseMirror commands.
 */
export class CommandChain {
    private view: EditorView;
    private tr: Transaction | null;
    private currentState: EditorState;

    constructor(view: EditorView) {
        this.view = view;
        this.currentState = view.state;
        this.tr = null;
    }

    /**
     * Add a command to the chain.
     * The command will be applied to the accumulated state.
     */
    command(cmd: Command): this {
        const dispatch = (tr: Transaction) => {
            if (this.tr === null) {
                this.tr = tr;
            } else {
                for (let i = 0; i < tr.steps.length; i++) {
                    this.tr.step(tr.steps[i]);
                }
                if (tr.selectionSet) {
                    this.tr.setSelection(tr.selection);
                }
                if (tr.storedMarks) {
                    this.tr.setStoredMarks(tr.storedMarks);
                }
            }
            this.currentState = this.currentState.apply(tr);
        };

        cmd(this.currentState, dispatch);
        return this;
    }

    /**
     * Execute all chained commands as a single transaction.
     * Returns true if any commands produced changes.
     */
    run(): boolean {
        if (this.tr === null) {
            return false;
        }
        this.view.dispatch(this.tr);
        return true;
    }

    /**
     * Check if the chain would produce changes without actually dispatching.
     */
    canRun(): boolean {
        return this.tr !== null && this.tr.steps.length > 0;
    }
}
