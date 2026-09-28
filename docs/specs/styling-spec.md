# Styling & Theme Guidelines

Companion to [app-architecture-spec.md](./app-architecture-spec.md)'s Styling Strategy section. Defines the design-token palette and UI patterns for status visualization, action density, tables, and iconography. All tokens are CSS custom properties in `app/src/index.css`; components consume them via `css()` (`@pokedb2/css-in-js`) per the existing "define once, use everywhere" rule — never hardcode colors in a component.

## Problems this addresses

- Only two text tones exist today (`--color-text`, `--color-text-muted`), so most copy renders at full brightness and the UI reads as flat/white-heavy.
- Caught/Missed/Eliminated encounters are indistinguishable except for a uniform `opacity: 0.6` fade on the whole card — no color signal for the outcome.
- Encounter/party action rows show up to 4-5 buttons at once (Caught/Missed/Eliminated/Clear, or the party-management cluster in `PokemonDetailPane.tsx`).
- Tables (`EncounterTable.tsx`) have no row-to-row visual separation beyond a bottom border.
- Emoji is used well in a few places (Roll/Randomize actions, "include ocean encounters") but has no documented convention, risking overuse.

## New design tokens

Add to `app/src/index.css`, mirrored in both the default (dark) `:root` block and the `:root[data-theme="light"]` override block, following the existing naming convention (`--color-*`):

| Token | Purpose |
|---|---|
| `--color-text-secondary` | Tertiary text tone between `--color-text` and `--color-text-muted`, for body copy that shouldn't compete with headings/titles. |
| `--color-primary` | Violet primary color for buttons and structural emphasis. |
| `--color-accent` | Scarlet accent color. |
| `--color-accent-warm` | Warm gold/orange accent for primary "roll" actions (Randomize/Roll Encounter/Roll Starter), distinct from `--color-primary`. |
| `--color-success` / `--color-success-bg` | Caught status — saturated text/icon color plus a subtle tinted background for chips. |
| `--color-warning` / `--color-warning-bg` | Missed status. |
| `--color-danger-bg` | Tinted background companion to the existing `--color-danger`, for Eliminated status chips (reuses `--color-danger` as the text/icon color). |
| `--color-surface-alt` | Slightly offset from `--color-surface`/`--color-bg`, for zebra-striped table rows. |

Guidance for choosing values: status colors should be legible on both dark and light themes, and the `-bg` variants should be subtle tints (low saturation/low opacity), not full solid fills — this matches the pill/chip look from the POC rather than painting whole cards or buttons in solid status colors.

## Status visualization pattern

Replace the flat `opacity: 0.6` "resolved card" fade with a **status chip**: a small colored pill (e.g. "✓ Caught", "✗ Missed", "Eliminated") using the new semantic tokens, shown next to the Pokémon name. This directly signals the outcome instead of uniformly dimming everything, matching the POC's `√ Caught` / `X Failed` treatment.

### Collapsed summary state

Once an encounter resolves (caught/missed/eliminated), its card switches to a compact one-line summary: location name + status chip + Pokémon icon/name only, with the full detail (levels, terrain, table, action buttons) hidden behind an expand affordance (e.g. a chevron/click-to-expand). This serves the common case of only caring about the outcome after moving on in-game, while keeping full detail one click away. Collapse/expand state is derived from `status` and local UI state only — it is not persisted, so a card always starts collapsed-if-resolved on load rather than remembering a per-card user choice.

## Button consolidation

Where an encounter/party card would otherwise show more than ~2 actions at once, move secondary or destructive actions (e.g. Clear, Eliminated) behind a kebab (⋯) overflow menu, keeping only the most common actions (Caught, Missed) as direct buttons. Applies to `RollActions.tsx` and the party-management button cluster in `PokemonDetailPane.tsx`. The overflow menu should dismiss on outside-click/Escape and be keyboard-navigable, consistent with the existing `Modal`/`Drawer` dismissal conventions.

## Table zebra striping

Any table styled via `css()` should alternate row backgrounds using `--color-surface-alt` on `:nth-child(even)` rows, not just `EncounterTable.tsx`. This is a general convention for every future table, not a one-off fix.

## Emoji/iconography guideline

Emoji are allowed as a leading glyph on primary action buttons and toggles to reinforce their meaning (e.g. a dice for Randomize/Roll, a wave for "include ocean encounters") — not as decoration on every button or label. Keep to one glyph per control, and only where it clarifies intent faster than the label alone.

## Backlog (implementation follow-ups, prioritized)

1. Add the new tokens to `app/src/index.css` (dark + light theme blocks).
2. Build a `StatusChip` component and use it in place of the `resolvedCard` opacity-fade pattern (`InletGrotto.tsx`, `PocoPath.tsx`, and sibling per-location progression files); wire it into `RollResult.tsx`.
3. Design and implement the collapsed/summary encounter-card state built on top of the `StatusChip` work.
4. Extract a reusable overflow-menu primitive and apply it to `RollActions.tsx` and `PokemonDetailPane.tsx`.
5. Add zebra striping to `EncounterTable.tsx` using `--color-surface-alt`.
6. Sweep existing components to move appropriate body text from `--color-text` to the new `--color-text-secondary` tone (titles/headings stay at `--color-text`).
