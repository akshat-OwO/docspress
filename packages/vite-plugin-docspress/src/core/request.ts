/** Minimal shape for HTML Accept header checks (Node/Connect compatible). */
export interface RequestWithAcceptHeader {
  headers: IncomingMessageHeadersLike;
}

interface IncomingMessageHeadersLike {
  accept?: string | string[] | undefined;
}

export function isDocsRequest(requestPath: string, basePath: string): boolean {
  if (basePath === "/") {
    return requestPath.startsWith("/");
  }

  return requestPath === basePath || requestPath.startsWith(`${basePath}/`);
}

export function acceptsHtml(req: RequestWithAcceptHeader): boolean {
  const acceptHeader = req.headers.accept;
  if (acceptHeader === undefined) {
    return false;
  }

  if (typeof acceptHeader === "string") {
    return acceptHeader.includes("text/html");
  }

  return acceptHeader.some((part) => part.includes("text/html"));
}
