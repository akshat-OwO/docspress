import { describe, expect, it } from "vitest";
import { acceptsHtml, isDocsRequest } from "@src/core/request";

describe("isDocsRequest", () => {
  it("treats root base as all paths under slash", () => {
    expect(isDocsRequest("/anything", "/")).toBe(true);
    expect(isDocsRequest("/", "/")).toBe(true);
  });

  it("matches nested base path", () => {
    expect(isDocsRequest("/docs", "/docs")).toBe(true);
    expect(isDocsRequest("/docs/page", "/docs")).toBe(true);
    expect(isDocsRequest("/doc", "/docs")).toBe(false);
    expect(isDocsRequest("/docsx", "/docs")).toBe(false);
  });

  it("normalizes trailing behavior via basePath caller", () => {
    expect(isDocsRequest("/docs/", "/docs")).toBe(true);
  });
});

describe("acceptsHtml", () => {
  it("matches text/html in a string Accept header", () => {
    expect(acceptsHtml({ headers: { accept: "text/html,application/xhtml+xml" } })).toBe(true);
  });

  it("returns false when accept is missing", () => {
    expect(acceptsHtml({ headers: {} })).toBe(false);
  });

  it("returns false for non-HTML accept", () => {
    expect(acceptsHtml({ headers: { accept: "application/json" } })).toBe(false);
  });

  it("matches when Accept is an array of header lines", () => {
    expect(
      acceptsHtml({
        headers: { accept: ["text/html,application/xhtml+xml", "image/webp"] },
      }),
    ).toBe(true);
  });

  it("returns false when array has no HTML hint", () => {
    expect(acceptsHtml({ headers: { accept: ["application/json"] } })).toBe(false);
  });
});
