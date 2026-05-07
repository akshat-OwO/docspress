import type { ReactNode } from "react";

export function Callout({ children }: { children: ReactNode }) {
  return (
    <aside
      style={{
        background: "white",
        border: "1px solid rgba(23, 32, 51, 0.16)",
        borderRadius: 18,
        boxShadow: "0 18px 50px rgba(23, 32, 51, 0.12)",
        margin: "28px 0",
        padding: "18px 20px",
      }}
    >
      {children}
    </aside>
  );
}
