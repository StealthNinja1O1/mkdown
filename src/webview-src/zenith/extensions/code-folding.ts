import { foldService, foldGutter } from "@codemirror/language";
import { syntaxTree } from "@codemirror/language";
import type { Extension } from "@codemirror/state";

function headingLevel(name: string): number {
  if (name === "ATXHeading1") return 1;
  if (name === "ATXHeading2") return 2;
  if (name === "ATXHeading3") return 3;
  if (name === "ATXHeading4") return 4;
  if (name === "ATXHeading5") return 5;
  if (name === "ATXHeading6") return 6;
  return 0;
}

const markdownFoldService = foldService.of((state, from, _to) => {
  const node = syntaxTree(state).resolveInner(from, 1);

  if (node.name === "FencedCode") {
    const startLine = state.doc.lineAt(node.from);
    const endLine = state.doc.lineAt(node.to);
    if (endLine.number - startLine.number < 2) return null;
    return { from: startLine.to, to: endLine.from };
  }

  const level = headingLevel(node.name);
  if (level > 0) {
    const headingLine = state.doc.lineAt(node.from);
    const totalLines = state.doc.lines;
    let foldEnd = state.doc.length;

    for (let ln = headingLine.number + 1; ln <= totalLines; ln++) {
      const line = state.doc.line(ln);
      const lineNode = syntaxTree(state).resolveInner(line.from + 1, 1);
      const nextLevel = headingLevel(lineNode.name);
      if (nextLevel > 0 && nextLevel <= level) {
        foldEnd = line.from;
        break;
      }
    }

    if (foldEnd <= headingLine.to + 1) return null;
    return { from: headingLine.to, to: foldEnd };
  }

  return null;
});

export function getCodeFoldingExtensions(): Extension[] {
  return [
    markdownFoldService,
    foldGutter({
      openText: "▾",
      closedText: "▸",
      markerDOM(open) {
        const span = document.createElement("span");
        span.textContent = open ? "▾" : "▸";
        span.style.cursor = "pointer";
        span.style.opacity = open ? "0.4" : "0.6";
        span.style.fontSize = "0.8em";
        span.style.marginRight = "4px";
        return span;
      },
    }),
  ];
}
