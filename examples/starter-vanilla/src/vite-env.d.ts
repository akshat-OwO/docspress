/// <reference types="vite/client" />

declare module "virtual:docspress/html-routes" {
  import type { HtmlDocspressRoute } from "vite-plugin-docspress/client";

  export const routes: HtmlDocspressRoute[];
}
