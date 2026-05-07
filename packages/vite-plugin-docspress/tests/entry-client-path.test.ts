import path from "node:path";
import { describe, expect, it } from "vitest";
import { ENTRY_CLIENT_FILE } from "@src/runtime/entry-client-path";

describe("ENTRY_CLIENT_FILE", () => {
  it("is an absolute path to the client entry bundle filename", () => {
    expect(ENTRY_CLIENT_FILE).toMatch(/entry-client\.js$/);
    expect(path.isAbsolute(ENTRY_CLIENT_FILE)).toBe(true);
  });
});
