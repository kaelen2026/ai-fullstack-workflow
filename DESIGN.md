# Design System — ai-fullstack-workflow

> Apple-flavored, Human Interface Guidelines minimal. Quiet until you touch it.
> Read this before any visual or UI change. Don't deviate without explicit user approval.

## Product Context

- **What this is:** A type-safe full-stack todos app — per-user task list with auth.
- **Who it's for:** End users managing personal todos; also the reference app for this monorepo template.
- **Space/industry:** Productivity / personal task management.
- **Project type:** Web app (Next.js 16 App Router, Tailwind v4, shadcn/ui).

## Aesthetic Direction

- **Direction:** Refined minimal, Apple HIG flavored.
- **Decoration level:** Minimal. Typography, whitespace, and hairline separators do the work. One signature material: frosted translucency on the sticky header.
- **Mood:** Calm and confident. Content floats on neutral surfaces; a single blue accent carries all intent. The interface stays quiet until interacted with.
- **Reference:** apple.com, iOS Settings (grouped lists), Apple Human Interface Guidelines.

## Typography

The genuinely-Apple choice is the **San Francisco system stack** — it renders real SF on Apple
hardware and falls back to a clean grotesque elsewhere. This is the one intentional exception to
"avoid system fonts": system fonts *are* the Apple look.

- **Display/Hero:** `-apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", sans-serif` — semibold (590–600), tight tracking `-0.02em`.
- **Body:** same stack — regular (400), tracking `-0.01em`, line-height `1.5`.
- **UI/Labels:** same stack — medium (500) for buttons and labels.
- **Data/Tables:** same stack with `font-variant-numeric: tabular-nums` for aligned numbers.
- **Code/IDs:** `"SF Mono", "JetBrains Mono", ui-monospace, monospace`.
- **Loading:** No web fonts needed — the system stack is native and zero-latency. (Do **not** pull Inter/Roboto; they break the SF rendering on Apple devices.)
- **Scale (rem, 16px base):** caption `0.75` · footnote `0.8125` · body `1.0` · callout `1.0625` · title3 `1.25` · title2 `1.375` · title1 `1.75` · large `2.125` · display `3.0`. Headings use `font-semibold` + `tracking-tight`.

## Color

Apple never uses pure black on pure white. These are the signature values.

**Light**

- **Background:** `#FFFFFF` — `oklch(1 0 0)`
- **Grouped surface:** `#F5F5F7` (apple.com gray) — `oklch(0.967 0.001 286)`
- **Card:** `#FFFFFF` — `oklch(1 0 0)`
- **Primary text:** `#1D1D1F` (Apple near-black, never `#000`) — `oklch(0.21 0.006 285)`
- **Muted text:** `#6E6E73` — `oklch(0.55 0.006 286)`
- **Accent (systemBlue):** `#0071E3` (apple.com) — `oklch(0.585 0.176 256)` — the only chromatic color in the UI.
- **Hairline / separator / border:** `#D2D2D7` — `oklch(0.873 0.002 286)`

**Dark**

- **Background:** `#000000` — `oklch(0 0 0)`
- **Elevated surface:** `#1C1C1E` — `oklch(0.21 0.004 286)`
- **Tertiary surface / card:** `#2C2C2E` — `oklch(0.27 0.004 286)`
- **Primary text:** `#F5F5F7` — `oklch(0.967 0.001 286)`
- **Muted text:** `#98989D` — `oklch(0.68 0.006 286)`
- **Accent:** `#0A84FF` (brightens for dark) — `oklch(0.62 0.19 256)`
- **Separator:** `oklch(1 0 0 / 12%)`

**Semantic (both modes)**

- success `#34C759` · warning/destructive `#FF3B30` · caution `#FF9500` · info = accent blue

- **Approach:** Restrained. Neutrals everywhere; blue is rare and meaningful. Color signals action and state, nothing decorative.
- **Dark mode:** True black base with stepped elevated surfaces (iOS pattern), accent brightened ~10%.

## Spacing

- **Base unit:** 8px (Apple 8pt grid). 4px allowed for tight inline gaps.
- **Density:** Comfortable — rows and cards breathe.
- **Scale (px):** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout

- **Approach:** Grid-disciplined, centered single column.
- **Grid:** Single column, centered. Content max-width `36rem` (`max-w-xl`) for the app surface.
- **Max content width:** `36rem` app / `64rem` marketing.
- **Border radius (continuous / squircle feel):** input & button `12px` · card `18px` · grouped-list container `18px` · pill/full `9999px`.
- **Signature pattern — iOS grouped list:** todos live in one rounded container (`18px`) with hairline dividers between rows, not separate floating cards. Mirrors iOS Settings.

## Motion

- **Approach:** Restrained, spring-like. Motion aids comprehension; never decorative.
- **Easing:** standard `cubic-bezier(0.4, 0, 0.2, 1)` · enter `ease-out` · exit `ease-in`.
- **Duration:** micro 100ms · short 200ms · medium 300ms · long 350ms.
- **Signature interactions:** press feedback `active:scale-[0.98]`; frosted sticky header via `backdrop-blur` over a translucent surface (`bg-background/70`), the way iOS navigation bars work.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-02 | Initial Apple design system created | Created by /design-consultation. Apple HIG direction chosen by user; SF system stack, single blue accent, 8pt grid, frosted header + iOS grouped-list todos. Tokens grounded in apple.com / iOS system values and mapped to the existing oklch CSS variables. |
