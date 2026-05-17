import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { isRangeSelected } from "../extensions/selection-awareness";
import katex from "katex";

const INLINE_BLOCK_MATH_RE = /\$\$([^$\n]+?)\$\$/g;
const INLINE_MATH_RE = /(?<![a-zA-Z\\])\$([^$\n]+?)\$(?![a-zA-Z0-9])/g;

class MathWidget extends WidgetType {
  constructor(readonly expression: string, readonly isBlock: boolean) { super(); }

  toDOM() {
    const container = document.createElement(this.isBlock ? "div" : "span");
    container.className = this.isBlock ? "cm-math-block" : "cm-math-inline";
    container.contentEditable = "false";

    try {
      katex.render(this.expression.trim(), container, {
        throwOnError: false,
        displayMode: this.isBlock,
        output: "html",
      });
    } catch {
      container.textContent = this.expression;
      container.style.color = "#e06c75";
      container.style.fontStyle = "italic";
    }

    return container;
  }

  ignoreEvent() { return false; }
  eq(other: MathWidget) { return other.expression === this.expression && other.isBlock === this.isBlock; }
}

export const mathRenderer = ViewPlugin.fromClass(
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
      try {
        return this._buildDecorations(view);
      } catch {
        return Decoration.none;
      }
    }

    _buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      const state = view.state;
      const docEnd = state.doc.length;
      const hiddenLineRanges: { from: number; to: number }[] = [];

      for (const { from, to } of view.visibleRanges) {
        const startLineNum = state.doc.lineAt(Math.max(0, Math.min(from, docEnd))).number;
        const endLineNum = state.doc.lineAt(Math.min(to, docEnd)).number;
        const totalLines = state.doc.lines;

        let i = startLineNum;
        while (i <= endLineNum && i <= totalLines) {
          const line = state.doc.line(i);
          const trimmed = line.text.trim();

          if (trimmed === "$$") {
            const exprLines: string[] = [];
            let j = i + 1;
            let foundClose = false;

            while (j <= Math.min(endLineNum, i + 50, totalLines)) {
              const closeLine = state.doc.line(j);
              if (closeLine.text.trim() === "$$") { foundClose = true; break; }
              exprLines.push(closeLine.text);
              j++;
            }

            if (foundClose) {
              const openLine = state.doc.line(i);
              const closeLine = state.doc.line(j);
              const expression = exprLines.join("\n");

              if (!isRangeSelected(state, openLine.from, closeLine.to)) {
                const openFrom = openLine.from;
                const openTo = openLine.from + openLine.text.length;
                if (openFrom <= openTo) {
                  decorations.push(
                    Decoration.replace({ widget: new MathWidget(expression, true) }).range(openFrom, openTo),
                  );
                }

                for (let k = i + 1; k <= j && k <= totalLines; k++) {
                  const hideLine = state.doc.line(k);
                  const hFrom = hideLine.from;
                  const hTo = hideLine.from + hideLine.text.length;
                  if (hFrom < hTo) {
                    decorations.push(Decoration.replace({}).range(hFrom, hTo));
                  }
                  decorations.push(Decoration.line({ class: "cm-math-hidden" }).range(hFrom));
                }

                hiddenLineRanges.push({ from: openLine.from, to: closeLine.to });
              }

              i = j + 1;
              continue;
            }
          }

          const lineText = line.text;
          INLINE_BLOCK_MATH_RE.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = INLINE_BLOCK_MATH_RE.exec(lineText)) !== null) {
            const matchStart = line.from + match.index;
            const matchEnd = matchStart + match[0].length;
            if (matchStart >= matchEnd) continue;
            if (isRangeSelected(state, matchStart, matchEnd)) continue;
            const overlaps = hiddenLineRanges.some((r) => matchStart < r.to && matchEnd > r.from);
            if (overlaps) continue;
            decorations.push(
              Decoration.replace({ widget: new MathWidget(match[1], true) }).range(matchStart, matchEnd),
            );
          }

          INLINE_MATH_RE.lastIndex = 0;
          while ((match = INLINE_MATH_RE.exec(lineText)) !== null) {
            const matchStart = line.from + match.index;
            const matchEnd = matchStart + match[0].length;
            if (matchStart >= matchEnd) continue;
            if (isRangeSelected(state, matchStart, matchEnd)) continue;
            const overlaps = hiddenLineRanges.some((r) => matchStart < r.to && matchEnd > r.from);
            if (overlaps) continue;
            decorations.push(
              Decoration.replace({ widget: new MathWidget(match[1], false) }).range(matchStart, matchEnd),
            );
          }

          i++;
        }
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);

type Range<T> = { from: number; to: number; value: T };
