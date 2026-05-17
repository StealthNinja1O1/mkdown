import {
  ViewPlugin,
  type ViewUpdate,
  type EditorView,
  Decoration,
  type DecorationSet,
} from "@codemirror/view";
import { type Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { isRangeSelected } from "../extensions/selection-awareness";

export interface NodeRef {
  name: string;
  from: number;
  to: number;
  node: { parent: { from: number; to: number } | null };
}

export interface NodeMatchResult {
  from: number;
  to: number;
  type: string;
  selectionFrom?: number;
  selectionTo?: number;
}

export type NodeMatcher = (node: NodeRef) => NodeMatchResult | undefined;
export type DecorationFactory = (from: number, to: number, type: string, view: EditorView) => Range<Decoration>[];

export function createInlineRenderer(
  matchNode: NodeMatcher,
  createDecorations: DecorationFactory,
) {
  return ViewPlugin.fromClass(
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

        for (const { from, to } of view.visibleRanges) {
          syntaxTree(view.state).iterate({
            from,
            to,
            enter: (nodeRef) => {
              const match = matchNode(nodeRef as unknown as NodeRef);
              if (!match) return;

              const selFrom = match.selectionFrom ?? match.from;
              const selTo = match.selectionTo ?? match.to;

              if (isRangeSelected(view.state, selFrom, selTo)) return;

              decorations.push(...createDecorations(match.from, match.to, match.type, view));
            },
          });
        }

        return Decoration.set(decorations, true);
      }
    },
    { decorations: (v) => v.decorations },
  );
}

export function createHideRenderer(
  matchNode: NodeMatcher,
  replacementWidget?: (from: number, to: number, type: string) => Range<Decoration>,
) {
  return createInlineRenderer(matchNode, (from, to, type) => {
    if (replacementWidget) {
      return [replacementWidget(from, to, type)];
    }
    if (from === to) return [];
    return [Decoration.replace({}).range(from, to)];
  });
}
