import { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import type { Extension } from "@codemirror/state";

/**
 * Creates a CM6 extension that handles Ctrl+Click on links to open them.
 */
export function createClickHandlers(): Extension {
  return EditorView.domEventHandlers({
    mousedown(event, view) {
      if (!event.ctrlKey && !event.metaKey) return false;
      if (event.button !== 0) return false;

      const pos = view.posAtCoords(event);
      if (pos === null) return false;

      let node = syntaxTree(view.state).resolveInner(pos, 1);

      let target = node;
      while (target && target.name !== "Link" && target.name !== "URL") {
        const parent = target.parent;
        if (!parent) break;
        target = parent;
      }

      if (!target || (target.name !== "Link" && target.name !== "URL")) return false;

      const url = extractUrlFromNode(view, target);
      if (!url) return false;

      event.preventDefault();
      window.open(url, "_blank", "noopener");
      return true;
    },
  });
}

function extractUrlFromNode(
  view: EditorView,
  node: { name: string; from: number; to: number; firstChild: any | null },
): string | null {
  if (node.name === "URL") {
    return view.state.doc.sliceString(node.from, node.to);
  }

  if (node.name === "Link") {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.name === "URL") {
        return view.state.doc.sliceString(child.from, child.to);
      }
    }
    const fullText = view.state.doc.sliceString(node.from, node.to);
    if (fullText.startsWith("<") && fullText.endsWith(">")) {
      return fullText.slice(1, -1);
    }
  }

  return null;
}
