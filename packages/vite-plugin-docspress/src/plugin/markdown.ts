import fs from "node:fs/promises";
import { marked } from "marked";

export async function renderMarkdownFile(file: string): Promise<string> {
  const source = await fs.readFile(file, "utf8");
  return renderMarkdownSource(source);
}

export async function renderMarkdownSource(source: string): Promise<string> {
  return String(await marked.parse(stripMdxOnlySyntax(source)));
}

export function stripMdxOnlySyntax(source: string): string {
  return source
    .replace(/^---[\s\S]*?\n---\s*/u, "")
    .split("\n")
    .filter((line) => !/^\s*(import|export)\s/u.test(line))
    .join("\n");
}
