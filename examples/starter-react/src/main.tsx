import "./style.css";
import { createRoot } from "react-dom/client";
import { DocspressRouter } from "vite-plugin-docspress/react";
import { routes } from "virtual:docspress/react-routes";

createRoot(document.querySelector<HTMLElement>("#app")!).render(
  <DocspressRouter routes={routes} title="Docspress React" />,
);
