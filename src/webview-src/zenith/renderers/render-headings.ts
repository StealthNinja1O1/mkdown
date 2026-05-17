import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { createInlineRenderer } from "./base-renderer";

export const headingMarkHider = createInlineRenderer(
  (node) => {
    if (node.name === "HeaderMark") {
      const parent = node.node.parent;
      return {
        from: node.from,
        to: node.to,
        type: "headerMark",
        selectionFrom: parent?.from ?? node.from,
        selectionTo: parent?.to ?? node.to,
      };
    }
    return undefined;
  },
  (from, to, type, view) => {
    const hideTo =
      to < view.state.doc.length &&
      view.state.doc.sliceString(to, to + 1) === " "
        ? to + 1
        : to;
    return [Decoration.replace({}).range(from, hideTo)];
  },
);

export const setextMarkHider = createInlineRenderer(
  (node) => {
    if (node.name === "SetextHeading1" || node.name === "SetextHeading2") {
      const parent = node.node.parent;
      return {
        from: node.from,
        to: node.to,
        type: "setextMark",
        selectionFrom: parent?.from ?? node.from,
        selectionTo: parent?.to ?? node.to,
      };
    }
    return undefined;
  },
  (from, to) => {
    return [Decoration.replace({}).range(from, to)];
  },
);

const HEADING_NODES: Record<string, string> = {
  ATXHeading1: "cm-md-heading1",
  ATXHeading2: "cm-md-heading2",
  ATXHeading3: "cm-md-heading3",
  ATXHeading4: "cm-md-heading4",
  ATXHeading5: "cm-md-heading5",
  ATXHeading6: "cm-md-heading6",
  SetextHeading1: "cm-md-heading1",
  SetextHeading2: "cm-md-heading2",
};

export const headingLineDecorator = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: any[] = [];
      const state = view.state;
      const doc = state.doc;

      let fmFrom = -1, fmTo = -1;
      if (doc.line(1).text === "---") {
        for (let i = 2; i <= Math.min(doc.lines, 50); i++) {
          if (doc.line(i).text === "---") {
            fmFrom = doc.line(1).from;
            fmTo = doc.line(i).to;
            break;
          }
        }
      }

      for (const { from, to } of view.visibleRanges) {
        syntaxTree(state).iterate({
          from,
          to,
          enter: (nodeRef) => {
            const cls = HEADING_NODES[nodeRef.name];
            if (!cls) return;
            if (fmFrom >= 0 && nodeRef.from >= fmFrom && nodeRef.from <= fmTo) return;
            const startLine = state.doc.lineAt(nodeRef.from);
            decorations.push(Decoration.line({ class: cls }).range(startLine.from));
          },
        });
      }

      return Decoration.set(decorations, true);
    }
  },
  { decorations: (v) => v.decorations },
);
