import type { ComponentType, ReactElement } from "react";
import { routes } from "virtual:docspress/react-routes";
import { sidebar } from "virtual:docspress/sidebar";
import { config } from "virtual:docspress/config";
import { DocspressRouter } from "./react";

export interface DocspressAppProps {
  initialPathname?: string;
  initialPage?: ComponentType;
}

export function DocspressApp({
  initialPathname,
  initialPage,
}: DocspressAppProps): ReactElement {
  return (
    <DocspressRouter
      initialPage={initialPage}
      initialPathname={initialPathname}
      routes={routes}
      sidebar={sidebar}
      title={config.title}
    />
  );
}

export { config, routes };
