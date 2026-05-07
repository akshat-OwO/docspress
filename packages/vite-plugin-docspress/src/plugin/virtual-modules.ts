import fs from "node:fs/promises";
import path from "node:path";
import { renderMarkdownFile } from "./markdown";
import { normalizeSlashes, type ResolvedDocspressOptions } from "./options";
import { toPublicRoutes, type FileRoute } from "./routes";

export function createConfigModule(options: ResolvedDocspressOptions): string {
  return `export const config = ${JSON.stringify(
    {
      basePath: options.basePath,
      title: options.title,
    },
    null,
    2,
  )};`;
}

export async function createHtmlRoutesModule(routes: FileRoute[]): Promise<string> {
  const htmlRoutes = await Promise.all(
    routes.map(async (route) => ({
      ...toPublicRoutes([route])[0],
      html: await renderMarkdownFile(route.absoluteFile),
    })),
  );

  return [
    `const routeData = ${JSON.stringify(htmlRoutes, null, 2)};`,
    "export const routes = routeData.map(({ html, ...route }) => ({",
    "  ...route,",
    "  load: async () => ({ html }),",
    "}));",
  ].join("\n");
}

export function createReactRoutesModule(routes: FileRoute[]): string {
  const routeLines = routes.map((route) => {
    const publicRoute = toPublicRoutes([route])[0];
    return `  { ...${JSON.stringify(publicRoute)}, load: () => import(${JSON.stringify(route.importPath)}) }`;
  });

  return `export const routes = [\n${routeLines.join(",\n")}\n];`;
}

export async function createSidebarModule(
  root: string,
  options: ResolvedDocspressOptions,
): Promise<string> {
  const sidebarFile = path.resolve(root, options.docsDir, "sidebar.ts");

  try {
    await fs.access(sidebarFile);
  } catch {
    return "const sidebar = undefined;\nexport { sidebar };\nexport default sidebar;";
  }

  return [
    `import sidebar from ${JSON.stringify(`/@fs/${normalizeSlashes(sidebarFile)}`)};`,
    "export { sidebar };",
    "export default sidebar;",
  ].join("\n");
}
