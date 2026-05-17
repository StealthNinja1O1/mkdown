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

export const tableRenderer = ViewPlugin.fromClass(
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
      const decoratedLines = new Map<number, string>();

      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter: (nodeRef) => {
            const name = nodeRef.name;
            if (name !== "TableHeader" && name !== "TableDelimiter" && name !== "TableRow") return;

            const line = view.state.doc.lineAt(nodeRef.from);
            const lineNum = line.number;
            const isSelected = isRangeSelected(view.state, line.from, line.to);

            if (!decoratedLines.has(lineNum) && !isSelected) {
              if (name === "TableHeader") {
                decoratedLines.set(lineNum, "header");
                decorations.push(Decoration.line({ class: "cm-table-header" }).range(line.from));
              } else if (name === "TableDelimiter") {
                decoratedLines.set(lineNum, "delimiter");
                decorations.push(Decoration.line({ class: "cm-table-delimiter" }).range(line.from));
              } else if (name === "TableRow") {
                decoratedLines.set(lineNum, "row");
                decorations.push(Decoration.line({ class: "cm-table-row" }).range(line.from));
              }
            }

            if (!isSelected) {
              const lineText = line.text;
              for (let i = 0; i < lineText.length; i++) {
                if (lineText[i] === "|") {
                  const pos = line.from + i;
                  decorations.push(Decoration.replace({}).range(pos, pos + 1));
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
