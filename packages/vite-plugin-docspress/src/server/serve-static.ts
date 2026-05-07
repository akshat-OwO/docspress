import path from "node:path";

/** True when `file` resolves to `directory` or a path inside it (no traversal). */
export function isPathInsideDirectory(file: string, directory: string): boolean {
  const relative = path.relative(directory, file);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export type ClientDistResolve =
  | { kind: "ok"; file: string }
  | { kind: "outside" }
  | { kind: "not_static" };

/**
 * Maps a URL pathname (e.g. `/assets/foo.js`) to an absolute path under clientDist,
 * or reports it is outside the directory / not a static file request.
 */
export function resolveClientDistFile(clientDist: string, pathname: string): ClientDistResolve {
  if (!path.extname(pathname)) {
    return { kind: "not_static" };
  }

  const file = path.resolve(clientDist, `.${decodeURIComponent(pathname)}`);

  if (!isPathInsideDirectory(file, clientDist)) {
    return { kind: "outside" };
  }

  return { kind: "ok", file };
}

export function clientDistContentType(file: string): string {
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
