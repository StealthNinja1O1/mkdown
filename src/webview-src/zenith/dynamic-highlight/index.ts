import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import type { DynamicHighlightRule } from "../types";

export const defaultHighlightRules: DynamicHighlightRule[] = [
  { pattern: /"[^"]*"/g, color: "#f97316", label: "Double quotes" },
  { pattern: /\*[^*]+\*/g, color: "#808080CC", label: "Italics" },
];

export function createDynamicHighlighter(rules: DynamicHighlightRule[]) {
  if (rules.length === 0) return [];

  return ViewPlugin.fromClass(
    class DynamicHighlightPlugin {
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
        const decorations = [];
        const seen = new Set<number>();

        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to);
          const lineTexts = text.split("\n");

          let inCodeBlock = false;
          let lineOffset = from;

          for (const lineText of lineTexts) {
            if (lineText.trimStart().startsWith("```")) {
              inCodeBlock = !inCodeBlock;
              lineOffset += lineText.length + 1;
              continue;
            }

            if (!inCodeBlock) {
              for (const rule of rules) {
                const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
                let match;
                while ((match = regex.exec(lineText)) !== null) {
                  // Prevent infinite loops on zero-length matches
                  if (match[0].length === 0) {
                    regex.lastIndex++;
                    continue;
                  }

                  const matchStart = lineOffset + match.index;
                  const matchEnd = matchStart + match[0].length;

                  let overlaps = false;
                  for (let p = matchStart; p < matchEnd; p++) {
                    if (seen.has(p)) { overlaps = true; break; }
                  }

                  if (!overlaps) {
                    for (let p = matchStart; p < matchEnd; p++) seen.add(p);
                    const cls = rule.className || "cm-dynamic-highlight";
                    
                    const attrs: Record<string, string> = {};
                    let style = "";
                    if (rule.color) style += `color: ${rule.color} !important;`;
                    if (rule.backgroundColor) style += `background-color: ${rule.backgroundColor} !important;`;
                    if (style) attrs.style = style;

                    decorations.push(Decoration.mark({ 
                      class: cls,
                      attributes: style ? attrs : undefined
                    }).range(matchStart, matchEnd));
                  }
                }
              }
            }

            lineOffset += lineText.length + 1;
          }
        }

        return Decoration.set(decorations, true);
      }
    },
    { decorations: (v) => v.decorations },
  );
}
