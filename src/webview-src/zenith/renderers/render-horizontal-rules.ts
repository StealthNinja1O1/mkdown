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

export const horizontalRuleRenderer = ViewPlugin.fromClass(
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
            if (nodeRef.name !== "HorizontalRule") return;

            const nodeFrom = nodeRef.from;
            const nodeTo = nodeRef.to;

            // Show raw syntax when cursor is on the line
            if (isRangeSelected(state, nodeFrom, nodeTo)) return;

            const line = state.doc.lineAt(nodeFrom);

            // Hide the line content (---, ***, ___)
            decorations.push(
              Decoration.replace({}).range(line.from, line.to),
            );

            // Add a class to the line for CSS styling
            decorations.push(
              Decoration.line({ class: "cm-md-hr" }).range(line.from),
            );
          },
        });
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);
