export { createEditor, themeCompartment, highlightStyleCompartment, emphasisCompartment, resolveThemeCSS } from "./create-editor";
export type { ZenithEditorInstance, ZenithEditorOptions, ZenithFeatures, ZenithThemeConfig, EditorTheme, DynamicHighlightRule, BuiltinThemeName } from "./types";
export { builtinThemes, isBuiltinTheme } from "./theme/themes";
export { defaultHighlightRules } from "./dynamic-highlight";
export { getCoreExtensions } from "./extensions";
export { getRendererExtensions } from "./renderers";
export { getEditorTheme } from "./theme/editor-theme";
export { getZenithHighlightStyle, getEmphasisOverride } from "./theme/highlight-style";
