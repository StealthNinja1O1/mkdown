import { EditorView, keymap, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection, highlightSpecialChars } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { getCoreExtensions, selectionToolbar } from "./extensions";
import { getRendererExtensions } from "./renderers";
import { getEditorTheme } from "./theme/editor-theme";
import { getZenithHighlightStyle, getEmphasisOverride } from "./theme/highlight-style";
import { createDynamicHighlighter, defaultHighlightRules } from "./dynamic-highlight";
import { builtinThemes } from "./theme/themes";
import type { ZenithEditorOptions, ZenithThemeConfig, EditorTheme, ZenithFeatures, DynamicHighlightRule } from "./types";

/**
 * Resolve an EditorTheme to a primitive "dark" | "light" value.
 */
function toPrimitiveTheme(theme: EditorTheme | undefined): "dark" | "light" {
  if (theme === undefined) return "dark";
  if (typeof theme === "string") {
    const lightNames = ["light", "zenith-light", "catppuccin-latte", "gruvbox-material-light"];
    return lightNames.includes(theme) ? "light" : "dark";
  }
  return "dark";
}

/**
 * Resolve theme + overrides into CSS custom properties to apply to the container.
 */
export function resolveThemeCSS(
  theme: EditorTheme | undefined,
  overrides: ZenithThemeConfig | undefined,
): { cssClass: string; vars: Record<string, string>; primitive: "dark" | "light" } {
  let config: ZenithThemeConfig = {};
  let primitive: "dark" | "light" = "dark";

  if (theme === undefined) {
    config = overrides ?? {};
    primitive = "dark";
  } else if (typeof theme === "string") {
    if (theme in builtinThemes) {
      config = { ...builtinThemes[theme] };
    }
    const isLight = theme === "light" || theme === "zenith-light" || theme === "catppuccin-latte" || theme === "gruvbox-material-light";
    primitive = isLight ? "light" : "dark";
  } else {
    config = { ...theme };
    const bg = config.bg;
    if (bg) {
      const hex = bg.replace(/^#/, "");
      if (hex.length === 3 || hex.length === 6) {
        const full = hex.length === 3
          ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
          : hex;
        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);
        if ((r * 299 + g * 587 + b * 114) / 1000 > 128) {
          primitive = "light";
        }
      }
    }
  }

  if (overrides) Object.assign(config, overrides);

  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    if (value == null) continue;
    const varName = key.startsWith("--") ? key : `--zenith-${key}`;
    vars[varName] = value;
  }

  const cssClass = primitive === "light" ? "zenith-md-light" : "zenith-md-dark";

  return { cssClass, vars, primitive };
}

// Compartments for dynamic reconfiguration
const dynamicHighlightCompartment = new Compartment();
const toolbarCompartment = new Compartment();
export const themeCompartment = new Compartment();
export const highlightStyleCompartment = new Compartment();
export const emphasisCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

export interface ZenithEditorInstance {
  view: EditorView;
  themeCompartment: Compartment;
  /** Apply a new theme to the editor without rebuilding state */
  setTheme: (theme: EditorTheme, overrides?: ZenithThemeConfig) => void;
  /** Update dynamic highlight rules at runtime */
  setHighlightRules: (rules: DynamicHighlightRule[]) => void;
  /** Toggle selection toolbar on/off */
  setSelectionToolbar: (enabled: boolean) => void;
  /** Destroy the editor */
  destroy: () => void;
}

/**
 * Create a ZenithMD editor instance — plain TypeScript, no React.
 *
 * This replaces the useCodeMirror hook. It creates a CodeMirror 6 EditorView
 * with all Zenith extensions (core, renderers, theme, dynamic highlighting).
 *
 * @param parent DOM element to mount the editor into
 * @param options Editor configuration
 * @returns Editor instance with control methods
 */
