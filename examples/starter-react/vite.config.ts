import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { docspress } from "vite-plugin-docspress";

export default defineConfig({
  plugins: [docspress(), mdx(), react()],
});
