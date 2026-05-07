import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveDocspressOptions } from "@src/plugin/options";
import {
  createRoute,
  createRouteId,
  isDocsFile,
  isSidebarFile,
  scanRoutes,
} from "@src/plugin/routes";

describe("createRouteId", () => {
  it("slugifies path segments", () => {
    expect(createRouteId("guide/getting-started.mdx")).toBe("guide-getting-started");
  });
});

describe("createRoute", () => {
  const opts = resolveDocspressOptions({ basePath: "/docs", docsDir: "pages" });

  it("builds a file route from an mdx path", () => {
    const docsRoot = path.join(os.tmpdir(), "docpress-docs-root-create");
    const file = path.join(docsRoot, "intro.mdx");
    const route = createRoute(file, docsRoot, opts);
    expect(route).toMatchObject({
      path: "/docs/intro",
      file: "/intro.mdx",
    });
    expect(route?.importPath).toContain("/@fs/");
  });

  it("maps $param segments to :param paths", () => {
    const docsRoot = path.join(os.tmpdir(), "docpress-docs-root-param");
    const file = path.join(docsRoot, "$slug.mdx");
    const route = createRoute(file, docsRoot, opts);
    expect(route?.path).toBe("/docs/:slug");
    expect(route?.params).toEqual(["slug"]);
  });
});

describe("scanRoutes", () => {
  const roots: string[] = [];

  afterEach(async () => {
    for (const dir of roots.splice(0)) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("returns sorted routes for mdx files under docsDir", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "docspress-route-"));
    roots.push(tmp);
    const docsRel = "my-docs";
    const docsAbs = path.join(tmp, docsRel);
    await fs.mkdir(path.join(docsAbs, "z-page"), { recursive: true });
    await fs.writeFile(path.join(docsAbs, "z-page", "index.mdx"), "# Z", "utf8");
    await fs.writeFile(path.join(docsAbs, "a.mdx"), "# A", "utf8");

    const options = resolveDocspressOptions({ docsDir: docsRel, basePath: "/" });
    const routes = await scanRoutes(tmp, options);

    expect(routes.map((r) => r.path)).toEqual(["/a", "/z-page"]);
  });
});

describe("isDocsFile / isSidebarFile", () => {
  it("identifies mdx under docs root", () => {
    const root = path.join(os.tmpdir(), "docspress-isdocs");
    const docsDir = "src/pages";
    expect(isDocsFile(path.join(root, docsDir, "x.mdx"), root, docsDir)).toBe(true);
    expect(isDocsFile(path.join(root, "other.mdx"), root, docsDir)).toBe(false);
  });

  it("identifies sidebar file", () => {
    const root = path.join(os.tmpdir(), "docspress-sidebar");
    const docsDir = "src/pages";
    expect(isSidebarFile(path.join(root, docsDir, "sidebar.ts"), root, docsDir)).toBe(true);
    expect(isSidebarFile(path.join(root, docsDir, "other.ts"), root, docsDir)).toBe(false);
  });
});
