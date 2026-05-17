import type { Extension } from "@codemirror/state";
import type { ZenithFeatures } from "../types";
import { emphasisMarkHider } from "./render-emphasis";
import { headingMarkHider, setextMarkHider, headingLineDecorator } from "./render-headings";
import { linkRenderer } from "./render-links";
import { codeMarkHider } from "./render-code";
import { codeBlockRenderer } from "./render-codeblock";
import { blockquoteRenderer } from "./render-blockquotes";
import { horizontalRuleRenderer } from "./render-horizontal-rules";
import { taskRenderer } from "./render-tasks";
import { listRenderer } from "./render-lists";
import { imageRenderer } from "./render-images";
import { tableRenderer } from "./render-tables";
import { htmlRenderer } from "./render-html";
import { highlightRenderer } from "./render-highlight";
import { footnoteRenderer } from "./render-footnotes";
import { mathRenderer } from "./render-math";
import { frontmatterRenderer } from "./render-frontmatter";

export function getRendererExtensions(features?: ZenithFeatures): Extension[] {
  const f = features ?? {};
  const extensions: Extension[] = [
    // Block-level renderers
    ...(f.frontmatter !== false ? [frontmatterRenderer] : []),
    codeBlockRenderer,
    blockquoteRenderer,
    ...(f.tables !== false ? [tableRenderer] : []),
    ...(f.images !== false ? [imageRenderer] : []),

    // Regex-based renderers
    ...(f.math !== false ? [mathRenderer] : []),
    ...(f.highlight !== false ? [highlightRenderer] : []),
    ...(f.footnotes !== false ? [footnoteRenderer] : []),

    // Inline syntax renderers
    emphasisMarkHider,
    headingMarkHider,
    headingLineDecorator,
    setextMarkHider,
    linkRenderer,
    codeMarkHider,
    horizontalRuleRenderer,
    listRenderer,
    ...(f.tasks !== false ? [taskRenderer] : []),

    // HTML rendering
    ...(f.html !== false ? [htmlRenderer] : []),
  ];

  return extensions;
}
