import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { marked } from "marked";
import type { Connect, Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { joinRoutePath, normalizeBasePath, routeScore, type DocspressRoute } from "./routing";

const ROUTES_MODULE_ID = "virtual:docspress/routes";
const HTML_ROUTES_MODULE_ID = "virtual:docspress/html-routes";
const REACT_ROUTES_MODULE_ID = "virtual:docspress/react-routes";
const RESOLVED_ROUTES_MODULE_ID = `\0${ROUTES_MODULE_ID}`;
const RESOLVED_HTML_ROUTES_MODULE_ID = `\0${HTML_ROUTES_MODULE_ID}`;
const RESOLVED_REACT_ROUTES_MODULE_ID = `\0${REACT_ROUTES_MODULE_ID}`;

export interface DocspressOptions {
  docsDir?: string;
  basePath?: string;
  indexToken?: string;
  routeToken?: string;
}

interface ResolvedDocspressOptions {
  docsDir: string;
  basePath: string;
  indexToken: string;
  routeToken: string;
}

interface FileRoute extends DocspressRoute {
  absoluteFile: string;
  importPath: string;
}

export function docspress(options: DocspressOptions = {}): Plugin {
  let config: ResolvedConfig;
  let resolvedOptions: ResolvedDocspressOptions;

  return {
    name: "vite-plugin-docspress",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      resolvedOptions = {
        docsDir: normalizeSlashes(options.docsDir ?? "src/docs"),
        basePath: normalizeBasePath(options.basePath ?? "/docs"),
        indexToken: options.indexToken ?? "index",
        routeToken: options.routeToken ?? "route",
      };
    },

    configureServer(server) {
      addDocsWatcher(server, resolvedOptions);
      addDocsFallback(server, resolvedOptions);
    },

    resolveId(id) {
      if (id === ROUTES_MODULE_ID) {
        return RESOLVED_ROUTES_MODULE_ID;
      }

      if (id === HTML_ROUTES_MODULE_ID) {
        return RESOLVED_HTML_ROUTES_MODULE_ID;
      }

      if (id === REACT_ROUTES_MODULE_ID) {
        return RESOLVED_REACT_ROUTES_MODULE_ID;
      }

      return undefined;
    },

    async load(id) {
      if (id === RESOLVED_ROUTES_MODULE_ID) {
        const routes = await scanRoutes(config.root, resolvedOptions);
        return `export const routes = ${JSON.stringify(toPublicRoutes(routes), null, 2)};`;
      }

      if (id === RESOLVED_HTML_ROUTES_MODULE_ID) {
        const routes = await scanRoutes(config.root, resolvedOptions);
        return createHtmlRoutesModule(routes);
      }

      if (id === RESOLVED_REACT_ROUTES_MODULE_ID) {
        const routes = await scanRoutes(config.root, resolvedOptions);
        return createReactRoutesModule(routes);
      }

      return undefined;
    },

    handleHotUpdate(ctx) {
      if (!isDocsFile(ctx.file, config.root, resolvedOptions.docsDir)) {
        return undefined;
      }

      invalidateVirtualModules(ctx.server);
      ctx.server.ws.send({ type: "full-reload", path: "*" });
      return [];
    },
  };
}

async function scanRoutes(root: string, options: ResolvedDocspressOptions): Promise<FileRoute[]> {
  const docsRoot = path.resolve(root, options.docsDir);
  const files = await fg("**/*.mdx", {
    cwd: docsRoot,
    absolute: true,
    onlyFiles: true,
  });

  return files
    .map((file) => createRoute(file, docsRoot, root, options))
    .filter((route): route is FileRoute => route !== undefined)
    .sort((a, b) => a.path.localeCompare(b.path));
}

