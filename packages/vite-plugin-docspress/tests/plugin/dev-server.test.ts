import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedDocspressOptions } from "@src/plugin/options";
import { addDocsFallback, addDocsWatcher } from "@src/plugin/dev-server";
import type { ViteDevServer } from "vite";

const opts: ResolvedDocspressOptions = {
  docsDir: "documentation",
  basePath: "/",
  framework: "react",
  indexToken: "index",
  routeToken: "route",
  title: "T",
};

describe("addDocsWatcher", () => {
  it("registers sidebar and mdx glob with vite watcher", () => {
    const add = vi.fn();
    const server = {
      config: { root: path.join("/", "project", "root") },
      watcher: { add },
    };

    addDocsWatcher(server as unknown as ViteDevServer, opts);

    expect(add).toHaveBeenCalledTimes(2);
    const joined = add.mock.calls.map((c) => String(c[0]));
    expect(joined.some((p) => p.includes("documentation") && p.includes(".mdx") && p.includes("**"))).toBe(
      true,
    );
    expect(joined.some((p) => p.endsWith(`documentation${path.sep}sidebar.ts`))).toBe(true);
  });
});

describe("addDocsFallback", () => {
  it("responds with transformed index.html for HTML doc requests", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "docspress-devsrv-"));

    await fs.mkdir(path.join(rootDir, "documentation"));
    await fs.writeFile(path.join(rootDir, "index.html"), "<html><!-- --></html>", "utf8");

    let middleware!: (
      req: IncomingMessage,
      res: ServerResponse,
      next: (err?: unknown) => void,
    ) => Promise<void>;

    const transformIndexHtml = vi.fn().mockResolvedValue("<html>ok</html>");

    addDocsFallback(
      {
        config: { root: rootDir },
        middlewares: {
          use(handler: typeof middleware): void {
            middleware = handler;
          },
        },
        transformIndexHtml,
      } as unknown as ViteDevServer,
      opts,
    );

    const next = vi.fn();
    const req = {
      url: "/page",
      headers: { accept: "text/html,application/json" },
    } as IncomingMessage;

    const res = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    await middleware(req, res as unknown as ServerResponse, next);

    expect(next).not.toHaveBeenCalled();
    expect(transformIndexHtml).toHaveBeenCalledWith("/page", "<html><!-- --></html>");
    expect(res.statusCode).toBe(200);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/html");
    expect(res.end).toHaveBeenCalledWith("<html>ok</html>");
  });

  it("calls next when Accept omits HTML", async () => {
    let mw!: (
      req: IncomingMessage,
      res: ServerResponse,
      next: (err?: unknown) => void,
    ) => void | Promise<void>;

    addDocsFallback(
      {
        config: { root: "/tmp" },
        middlewares: {
          use(handler: typeof mw): void {
            mw = handler;
          },
        },
        transformIndexHtml: vi.fn(),
      } as unknown as ViteDevServer,
      opts,
    );

    const next = vi.fn();
    await mw(
      {
        url: "/x",
        headers: { accept: "application/javascript" },
      } as IncomingMessage,
      {} as ServerResponse,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
