import { Decoration } from "@codemirror/view";
import { createInlineRenderer } from "./base-renderer";

export const codeMarkHider = createInlineRenderer(
  (node) => {
    if (node.name === "CodeMark") {
      const parent = node.node.parent;
      return {
        from: node.from,
        to: node.to,
        type: "codeMark",
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
