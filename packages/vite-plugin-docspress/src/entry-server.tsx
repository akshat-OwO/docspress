import { renderToString } from "react-dom/server";
import { loadDocspressPage } from "./react";
import { DocspressApp, routes } from "./app";
import type { DocspressRenderResult } from "./server";

export async function render(url: string): Promise<DocspressRenderResult> {
  const pathname = new URL(url, "http://docspress.local").pathname;
  const initialPage = await loadDocspressPage(routes, pathname);
  const appHtml = renderToString(
    <DocspressApp
      initialPage={initialPage.Page}
      initialPathname={initialPage.pathname}
    />,
  );

  return {
    appHtml,
    status: initialPage.route ? 200 : 404,
  };
}
