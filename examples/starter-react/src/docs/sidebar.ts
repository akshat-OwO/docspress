import { createElement } from "react";
import { createSidebar } from "vite-plugin-docspress";

function SidebarHeader() {
  return createElement(
    "div",
    undefined,
    createElement("strong", { "data-docspress-brand": true }, "Docspress"),
    createElement("p", { style: { color: "#7a6f61", margin: "6px 0 0" } }, "React starter"),
  );
}

function SidebarFooter() {
  return createElement(
    "small",
    { style: { color: "#7a6f61" } },
    "Powered by the Docspress Vite plugin.",
  );
}

export default createSidebar({
  header: SidebarHeader,
  footer: SidebarFooter,
  items: [
    {
      heading: "Start here",
      items: [
        { label: "Overview", file: "/index.mdx" },
        { label: "Getting started", file: "/getting-started.mdx" },
      ],
    },
    {
      heading: "Guides",
      items: [
        { label: "Guide", file: "/guide/index.mdx" },
        { label: "About pathless routes", file: "/_layout.about.mdx" },
      ],
    },
    {
      heading: "Blogs",
      items: [{ label: "Hello World", file: "/blog/$slug.mdx" }],
    },
  ],
});
