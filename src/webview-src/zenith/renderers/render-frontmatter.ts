import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import { isRangeSelected } from "../extensions/selection-awareness";
import type { Range } from "../types";

export const frontmatterRenderer = ViewPlugin.fromClass(
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
      const state = view.state;
      const doc = state.doc;

      const firstLine = doc.line(1);
      if (firstLine.text !== "---") return Decoration.none;

      let endLine = -1;
      const totalLines = doc.lines;
      for (let i = 2; i <= totalLines; i++) {
        const line = doc.line(i);
        if (line.text === "---") { endLine = i; break; }
        if (i > 50) break; // Limit frontmatter search to first 50 lines for performance
      }

      if (endLine === -1) return Decoration.none;

      const blockFrom = doc.line(1).from;
      const blockTo = doc.line(endLine).to;

      if (isRangeSelected(state, blockFrom, blockTo)) {
        return Decoration.none;
      }

      const decorations: Range<Decoration>[] = [];
      for (let i = 1; i <= endLine; i++) {
        const line = doc.line(i);
        decorations.push(Decoration.line({ class: "cm-frontmatter-line" }).range(line.from));
      }

      decorations.push(Decoration.mark({ class: "cm-frontmatter-delim" }).range(firstLine.from, firstLine.to));
      const closingLine = doc.line(endLine);
      decorations.push(Decoration.mark({ class: "cm-frontmatter-delim" }).range(closingLine.from, closingLine.to));

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);
