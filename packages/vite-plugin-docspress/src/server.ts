import fs from "node:fs/promises";
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { normalizeBasePath } from "./routing";

export interface DocspressRenderResult {
  appHtml: string;
  status: number;
}

export type DocspressRender = (url: string) => Promise<DocspressRenderResult>;

export interface StartDocspressSsrServerOptions {
  root?: string;
  basePath?: string;
  isProduction?: boolean;
  port?: number;
  clientDist?: string;
  serverEntry?: string;
  serverEntryDev?: string;
}

export async function startDocspressSsrServer({
  root = process.cwd(),
  basePath = "/",
  isProduction = process.env.NODE_ENV === "production",
  port = Number(process.env.PORT ?? 5173),
  clientDist = path.resolve(root, "dist/client"),
  serverEntry = path.resolve(root, "dist/server/entry-server.js"),
  serverEntryDev = "vite-plugin-docspress/entry-server",
}: StartDocspressSsrServerOptions = {}): Promise<void> {
  const docsBasePath = normalizeBasePath(basePath);
  const vite = isProduction
    ? undefined
    : await createViteServer({
        appType: "custom",
        root,
        server: { middlewareMode: true },
      });
  const productionTemplate = isProduction
    ? await fs.readFile(path.resolve(clientDist, "index.html"), "utf8")
    : undefined;

  createHttpServer((req, res) => {
    void handleRequest({
      clientDist,
      docsBasePath,
      productionTemplate,
      req,
      res,
      root,
      serverEntry,
      serverEntryDev,
      vite,
    });
  }).listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
  });
}

interface HandleRequestOptions {
  clientDist: string;
  docsBasePath: string;
  productionTemplate: string | undefined;
  req: IncomingMessage;
  res: ServerResponse;
  root: string;
  serverEntry: string;
  serverEntryDev: string;
  vite: ViteDevServer | undefined;
}

async function handleRequest({
  clientDist,
  docsBasePath,
  productionTemplate,
  req,
  res,
  root,
  serverEntry,
  serverEntryDev,
  vite,
}: HandleRequestOptions): Promise<void> {
  const url = req.url ?? "/";
  const pathname = new URL(url, "http://docspress.local").pathname;

  try {
    if (isDocsRequest(pathname, docsBasePath) && acceptsHtml(req)) {
      await renderDocsRequest({
        productionTemplate,
        res,
        root,
        serverEntry,
        serverEntryDev,
        url,
        vite,
      });
      return;
    }

    if (vite) {
      await runViteMiddleware(vite, req, res);

      if (res.writableEnded) {
        return;
      }
    } else if (await serveStaticAsset(pathname, res, clientDist)) {
      return;
    }

    if (acceptsHtml(req)) {
      await serveAppTemplate({
        productionTemplate,
        res,
        root,
        url,
        vite,
      });
      return;
    }

    if (vite) {
      sendNotFound(res);
      return;
    }

    sendNotFound(res);
  } catch (error) {
    if (error instanceof Error) {
      vite?.ssrFixStacktrace(error);
    }

    console.error(error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}

async function renderDocsRequest({
  productionTemplate,
  res,
  root,
  serverEntry,
  serverEntryDev,
  url,
  vite,
}: {
  productionTemplate: string | undefined;
  res: ServerResponse;
  root: string;
  serverEntry: string;
  serverEntryDev: string;
  url: string;
  vite: ViteDevServer | undefined;
}): Promise<void> {
  const template = vite
    ? await fs.readFile(path.resolve(root, "index.html"), "utf8")
    : productionTemplate;

  if (!template) {
    throw new Error("Production HTML template was not loaded.");
  }

  const transformedTemplate = vite
    ? await vite.transformIndexHtml(url, template)
    : template;
  const render = await loadRender(vite, serverEntry, serverEntryDev);
  const rendered = await render(url);
  const html = transformedTemplate.replace("<!--app-html-->", rendered.appHtml);

  res.statusCode = rendered.status;
  res.setHeader("Content-Type", "text/html");
  res.end(html);
}

async function serveAppTemplate({
  productionTemplate,
  res,
  root,
  url,
  vite,
}: {
  productionTemplate: string | undefined;
  res: ServerResponse;
  root: string;
  url: string;
  vite: ViteDevServer | undefined;
}): Promise<void> {
  const template = vite
    ? await fs.readFile(path.resolve(root, "index.html"), "utf8")
    : productionTemplate;

  if (!template) {
    throw new Error("Production HTML template was not loaded.");
  }

  const transformedTemplate = vite
    ? await vite.transformIndexHtml(url, template)
    : template;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.end(transformedTemplate.replace("<!--app-html-->", ""));
}

function runViteMiddleware(
  vite: ViteDevServer,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return new Promise((resolve, reject) => {
    vite.middlewares(req, res, (error: unknown) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function loadRender(
  vite: ViteDevServer | undefined,
  serverEntry: string,
  serverEntryDev: string,
): Promise<DocspressRender> {
  if (vite) {
    const module = await vite.ssrLoadModule(serverEntryDev);
    return module.render as DocspressRender;
  }

  const module = await import(pathToFileURL(serverEntry).href);
  return module.render as DocspressRender;
}

async function serveStaticAsset(
  pathname: string,
  res: ServerResponse,
  clientDist: string,
): Promise<boolean> {
  if (!path.extname(pathname)) {
    return false;
  }

  const file = path.resolve(clientDist, `.${decodeURIComponent(pathname)}`);

  if (!isInsideDirectory(file, clientDist)) {
    sendNotFound(res);
    return true;
  }

  try {
    const content = await fs.readFile(file);
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType(file));
    res.end(content);
    return true;
  } catch {
    sendNotFound(res);
    return true;
  }
}

function isInsideDirectory(file: string, directory: string): boolean {
  const relative = path.relative(directory, file);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isDocsRequest(pathname: string, basePath: string): boolean {
  if (basePath === "/") {
    return pathname.startsWith("/");
  }

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function acceptsHtml(req: IncomingMessage): boolean {
  const accept = req.headers.accept;
  return typeof accept === "string" && accept.includes("text/html");
}

function sendNotFound(res: ServerResponse): void {
  res.statusCode = 404;
  res.end("Not Found");
}

function contentType(file: string): string {
  switch (path.extname(file)) {
    case ".css":
      return "text/css";
    case ".html":
      return "text/html";
    case ".js":
      return "text/javascript";
    case ".json":
      return "application/json";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
