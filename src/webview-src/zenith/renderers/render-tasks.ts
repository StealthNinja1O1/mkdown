import { Decoration, WidgetType, type EditorView } from "@codemirror/view";
import { createInlineRenderer } from "./base-renderer";

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean, readonly pos: number) { super(); }

  toDOM(view: EditorView) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.style.cssText = `
      appearance: none;
      width: 16px;
      height: 16px;
      border: 2px solid ${this.checked ? "var(--zenith-accent, #f97316)" : "#555"};
      border-radius: 3px;
      background: ${this.checked ? "var(--zenith-accent, #f97316)" : "transparent"};
      cursor: pointer;
      vertical-align: middle;
      margin-right: 6px;
      position: relative;
    `;

    if (this.checked) {
      const check = document.createElement("span");
      check.style.cssText = `
        position: absolute;
        top: -2px;
        left: 2px;
        color: #000;
        font-size: 12px;
        font-weight: bold;
        pointer-events: none;
      `;
      check.textContent = "✓";
      input.style.position = "relative";
      input.appendChild(check);
    }

    input.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const state = view.state;
      const line = state.doc.lineAt(this.pos);
      const lineText = line.text;

      const uncheckedMatch = lineText.match(/- \[ \]/);
      const checkedMatch = lineText.match(/- \[x\]/);

      if (uncheckedMatch) {
        const idx = lineText.indexOf("- [ ]");
        if (idx !== -1) {
          const from = line.from + idx + 3;
          view.dispatch({ changes: { from, to: from + 1, insert: "x" } });
        }
      } else if (checkedMatch) {
        const idx = lineText.indexOf("- [x]");
        if (idx !== -1) {
          const from = line.from + idx + 3;
          view.dispatch({ changes: { from, to: from + 1, insert: " " } });
        }
      }
    });

    return input;
  }

  ignoreEvent() { return false; }
  eq(other: CheckboxWidget) { return other.checked === this.checked && other.pos === this.pos; }
}

export const taskRenderer = createInlineRenderer(
  (node) => {
    if (node.name === "TaskMarker") {
      const parent = node.node.parent;
      return {
        from: node.from,
        to: node.to,
        type: "taskMarker",
        selectionFrom: parent?.from ?? node.from,
        selectionTo: parent?.to ?? node.to,
      };
    }
    return undefined;
  },
  (from, to, type, view) => {
    const text = view.state.doc.sliceString(from, to);
    const isChecked = text.includes("x") || text.includes("X");
    return [Decoration.replace({ widget: new CheckboxWidget(isChecked, from) }).range(from, to)];
  },
);
