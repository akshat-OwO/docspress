import { describe, expect, it } from "vitest";
import {
  joinRoutePath,
  matchRoute,
  normalizeBasePath,
  routeScore,
  type DocspressRoute,
} from "@src/core/routing";

describe("normalizeBasePath", () => {
  it("adds leading slash and strips trailing slashes", () => {
    expect(normalizeBasePath("docs")).toBe("/docs");
    expect(normalizeBasePath("/docs/")).toBe("/docs");
    expect(normalizeBasePath("/")).toBe("/");
  });
});

describe("joinRoutePath", () => {
  it("returns base when there are no segments", () => {
    expect(joinRoutePath("/docs", [])).toBe("/docs");
  });

  it("joins segments", () => {
    expect(joinRoutePath("/docs", ["guide", "intro"])).toBe("/docs/guide/intro");
  });
});

describe("routeScore", () => {
  it("ranks static segments above params", () => {
    expect(routeScore("/a/b")).toBeGreaterThan(routeScore("/a/:id"));
  });
});

describe("matchRoute", () => {
  const routes: DocspressRoute[] = [
    { id: "a", path: "/docs/foo", file: "/foo.mdx", params: [], score: 20 },
    { id: "b", path: "/docs/:slug", file: "/[slug].mdx", params: ["slug"], score: 11 },
  ];

  it("matches static routes before param routes when more specific", () => {
    const match = matchRoute("/docs/foo", routes);
    expect(match?.route.path).toBe("/docs/foo");
  });

  it("captures param values", () => {
    const match = matchRoute("/docs/bar", routes);
    expect(match?.route.path).toBe("/docs/:slug");
    expect(match?.params).toEqual({ slug: "bar" });
  });

  it("returns undefined when nothing matches", () => {
    expect(matchRoute("/other", routes)).toBeUndefined();
  });
});
