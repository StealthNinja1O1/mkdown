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
import type { Range } from "../types";

class LinkOpenIconWidget extends WidgetType {
  constructor(readonly url: string) { super(); }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-link-open-icon";
    span.setAttribute("data-url", this.url);
    span.setAttribute("title", `Open: ${this.url}`);
    span.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
    span.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(this.url, "_blank", "noopener");
    };
    return span;
  }

  ignoreEvent() { return false; }
  eq(other: LinkOpenIconWidget) { return other.url === this.url; }
}

function extractUrl(
  view: EditorView,
  linkNode: { firstChild: { name: string; from: number; to: number; nextSibling: any } | null },
): string | null {
  let child = linkNode.firstChild;
  while (child) {
    if (child.name === "URL") {
      return view.state.doc.sliceString(child.from, child.to);
    }
    child = child.nextSibling;
  }
  return null;
}

export const linkRenderer = ViewPlugin.fromClass(
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
            if (nodeRef.name !== "Link") return;

            const linkFrom = nodeRef.from;
            const linkTo = nodeRef.to;

            if (isRangeSelected(state, linkFrom, linkTo)) return;

            const url = extractUrl(view, nodeRef.node);
            if (!url) return;

            const node = nodeRef.node;
            let openBracket = -1;
            let closeBracket = -1;

            for (let child = node.firstChild; child; child = child.nextSibling) {
              if (child.name === "LinkMark") {
                const text = state.doc.sliceString(child.from, child.to);
                if (text === "[") openBracket = child.to;
                if (text === "]") closeBracket = child.from;
                decorations.push(Decoration.replace({}).range(child.from, child.to));
              } else if (child.name === "URL") {
                decorations.push(Decoration.replace({ class: "cm-link-url" }).range(child.from, child.to));
              }
            }

            if (openBracket >= 0 && closeBracket >= 0) {
              decorations.push(Decoration.mark({ class: "cm-link-text" }).range(openBracket, closeBracket));
            }

            decorations.push(
              Decoration.widget({ widget: new LinkOpenIconWidget(url), side: 1 }).range(linkTo),
            );
          },
        });
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);
