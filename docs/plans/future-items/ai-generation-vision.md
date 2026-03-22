# Kanava AI Image Generation — Vision Document

> **Status**: Vision / Future Phase  
> **Priority**: P2 — Beyond current Master Implementation Plan scope  
> **Dependencies**: Core image block, React ImageInsertPopover, plugin architecture

## Overview

Add AI-powered image generation capabilities to Kanava as an **optional add-on**,
allowing users to generate, edit, and enhance images using natural language prompts
directly within the editor.

## Architecture: `@kanava/ai` Package

A **separate npm package** keeps AI concerns isolated, tree-shakeable, and optional:

```
@kanava/ai/
  src/
    providers/
      openai.ts          ← DALL-E 3 / GPT-Image
      stability.ts       ← Stable Diffusion API
      replicate.ts       ← Replicate API
      custom.ts          ← Generic REST endpoint
    createAIProvider.ts  ← Provider factory / interface
    types.ts             ← AIImageProvider, AIGenerateOptions, AIEditOptions
    index.ts
```

### Provider Interface

```ts
interface AIImageProvider {
  name: string;
  generate(prompt: string, options?: AIGenerateOptions): Promise<AIImageResult>;
  edit?(image: Blob, prompt: string, options?: AIEditOptions): Promise<AIImageResult>;
  variations?(image: Blob, count?: number): Promise<AIImageResult[]>;
}

interface AIGenerateOptions {
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  style?: "natural" | "vivid";
  model?: string;
  n?: number;
}

interface AIImageResult {
  url: string;         // Temporary URL or data URI
  revisedPrompt?: string;
}
```

## Integration Points

### Tier 1: `@kanava/editor` (Headless)

- New event type: `aiImageGenerate` with payload `{ pos, prompt }`
- The core package **does not** import `@kanava/ai` — it only emits events

### Tier 2: `@kanava/editor-react` (Batteries-Included)

- **ImageInsertPopover**: Add 3rd tab `✨ Generate` alongside URL and Upload
- **AIGeneratePanel**: Prompt input, size/style options, preview, insert
- **AIEditPanel**: Select existing image → describe edits in natural language

### Tier 3: App Layer

Developer provides the API configuration:

```tsx
import { KanavaEditorComponent } from "@kanava/editor-react";
import { createOpenAIProvider } from "@kanava/ai";

const aiProvider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  // Or proxy through your own backend:
  // endpoint: "/api/ai/generate",
});

<KanavaEditorComponent
  aiProvider={aiProvider}
  // ...other props
/>
```

## UX Flow

1. User clicks empty image block → **ImageInsertPopover** appears
2. User selects **✨ Generate** tab
3. Types prompt: *"A serene mountain landscape at sunset, watercolor style"*
4. Clicks **Generate** → loading spinner
5. Preview appears in the popover → **Insert** button
6. Image inserted into the block

For existing images:
1. User opens **Edit Image** modal on populated image
2. New **✨ AI Edit** tab alongside Crop/Filters/Adjust/Rotate
3. Types prompt: *"Remove the background"* or *"Make the sky more dramatic"*
4. Preview appears → **Apply**

## Security Considerations

- **API keys never ship in the bundle** — always provided at runtime by developer
- Recommend backend proxy (`/api/ai/generate`) to avoid exposing keys client-side
- Content moderation: provider-level filtering (OpenAI already does this)
- Rate limiting: developer-configurable at app layer

## Implementation Phases

### Phase A: Foundation
- [ ] Create `@kanava/ai` package scaffold
- [ ] Define `AIImageProvider` interface + factory
- [ ] Implement OpenAI provider
- [ ] Add `aiImageGenerate` event to core

### Phase B: React Integration
- [ ] `AIGeneratePanel` component (prompt → generate → preview)
- [ ] 3rd tab in `ImageInsertPopover`
- [ ] Loading states + error handling
- [ ] Size/style options UI

### Phase C: AI Image Editing
- [ ] `AIEditPanel` in `ImageEditorModal`
- [ ] Send existing image + prompt to provider's `edit()` endpoint
- [ ] Before/after preview comparison
- [ ] Undo integration (ProseMirror transaction-based)

### Phase D: Additional Providers
- [ ] Stability AI provider
- [ ] Replicate provider
- [ ] Custom endpoint provider (generic REST)
- [ ] Provider auto-detection from config

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| A | 2-3 days | None |
| B | 2-3 days | Phase A |
| C | 3-4 days | Phase B |
| D | 2-3 days | Phase A |

**Total**: ~10-13 days for full AI integration
