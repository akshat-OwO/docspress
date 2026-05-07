/// <reference types="vite/client" />

declare module "virtual:docspress/react-routes" {
  import type { ReactDocspressRoute } from "vite-plugin-docspress/react";

  export const routes: ReactDocspressRoute[];
}

declare module "virtual:docspress/sidebar" {
  import type { SidebarConfig } from "vite-plugin-docspress";

  export const sidebar: SidebarConfig | undefined;
  export default sidebar;
}

declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXComponent: ComponentType;
  export default MDXComponent;
}
