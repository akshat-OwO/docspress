import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ResolvedDocspressOptions } from "@src/plugin/options";
import {
  createConfigModule,
  createHtmlRoutesModule,
  createReactRoutesModule,
  createSidebarModule,
} from "@src/plugin/virtual-modules";
import type { FileRoute } from "@src/plugin/routes";

function resolved(overrides: Partial<ResolvedDocspressOptions> = {}): ResolvedDocspressOptions {
  return {
    docsDir: "docs",
    basePath: "/",
    framework: "react",
    indexToken: "index",
    routeToken: "route",
    title: "Doc Site",
    ...overrides,
  };
}

describe("createConfigModule", () => {
  it("exports serialized basePath and title", () => {
    const code = createConfigModule(resolved({ basePath: "/help", title: "Manual" }));
    expect(code).toContain("export const config");
    expect(code).toContain("/help");
    expect(code).toContain("Manual");
  });
});

describe("createReactRoutesModule", () => {
  it("generates lazy import loaders", () => {
    const route: FileRoute = {
      id: "page-guide",
      path: "/guide",
      file: "/guide.mdx",
      absoluteFile: "/abs/guide.mdx",
      importPath: "/@fs/abs/guide.mdx",
      params: [],
      score: 20,
    };
    const code = createReactRoutesModule([route]);
    expect(code).toContain("/@fs/abs/guide.mdx");
    expect(code).not.toMatch(/virtual:docspress/);
    expect(code).toContain("/guide");
  });
});

describe("createHtmlRoutesModule", () => {
  const roots: string[] = [];

  afterEach(async () => {
    for (const dir of roots.splice(0)) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("embeds rendered html per route", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "docspress-vm-"));
    roots.push(tmp);
    const docs = path.join(tmp, "pages");
    await fs.mkdir(docs);
    const mdx = path.join(docs, "a.mdx");
    await fs.writeFile(mdx, "# Hello from tests", "utf8");

    const route: FileRoute = {
      id: "a",
      path: "/a",
      file: "/a.mdx",
      absoluteFile: mdx,
      importPath: "/@fs/ignored",
      params: [],
      score: 10,
    };

    const code = await createHtmlRoutesModule([route]);
    expect(code).toContain("routeData");
    expect(code.toLowerCase()).toContain("<h1");
    expect(code).toContain("Hello from tests");
  });
});

describe("createSidebarModule", () => {
  const roots: string[] = [];

  afterEach(async () => {
    for (const dir of roots.splice(0)) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("returns undefined sidebar when sidebar.ts is missing", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "docspress-side-"));
    roots.push(root);
    await fs.mkdir(path.join(root, "docs"));

    const code = await createSidebarModule(root, resolved({ docsDir: "docs" }));
    expect(code).toContain("sidebar = undefined");
  });

  it("imports sidebar when sidebar.ts exists", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "docspress-side2-"));
    roots.push(root);
    const docs = path.join(root, "pages");
    await fs.mkdir(docs);
    await fs.writeFile(path.join(docs, "sidebar.ts"), "export default {}; export {};\n", "utf8");

    const code = await createSidebarModule(root, resolved({ docsDir: "pages" }));
    expect(code).toContain("import sidebar");
    expect(code).toContain("/@fs/");
  });
});
