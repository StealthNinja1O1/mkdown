import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { isRangeSelected } from "../extensions/selection-awareness";
import type { Range } from "../types";

const FN_REF_RE = /\[\^([^\]]+)\]/g;
const FN_DEF_RE = /^\[\^([^\]]+)\]:\s+(.+)$/gm;

class FootnoteDefBadgeWidget extends WidgetType {
  constructor(readonly id: string, readonly view: EditorView) { super(); }

  toDOM() {
    const container = document.createElement("span");
    container.className = "cm-footnote-def-badge";
    container.contentEditable = "false";

    const sup = document.createElement("sup");
    sup.textContent = this.id;
    container.appendChild(sup);

    container.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const doc = this.view.state.doc.toString();
      const refRe = new RegExp(`\\[\\^${this.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, "g");
      let refMatch: RegExpExecArray | null;
      while ((refMatch = refRe.exec(doc)) !== null) {
        const lineStart = this.view.state.doc.lineAt(refMatch.index).from;
        const lineText = this.view.state.doc.sliceString(lineStart, this.view.state.doc.lineAt(refMatch.index).to);
        if (/^\[\^[^\]]+\]:/.test(lineText)) continue;
        this.view.dispatch({
          selection: { anchor: refMatch.index, head: refMatch.index + refMatch[0].length },
          scrollIntoView: true,
        });
        break;
      }
    });

    return container;
  }

  ignoreEvent() { return false; }
  eq(other: FootnoteDefBadgeWidget) { return other.id === this.id; }
}

class FootnoteRefWidget extends WidgetType {
  constructor(
    readonly id: string,
    readonly definition: string | null,
    readonly fullFrom: number,
    readonly fullTo: number,
  ) { super(); }

  toDOM() {
    const sup = document.createElement("sup");
    sup.className = "cm-footnote-ref";
    sup.textContent = this.id;
    sup.contentEditable = "false";
    sup.style.position = "relative";

    if (this.definition) {
      const tooltip = document.createElement("div");
      tooltip.className = "cm-footnote-tooltip";
      tooltip.textContent = this.definition;
      sup.appendChild(tooltip);
    }

    return sup;
  }

  ignoreEvent() { return false; }
  eq(other: FootnoteRefWidget) { return other.id === this.id && other.definition === this.definition; }
}

function buildDefinitionMap(doc: string): Map<string, string> {
  const defs = new Map<string, string>();
  FN_DEF_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FN_DEF_RE.exec(doc)) !== null) {
    defs.set(match[1], match[2]);
  }
  return defs;
}

export const footnoteRenderer = ViewPlugin.fromClass(
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
      const fullDoc = state.doc.toString();
      const defs = buildDefinitionMap(fullDoc);

      for (const { from, to } of view.visibleRanges) {
        const visibleText = state.doc.sliceString(from, to);
        FN_REF_RE.lastIndex = 0;
        let refMatch: RegExpExecArray | null;

        while ((refMatch = FN_REF_RE.exec(visibleText)) !== null) {
          const matchStart = from + refMatch.index;
          const matchEnd = matchStart + refMatch[0].length;

          const lineStart = state.doc.lineAt(matchStart).from;
          const lineText = state.doc.sliceString(lineStart, state.doc.lineAt(matchStart).to);
          if (/^\[\^[^\]]+\]:/.test(lineText)) continue;
          if (isRangeSelected(state, matchStart, matchEnd)) continue;

          const id = refMatch[1];
          const definition = defs.get(id) ?? null;

          decorations.push(
            Decoration.replace({
              widget: new FootnoteRefWidget(id, definition, matchStart, matchEnd),
            }).range(matchStart, matchEnd),
          );
        }

        FN_DEF_RE.lastIndex = 0;
        let defMatch: RegExpExecArray | null;
        const visibleTextForDef = state.doc.sliceString(from, to);
        while ((defMatch = FN_DEF_RE.exec(visibleTextForDef)) !== null) {
          const defLineStart = from + defMatch.index;
          const line = state.doc.lineAt(defLineStart);

          if (isRangeSelected(state, line.from, line.to)) continue;

          decorations.push(Decoration.line({ class: "cm-footnote-def" }).range(line.from));

          const prefixMatch = line.text.match(/^\[\^([^\]]+)\]:\s*/);
          if (prefixMatch) {
            const prefixEnd = line.from + prefixMatch[0].length;
            const badgeEnd = line.from + line.text.indexOf("]") + 1;
            decorations.push(
              Decoration.replace({
                widget: new FootnoteDefBadgeWidget(prefixMatch[1], view),
              }).range(line.from, badgeEnd),
            );
          }
        }
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);
