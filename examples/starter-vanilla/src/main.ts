import { mountDocspress } from "vite-plugin-docspress/client";
import { routes } from "virtual:docspress/html-routes";

mountDocspress({
  routes,
  title: "Docspress Vanilla",
});
