import type { ComponentType, ReactNode } from "react";
import type { DocspressRoute } from "../core/routing";

export type SidebarComponent = ComponentType | ReactNode;

export interface SidebarLink {
  label: string;
  path?: string;
  file?: string;
}

export interface SidebarGroup {
  heading: string;
  items: SidebarLink[];
}

export type SidebarItem = SidebarLink | SidebarGroup;

export interface SidebarConfig {
  items: SidebarItem[];
  header?: SidebarComponent;
  footer?: SidebarComponent;
}

export interface ResolvedSidebarLink {
  type: "link";
  label: string;
  path: string;
  file?: string;
}

export interface ResolvedSidebarGroup {
  type: "group";
  heading: string;
  items: ResolvedSidebarLink[];
}

export type ResolvedSidebarItem = ResolvedSidebarLink | ResolvedSidebarGroup;

export interface ResolvedSidebarConfig {
  items: ResolvedSidebarItem[];
  header?: SidebarComponent;
  footer?: SidebarComponent;
}

export function createSidebar(config: SidebarConfig): SidebarConfig {
  return config;
}

export function resolveSidebar(
  routes: readonly DocspressRoute[],
  sidebar?: SidebarConfig,
): ResolvedSidebarConfig {
  if (!sidebar) {
    return { items: routes.filter(isNavigableRoute).map(routeToLink) };
  }

  return {
    ...sidebar,
    items: sidebar.items.flatMap((item) => resolveSidebarItem(item, routes)),
  };
}

function resolveSidebarItem(
  item: SidebarItem,
  routes: readonly DocspressRoute[],
): ResolvedSidebarItem[] {
  if ("items" in item) {
    return [
      {
        type: "group",
        heading: item.heading,
        items: item.items.flatMap((link) => resolveSidebarLink(link, routes)),
      },
    ];
  }

  return resolveSidebarLink(item, routes);
}

function resolveSidebarLink(
  item: SidebarLink,
  routes: readonly DocspressRoute[],
): ResolvedSidebarLink[] {
  const route = item.path
    ? routes.find((candidate) => candidate.path === item.path)
    : routes.find((candidate) => candidate.file === item.file);

  const path = item.path ?? route?.path;

  if (!path) {
    return [];
  }

  return [
    {
      type: "link",
      label: item.label,
      path,
      file: item.file ?? route?.file,
    },
  ];
}

function isNavigableRoute(route: DocspressRoute): boolean {
  return !route.path.includes(":");
}

function routeToLink(route: DocspressRoute): ResolvedSidebarLink {
  return {
    type: "link",
    label: labelFromPath(route.path),
    path: route.path,
    file: route.file,
  };
}

function labelFromPath(pathname: string): string {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "Docs";
  return lastSegment
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
