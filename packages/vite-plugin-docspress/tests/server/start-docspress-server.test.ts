import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { startDocspressSsrServer } from "@src/server";

function httpGet(hostname: string, port: number, requestPath: string, headers: Record<string, string>) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    http
      .get(
        {
          hostname,
          port,
          path: requestPath,
          headers,
        },
        (res) => {
          let body = "";
          res.on("data", (c: Buffer | string) => {
            body += String(c);
          });
          res.on("end", () => {
            resolve({ status: res.statusCode ?? 0, body });
          });
        },
      )
      .on("error", reject);
  });
}

describe("startDocspressSsrServer", () => {
  let server: http.Server | undefined;

  afterEach(async () => {
    await new Promise<void>((r) => server?.close(() => r()));
    server = undefined;
  });

  it("serves a hashed static file when Accept is not HTML (production)", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "docspress-http-"));
    const clientDist = path.join(root, "client");
    await fs.mkdir(clientDist, { recursive: true });
    await fs.writeFile(path.join(clientDist, "index.html"), "<!doctype html><!--app-html-->", "utf8");
    await fs.writeFile(path.join(clientDist, "theme.css"), "body{}", "utf8");

    server = await startDocspressSsrServer({
      root,
      isProduction: true,
      clientDist,
      serverEntry: path.join(root, "no-server-bundle.js"),
      port: 0,
      host: "127.0.0.1",
    });

    const addr = server.address();
    if (!addr || typeof addr === "string") {
      throw new Error("expected listener address object");
    }

    const { status, body } = await httpGet("127.0.0.1", addr.port, "/theme.css", {
      Accept: "*/*",
    });

    expect(status).toBe(200);
    expect(body).toBe("body{}");
  });
});
