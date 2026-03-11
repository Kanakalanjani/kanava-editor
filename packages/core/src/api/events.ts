import type { EditorView } from "prosemirror-view";
import type { KanavaDocument, KanavaSelectionInfo } from "./types.js";
import { getSelectionInfo } from "./operations.js";
import { docToKanava } from "./blockTree.js";

export type KanavaEventType = "change" | "selectionChange" | "focus" | "blur" | "imageEdit" | "imageInsert" | "zoomChange";

export interface ImageEditEventPayload {
  /** Position of the image node in the document */
  pos: number;
  /** Current attributes of the image node */
  attrs: Record<string, any>;
}

export interface ImageInsertEventPayload {
  /** Position of the empty image node in the document */
  pos: number;
  /** DOM element of the empty image block (for anchoring a popover) */
  dom: HTMLElement;
}

export interface KanavaEventMap {
  change: KanavaDocument;
  selectionChange: KanavaSelectionInfo;
  focus: void;
  blur: void;
  imageEdit: ImageEditEventPayload;
  imageInsert: ImageInsertEventPayload;
  zoomChange: number;
}

type EventHandler<T> = (data: T) => void;

/**
 * Simple event emitter for the editor.
 */
export class KanavaEventEmitter {
  private handlers: Map<string, Set<EventHandler<any>>> = new Map();

  on<K extends KanavaEventType>(
    event: K,
    handler: EventHandler<KanavaEventMap[K]>
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  emit<K extends KanavaEventType>(
    event: K,
    data: KanavaEventMap[K]
  ): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  removeAllListeners(): void {
    this.handlers.clear();
  }
}
