import { defineConfig } from "vite";
import { docspress } from "vite-plugin-docspress";

export default defineConfig({
  plugins: [docspress({ docsDir: "src/docs", framework: "vanilla" })],
});
