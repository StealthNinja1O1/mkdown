import type { Extension } from "@codemirror/state";
import { showSyntaxOnAdjacentField } from "./selection-awareness";
import { getMarkdownSetup, getMarkdownHighlighting, getIndentConfig } from "./markdown-setup";
import { createClickHandlers } from "./click-handlers";
import { getCodeFoldingExtensions } from "./code-folding";

export { isRangeSelected, showSyntaxOnAdjacentField } from "./selection-awareness";
export { selectionToolbar } from "./selection-toolbar";

export function getCoreExtensions(features?: { codeFolding?: boolean }): Extension[] {
  const extensions: Extension[] = [
    getMarkdownSetup(),
    getMarkdownHighlighting(),
    getIndentConfig(),
    showSyntaxOnAdjacentField,
    createClickHandlers(),
  ];

  if (features?.codeFolding !== false) {
    extensions.push(...getCodeFoldingExtensions());
  }

  return extensions;
}
