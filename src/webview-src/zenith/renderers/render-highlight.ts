import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import { isRangeSelected } from "../extensions/selection-awareness";

const HIGHLIGHT_RE = /==((?:[^\n=]|=(?!=))+)==/g;

export const highlightRenderer = ViewPlugin.fromClass(
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
        const text = state.doc.sliceString(from, to);
        HIGHLIGHT_RE.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = HIGHLIGHT_RE.exec(text)) !== null) {
          const matchStart = from + match.index;
          const matchEnd = matchStart + match[0].length;
          const contentStart = matchStart + 2;
          const contentEnd = matchEnd - 2;

          if (isRangeSelected(state, matchStart, matchEnd)) continue;

          decorations.push(Decoration.replace({}).range(matchStart, contentStart));
          decorations.push(Decoration.mark({ class: "cm-md-highlight" }).range(contentStart, contentEnd));
          decorations.push(Decoration.replace({}).range(contentEnd, matchEnd));
        }
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);

type Range<T> = { from: number; to: number; value: T };
