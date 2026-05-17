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

class LanguageBadgeWidget extends WidgetType {
  constructor(readonly lang: string) { super(); }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-code-lang-badge";
    span.textContent = this.lang;
    return span;
  }
  ignoreEvent() { return true; }
  eq(other: LanguageBadgeWidget) { return other.lang === this.lang; }
}

export const codeBlockRenderer = ViewPlugin.fromClass(
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
      const lineDecos: Range<Decoration>[] = [];
      const replaceDecos: Range<Decoration>[] = [];
      const state = view.state;

      for (const { from, to } of view.visibleRanges) {
        syntaxTree(state).iterate({
          from,
          to,
          enter: (nodeRef) => {
            if (nodeRef.name !== "FencedCode") return;

            const blockFrom = nodeRef.from;
            const blockTo = nodeRef.to;
            const isSelected = isRangeSelected(state, blockFrom, blockTo);

            const startLine = state.doc.lineAt(blockFrom).number;
            const endLine = state.doc.lineAt(blockTo).number;

            for (let ln = startLine; ln <= endLine; ln++) {
              const line = state.doc.line(ln);
              lineDecos.push(Decoration.line({ class: "cm-md-codeblock" }).range(line.from));
            }

            if (!isSelected) {
              const openLine = state.doc.line(startLine);
              const openText = openLine.text;
              const fenceMatch = openText.match(/^(~~~+|`{3,})/);
              if (fenceMatch) {
                const langPart = openText.slice(fenceMatch[0].length).trim();
                if (langPart) {
                  replaceDecos.push(
                    Decoration.replace({ widget: new LanguageBadgeWidget(langPart) }).range(openLine.from, openLine.to),
                  );
                } else {
                  replaceDecos.push(Decoration.replace({}).range(openLine.from, openLine.to));
                }
              }

              if (endLine > startLine) {
                const closeLine = state.doc.line(endLine);
                const closeText = closeLine.text;
                if (/^(~~~+|`{3,})\s*$/.test(closeText)) {
                  replaceDecos.push(Decoration.replace({}).range(closeLine.from, closeLine.to));
                }
              }
            }
          },
        });
      }

      const all = [...lineDecos, ...replaceDecos];
      return Decoration.set(all, true);
    }
  },
  { decorations: (v) => v.decorations },
);
