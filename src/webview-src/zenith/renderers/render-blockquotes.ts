import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { isRangeSelected } from "../extensions/selection-awareness";
import type { Range } from "../types";

export const blockquoteRenderer = ViewPlugin.fromClass(
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
            if (nodeRef.name !== "Blockquote") return;

            const blockFrom = nodeRef.from;
            const blockTo = nodeRef.to;
            const isSelected = isRangeSelected(state, blockFrom, blockTo);

            const startLine = state.doc.lineAt(blockFrom).number;
            const endLine = state.doc.lineAt(blockTo).number;

            for (let ln = startLine; ln <= endLine; ln++) {
              const line = state.doc.line(ln);
              decorations.push(Decoration.line({ class: "cm-md-blockquote" }).range(line.from));
            }

            if (!isSelected) {
              const node = nodeRef.node;
              for (let child = node.firstChild; child; child = child.nextSibling) {
                if (child.name === "QuoteMark") {
                  const spaceAfter = child.to < state.doc.length &&
                    state.doc.sliceString(child.to, child.to + 1) === " "
                    ? child.to + 1
                    : child.to;
                  decorations.push(Decoration.replace({}).range(child.from, spaceAfter));
                }
              }
            }
          },
        });
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);
