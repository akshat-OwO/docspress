/// <reference types="vite/client" />

declare module "virtual:docspress/react-routes" {
  import type { ReactDocspressRoute } from "vite-plugin-docspress/react";

  export const routes: ReactDocspressRoute[];
}

declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXComponent: ComponentType;
  export default MDXComponent;
}
