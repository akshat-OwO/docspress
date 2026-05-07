import { describe, expect, it } from "vitest";
import { normalizeSlashes, resolveDocspressOptions } from "@src/plugin/options";

describe("normalizeSlashes", () => {
  it("converts backslashes to forward slashes", () => {
    expect(normalizeSlashes("src\\pages")).toBe("src/pages");
  });
});

describe("resolveDocspressOptions", () => {
  it("applies defaults", () => {
    const o = resolveDocspressOptions({});
    expect(o.docsDir).toBe("src/pages");
    expect(o.basePath).toBe("/");
    expect(o.framework).toBe("react");
    expect(o.indexToken).toBe("index");
    expect(o.routeToken).toBe("route");
    expect(o.title).toBe("Docspress");
  });

  it("respects overrides", () => {
    const o = resolveDocspressOptions({
      docsDir: "content",
      basePath: "/help/",
      framework: "vanilla",
      title: "T",
    });
    expect(o.docsDir).toBe("content");
    expect(o.basePath).toBe("/help");
    expect(o.framework).toBe("vanilla");
    expect(o.title).toBe("T");
  });
});
