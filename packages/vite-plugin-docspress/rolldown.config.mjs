import { defineConfig } from "rolldown";

export default defineConfig({
  input: {
    app: "src/app.tsx",
    cli: "src/cli.ts",
    index: "src/index.ts",
    client: "src/client.ts",
    "entry-client": "src/entry-client.tsx",
    "entry-server": "src/entry-server.tsx",
    react: "src/react.tsx",
    server: "src/server.ts",
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
