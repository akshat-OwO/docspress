import { describe, expect, it } from "vitest";
import { createDocspressPlugin } from "@src/plugin/create-plugin";

describe("createDocspressPlugin", () => {
  it("contributes optimizeDeps and ssr config", () => {
    const plugin = createDocspressPlugin();
    expect(plugin.config).toBeDefined();

    type ConfigEnv = { command: string; mode: string };
    const merged = (
      plugin.config as (
        config: Record<string, unknown>,
        env: ConfigEnv,
      ) => Record<string, unknown>
    )({}, { command: "serve", mode: "development" });
    expect(merged).toMatchObject({
      optimizeDeps: { exclude: ["vite-plugin-docspress"] },
      ssr: { noExternal: ["vite-plugin-docspress"] },
    });
  });

  it("exposes the vite plugin name", () => {
    const plugin = createDocspressPlugin();
    expect(plugin.name).toBe("vite-plugin-docspress");
  });

  it("resolves virtual route module ids", () => {
    const plugin = createDocspressPlugin();
    const resolveId = plugin.resolveId;
    expect(resolveId).toBeDefined();
    if (typeof resolveId !== "function") {
      throw new Error("expected resolveId function");
    }

    const resolver = resolveId as (id: string, importer?: string, options?: { ssr?: boolean }) => string | undefined;

    const resolved = resolver("virtual:docspress/routes");
    expect(resolved?.startsWith("\u0000")).toBe(true);
    expect(resolved).toContain("virtual:docspress/routes");
    expect(resolver("not-virtual")).toBeUndefined();
  });
});
