import { createRoot } from "react-dom/client";
import { DocspressRouter } from "vite-plugin-docspress/react";
import { routes } from "virtual:docspress/react-routes";
import { sidebar } from "virtual:docspress/sidebar";

createRoot(document.querySelector<HTMLElement>("#app")!).render(
  <DocspressRouter routes={routes} sidebar={sidebar} title="Docspress React" />,
);