function createRoute(
  file: string,
  docsRoot: string,
  root: string,
  options: ResolvedDocspressOptions,
): FileRoute | undefined {
  const relativeFile = normalizeSlashes(path.relative(docsRoot, file));
  const withoutExtension = relativeFile.replace(/\.mdx$/, "");
  const parts = withoutExtension.split("/").flatMap((part) => part.split("."));
  const params: string[] = [];
  const segments: string[] = [];

  for (const part of parts) {
    if (
      !part ||
      part === "__root" ||
      part === options.indexToken ||
      part === options.routeToken ||
      part.startsWith("_")
    ) {
      continue;
    }

    if (part.startsWith("$")) {
      const paramName = part.slice(1);
      if (!paramName) {
        continue;
      }

      params.push(paramName);
      segments.push(`:${paramName}`);
      continue;
    }

    segments.push(part);
  }

  const routePath = joinRoutePath(options.basePath, segments);

  return {
    id: createRouteId(relativeFile),
    path: routePath,
    file: normalizeSlashes(path.relative(root, file)),
    absoluteFile: file,
    importPath: `/@fs/${normalizeSlashes(file)}`,
    params,
    score: routeScore(routePath),
  };
}

function toPublicRoutes(routes: FileRoute[]): DocspressRoute[] {
  return routes.map(({ id, path: routePath, file, params, score }) => ({
    id,
    path: routePath,
    file,
    params,
    score,
  }));
}

async function createHtmlRoutesModule(routes: FileRoute[]): Promise<string> {
  const htmlRoutes = await Promise.all(
    routes.map(async (route) => ({
      ...toPublicRoutes([route])[0],
      html: await renderMarkdownFile(route.absoluteFile),
    })),
  );

  return [
    `const routeData = ${JSON.stringify(htmlRoutes, null, 2)};`,
    "export const routes = routeData.map(({ html, ...route }) => ({",
    "  ...route,",
    "  load: async () => ({ html }),",
    "}));",
  ].join("\n");
}

function createReactRoutesModule(routes: FileRoute[]): string {
  const routeLines = routes.map((route) => {
    const publicRoute = toPublicRoutes([route])[0];
    return `  { ...${JSON.stringify(publicRoute)}, load: () => import(${JSON.stringify(route.importPath)}) }`;
  });

  return `export const routes = [\n${routeLines.join(",\n")}\n];`;
}

async function renderMarkdownFile(file: string): Promise<string> {
  const source = await fs.readFile(file, "utf8");
  return String(await marked.parse(stripMdxOnlySyntax(source)));
}

function stripMdxOnlySyntax(source: string): string {
  return source
    .replace(/^---[\s\S]*?\n---\s*/u, "")
    .split("\n")
    .filter((line) => !/^\s*(import|export)\s/u.test(line))
    .join("\n");
}

function addDocsWatcher(server: ViteDevServer, options: ResolvedDocspressOptions): void {
  const docsGlob = path.resolve(server.config.root, options.docsDir, "**/*.mdx");
  server.watcher.add(docsGlob);
}

function addDocsFallback(server: ViteDevServer, options: ResolvedDocspressOptions): void {
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

function isDocsRequest(requestPath: string, basePath: string): boolean {
  return requestPath === basePath || requestPath.startsWith(`${basePath}/`);
}

function acceptsHtml(req: Connect.IncomingMessage): boolean {
  const acceptHeader = req.headers.accept;
  return typeof acceptHeader === "string" && acceptHeader.includes("text/html");
}

function invalidateVirtualModules(server: ViteDevServer): void {
  for (const id of [ROUTES_MODULE_ID, HTML_ROUTES_MODULE_ID, REACT_ROUTES_MODULE_ID]) {
    const moduleNode = server.moduleGraph.getModuleById(`\0${id}`);
    if (moduleNode) {
      server.moduleGraph.invalidateModule(moduleNode);
    }
  }
}

function isDocsFile(file: string, root: string, docsDir: string): boolean {
  const docsRoot = path.resolve(root, docsDir);
  const relative = path.relative(docsRoot, file);
  return !relative.startsWith("..") && !path.isAbsolute(relative) && file.endsWith(".mdx");
}

function createRouteId(relativeFile: string): string {
  return relativeFile
    .replace(/\.mdx$/u, "")
    .replace(/[^a-zA-Z0-9_$]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, "/");
}
