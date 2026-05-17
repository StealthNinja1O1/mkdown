import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { indentUnit } from "@codemirror/language";
import { getZenithHighlightStyle } from "../theme/highlight-style";

export function getMarkdownSetup(): ReturnType<typeof markdown> {
  return markdown({
    base: markdownLanguage,
    codeLanguages: languages,
  });
}

export function getMarkdownHighlighting() {
  return getZenithHighlightStyle();
}

export function getIndentConfig() {
  return indentUnit.of("  ");
}
