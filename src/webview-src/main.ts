import { createEditor, builtinThemes, themeCompartment, highlightStyleCompartment, emphasisCompartment, getZenithHighlightStyle, getEmphasisOverride, type ZenithEditorInstance } from "./zenith";

import {
  abcdef,
  abcdefMergeStyles,
  applyMergeRevertStyles,
  abyss,
  abyssMergeStyles,
  androidStudio,
  androidStudioMergeStyles,
  andromeda,
  andromedaMergeStyles,
  basicDark,
  basicDarkMergeStyles,
  basicLight,
  basicLightMergeStyles,
  catppuccinMocha,
  catppuccinMochaMergeStyles,
  cobalt2,
  cobalt2MergeStyles,
  forest,
  forestMergeStyles,
  githubDark,
  githubDarkMergeStyles,
  githubLight,
  githubLightMergeStyles,
  gruvboxDark,
  gruvboxDarkMergeStyles,
  gruvboxLight,
  gruvboxLightMergeStyles,
  highContrastDark,
  highContrastDarkMergeStyles,
  highContrastLight,
  highContrastLightMergeStyles,
  materialDark,
  materialDarkMergeStyles,
  materialLight,
  materialLightMergeStyles,
  monokai,
  monokaiMergeStyles,
  nord,
  nordMergeStyles,
  palenight,
  palenightMergeStyles,
  solarizedDark,
  solarizedDarkMergeStyles,
  solarizedLight,
  solarizedLightMergeStyles,
  synthwave84,
  synthwave84MergeStyles,
  tokyoNightDay,
  tokyoNightDayMergeStyles,
  tokyoNightStorm,
  tokyoNightStormMergeStyles,
  volcano,
  volcanoMergeStyles,
  vsCodeDark,
  vsCodeDarkMergeStyles,
  vsCodeLight,
  vsCodeLightMergeStyles,
} from "@fsegurai/codemirror-theme-bundle";

declare const acquireVsCodeApi: () => { postMessage(message: any): void };
const vscode = acquireVsCodeApi();
let isUpdatingFromExtension = false;

// ── Legacy @fsegurai theme map (kept for backward compat) ────────

const legacyThemeMap: { [key: string]: any } = {
  abcdef, abcdefMergeStyles, applyMergeRevertStyles,
  abyss, abyssMergeStyles, androidStudio, androidStudioMergeStyles,
  andromeda, andromedaMergeStyles, basicDark, basicDarkMergeStyles,
  basicLight, basicLightMergeStyles, catppuccinMocha, catppuccinMochaMergeStyles,
  cobalt2, cobalt2MergeStyles, forest, forestMergeStyles,
  githubDark, githubDarkMergeStyles, githubLight, githubLightMergeStyles,
  gruvboxDark, gruvboxDarkMergeStyles, gruvboxLight, gruvboxLightMergeStyles,
  highContrastDark, highContrastDarkMergeStyles, highContrastLight, highContrastLightMergeStyles,
  materialDark, materialDarkMergeStyles, materialLight, materialLightMergeStyles,
  monokai, monokaiMergeStyles, nord, nordMergeStyles,
  palenight, palenightMergeStyles, solarizedDark, solarizedDarkMergeStyles,
  solarizedLight, solarizedLightMergeStyles, synthwave84, synthwave84MergeStyles,
  tokyoNightDay, tokyoNightDayMergeStyles, tokyoNightStorm, tokyoNightStormMergeStyles,
  volcano, volcanoMergeStyles, vsCodeDark, vsCodeDarkMergeStyles,
  vsCodeLight, vsCodeLightMergeStyles,
};

function isZenithTheme(name: string): boolean {
  return name in builtinThemes;
}

// ── Detect VS Code theme kind ────────────────────────────────────

function getVSCodeThemeKind(): "dark" | "light" {
  const body = document.body as HTMLElement;
  const kind = body?.dataset?.vscodeThemeKind;
  if (kind === "vscode-light") return "light";
  return "dark";
}

// ── Create the editor ────────────────────────────────────────────

let editorInstance: ZenithEditorInstance | null = null;
const editorContainer = document.querySelector("#editor") as HTMLElement;

if (editorContainer) {
  // Apply default layout class
  editorContainer.classList.add("layout-obsidian");

  editorInstance = createEditor(editorContainer, {
    onChange(text) {
      if (!isUpdatingFromExtension) {
        vscode.postMessage({ type: "edit", text });
      }
    },
    theme: getVSCodeThemeKind() === "dark" ? "dark" : "light",
  });
}

// ── Apply theme ──────────────────────────────────────────────────

function applyTheme(themeName: string) {
  if (!editorInstance) return;

  if (isZenithTheme(themeName)) {
    // Zenith built-in theme — use the Zenith engine with CSS vars
    editorInstance.setTheme(themeName as any);
  } else {
    // Legacy @fsegurai theme — use CM6 compartment directly
    const themeExt = legacyThemeMap[themeName];
    if (themeExt) {
      const isLight = themeName.toLowerCase().includes("light");
      editorInstance.setTheme(isLight ? "light" : "dark");

      // Apply the @fsegurai theme extension via compartment, then re-apply Zenith
      // highlight style + emphasis override to strip bundled syntax highlighting
      const view = editorInstance.view;
      view.dispatch({
        effects: [
          themeCompartment.reconfigure(themeExt),
          highlightStyleCompartment.reconfigure(getZenithHighlightStyle()),
          emphasisCompartment.reconfigure(getEmphasisOverride()),
        ],
      });
    }
  }
}

// ── Apply config ─────────────────────────────────────────────────

function applyConfig(config: any) {
  if (!editorInstance) return;

  // Theme
  if (config.theme) {
    applyTheme(config.theme);
  }

  // Font size
  if (config.fontSize) {
    editorContainer.style.setProperty("--zenith-font-size", `${config.fontSize}px`);
  }

  // Font family
  if (config.fontFamily) {
    editorContainer.style.setProperty("--zenith-font", config.fontFamily);
  }

  // Layout alignment
  if (config.alignment) {
    editorContainer.classList.remove("layout-obsidian", "layout-left", "layout-center");
    editorContainer.classList.add(`layout-${config.alignment}`);
  }

  // Dynamic highlighting
  if (!config.highlightEnabled) {
    editorInstance.setHighlightRules([]);
  } else if (config.highlightRules && Array.isArray(config.highlightRules)) {
    const rules = config.highlightRules.map((r: any) => ({
      pattern: new RegExp(r.pattern, "g"),
      color: r.color || "#f97316",
      label: r.label,
    }));
    editorInstance.setHighlightRules(rules);
  }

  // Selection toolbar
  if (config.selectionToolbar !== undefined) {
    editorInstance.setSelectionToolbar(config.selectionToolbar);
  }
}

// ── Message handlers ─────────────────────────────────────────────

window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.type) {
    case "update": {
      if (!editorInstance) return;
      const newText = message.text;
      const currentText = editorInstance.view.state.doc.toString();
      if (newText !== currentText) {
        isUpdatingFromExtension = true;
        editorInstance.view.dispatch({
          changes: {
            from: 0,
            to: editorInstance.view.state.doc.length,
            insert: newText,
          },
        });
        isUpdatingFromExtension = false;
      }
      break;
    }

    case "update-config": {
      applyConfig(message.config);
      break;
    }
  }
});
