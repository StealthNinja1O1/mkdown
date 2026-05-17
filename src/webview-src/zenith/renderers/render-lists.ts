import { Decoration, WidgetType } from "@codemirror/view";
import { createInlineRenderer } from "./base-renderer";

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-bullet";
    span.textContent = "•";
    span.contentEditable = "false";
    return span;
  }
  ignoreEvent() { return false; }
  eq() { return true; }
}

export const listRenderer = createInlineRenderer(
  (node) => {
    if (node.name === "ListMark") {
      const parent = node.node.parent;
      return {
        from: node.from,
        to: node.to,
        type: "listMark",
        selectionFrom: parent?.from ?? node.from,
        selectionTo: parent?.to ?? node.to,
      };
    }
    return undefined;
  },
  (from, to, type, view) => {
    const text = view.state.doc.sliceString(from, to);
    if (!/^[-*+]$/.test(text)) return [];

    const afterMark = view.state.doc.sliceString(to, to + 3);
    if (afterMark.startsWith(" [")) return [];

    const hideTo =
      to < view.state.doc.length && view.state.doc.sliceString(to, to + 1) === " "
        ? to + 1
        : to;

    return [Decoration.replace({ widget: new BulletWidget() }).range(from, hideTo)];
  },
);
