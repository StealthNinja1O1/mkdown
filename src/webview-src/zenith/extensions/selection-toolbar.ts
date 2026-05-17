/**
 * Selection Toolbar — floating formatting toolbar on text selection.
 * Ported from Inspiration/ZenithMDEditor/selection-toolbar.ts
 */

import {
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  type PluginValue,
  keymap,
} from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";

// ─── SVG Icons (16px, stroke-based) ──────────────────────────────

const ICONS: Record<string, string> = {
  bold: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  strikethrough: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-3 3c0 1.5 1 2.5 2.5 3"/><line x1="4" y1="12" x2="20" y2="12"/><path d="M15 12c2 1 3 2.5 3 4a3 3 0 0 1-3 3H8"/></svg>`,
  highlight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>`,
  code: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  link: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
};

// ─── Formatting helpers ──────────────────────────────────────────

function toggleWrap(view: EditorView, before: string, after: string): boolean {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);

  if (from === to) {
    const placeholder = "text";
    view.dispatch({
      changes: { from, to, insert: `${before}${placeholder}${after}` },
      selection: EditorSelection.create([
        EditorSelection.range(from + before.length, from + before.length + placeholder.length),
      ]),
    });
    return true;
  }

  const beforeText = view.state.sliceDoc(Math.max(0, from - before.length), from);
  const afterText = view.state.sliceDoc(to, to + after.length);

  if (beforeText === before && afterText === after) {
    view.dispatch({
      changes: [
        { from: to, to: to + after.length, insert: "" },
        { from: from - before.length, to: from, insert: "" },
      ],
      selection: EditorSelection.create([
        EditorSelection.range(from - before.length, to - before.length),
      ]),
    });
    return true;
  }

  view.dispatch({
    changes: [{ from, to, insert: `${before}${selected}${after}` }],
    selection: EditorSelection.create([
      EditorSelection.range(from + before.length, to + before.length),
    ]),
  });
  return true;
}

function applyAction(view: EditorView, action: string): boolean {
  switch (action) {
    case "bold":
      return toggleWrap(view, "**", "**");
    case "italic":
      return toggleWrap(view, "*", "*");
    case "strikethrough":
      return toggleWrap(view, "~~", "~~");
    case "highlight":
      return toggleWrap(view, "==", "==");
    case "code":
      return toggleWrap(view, "`", "`");
    case "link": {
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      if (from === to) {
        view.dispatch({
          changes: { from, to, insert: "[link text](url)" },
          selection: EditorSelection.create([
            EditorSelection.range(from + 1, from + 10),
          ]),
        });
      } else {
        view.dispatch({
          changes: { from, to, insert: `[${selected}](url)` },
          selection: EditorSelection.create([
            EditorSelection.range(to + 3, to + 6),
          ]),
        });
      }
      return true;
    }
    default:
      return false;
  }
}

// ─── Toolbar DOM ─────────────────────────────────────────────────

let toolbarEl: HTMLDivElement | null = null;
let currentView: EditorView | null = null;
let rafId: number | null = null;

function getOrCreateToolbar(): HTMLDivElement {
  if (toolbarEl && toolbarEl.isConnected) return toolbarEl;

  toolbarEl = document.createElement("div");
  toolbarEl.className = "cm-selection-toolbar";
  toolbarEl.setAttribute("role", "toolbar");
  toolbarEl.setAttribute("aria-label", "Text formatting");
  toolbarEl.style.display = "none";
  document.body.appendChild(toolbarEl);
  return toolbarEl;
}

function hideToolbar() {
  if (toolbarEl) {
    toolbarEl.style.display = "none";
  }
}

function positionToolbar(view: EditorView) {
  const toolbar = getOrCreateToolbar();
  const sel = view.state.selection.main;
  if (sel.from === sel.to) {
    hideToolbar();
    return;
  }

  const toolbarRect = toolbar.getBoundingClientRect();
  const isForward = sel.anchor <= sel.head;
  const headCoords = view.coordsAtPos(sel.head);
  if (!headCoords) {
    hideToolbar();
    return;
  }

  const anchorCoords = view.coordsAtPos(sel.anchor);
  const leftMost = anchorCoords ? Math.min(anchorCoords.left, headCoords.left) : headCoords.left;
  const rightMost = anchorCoords ? Math.max(anchorCoords.right, headCoords.right) : headCoords.right;
  let left = (leftMost + rightMost) / 2 - toolbarRect.width / 2;

  let top: number;
  if (isForward) {
    top = headCoords.top - toolbarRect.height - 10;
    if (top < 4) top = headCoords.bottom + 10;
  } else {
    top = headCoords.bottom + 10;
    if (top + toolbarRect.height > window.innerHeight - 4) {
      top = headCoords.top - toolbarRect.height - 10;
    }
  }

  left = Math.max(8, Math.min(left, window.innerWidth - toolbarRect.width - 8));

  toolbar.style.position = "fixed";
  toolbar.style.left = `${left}px`;
  toolbar.style.top = `${top}px`;
  toolbar.style.display = "flex";
}

const defaultButtons = [
  { id: "bold", label: "Bold", shortcut: "Ctrl+B", action: "bold" as const, icon: ICONS.bold },
  { id: "italic", label: "Italic", shortcut: "Ctrl+I", action: "italic" as const, icon: ICONS.italic },
  { id: "strikethrough", label: "Strikethrough", action: "strikethrough" as const, icon: ICONS.strikethrough },
  { id: "highlight", label: "Highlight", action: "highlight" as const, icon: ICONS.highlight },
  { id: "code", label: "Inline Code", shortcut: "Ctrl+`", action: "code" as const, icon: ICONS.code },
  { id: "link", label: "Link", shortcut: "Ctrl+K", action: "link" as const, icon: ICONS.link },
];

