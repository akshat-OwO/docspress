import type { Plugin, ResolvedConfig } from "vite";
import { ENTRY_CLIENT_FILE } from "../runtime/entry-client-path";
import {
  CONFIG_MODULE_ID,
  HTML_ROUTES_MODULE_ID,
  REACT_ROUTES_MODULE_ID,
  RESOLVED_CONFIG_MODULE_ID,
  RESOLVED_HTML_ROUTES_MODULE_ID,
  RESOLVED_REACT_ROUTES_MODULE_ID,
  RESOLVED_ROUTES_MODULE_ID,
  RESOLVED_SIDEBAR_MODULE_ID,
  ROUTES_MODULE_ID,
  SIDEBAR_MODULE_ID,
} from "./constants";
import { addDocsFallback, addDocsWatcher } from "./dev-server";
import { invalidateVirtualModules } from "./hmr";
import { normalizeSlashes, resolveDocspressOptions, type DocspressOptions, type ResolvedDocspressOptions } from "./options";
import { isDocsFile, isSidebarFile, scanRoutes, toPublicRoutes } from "./routes";
import {
  createConfigModule,
  createHtmlRoutesModule,
  createReactRoutesModule,
  createSidebarModule,
} from "./virtual-modules";

export function createDocspressPlugin(options: DocspressOptions = {}): Plugin {
  let config: ResolvedConfig | undefined;
  let resolvedOptions: ResolvedDocspressOptions | undefined;

  return {
    name: "vite-plugin-docspress",

    config() {
      return {
        optimizeDeps: {
          exclude: ["vite-plugin-docspress"],
        },
        ssr: {
          noExternal: ["vite-plugin-docspress"],
        },
      };
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      resolvedOptions = resolveDocspressOptions(options);
    },

    configureServer(server) {
      if (!resolvedOptions) {
        throw new Error(
          "vite-plugin-docspress: resolved options were not set before configureServer (configResolved should run first).",
        );
      }

      addDocsWatcher(server, resolvedOptions);
      addDocsFallback(server, resolvedOptions);
    },

    resolveId(id) {
      if (id === ROUTES_MODULE_ID) {
        return RESOLVED_ROUTES_MODULE_ID;
      }

      if (id === HTML_ROUTES_MODULE_ID) {
        return RESOLVED_HTML_ROUTES_MODULE_ID;
      }

      if (id === REACT_ROUTES_MODULE_ID) {
        return RESOLVED_REACT_ROUTES_MODULE_ID;
      }

      if (id === SIDEBAR_MODULE_ID) {
        return RESOLVED_SIDEBAR_MODULE_ID;
      }

      if (id === CONFIG_MODULE_ID) {
        return RESOLVED_CONFIG_MODULE_ID;
      }

      return undefined;
    },

    async load(id) {
      if (!config || !resolvedOptions) {
        return undefined;
      }

      const { root } = config;

      if (id === RESOLVED_ROUTES_MODULE_ID) {
        const routes = await scanRoutes(root, resolvedOptions);
        return `export const routes = ${JSON.stringify(toPublicRoutes(routes), null, 2)};`;
      }

      if (id === RESOLVED_HTML_ROUTES_MODULE_ID) {
        const routes = await scanRoutes(root, resolvedOptions);
        return createHtmlRoutesModule(routes);
      }

      if (id === RESOLVED_REACT_ROUTES_MODULE_ID) {
        const routes = await scanRoutes(root, resolvedOptions);
        return createReactRoutesModule(routes);
      }

      if (id === RESOLVED_SIDEBAR_MODULE_ID) {
        return createSidebarModule(root, resolvedOptions);
      }

      if (id === RESOLVED_CONFIG_MODULE_ID) {
        return createConfigModule(resolvedOptions);
      }

      return undefined;
    },

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if (!resolvedOptions) {
          return html;
        }

        if (resolvedOptions.framework !== "react") {
          return html;
        }

        if (html.includes(ENTRY_CLIENT_FILE)) {
          return html;
        }

        return {
          html,
          tags: [
            {
              tag: "script",
              attrs: {
                type: "module",
                src: `/@fs/${normalizeSlashes(ENTRY_CLIENT_FILE)}`,
              },
              injectTo: "body",
            },
          ],
        };
      },
    },

    handleHotUpdate(ctx) {
      if (!config || !resolvedOptions) {
        return undefined;
      }

      const { root } = config;

      if (
        !isDocsFile(ctx.file, root, resolvedOptions.docsDir) &&
        !isSidebarFile(ctx.file, root, resolvedOptions.docsDir)
      ) {
        return undefined;
      }

      invalidateVirtualModules(ctx.server);
      ctx.server.ws.send({ type: "full-reload", path: "*" });
      return [];
    },
  };
}
