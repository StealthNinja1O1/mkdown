import { HighlightStyle } from "@codemirror/language"
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

export const centeredLayout = EditorView.theme({
  "&": {
    maxWidth: "1200px",
    minWidth: "400px",
    width: "100%",
    margin: "0 auto",
    padding: "1em 2em",
    lineHeight: "1.6",
  },
  ".cm-content": {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    fontSize: "18px",

  }
});
