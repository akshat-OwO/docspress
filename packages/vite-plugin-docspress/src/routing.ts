export interface DocspressRoute {
  id: string;
  path: string;
  file: string;
  params: string[];
  score: number;
}

export interface RouteMatch<Route extends Pick<DocspressRoute, "path">> {
  route: Route;
  params: Record<string, string>;
}

const SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

export function normalizeBasePath(basePath: string): string {
  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

export function joinRoutePath(basePath: string, segments: string[]): string {
  const base = normalizeBasePath(basePath);
  const suffix = segments.join("/");

  if (!suffix) {
    return base;
  }

  return `${base}/${suffix}`.replace(/\/+/g, "/");
}

export function matchRoute<Route extends Pick<DocspressRoute, "path">>(
  pathname: string,
  routes: readonly Route[],
): RouteMatch<Route> | undefined {
  const sortedRoutes = [...routes].sort((a, b) => routeScore(b.path) - routeScore(a.path));

  for (const route of sortedRoutes) {
    const paramNames: string[] = [];
    const pattern = route.path
      .split("/")
      .map((segment) => {
        if (segment.startsWith(":")) {
          paramNames.push(segment.slice(1));
          return "([^/]+)";
        }

        return segment.replace(SPECIAL_CHARS, "\\$&");
      })
      .join("/");
    const match = new RegExp(`^${pattern}/?$`).exec(pathname);

    if (!match) {
      continue;
    }

    return {
      route,
      params: Object.fromEntries(
        paramNames.map((name, index) => [name, decodeURIComponent(match[index + 1] ?? "")]),
      ),
    };
  }

  return undefined;
}

export function routeScore(pathname: string): number {
  return pathname
    .split("/")
    .filter(Boolean)
    .reduce((score, segment) => score + (segment.startsWith(":") ? 1 : 10), 0);
}
