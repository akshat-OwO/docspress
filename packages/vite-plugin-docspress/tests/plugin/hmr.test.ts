import { describe, expect, it, vi } from "vitest";
import type { ModuleNode, ViteDevServer } from "vite";
import { VIRTUAL_MODULE_IDS } from "@src/plugin/constants";
import { invalidateVirtualModules } from "@src/plugin/hmr";

describe("invalidateVirtualModules", () => {
  it("invalidates every virtual docspress module that exists in the graph", () => {
    const invalidated: ModuleNode[] = [];
    const getModuleById = vi.fn((id: string) => {
      if (id.startsWith("\0virtual:docspress/")) {
        return { id, url: id } as ModuleNode;
      }
      return undefined;
    });

    const invalidateModule = vi.fn((node: ModuleNode) => {
      invalidated.push(node);
    });

    const server = {
      moduleGraph: { getModuleById, invalidateModule },
    };

    invalidateVirtualModules(server as unknown as ViteDevServer);

    expect(getModuleById).toHaveBeenCalled();
    expect(invalidateModule).toHaveBeenCalledTimes(VIRTUAL_MODULE_IDS.length);
    expect(VIRTUAL_MODULE_IDS.every((id) =>
      invalidated.some((n) => n.id === `\0${id}`),
    )).toBe(true);
  });
});
