import path from "node:path";
import fg from "fast-glob";
import { joinRoutePath, routeScore, type DocspressRoute } from "../core/routing";
import { normalizeSlashes, type ResolvedDocspressOptions } from "./options";

export interface FileRoute extends DocspressRoute {
  absoluteFile: string;
  importPath: string;
}

export async function scanRoutes(root: string, options: ResolvedDocspressOptions): Promise<FileRoute[]> {
  const docsRoot = path.resolve(root, options.docsDir);
  const files = await fg("**/*.mdx", {
    cwd: docsRoot,
    absolute: true,
    onlyFiles: true,
  });

  return files
    .map((file) => createRoute(file, docsRoot, options))
    .filter((route): route is FileRoute => route !== undefined)
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function createRoute(
  file: string,
  docsRoot: string,
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
    file: `/${relativeFile}`,
    absoluteFile: file,
    importPath: `/@fs/${normalizeSlashes(file)}`,
    params,
    score: routeScore(routePath),
  };
}

export function toPublicRoutes(routes: FileRoute[]): DocspressRoute[] {
  return routes.map(({ id, path: routePath, file, params, score }) => ({
    id,
    path: routePath,
    file,
    params,
    score,
  }));
}

export function isDocsFile(file: string, root: string, docsDir: string): boolean {
  const docsRoot = path.resolve(root, docsDir);
  const relative = path.relative(docsRoot, file);
  return !relative.startsWith("..") && !path.isAbsolute(relative) && file.endsWith(".mdx");
}

export function isSidebarFile(file: string, root: string, docsDir: string): boolean {
  return file === path.resolve(root, docsDir, "sidebar.ts");
}

export function createRouteId(relativeFile: string): string {
  return relativeFile
    .replace(/\.mdx$/u, "")
    .replace(/[^a-zA-Z0-9_$]+/gu, "-")
    .replace(/^-|-$/gu, "");
}
