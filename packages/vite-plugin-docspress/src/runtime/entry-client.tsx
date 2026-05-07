import { hydrateRoot } from "react-dom/client";
import { loadDocspressPage } from "./react";
import { DocspressApp, config, routes } from "./app";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Docspress root element not found: #app");
}

if (isDocsPath(window.location.pathname)) {
  const initialPage = await loadDocspressPage(routes, window.location.pathname);

  hydrateRoot(
    root,
    <DocspressApp
      initialPage={initialPage.Page}
      initialPathname={initialPage.pathname}
    />,
  );
}

function isDocsPath(pathname: string): boolean {
  if (config.basePath === "/") {
    return pathname.startsWith("/");
  }

  return pathname === config.basePath || pathname.startsWith(`${config.basePath}/`);
}
