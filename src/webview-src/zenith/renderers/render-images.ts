import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { isRangeSelected } from "../extensions/selection-awareness";

class ImageWidget extends WidgetType {
  constructor(readonly url: string, readonly alt: string) { super(); }

  toDOM() {
    const container = document.createElement("span");
    container.className = "cm-image-inline";
    container.contentEditable = "false";
    container.style.cssText = `display: block; max-width: 100%; margin: 8px 0;`;

    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.style.cssText = `max-width: 100%; max-height: 400px; border-radius: 6px; border: 1px solid var(--zenith-border, #333); display: block;`;
    img.onerror = () => {
      container.innerHTML = "";
      const fallback = document.createElement("span");
      fallback.style.cssText = `display: inline-flex; align-items: center; gap: 6px; color: #888; font-style: italic; font-size: 0.9em; padding: 8px 12px; background: #1a1a1a; border-radius: 6px; border: 1px dashed #333;`;
      fallback.textContent = `📷 ${this.alt || this.url}`;
      container.appendChild(fallback);
    };
    container.appendChild(img);
    return container;
  }

  ignoreEvent() { return false; }
  eq(other: ImageWidget) { return other.url === this.url && other.alt === this.alt; }
}

interface SyntaxNodeChild {
  name: string;
  from: number;
  to: number;
  firstChild: SyntaxNodeChild | null;
  nextSibling: SyntaxNodeChild | null;
}

function extractImageParts(
  view: EditorView,
  imageNode: { from: number; to: number; firstChild: SyntaxNodeChild | null },
): { url: string; alt: string } | null {
  let url = "";
  let child: SyntaxNodeChild | null = imageNode.firstChild;
  while (child) {
    if (child.name === "URL") {
      url = view.state.doc.sliceString(child.from, child.to);
      break;
    }
    child = child.nextSibling;
  }
  if (!url) return null;

  const rawText = view.state.doc.sliceString(imageNode.from, imageNode.to);
  const altMatch = rawText.match(/^!\[([^\]]*)\]/);
  const alt = altMatch ? altMatch[1] : "";
  return { url, alt };
}

export const imageRenderer = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      const state = view.state;

      for (const { from, to } of view.visibleRanges) {
        syntaxTree(state).iterate({
          from,
          to,
          enter: (nodeRef) => {
            if (nodeRef.name !== "Image") return;
            const imgFrom = nodeRef.from;
            const imgTo = nodeRef.to;
            if (isRangeSelected(state, imgFrom, imgTo)) return;

            const node = nodeRef.node;
            const parts = extractImageParts(view, node as unknown as SyntaxNodeChild);
            if (parts) {
              decorations.push(
                Decoration.replace({ widget: new ImageWidget(parts.url, parts.alt) }).range(imgFrom, imgTo),
              );
            }
          },
        });
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);

type Range<T> = { from: number; to: number; value: T };
