import { describe, expect, it } from "vitest";
import {
  CONFIG_MODULE_ID,
  HTML_ROUTES_MODULE_ID,
  REACT_ROUTES_MODULE_ID,
  ROUTES_MODULE_ID,
  SIDEBAR_MODULE_ID,
  VIRTUAL_MODULE_IDS,
} from "@src/plugin/constants";

describe("virtual module ids", () => {
  it("uses stable virtual: prefixed identifiers", () => {
    expect(ROUTES_MODULE_ID).toBe("virtual:docspress/routes");
    expect(HTML_ROUTES_MODULE_ID).toBe("virtual:docspress/html-routes");
    expect(REACT_ROUTES_MODULE_ID).toBe("virtual:docspress/react-routes");
    expect(SIDEBAR_MODULE_ID).toBe("virtual:docspress/sidebar");
    expect(CONFIG_MODULE_ID).toBe("virtual:docspress/config");
  });

  it("lists every invalidate id once", () => {
    expect(VIRTUAL_MODULE_IDS).toHaveLength(5);
    expect(new Set(VIRTUAL_MODULE_IDS).size).toBe(5);
  });
});
