// ZenithMD types — adapted for VS Code webview (no React)
// Ported from Inspiration/ZenithMDEditor/types.ts

import type { Extension } from "@codemirror/state";

// ─── Shared generic type ─────────────────────────────────────────

/** A generic range with an associated value, used by decoration builders */
export type Range<T> = { from: number; to: number; value: T };

// ─── Token names ────────────────────────────────────────────────

export type ZenithTokenName =
  | "accent"
  | "accent-rgb"
  | "bg"
  | "bg-surface"
  | "bg-code"
  | "bg-highlight"
  | "bg-active-line"
  | "bg-selection"
  | "text"
  | "text-muted"
  | "text-dim"
  | "text-syntax"
  | "border"
  | "border-subtle"
  | "blockquote-border"
  | "blockquote-text"
  | "code-lang-color"
  | "code-font"
  | "frontmatter-text"
  | "frontmatter-delim"
  | "footnote-text"
  | "footnote-bg"
  | "footnote-def-border"
  | "footnote-tooltip-bg"
  | "footnote-tooltip-text"
  | "footnote-tooltip-border"
  | "scrollbar-thumb"
  | "scrollbar-thumb-hover"
  | "gutter-bg"
  | "gutter-text"
  | "font"
  | "font-size"
  | "line-height"
  | "content-max-width"
  | "content-padding"
  | "heading1-size"
  | "heading2-size"
  | "heading3-size"
  | "heading4-size"
  | "heading5-size"
  | "heading6-size"
  | "heading1-margin"
  | "heading2-margin"
  | "heading3-margin"
  | "heading4-margin"
  | "heading5-margin"
  | "heading6-margin"
  | "heading-color"
  | "heading6-color"
  | "strong-color"
  | "emphasis-color"
  | "strikethrough-color"
  | "link-color"
  | "url-color"
  | "inline-code-color"
  | "inline-code-bg"
  | "quote-color"
  | "meta-color"
  | "syn-keyword"
  | "syn-string"
  | "syn-number"
  | "syn-bool"
  | "syn-comment"
  | "syn-function"
  | "syn-variable"
  | "syn-type"
  | "syn-operator"
  | "syn-punctuation"
  | "syn-tag"
  | "syn-attribute"
  | "syn-escape"
  | "syn-deleted"
  | "syn-inserted"
  | "syn-changed"
  | "syn-content";

export type ZenithThemeConfig = Partial<Record<ZenithTokenName, string>>;

export type BuiltinThemeName =
  | "dark"
  | "light"
  | "zenith-dark"
  | "zenith-light"
  | "catppuccin-mocha"
  | "catppuccin-macchiato"
  | "catppuccin-frappe"
  | "catppuccin-latte"
  | "gruvbox-material-dark"
  | "gruvbox-material-light";

export type EditorTheme = BuiltinThemeName | ZenithThemeConfig;

// ─── Dynamic highlighting ───────────────────────────────────────

export interface DynamicHighlightRule {
  pattern: RegExp;
  className?: string;
  color?: string;
  backgroundColor?: string;
  label?: string;
}

// ─── Editor options (replaces ZenithMDEditorProps) ──────────────

export interface ZenithEditorOptions {
  initialContent?: string;
  onChange?: (text: string) => void;
  theme?: EditorTheme;
  themeOverrides?: ZenithThemeConfig;
  dynamicHighlightRules?: DynamicHighlightRule[];
  readOnly?: boolean;
  placeholder?: string;
  /** Feature flags for individual renderers */
  features?: ZenithFeatures;
  /** Extra CM6 extensions */
  extensions?: Extension[];
}

export interface ZenithFeatures {
  math?: boolean;
  footnotes?: boolean;
  highlight?: boolean;
  images?: boolean;
  tasks?: boolean;
  html?: boolean;
  frontmatter?: boolean;
  tables?: boolean;
  codeFolding?: boolean;
  selectionToolbar?: boolean;
}

// Re-export from create-editor
export type { ZenithEditorInstance } from "./create-editor";
