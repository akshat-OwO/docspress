import { describe, expect, it } from "vitest";
import { renderMarkdownSource, stripMdxOnlySyntax } from "@src/plugin/markdown";

describe("stripMdxOnlySyntax", () => {
  it("drops YAML frontmatter", () => {
    const stripped = stripMdxOnlySyntax(`---
title: Hi
---

# Hello`);
    expect(stripped).not.toContain("title:");
    expect(stripped).toContain("# Hello");
  });

  it("removes standalone import/export lines", () => {
    const stripped = stripMdxOnlySyntax(`import X from "./x"\nexport const a = 1\n\n# Hi`);
    expect(stripped).not.toMatch(/import\s/);
    expect(stripped).not.toMatch(/^\s*export\s/u);
    expect(stripped).toContain("# Hi");
  });
});

describe("renderMarkdownSource", () => {
  it("renders markdown after stripping MDX-ish lines", async () => {
    const html = await renderMarkdownSource("# Title\n\nParagraph.");
    expect(html.toLowerCase()).toContain("<h1");
    expect(html).toContain("Title");
    expect(html).toContain("Paragraph");
  });
});
