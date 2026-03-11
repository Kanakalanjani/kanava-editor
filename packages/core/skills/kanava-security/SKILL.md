---
name: kanava-security
description: Security patterns for @kanava/editor. Use when handling user-generated content, clipboard data, external document loading, link validation, or image uploads in a Kanava editor.
metadata:
  author: kanava
  version: "1.0"
  package: "@kanava/editor"
---

# Security Patterns for @kanava/editor

## When to use

- Handling user-generated content from untrusted sources
- Loading documents from external APIs or databases
- Implementing image upload handlers
- Validating link URLs
- Understanding Kanava's built-in protections

## Built-in protections

### Schema-based whitelist

ProseMirror's schema acts as a structural whitelist. Only node types and mark types defined in the schema are accepted during paste or content loading.

- Pasted HTML is parsed through `DOMParser.fromSchema()` — unrecognized elements are stripped
- Only attrs defined in `spec.attrs` are preserved
- No `script`, `style`, `iframe`, `object`, `embed`, or `form` nodes exist in the schema

### Clipboard sanitization

The clipboard plugin (`src/plugins/clipboard.ts`):
- Uses `DOMSerializer.fromSchema()` for copy — only serializes known nodes
- Strips zero-width characters from pasted HTML
- Wraps plain text in blockNodes (no raw HTML injection)
- Clears block IDs on paste so fresh IDs are assigned

### DOM creation

NodeViews use `document.createElement()` — never `innerHTML` with dynamic content.

## Safe patterns

### Loading external documents

```ts
// The kanavaToDoc() function validates against the schema
// Unknown types throw and fall back to empty doc
try {
  editor.setDocument(externalDoc);
} catch (e) {
  console.error("Invalid document:", e);
}
```

Validate before loading:
1. All `block.type` values match registered block definition names
2. All `mark.type` values match registered mark definition names
3. `block.id` values are strings (prevents prototype pollution)
4. `attrs` only contain expected keys with expected types

### Link href validation

Validate `href` in the Link mark to prevent `javascript:` URI injection:

```ts
// In parseDOM getAttrs:
const href = dom.getAttribute("href") || "";
if (/^(javascript|data):/i.test(href.trim())) return false;
```

### Image upload

The `onImageUpload` callback returns a URL that is used as `img.src`. Ensure:
- Returned URL uses HTTPS
- Upload endpoint requires authentication
- Consider CSP headers to restrict image sources

## Rules for custom blocks

1. **Always set `default` values for attrs** — prevents undefined attr injection
2. **Never use `innerHTML` with user content** — use `document.createElement()`
3. **Use `this.el(tag, class)` in NodeViews** — safe DOM creation helper
4. **Validate attrs in `parseDOM.getAttrs()`** — reject unexpected values
5. **Don't store raw HTML in block attrs** — use structured data only

## What Kanava does NOT protect against

- **Server-side rendering of stored docs** — if you render Kanava JSON to HTML on the server, you must sanitize yourself
- **onImageUpload return values** — the editor trusts the URL you return
- **Custom block innerHTML** — if your custom NodeView uses `innerHTML` with attrs, you're responsible for sanitizing
- **Document content from the editor API** — `getDocument()` returns whatever the user typed; sanitize before storing if needed
