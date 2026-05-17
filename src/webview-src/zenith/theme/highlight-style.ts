import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

const zenithHighlight = HighlightStyle.define([
  // Markdown: Heading sizes
  { tag: tags.heading1, fontSize: "2em", fontWeight: "700", lineHeight: "1.3", color: "var(--zenith-heading-color)" },
  { tag: tags.heading2, fontSize: "1.8em", fontWeight: "700", lineHeight: "1.3", color: "var(--zenith-heading-color)" },
  { tag: tags.heading3, fontSize: "1.5em", fontWeight: "600", lineHeight: "1.4", color: "var(--zenith-heading-color)" },
  { tag: tags.heading4, fontSize: "1.3em", fontWeight: "600", lineHeight: "1.4", color: "var(--zenith-heading-color)" },
  { tag: tags.heading5, fontSize: "1.1em", fontWeight: "600", lineHeight: "1.4", color: "var(--zenith-heading-color)" },
  { tag: tags.heading6, fontSize: "1em", fontWeight: "600", lineHeight: "1.5", color: "var(--zenith-heading6-color)" },

  // Markdown: Emphasis (no color — dynamic highlighter controls color via inline styles)
  { tag: tags.strong, fontWeight: "700", color: "var(--zenith-strong-color)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--zenith-strikethrough-color)" },

  // Markdown: Links
  { tag: tags.link, color: "var(--zenith-link-color)", textDecoration: "none" },
  { tag: tags.url, color: "var(--zenith-url-color)" },

  // Markdown: Code
  { tag: tags.monospace, fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", backgroundColor: "var(--zenith-inline-code-bg)", color: "var(--zenith-inline-code-color)", borderRadius: "3px", padding: "1px 4px" },

  // Markdown: Quotes
  { tag: tags.quote, color: "var(--zenith-quote-color)" },

  // Markdown: HR
  { tag: tags.contentSeparator, color: "var(--zenith-border)", borderBottom: "1px solid var(--zenith-border)" },

  // Markdown: Meta
  { tag: tags.meta, color: "var(--zenith-meta-color)" },

  // Code: Keywords
  { tag: tags.keyword, color: "var(--zenith-syn-keyword)" },
  { tag: tags.controlKeyword, color: "var(--zenith-syn-keyword)" },
  { tag: tags.definitionKeyword, color: "var(--zenith-syn-keyword)" },
  { tag: tags.moduleKeyword, color: "var(--zenith-syn-keyword)" },

  // Code: Strings
  { tag: tags.string, color: "var(--zenith-syn-string)" },
  { tag: tags.special(tags.string), color: "var(--zenith-syn-string)" },
  { tag: tags.regexp, color: "var(--zenith-syn-string)" },
  { tag: tags.escape, color: "var(--zenith-syn-escape)" },
  { tag: tags.inserted, color: "var(--zenith-syn-inserted)" },

  // Code: Numbers & Constants
  { tag: tags.number, color: "var(--zenith-syn-number)" },
  { tag: tags.integer, color: "var(--zenith-syn-number)" },
  { tag: tags.bool, color: "var(--zenith-syn-bool)" },
  { tag: tags.null, color: "var(--zenith-syn-bool)" },
  { tag: tags.unit, color: "var(--zenith-syn-number)" },

  // Code: Comments
  { tag: tags.comment, color: "var(--zenith-syn-comment)", fontStyle: "italic" },
  { tag: tags.lineComment, color: "var(--zenith-syn-comment)", fontStyle: "italic" },
  { tag: tags.blockComment, color: "var(--zenith-syn-comment)", fontStyle: "italic" },
  { tag: tags.docComment, color: "var(--zenith-syn-comment)", fontStyle: "italic" },

  // Code: Functions & Variables
  { tag: tags.function(tags.variableName), color: "var(--zenith-syn-function)" },
  { tag: tags.variableName, color: "var(--zenith-syn-variable)" },
  { tag: tags.definition(tags.variableName), color: "var(--zenith-syn-type)" },
  { tag: tags.local(tags.variableName), color: "var(--zenith-syn-variable)" },
  { tag: tags.special(tags.variableName), color: "var(--zenith-syn-type)" },
  { tag: tags.propertyName, color: "var(--zenith-syn-variable)" },
  { tag: tags.definition(tags.propertyName), color: "var(--zenith-syn-type)" },

  // Code: Types & Classes
  { tag: tags.typeName, color: "var(--zenith-syn-type)" },
  { tag: tags.className, color: "var(--zenith-syn-type)" },
  { tag: tags.labelName, color: "var(--zenith-syn-type)" },
  { tag: tags.namespace, color: "var(--zenith-syn-type)" },
  { tag: tags.definition(tags.typeName), color: "var(--zenith-syn-type)" },

  // Code: Operators & Punctuation
  { tag: tags.operator, color: "var(--zenith-syn-operator)" },
  { tag: tags.compareOperator, color: "var(--zenith-syn-operator)" },
  { tag: tags.arithmeticOperator, color: "var(--zenith-syn-operator)" },
  { tag: tags.logicOperator, color: "var(--zenith-syn-operator)" },
  { tag: tags.bitwiseOperator, color: "var(--zenith-syn-operator)" },
  { tag: tags.punctuation, color: "var(--zenith-syn-punctuation)" },
  { tag: tags.bracket, color: "var(--zenith-syn-punctuation)" },
  { tag: tags.angleBracket, color: "var(--zenith-syn-punctuation)" },
  { tag: tags.separator, color: "var(--zenith-meta-color)" },

  // Code: Tags & Attributes (HTML/JSX)
  { tag: tags.tagName, color: "var(--zenith-syn-tag)" },
  { tag: tags.attributeName, color: "var(--zenith-syn-attribute)" },
  { tag: tags.attributeValue, color: "var(--zenith-syn-string)" },

  // Code: Misc
  { tag: tags.atom, color: "var(--zenith-syn-number)" },
  { tag: tags.content, color: "var(--zenith-syn-content)" },
  { tag: tags.contentSeparator, color: "var(--zenith-border)" },
  { tag: tags.list, color: "var(--zenith-syn-variable)" },
  { tag: tags.processingInstruction, color: "var(--zenith-meta-color)" },
  { tag: tags.invalid, color: "var(--zenith-syn-deleted)", borderBottom: "1px solid var(--zenith-syn-deleted)" },
  { tag: tags.deleted, color: "var(--zenith-syn-deleted)", textDecoration: "line-through" },
  { tag: tags.changed, color: "var(--zenith-syn-changed)" },
  { tag: tags.color, color: "var(--zenith-syn-number)" },
]);

export function getZenithHighlightStyle(): Extension {
  return syntaxHighlighting(zenithHighlight, { fallback: true });
}

/**
 * Non-fallback emphasis override that forces emphasis/strikethrough to
 * inherit color from their parent element. This ensures the dynamic
 * highlighter's inline `style="color: … !important"` on a wrapper span
 * actually propagates to the emphasized text, instead of being overridden
 * by a HighlightStyle CSS class on the inner element.
 *
 * Placed AFTER the theme compartment so it always wins.
 */
const emphasisOverride = HighlightStyle.define([
  { tag: tags.emphasis, fontStyle: "italic", color: "inherit" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "inherit" },
]);

export function getEmphasisOverride(): Extension {
  return syntaxHighlighting(emphasisOverride);
}
