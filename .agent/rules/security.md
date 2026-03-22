# Security — Kanava Editor

Rules and safe patterns for handling user input, clipboard content, and HTML rendering.

## Threat model

Kanava runs in the browser and processes user-generated content. The main risks:

1. **XSS via pasted HTML** — Malicious HTML in clipboard data
2. **XSS via stored content** — Malicious attrs or text in saved documents
3. **Prototype pollution** — Manipulated JSON input to `setDocument()`
4. **Script injection via marks** — Link `href` attrs with `javascript:` URIs

## How Kanava mitigates XSS

### Schema-based whitelist

ProseMirror's schema acts as a structural whitelist. Only node types and mark types defined in the schema are accepted. The `parseDOM` rules in each block/mark definition determine which HTML elements and attributes are recognized during paste.

- Pasted HTML is parsed through ProseMirror's `DOMParser` using the schema — unrecognized elements are stripped
- Only attrs defined in the `spec.attrs` of each node/mark are preserved
- The schema never includes `script`, `style`, `iframe`, `object`, `embed`, or `form` nodes

### Clipboard plugin

> **Source of truth:** [`clipboard.ts`](../packages/core/src/plugins/clipboard.ts)

The clipboard plugin:
- Uses `DOMSerializer.fromSchema()` for copy — only serializes known schema nodes
- `transformPastedHTML` hook strips zero-width characters
- `clipboardTextParser` wraps plain text in blockNodes (no raw HTML)
- `transformPasted` clears block IDs so fresh IDs are assigned

### NodeView DOM creation

NodeViews use `document.createElement()` — never `innerHTML` with user content. The only `innerHTML` usage is for static SVG icons (hardcoded strings, no user input).

## Safe patterns

### DO ✅

- Use `this.el(tag, className)` in NodeViews to create DOM elements
- Use `node.textContent` for reading text — not `innerHTML`
- Validate attrs with default values in `spec.attrs`: `{ level: { default: 1 } }`
- Use ProseMirror's `DOMParser.fromSchema()` for parsing HTML input
- Validate `href` in the Link mark's `parseDOM` — reject `javascript:` URIs

### DON'T ❌

- Never use `innerHTML` with dynamic content from node attrs or user input
- Never use `dangerouslySetInnerHTML` in React components with user data
- Never trust `attrs` from external JSON — always specify `default` values in `spec.attrs`
- Never add `<script>`, `<style>`, `<iframe>` to the schema
- Never store raw HTML strings in block attrs — use structured data

## Link href validation

The `Link` mark should validate `href` to prevent `javascript:` URI injection. Safe pattern:

```ts
parseDOM: [{
  tag: "a[href]",
  getAttrs(dom) {
    const href = (dom as HTMLElement).getAttribute("href") || "";
    // Reject javascript: and data: URIs
    if (/^(javascript|data):/i.test(href.trim())) return false;
    return { href, title: (dom as HTMLElement).getAttribute("title") };
  },
}],
```

## Content sanitization for `setDocument()`

When loading content from external sources (database, API), validate:

1. All `block.type` values match a registered block definition name
2. All `mark.type` values match a registered mark definition name
3. `block.id` values are strings (not objects — prevents prototype pollution)
4. `attrs` only contain expected keys with expected value types

The `kanavaToDoc()` function already validates against the schema — unknown types throw errors and fall back to `createEmptyDoc()`.

## Image upload security

The `onImageUpload` callback is user-provided. The editor does not validate the returned URL. Consumers should:

- Validate the returned URL is HTTPS
- Ensure the upload endpoint is authentication-protected
- Consider Content-Security-Policy headers to restrict image sources

## Reporting vulnerabilities

For security vulnerabilities, follow responsible disclosure. Contact the maintainers directly rather than opening a public issue.