export function createEditor(
  parent: HTMLElement,
  options: ZenithEditorOptions = {},
): ZenithEditorInstance {
  const {
    initialContent = "",
    onChange,
    dynamicHighlightRules,
    readOnly = false,
    theme = "dark",
    themeOverrides,
    placeholder,
    features: _features,
    extensions: extraExtensions = [],
  } = options;

  const features: ZenithFeatures = {
    math: true,
    footnotes: true,
    highlight: true,
    images: true,
    tasks: true,
    html: true,
    frontmatter: true,
    tables: true,
    codeFolding: true,
    selectionToolbar: true,
    ..._features,
  };

  const highlightRules = dynamicHighlightRules ?? defaultHighlightRules;
  const primitive = toPrimitiveTheme(theme);

  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      // Core markdown support
      ...getCoreExtensions(features),

      // Inline renderers (Obsidian-like hide-when-not-selected)
      ...getRendererExtensions(features),

      // Dynamic highlighting in a compartment
      dynamicHighlightCompartment.of(createDynamicHighlighter(highlightRules)),

      // Selection toolbar in a compartment (can be toggled at runtime)
      toolbarCompartment.of(features.selectionToolbar !== false ? selectionToolbar() : []),

      // Theme in a compartment
      themeCompartment.of(getEditorTheme(primitive)),

      // Re-apply Zenith highlight style AFTER theme compartment to override
      // any bundled syntax highlighting from legacy themes (@fsegurai)
      highlightStyleCompartment.of(getZenithHighlightStyle()),

      // Force emphasis/strikethrough to inherit color so the dynamic
      // highlighter's inline style propagates down to the text
      emphasisCompartment.of(getEmphasisOverride()),

      // Read-only in a compartment
      readOnlyCompartment.of(readOnly ? EditorState.readOnly.of(true) : []),

      // Standard editor features
      history(),
      EditorView.lineWrapping,
      highlightActiveLine(),
      highlightActiveLineGutter(),
      drawSelection(),
      rectangularSelection(),
      highlightSpecialChars(),
      highlightSelectionMatches(),
      closeBrackets(),

      // Placeholder
      placeholder
        ? EditorView.contentAttributes.of({ "data-placeholder": placeholder })
        : [],

      // Keymaps
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),

      // Content change callback
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          onChange(update.state.doc.toString());
        }
      }),

      // Extra extensions from caller
      ...extraExtensions,
    ],
  });

  const view = new EditorView({
    state,
    parent,
  });

  // Apply CSS variables from theme to the parent container
  const { vars, cssClass } = resolveThemeCSS(theme, themeOverrides);
  parent.classList.add("zenith-md-editor", cssClass);
  for (const [key, value] of Object.entries(vars)) {
    parent.style.setProperty(key, value);
  }

  return {
    view,
    themeCompartment,
    setTheme(newTheme: EditorTheme, overrides?: ZenithThemeConfig) {
      const { vars: newVars, cssClass: newCssClass, primitive: newPrimitive } = resolveThemeCSS(newTheme, overrides);

      // Update CSS vars on container
      parent.classList.remove("zenith-md-dark", "zenith-md-light");
      parent.classList.add(newCssClass);
      for (const [key, value] of Object.entries(newVars)) {
        parent.style.setProperty(key, value);
      }

      // Reconfigure CM6 theme compartment + re-apply Zenith highlight style
      // to override any bundled syntax colors from legacy themes
      view.dispatch({
        effects: [
          themeCompartment.reconfigure(getEditorTheme(newPrimitive)),
          highlightStyleCompartment.reconfigure(getZenithHighlightStyle()),
          emphasisCompartment.reconfigure(getEmphasisOverride()),
        ],
      });
    },
    setHighlightRules(rules: DynamicHighlightRule[]) {
      view.dispatch({
        effects: dynamicHighlightCompartment.reconfigure(
          rules.length > 0 ? createDynamicHighlighter(rules) : [],
        ),
      });
    },
    setSelectionToolbar(enabled: boolean) {
      view.dispatch({
        effects: toolbarCompartment.reconfigure(
          enabled ? selectionToolbar() : [],
        ),
      });
    },
    destroy() {
      view.destroy();
    },
  };
}
