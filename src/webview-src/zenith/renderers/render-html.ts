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
import DOMPurify from "isomorphic-dompurify";

class HTMLWidget extends WidgetType {
  constructor(readonly html: string, readonly isBlock: boolean) { super(); }

  toDOM() {
    const tag = this.isBlock ? "div" : "span";
    const container = document.createElement(tag);
    container.className = "cm-html-rendered";
    container.innerHTML = DOMPurify.sanitize(this.html, {
      ALLOWED_TAGS: [
        "b", "i", "s", "mark", "span", "div", "br", "hr",
        "details", "summary", "kbd", "code", "pre",
        "sub", "sup", "img", "table", "thead", "tbody",
        "tr", "th", "td", "a", "ul", "ol", "li", "p",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "strong", "em", "del", "ins", "blockquote",
        "abbr", "cite", "dl", "dt", "dd",
        "figure", "figcaption", "small", "u", "button",
        "input", "select", "option", "textarea",
        "ruby", "rt", "rp",
      ],
      ALLOWED_ATTR: [
        "style", "class", "href", "src", "alt", "title",
        "colspan", "rowspan", "width", "height",
        "open", "target", "rel", "id", "lang",
        "start", "type", "value", "disabled",
        "checked", "placeholder", "readonly",
      ],
      ALLOW_DATA_ATTR: false,
    });
    container.contentEditable = "false";
    return container;
  }

  ignoreEvent() { return false; }
  eq(other: HTMLWidget) { return other.html === this.html && other.isBlock === this.isBlock; }
}

export const htmlRenderer = ViewPlugin.fromClass(
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
            if (nodeRef.name !== "HTMLBlock") return;
            const nodeFrom = nodeRef.from;
            const nodeTo = nodeRef.to;
            if (isRangeSelected(state, nodeFrom, nodeTo)) return;

            const html = state.doc.sliceString(nodeFrom, nodeTo);
            if (!html.trim()) return;

            const firstLine = state.doc.lineAt(nodeFrom);
            const lastLine = state.doc.lineAt(nodeTo);
            const isSingleLine = firstLine.number === lastLine.number;

            if (isSingleLine) {
              decorations.push(
                Decoration.replace({ widget: new HTMLWidget(html, true) }).range(nodeFrom, nodeTo),
              );
            } else {
              decorations.push(
                Decoration.replace({ widget: new HTMLWidget(html, true) }).range(firstLine.from, firstLine.from + firstLine.text.length),
              );
              for (let ln = firstLine.number + 1; ln <= lastLine.number; ln++) {
                const line = state.doc.line(ln);
                if (line.text.length > 0) {
                  decorations.push(Decoration.replace({}).range(line.from, line.from + line.text.length));
                }
                decorations.push(Decoration.line({ class: "cm-html-hidden" }).range(line.from));
              }
            }
          },
        });

        const startLineNum = state.doc.lineAt(from).number;
        const endLineNum = state.doc.lineAt(to).number;

        for (let ln = startLineNum; ln <= endLineNum; ln++) {
          const line = state.doc.line(ln);
          const lineText = line.text;

          const INLINE_HTML_RE = /<(strong|em|b|i|s|mark|kbd|code|sub|sup|small|u|del|ins|abbr|span|abbr|cite)(\s[^>]*)?>([^<]*?)<\/\1>/g;
          let match: RegExpExecArray | null;

          while ((match = INLINE_HTML_RE.exec(lineText)) !== null) {
            const matchStart = line.from + match.index;
            const matchEnd = matchStart + match[0].length;
            if (isRangeSelected(state, matchStart, matchEnd)) continue;

            decorations.push(
              Decoration.replace({ widget: new HTMLWidget(match[0], false) }).range(matchStart, matchEnd),
            );
          }
        }
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);

type Range<T> = { from: number; to: number; value: T };
