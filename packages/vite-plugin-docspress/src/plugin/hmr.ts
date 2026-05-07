import type { ViteDevServer } from "vite";
import { VIRTUAL_MODULE_IDS } from "./constants";

export function invalidateVirtualModules(server: ViteDevServer): void {
  for (const id of VIRTUAL_MODULE_IDS) {
    const moduleNode = server.moduleGraph.getModuleById(`\0${id}`);
    if (moduleNode) {
      server.moduleGraph.invalidateModule(moduleNode);
    }
  }
}
