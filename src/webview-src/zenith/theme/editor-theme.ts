import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

export function getEditorTheme(base: "dark" | "light" = "dark"): Extension {
  if (base === "dark") return darkTheme;
  return lightTheme;
}

type Ext = ReturnType<typeof EditorView.theme> extends Array<infer T> ? T : ReturnType<typeof EditorView.theme>;

const darkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--zenith-bg)",
      color: "var(--zenith-text)",
      fontSize: "var(--zenith-font-size)",
      fontFamily: "var(--zenith-font)",
      height: "100%",
    },
    ".cm-content": {
      padding: "var(--zenith-content-padding)",
      caretColor: "var(--zenith-accent)",
      lineHeight: "var(--zenith-line-height)",
      maxWidth: "var(--zenith-content-max-width)",
      margin: "0 auto",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--zenith-accent)",
      borderLeftWidth: "2px",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--zenith-bg-selection) !important",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--zenith-bg-active-line)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--zenith-gutter-bg)",
      color: "var(--zenith-gutter-text)",
      borderRight: "1px solid var(--zenith-border-subtle)",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: "var(--zenith-accent)",
    },
    ".cm-line": { padding: "0 4px" },
    ".cm-focused": { outline: "none" },
    ".cm-line.cm-md-codeblock": {
      backgroundColor: "var(--zenith-code-bg)",
      paddingLeft: "24px",
      paddingRight: "24px",
      marginLeft: "-24px",
      marginRight: "-24px",
      fontFamily: "var(--zenith-code-font)",
      fontSize: "0.9em",
      lineHeight: "1.6",
    },
    ".cm-line.cm-md-blockquote": {
      borderLeft: "3px solid var(--zenith-blockquote-border)",
      paddingLeft: "12px",
      color: "var(--zenith-blockquote-text)",
    },
    ".cm-line.cm-table-header": {
      fontWeight: "600",
      backgroundColor: "rgba(var(--zenith-accent-rgb), 0.05)",
      color: "var(--zenith-text)",
    },
    ".cm-line.cm-table-delimiter": {
      color: "var(--zenith-text-dim)",
      height: "4px",
      overflow: "hidden",
      lineHeight: "0.3",
    },
    ".cm-line.cm-table-row": { color: "var(--zenith-text)" },
    ".cm-task-marker": { color: "var(--zenith-accent)" },
    ".cm-mark": { color: "var(--zenith-text-syntax)" },
    ".cm-link-text": { color: "var(--zenith-accent)" },
    ".cm-link-open-icon": { color: "var(--zenith-accent)" },
    ".cm-md-highlight": {
      backgroundColor: "var(--zenith-bg-highlight)",
      borderRadius: "2px",
    },
    ".cm-footnote-ref": {
      color: "var(--zenith-accent)",
      fontSize: "0.75em",
      fontWeight: "600",
    },
    ".cm-footnote-def": {
      color: "var(--zenith-text-muted)",
      fontSize: "0.9em",
    },
    ".cm-math-block": { padding: "12px 0" },
    ".cm-frontmatter-line": {
      fontFamily: "var(--zenith-code-font)",
      fontSize: "0.85em",
      color: "var(--zenith-frontmatter-text)",
    },
    ".cm-html-rendered": { userSelect: "none" },
  },
  { dark: true },
);

const lightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--zenith-bg)",
      color: "var(--zenith-text)",
    },
    ".cm-content": { caretColor: "var(--zenith-accent)" },
    ".cm-cursor": { borderLeftColor: "var(--zenith-accent)" },
    ".cm-gutters": {
      backgroundColor: "var(--zenith-gutter-bg)",
      color: "var(--zenith-gutter-text)",
      borderRight: "1px solid var(--zenith-border-subtle)",
    },
    ".cm-focused": { outline: "none" },
    ".cm-line.cm-md-blockquote": {
      borderLeft: "3px solid var(--zenith-blockquote-border)",
      paddingLeft: "12px",
      color: "var(--zenith-blockquote-text)",
    },
    ".cm-line.cm-table-header": {
      fontWeight: "600",
      backgroundColor: "rgba(var(--zenith-accent-rgb), 0.08)",
    },
    ".cm-line.cm-table-delimiter": {
      color: "var(--zenith-text-dim)",
      height: "4px",
      overflow: "hidden",
      lineHeight: "0.3",
    },
    ".cm-line.cm-table-row": { color: "var(--zenith-text)" },
  },
  { dark: false },
);
