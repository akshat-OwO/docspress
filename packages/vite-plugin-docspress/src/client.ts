import { matchRoute, type DocspressRoute } from "./routing";
import {
  resolveSidebar,
  type ResolvedSidebarConfig,
  type ResolvedSidebarItem,
  type SidebarConfig,
} from "./sidebar";
import { docspressStyles } from "./styles";

export interface HtmlDocspressRoute extends DocspressRoute {
  load: () => Promise<{ html: string }>;
}

export interface MountDocspressOptions {
  routes: readonly HtmlDocspressRoute[];
  sidebar?: SidebarConfig;
  root?: string | HTMLElement;
  title?: string;
}

export function mountDocspress(options: MountDocspressOptions): void {
  const root = resolveRoot(options.root ?? "#app");
  const sidebar = resolveSidebar(options.routes, options.sidebar);

  async function render() {
    const match = matchRoute(window.location.pathname, options.routes);

    if (!match) {
      root.innerHTML = createShell({
        title: options.title ?? "Docspress",
        sidebar,
        content: "<h1>Not found</h1><p>No documentation page matches this URL.</p>",
      });
      return;
    }

    const page = await match.route.load();
    root.innerHTML = createShell({
      title: options.title ?? "Docspress",
      sidebar,
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
  sidebar,
  activePath,
  content,
}: {
  title: string;
  sidebar: ResolvedSidebarConfig;
  activePath?: string;
  content: string;
}): string {
  return `
    <style data-docspress-style>${docspressStyles}</style>
    <div data-docspress-shell>
      <aside data-docspress-sidebar>
        <div data-docspress-sidebar-header>${renderHtmlSlot(sidebar.header) ?? `<strong data-docspress-brand>${escapeHtml(title)}</strong>`}</div>
        <nav data-docspress-nav>${renderSidebarItems(sidebar.items, activePath)}</nav>
        ${sidebar.footer ? `<div data-docspress-sidebar-footer>${renderHtmlSlot(sidebar.footer) ?? ""}</div>` : ""}
      </aside>
      <main data-docspress-content>${content}</main>
    </div>
  `;
}

function renderSidebarItems(
  items: readonly ResolvedSidebarItem[],
  activePath: string | undefined,
): string {
  return items.map((item) => renderSidebarItem(item, activePath)).join("");
}

function renderSidebarItem(item: ResolvedSidebarItem, activePath: string | undefined): string {
  if (item.type === "group") {
    return `
      <section data-docspress-group>
        <span data-docspress-group-heading>${escapeHtml(item.heading)}</span>
        <div data-docspress-links>${item.items.map((link) => renderSidebarItem(link, activePath)).join("")}</div>
      </section>
    `;
  }

  const current = item.path === activePath ? ' aria-current="page"' : "";
  return `<a data-docspress-link href="${item.path}"${current}>${escapeHtml(item.label)}</a>`;
}

function renderHtmlSlot(slot: unknown): string | undefined {
  return typeof slot === "string" ? slot : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
