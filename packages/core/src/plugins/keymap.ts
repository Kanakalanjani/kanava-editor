import { keymap } from "prosemirror-keymap";
import {
  chainCommands,
  newlineInCode,
  createParagraphNear,
  liftEmptyBlock,
  splitBlock,
  deleteSelection,
  joinBackward,
  selectNodeBackward,
  joinForward,
  selectNodeForward,
  selectAll,
} from "prosemirror-commands";
import { undo, redo } from "prosemirror-history";
import { undoInputRule } from "prosemirror-inputrules";
import type { Plugin } from "prosemirror-state";
import type { Schema } from "prosemirror-model";
import { indentBlock, outdentBlock } from "../commands/nesting.js";
import { toggleMark } from "prosemirror-commands";
import {
  splitBlockNode,
  handleBlockBackspace,
  handleBlockDelete,
  duplicateBlock,
  moveBlockUp,
  moveBlockDown,
  toggleCollapseBlock,
  deleteCurrentBlock,
} from "../commands/block.js";
import { exitColumnUp, exitColumnDown } from "../commands/columnNav.js";
import { handleBackspaceInColumn } from "../commands/columns.js";
import { insertBlockAtGapCursor } from "../commands/gapCursorInsert.js";
import { openFindReplace } from "../commands/findReplace.js";

/**
 * Creates the complete keymap plugin for Kanava editor.
 */
export function kanavaKeymap(schema: Schema): Plugin {
  const bindings: Record<string, any> = {
    // History
    "Mod-z": undo,
    "Mod-Shift-z": redo,
    "Mod-y": redo,

    // Block operations
    Enter: chainCommands(
      newlineInCode,
      insertBlockAtGapCursor,
      splitBlockNode,
      createParagraphNear,
      liftEmptyBlock,
      splitBlock
    ),
    Backspace: chainCommands(
      undoInputRule,
      deleteSelection,
      handleBackspaceInColumn,
      handleBlockBackspace,
      joinBackward,
      selectNodeBackward
    ),
    "Mod-Backspace": chainCommands(
      deleteSelection,
      joinBackward,
      selectNodeBackward
    ),
    Delete: chainCommands(deleteSelection, handleBlockDelete, joinForward, selectNodeForward),
    "Mod-a": selectAll,

    // Nesting
    Tab: indentBlock,
    "Shift-Tab": outdentBlock,

    // Text formatting
    "Mod-b": toggleMark(schema.marks.bold),
    "Mod-i": toggleMark(schema.marks.italic),
    "Mod-u": toggleMark(schema.marks.underline),
    "Mod-Shift-s": toggleMark(schema.marks.strike),
    "Mod-e": toggleMark(schema.marks.code),

    // Block manipulation
    "Mod-d": duplicateBlock,
    "Mod-Shift-ArrowUp": moveBlockUp,
    "Mod-Shift-ArrowDown": moveBlockDown,
    "Mod-Shift-Backspace": deleteCurrentBlock,
    "Ctrl-Enter": toggleCollapseBlock,

    // Soft line break
    "Shift-Enter": (state: any, dispatch: any) => {
      const { hard_break } = state.schema.nodes;
      if (!hard_break) return false;
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(hard_break.create()).scrollIntoView());
      }
      return true;
    },

    // Find & Replace
    "Mod-f": openFindReplace(),
    "Mod-h": openFindReplace(),

    // Column navigation — exit column when at boundary
    ArrowUp: chainCommands(exitColumnUp),
    ArrowDown: chainCommands(exitColumnDown),
  };

  return keymap(bindings);
}
