# Villa Design System

> Premium Apple-like design system for the Mavon Villa Platform.
> Bright white Day Mode ↔ Deep black Night Mode, with Liquid Glass materials and gold as the premium brand accent.

## Principles

1. **Bright white Day Mode** — `#FFFFFF` background, clean and luxurious
2. **Deep black Night Mode** — `#000000` background, iPhone Dark Mode aesthetic
3. **Liquid Glass materials** — Three tiers: navigation, cards, floating
4. **Gold as premium brand accent** — `#D4A72C`, used at 5% ratio
5. **Semantic color tokens** — `bg-card`, `text-foreground`, never `bg-white`
6. **Shared components only** — No page-specific theme colors
7. **No page-specific theme colors** — All colors via CSS variables
8. **Consistent radius system** — 20px card default, 12px buttons/inputs
9. **Subtle Apple-like motion** — translateY(-2px) on hover, not -10px
10. **Accessibility before aesthetics**

## Architecture

```
DESIGN TOKENS
     ↓
   THEMES
     ↓
UI PRIMITIVES
     ↓
GLASS COMPONENTS
     ↓
SHARED COMPONENTS
     ↓
FEATURE COMPONENTS
     ↓
   PAGES
```

Never reverse this hierarchy.

## Gold Accent Usage

Gold should feel luxurious, not decorative. Use **only** for:

- Active navigation items
- Selected dates
- Primary CTA buttons
- Booking highlights
- Important numbers
- Logo accent
- Selected state indicators
- Premium indicators

**Ratio**: 85% background / 10% neutral / 5% gold

## Forbidden Patterns

```tsx
// ❌ NEVER do this in feature pages:
<div className="bg-white text-black border-gray-200">
<div className="bg-[#123456] text-[#abcdef]">
<div className="dark:bg-zinc-950">

// ✅ ALWAYS use semantic tokens:
<div className="bg-card text-foreground border-border">
<div className="bg-muted text-muted-foreground">
<div className="text-primary">  // gold accent
```

## Quick Reference

| Token | Day | Night |
|-------|-----|-------|
| `--background` | `#FFFFFF` | `#000000` |
| `--foreground` | `#1D1D1F` | `#F5F5F7` |
| `--card` | `#FFFFFF` | `#0B0B0D` |
| `--muted` | `#F5F5F7` | `#151517` |
| `--muted-foreground` | `#6E6E73` | `#98989D` |
| `--border` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.10)` |
| `--primary` | `#D4A72C` | `#D4A72C` |
| `--success` | `#34C759` | `#30D158` |
| `--danger` | `#FF3B30` | `#FF453A` |
| `--warning` | `#FF9500` | `#FF9F0A` |
| `--info` | `#007AFF` | `#0A84FF` |

## Glass Materials

| Level | Opacity | Blur | Use For |
|-------|---------|------|---------|
| `glass-nav` | 72% | 24px | Sidebar, header |
| `glass-card` | 78% | 20px | Content cards |
| `glass-floating` | 62% | 28px | Modals, popovers |
| `glass-subtle` | 88% | 12px | Forms, inputs |

**Don't overdo glass.** Tables should be mostly solid, not every element frosted.

## Radius Scale

| Token | Value | Used By |
|-------|-------|---------|
| `--radius-xs` | 8px | Small elements |
| `--radius-sm` | 12px | Buttons, inputs |
| `--radius-md` | 16px | |
| `--radius-lg` | 20px | Cards (default) |
| `--radius-xl` | 24px | Large cards, sidebar |
| `--radius-2xl` | 28px | Modals |
| `--radius-full` | 9999px | Badges, pills |

## Typography

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
  "SF Pro Text", Inter, system-ui, sans-serif;
```

| Scale | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 32px | 600 | Page titles |
| Heading | 18px | 600 | Card headings |
| Body | 14px | 400 | Primary text |
| Caption | 12px | 400 | Metadata |
| Overline | 11px | 600 | Badges, labels |

## Theme Switching

```tsx
// In your layout:
<ThemeProvider defaultTheme="dark">
  <App />
</ThemeProvider>

// To switch themes:
const { setTheme } = useThemeStore();
setTheme('light');   // Day mode
setTheme('dark');    // Night mode
setTheme('system');  // Follow OS preference
```

## Adding a New App

1. Add `@villa-platform/design-system` to your dependencies
2. Import in your globals.css:
   ```css
   @import "tailwindcss";
   @import "@villa-platform/design-system/index.css";
   ```
3. Wrap your layout in `<ThemeProvider>`
4. Use semantic tokens everywhere — no hard-coded colors