interface ToolbarButton {
  id: string;
  label: string;
  shortcut?: string;
  action?: string;
  icon?: string;
}

function buildToolbar(view: EditorView, buttons: ToolbarButton[]) {
  const toolbar = getOrCreateToolbar();
  toolbar.innerHTML = "";
  currentView = view;

  for (const btn of buttons) {
    const button = document.createElement("button");
    button.className = "cm-selection-toolbar-btn";
    button.setAttribute("type", "button");
    button.setAttribute("aria-label", btn.label);
    button.title = btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label;

    if (btn.icon) {
      button.innerHTML = btn.icon;
    } else {
      button.textContent = btn.label;
    }

    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.action) applyAction(view, btn.action);
    });

    toolbar.appendChild(button);
  }
}

// ─── Extension ───────────────────────────────────────────────────

export function selectionToolbar(): import("@codemirror/state").Extension {
  return [
    ViewPlugin.fromClass(
      class implements PluginValue {
        private scrollHandler: () => void;
        private scrollRaf: number | null = null;

        constructor(readonly view: EditorView) {
          this.scrollHandler = () => {
            if (this.scrollRaf !== null) cancelAnimationFrame(this.scrollRaf);
            this.scrollRaf = requestAnimationFrame(() => {
              this.scrollRaf = null;
              this.reposition();
            });
          };
          const scroller = view.dom.querySelector(".cm-scroller");
          scroller?.addEventListener("scroll", this.scrollHandler, { passive: true });
        }

        private reposition() {
          const sel = this.view.state.selection.main;
          if (sel.from === sel.to) { hideToolbar(); return; }
          const coords = this.view.coordsAtPos(sel.head);
          if (!coords) { hideToolbar(); return; }
          const scroller = this.view.dom.querySelector(".cm-scroller");
          if (scroller) {
            const sr = scroller.getBoundingClientRect();
            if (coords.bottom < sr.top || coords.top > sr.bottom) {
              hideToolbar(); return;
            }
          }
          const toolbar = getOrCreateToolbar();
          if (toolbar.style.display === "none" || !toolbar.innerHTML) {
            buildToolbar(this.view, defaultButtons);
          }
          positionToolbar(this.view);
        }

        update(update: ViewUpdate) {
          if (update.selectionSet || update.docChanged) {
            const sel = this.view.state.selection.main;
            if (sel.from === sel.to) { hideToolbar(); return; }
            if (!this.view.dom.isConnected) return;

            buildToolbar(this.view, defaultButtons);
            const v = this.view;
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
              rafId = null;
              positionToolbar(v);
            });
          }
        }

        destroy() {
          const scroller = this.view.dom.querySelector(".cm-scroller");
          scroller?.removeEventListener("scroll", this.scrollHandler);
          if (this.scrollRaf !== null) cancelAnimationFrame(this.scrollRaf);
          if (rafId !== null) cancelAnimationFrame(rafId);
          hideToolbar();
        }
      },
    ),
    keymap.of([
      { key: "Mod-b", run: (v) => applyAction(v, "bold") },
      { key: "Mod-i", run: (v) => applyAction(v, "italic") },
      { key: "Mod-k", run: (v) => applyAction(v, "link") },
      { key: "Mod-`", run: (v) => applyAction(v, "code") },
    ]),
  ];
}
