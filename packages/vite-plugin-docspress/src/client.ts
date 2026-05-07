import { matchRoute, type DocspressRoute } from "./routing";

export interface HtmlDocspressRoute extends DocspressRoute {
  load: () => Promise<{ html: string }>;
}

export interface MountDocspressOptions {
  routes: readonly HtmlDocspressRoute[];
  root?: string | HTMLElement;
  title?: string;
}

export function mountDocspress(options: MountDocspressOptions): void {
  const root = resolveRoot(options.root ?? "#app");

  async function render() {
    const match = matchRoute(window.location.pathname, options.routes);

    if (!match) {
      root.innerHTML = createShell({
        title: options.title ?? "Docspress",
        routes: options.routes,
        content: "<h1>Not found</h1><p>No documentation page matches this URL.</p>",
      });
      return;
    }

    const page = await match.route.load();
    root.innerHTML = createShell({
      title: options.title ?? "Docspress",
      routes: options.routes,
      activePath: match.route.path,
      content: page.html,
    });
  }

  window.addEventListener("popstate", () => {
    void render();
  });

  document.addEventListener("click", (event) => {
    const anchor = (event.target as Element | null)?.closest("a");

    if (!anchor || anchor.origin !== window.location.origin) {
      return;
    }

    if (!options.routes.some((route) => route.path === anchor.pathname)) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", anchor.href);
    void render();
  });

  void render();
}

function resolveRoot(root: string | HTMLElement): HTMLElement {
  if (typeof root !== "string") {
    return root;
  }

  const element = document.querySelector<HTMLElement>(root);

  if (!element) {
    throw new Error(`Docspress root element not found: ${root}`);
  }

  return element;
}

function createShell({
  title,
  routes,
  activePath,
  content,
}: {
  title: string;
  routes: readonly HtmlDocspressRoute[];
  activePath?: string;
  content: string;
}): string {
  const navItems = routes
    .filter((route) => !route.path.includes(":"))
    .map((route) => {
      const current = route.path === activePath ? ' aria-current="page"' : "";
      return `<a href="${route.path}"${current}>${labelFromPath(route.path)}</a>`;
    })
    .join("");

  return `
    <div class="docspress-shell">
      <aside class="docspress-sidebar">
        <strong>${title}</strong>
        <nav>${navItems}</nav>
      </aside>
      <main class="docspress-content">${content}</main>
    </div>
  `;
}

function labelFromPath(pathname: string): string {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "Docs";
  return lastSegment
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
