import { normalizeBasePath } from "../core/routing";

export interface DocspressOptions {
  docsDir?: string;
  basePath?: string;
  framework?: "react" | "vanilla";
  indexToken?: string;
  routeToken?: string;
  title?: string;
}

export interface ResolvedDocspressOptions {
  docsDir: string;
  basePath: string;
  framework: "react" | "vanilla";
  indexToken: string;
  routeToken: string;
  title: string;
}

export function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, "/");
}

export function resolveDocspressOptions(options: DocspressOptions = {}): ResolvedDocspressOptions {
  return {
    docsDir: normalizeSlashes(options.docsDir ?? "src/pages"),
    basePath: normalizeBasePath(options.basePath ?? "/"),
    framework: options.framework ?? "react",
    indexToken: options.indexToken ?? "index",
    routeToken: options.routeToken ?? "route",
    title: options.title ?? "Docspress",
  };
}
