import fs from "node:fs/promises";
import path from "node:path";
import type { Connect, ViteDevServer } from "vite";
import { acceptsHtml, isDocsRequest } from "../core/request";
import type { ResolvedDocspressOptions } from "./options";

export function addDocsWatcher(server: ViteDevServer, options: ResolvedDocspressOptions): void {
  const docsGlob = path.resolve(server.config.root, options.docsDir, "**/*.mdx");
  server.watcher.add(docsGlob);
  server.watcher.add(path.resolve(server.config.root, options.docsDir, "sidebar.ts"));
}

export function addDocsFallback(server: ViteDevServer, options: ResolvedDocspressOptions): void {
  server.middlewares.use(async (req: Connect.IncomingMessage, res, next) => {
    const requestPath = getRequestPath(req.url);

    if (!requestPath || !isDocsRequest(requestPath, options.basePath) || !acceptsHtml(req)) {
      next();
      return;
    }

    try {
      const htmlPath = path.join(server.config.root, "index.html");
      const html = await fs.readFile(htmlPath, "utf8");
      const transformed = await server.transformIndexHtml(requestPath, html);
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.end(transformed);
    } catch (error) {
      next(error);
    }
  });
}

function getRequestPath(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  return new URL(url, "http://docspress.local").pathname;
}
