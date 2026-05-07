import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import { matchRoute, type DocspressRoute } from "./routing";
import {
  resolveSidebar,
  type ResolvedSidebarItem,
  type SidebarComponent,
  type SidebarConfig,
} from "./sidebar";
import { docspressStyles } from "./styles";

export interface ReactDocspressRoute extends DocspressRoute {
  load: () => Promise<{ default: ComponentType }>;
}

export interface DocspressRouterProps {
  routes: readonly ReactDocspressRoute[];
  sidebar?: SidebarConfig;
  title?: string;
  notFound?: ReactElement;
}

export function DocspressRouter({
  routes,
  sidebar: sidebarConfig,
  title = "Docspress",
  notFound = <p>No documentation page matches this URL.</p>,
}: DocspressRouterProps): ReactElement {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [Page, setPage] = useState<ComponentType | undefined>();
  const sidebar = useMemo(() => resolveSidebar(routes, sidebarConfig), [routes, sidebarConfig]);
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
    <>
      <style>{docspressStyles}</style>
      <div data-docspress-shell>
        <aside data-docspress-sidebar>
          <div data-docspress-sidebar-header>
            {renderSlot(sidebar.header) ?? <strong data-docspress-brand>{title}</strong>}
          </div>
          <nav data-docspress-nav>
            <SidebarItems
              activePath={match?.route.path}
              items={sidebar.items}
              routes={routes}
              setPathname={setPathname}
            />
          </nav>
          {sidebar.footer ? (
            <div data-docspress-sidebar-footer>{renderSlot(sidebar.footer)}</div>
          ) : null}
        </aside>
        <main data-docspress-content>{Page ? <Page /> : notFound}</main>
      </div>
    </>
  );
}

function SidebarItems({
  activePath,
  items,
  routes,
  setPathname,
}: {
  activePath: string | undefined;
  items: readonly ResolvedSidebarItem[];
  routes: readonly ReactDocspressRoute[];
  setPathname: (pathname: string) => void;
}): ReactNode {
  return items.map((item) => (
    <SidebarItem
      activePath={activePath}
      item={item}
      key={sidebarItemKey(item)}
      routes={routes}
      setPathname={setPathname}
    />
  ));
}

function SidebarItem({
  activePath,
  item,
  routes,
  setPathname,
}: {
  activePath: string | undefined;
  item: ResolvedSidebarItem;
  routes: readonly ReactDocspressRoute[];
  setPathname: (pathname: string) => void;
}): ReactElement {
  if (item.type === "group") {
    return (
      <section data-docspress-group>
        <span data-docspress-group-heading>{item.heading}</span>
        <div data-docspress-links>
          <SidebarItems
            activePath={activePath}
            items={item.items}
            routes={routes}
            setPathname={setPathname}
          />
        </div>
      </section>
    );
  }

  return (
    <a
      aria-current={item.path === activePath ? "page" : undefined}
      data-docspress-link
      href={item.path}
      onClick={(event) => {
        if (!routes.some((route) => route.path === item.path)) {
          return;
        }

        event.preventDefault();
        window.history.pushState({}, "", item.path);
        setPathname(item.path);
      }}
    >
      {item.label}
    </a>
  );
}

function sidebarItemKey(item: ResolvedSidebarItem): string {
  return item.type === "group" ? item.heading : item.path;
}

function renderSlot(slot: SidebarComponent | undefined): ReactNode {
  if (typeof slot === "function") {
    const Component = slot as ComponentType;
    return <Component />;
  }

  return slot;
}
