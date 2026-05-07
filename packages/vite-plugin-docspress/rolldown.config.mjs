import { defineConfig } from "rolldown";

export default defineConfig({
  input: {
    index: "src/index.ts",
    client: "src/client.ts",
    react: "src/react.tsx",
    sidebar: "src/sidebar.ts",
    virtual: "src/virtual.ts",
  },
  external: (id) => !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0"),
  output: {
    dir: "dist",
    entryFileNames: "[name].js",
    format: "esm",
  },
});
