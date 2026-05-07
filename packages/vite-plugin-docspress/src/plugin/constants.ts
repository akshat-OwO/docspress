export const ROUTES_MODULE_ID = "virtual:docspress/routes";
export const HTML_ROUTES_MODULE_ID = "virtual:docspress/html-routes";
export const REACT_ROUTES_MODULE_ID = "virtual:docspress/react-routes";
export const SIDEBAR_MODULE_ID = "virtual:docspress/sidebar";
export const CONFIG_MODULE_ID = "virtual:docspress/config";

export const RESOLVED_ROUTES_MODULE_ID = `\0${ROUTES_MODULE_ID}`;
export const RESOLVED_HTML_ROUTES_MODULE_ID = `\0${HTML_ROUTES_MODULE_ID}`;
export const RESOLVED_REACT_ROUTES_MODULE_ID = `\0${REACT_ROUTES_MODULE_ID}`;
export const RESOLVED_SIDEBAR_MODULE_ID = `\0${SIDEBAR_MODULE_ID}`;
export const RESOLVED_CONFIG_MODULE_ID = `\0${CONFIG_MODULE_ID}`;

export const VIRTUAL_MODULE_IDS = [
  ROUTES_MODULE_ID,
  HTML_ROUTES_MODULE_ID,
  REACT_ROUTES_MODULE_ID,
  SIDEBAR_MODULE_ID,
  CONFIG_MODULE_ID,
] as const;
