import type { HtmlDocspressRoute } from "./client";
import type { ReactDocspressRoute } from "./react";
import type { DocspressRoute } from "./routing";
import type { SidebarConfig } from "./sidebar";

declare module "virtual:docspress/routes" {
  export const routes: DocspressRoute[];
}

declare module "virtual:docspress/html-routes" {
  export const routes: HtmlDocspressRoute[];
}

declare module "virtual:docspress/react-routes" {
  export const routes: ReactDocspressRoute[];
}

declare module "virtual:docspress/sidebar" {
  export const sidebar: SidebarConfig | undefined;
  export default sidebar;
}
