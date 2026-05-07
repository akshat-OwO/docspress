declare module "virtual:docspress/routes" {
  export const routes: unknown[];
}

declare module "virtual:docspress/html-routes" {
  export const routes: unknown[];
}

declare module "virtual:docspress/react-routes" {
  export const routes: any[];
}

declare module "virtual:docspress/sidebar" {
  export const sidebar: any;
  export default sidebar;
}

declare module "virtual:docspress/config" {
  export const config: {
    basePath: string;
    title: string;
  };
}
