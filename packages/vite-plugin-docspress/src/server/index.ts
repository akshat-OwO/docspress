import fs from "node:fs/promises";
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { acceptsHtml, isDocsRequest } from "../core/request";
import { normalizeBasePath } from "../core/routing";
import { clientDistContentType, resolveClientDistFile } from "./serve-static";

export interface DocspressRenderResult {
  appHtml: string;
  status: number;
}

export type DocspressRender = (url: string) => Promise<DocspressRenderResult>;

export interface StartDocspressSsrServerOptions {
  root?: string;
  basePath?: string;
  isProduction?: boolean;
  /** Listen port (from `PORT` when unset under default options). */
  port?: number;
  /**
   * Bind host. Defaults to `127.0.0.1` so the server is not exposed on every interface by default.
   * Use `"0.0.0.0"` when you need LAN/Docker ingress.
   */
  host?: string;
  clientDist?: string;
  serverEntry?: string;
  serverEntryDev?: string;
}

export async function startDocspressSsrServer({
  root = process.cwd(),
  basePath = "/",
  isProduction = process.env.NODE_ENV === "production",
  port = Number(process.env.PORT ?? 5173),
  host = "127.0.0.1",
  clientDist = path.resolve(root, "dist/client"),
  serverEntry = path.resolve(root, "dist/server/entry-server.js"),
  serverEntryDev = "vite-plugin-docspress/entry-server",
}: StartDocspressSsrServerOptions = {}): Promise<HttpServer> {
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

  const httpServer = createHttpServer((req, res) => {
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
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once("listening", resolve);
    httpServer.once("error", reject);
    httpServer.listen(port, host);
  });

  const addr = httpServer.address();
  const listeningPort =
    typeof addr === "object" && addr !== null ? addr.port : port;
  const displayHost = host === "0.0.0.0" ? "localhost" : host;
  console.log(`listening at http://${displayHost}:${listeningPort}`);

  return httpServer;
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
  const resolved = resolveClientDistFile(clientDist, pathname);

  if (resolved.kind === "not_static") {
    return false;
  }

  if (resolved.kind === "outside") {
    sendNotFound(res);
    return true;
  }

  try {
    const content = await fs.readFile(resolved.file);
    res.statusCode = 200;
    res.setHeader("Content-Type", clientDistContentType(resolved.file));
    res.end(content);
    return true;
  } catch {
    sendNotFound(res);
    return true;
  }
}

function sendNotFound(res: ServerResponse): void {
  res.statusCode = 404;
  res.end("Not Found");
}
