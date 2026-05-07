import { useEffect, useState, type ComponentType, type ReactElement } from "react";
import { matchRoute, type DocspressRoute } from "./routing";

export interface ReactDocspressRoute extends DocspressRoute {
  load: () => Promise<{ default: ComponentType }>;
}

export interface DocspressRouterProps {
  routes: readonly ReactDocspressRoute[];
  title?: string;
  notFound?: ReactElement;
}

export function DocspressRouter({
  routes,
  title = "Docspress",
  notFound = <p>No documentation page matches this URL.</p>,
}: DocspressRouterProps): ReactElement {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [Page, setPage] = useState<ComponentType | undefined>();
  const match = matchRoute(pathname, routes);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let disposed = false;

    if (!match) {
      setPage(undefined);
      return;
    }

    match.route.load().then((module) => {
      if (!disposed) {
        setPage(() => module.default);
      }
    });

    return () => {
      disposed = true;
    };
  }, [match?.route.id]);

  return (
    <div className="docspress-shell">
      <aside className="docspress-sidebar">
        <strong>{title}</strong>
        <nav>
          {routes
            .filter((route) => !route.path.includes(":"))
            .map((route) => (
              <a
                aria-current={route.path === pathname ? "page" : undefined}
                href={route.path}
                key={route.id}
                onClick={(event) => {
                  event.preventDefault();
                  window.history.pushState({}, "", route.path);
                  setPathname(route.path);
                }}
              >
                {labelFromPath(route.path)}
              </a>
            ))}
        </nav>
      </aside>
      <main className="docspress-content">{Page ? <Page /> : notFound}</main>
    </div>
  );
}

function labelFromPath(pathname: string): string {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "Docs";
  return lastSegment
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
