import { Decoration } from "@codemirror/view";
import { createInlineRenderer } from "./base-renderer";

export const emphasisMarkHider = createInlineRenderer(
  (node) => {
    if (node.name === "EmphasisMark" || node.name === "StrikethroughMark") {
      const parent = node.node.parent;
      return {
        from: node.from,
        to: node.to,
        type: "mark",
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
