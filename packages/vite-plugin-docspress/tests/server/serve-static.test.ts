import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  clientDistContentType,
  isPathInsideDirectory,
  resolveClientDistFile,
} from "@src/server/serve-static";

describe("isPathInsideDirectory", () => {
  it("allows files under the root", () => {
    const dir = path.join("a", "b", "dist");
    const inside = path.join("a", "b", "dist", "chunk.js");
    expect(isPathInsideDirectory(inside, dir)).toBe(true);
  });

  it("rejects traversal via ..", () => {
    const dir = path.normalize("/project/dist");
    const escaped = path.normalize("/project/dist/../secret.js");
    expect(isPathInsideDirectory(escaped, dir)).toBe(false);
  });
});

describe("resolveClientDistFile", () => {
  const dist = path.normalize("/app/dist/client");

  it("returns not_static when there is no file extension", () => {
    expect(resolveClientDistFile(dist, "/docs")).toEqual({ kind: "not_static" });
  });

  it("returns outside for path traversal under a pretend static path", () => {
    expect(resolveClientDistFile(dist, "/x/../../../evil.css")).toEqual({ kind: "outside" });
  });

  it("resolves normal static assets", () => {
    const r = resolveClientDistFile(dist, "/assets/main-abc.js");
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.file).toBe(path.join(dist, "assets", "main-abc.js"));
    }
  });

  it("decodes percent-encoded path segments", () => {
    const r = resolveClientDistFile(dist, "/file%20name.css");
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.file).toBe(path.join(dist, "file name.css"));
    }
  });
});

describe("clientDistContentType", () => {
  it("maps common extensions", () => {
    expect(clientDistContentType("a.css")).toBe("text/css");
    expect(clientDistContentType("a.js")).toBe("text/javascript");
    expect(clientDistContentType("a.svg")).toBe("image/svg+xml");
    expect(clientDistContentType("a.bin")).toBe("application/octet-stream");
  });
});
