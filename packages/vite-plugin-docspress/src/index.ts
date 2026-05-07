import mdx from "@mdx-js/rollup";
import type { PluginOption } from "vite";
import { createDocspressPlugin } from "./plugin/create-plugin";
import type { DocspressOptions } from "./plugin/options";

export { createSidebar } from "./sidebar";
export type {
  SidebarComponent,
  SidebarConfig,
  SidebarGroup,
  SidebarItem,
  SidebarLink,
} from "./sidebar";

export type { DocspressOptions } from "./plugin/options";

export function docspress(options: DocspressOptions = {}): PluginOption {
  return [createDocspressPlugin(options), mdx()];
}
