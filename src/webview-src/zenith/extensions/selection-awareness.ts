import { StateField, type EditorState } from "@codemirror/state";
import type { EditorSelection } from "@codemirror/state";

/**
 * Configuration state field: whether to show syntax when the cursor is
 * adjacent to (touching the edge of) a formatted range.
 * Default: true (matches Obsidian/Zettlr behavior).
 */
export const showSyntaxOnAdjacentField = StateField.define<boolean>({
  create: () => true,
  update: (value) => value,
});

/**
 * Check whether a given range overlaps with (or is adjacent to) the current
 * editor selection.
 */
export function rangeInSelection(
  selection: EditorSelection,
  rangeFrom: number,
  rangeTo: number,
  includeAdjacent: boolean = true,
): boolean {
  for (const range of selection.ranges) {
    if (includeAdjacent) {
      if (range.to >= rangeFrom && range.from <= rangeTo) return true;
    } else {
      if (range.to > rangeFrom && range.from < rangeTo) return true;
    }
  }
  return false;
}

/**
 * Convenience: check if ANY part of the current selection touches the range.
 */
export function isRangeSelected(
  state: EditorState,
  from: number,
  to: number,
): boolean {
  const includeAdjacent = state.field(showSyntaxOnAdjacentField, false) ?? true;
  return rangeInSelection(state.selection, from, to, includeAdjacent);
}
