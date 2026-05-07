export const docspressStyles = `
  :root {
    color: #172033;
    background: #f7f4ee;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  body {
    margin: 0;
  }

  [data-docspress-shell],
  [data-docspress-shell] * {
    box-sizing: border-box;
  }

  [data-docspress-shell] {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    min-height: 100vh;
  }

  [data-docspress-sidebar] {
    border-right: 1px solid #ded7cb;
    padding: 32px;
    background: #fffaf2;
  }

  [data-docspress-sidebar-header] {
    margin-bottom: 28px;
  }

  [data-docspress-brand] {
    display: block;
    color: #172033;
    font-size: 1.08rem;
    font-weight: 700;
  }

  [data-docspress-nav] {
    display: grid;
    gap: 18px;
  }

  [data-docspress-group] {
    display: grid;
    gap: 8px;
  }

  [data-docspress-group-heading] {
    color: #7a6f61;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-docspress-links] {
    display: grid;
    gap: 6px;
  }

  [data-docspress-link] {
    border-radius: 12px;
    color: #334155;
    padding: 10px 12px;
    text-decoration: none;
  }

  [data-docspress-link][aria-current="page"] {
    background: #172033;
    color: white;
  }

  [data-docspress-sidebar-footer] {
    margin-top: 32px;
  }

  [data-docspress-content] {
    width: min(820px, calc(100vw - 64px));
    padding: 56px 32px;
  }

  [data-docspress-content] h1 {
    margin-top: 0;
    color: #111827;
    font-size: clamp(2.4rem, 6vw, 4.8rem);
    line-height: 0.95;
  }

  [data-docspress-content] p,
  [data-docspress-content] li {
    color: #445066;
    font-size: 1.05rem;
    line-height: 1.75;
  }

  [data-docspress-content] code {
    border-radius: 6px;
    background: #eee7db;
    padding: 0.15em 0.35em;
  }

  @media (max-width: 720px) {
    [data-docspress-shell] {
      grid-template-columns: 1fr;
    }

    [data-docspress-sidebar] {
      border-right: 0;
      border-bottom: 1px solid #ded7cb;
    }
  }
`;
