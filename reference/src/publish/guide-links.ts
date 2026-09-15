/**
 * Where a mapping, and a single row of a mapping, is published in the guide.
 *
 * This module is the **one** declaration of that fact. The renderer reads it to
 * decide which page a summary row links to and which anchor ids it emits; the
 * browser facade reads it to decide where a converter issue points. A second
 * copy anywhere — in the renderer, in a page, or in a consuming site — is a
 * review Blocker, because the guide and any tool built on it would then be free
 * to disagree about where a mapping row lives.
 *
 * **It is browser-safe by construction.** It imports nothing but types from
 * `../model/types.ts`: no `node:` builtin, no renderer module, no `load.ts`.
 * That is what lets a bundled browser build import it without pulling the
 * Node-only rendering pipeline in behind it.
 *
 * The anchor strings below are a **published link surface**. Once a guide is
 * released, an `id` the renderer emits is what inbound links and this
 * repository's own tooling point at, so changing the scheme moves every one of
 * them. Treat it the way `AGENTS.md` § *Architectural invariants* treats a
 * canonical URL: a non-compatible change, recorded as such.
 */

import type { Category, Direction, Mapping } from '../model/types.ts';

/** The page each category's mappings are published on. */
export const CATEGORY_PAGE: Readonly<Record<Category, string>> = {
  quantity: 'mapping-quantity.html',
  coded: 'mapping-coded.html',
  boolean: 'mapping-boolean.html',
  numeric: 'mapping-numeric.html',
  textual: 'mapping-textual.html',
  reference: 'mapping-reference.html',
  temporal: 'mapping-temporal.html',
  other: 'mapping-other.html',
  gaps: 'gaps.html',
};

/** Human-readable category names, for table cells and headings. */
export const CATEGORY_LABEL: Readonly<Record<Category, string>> = {
  quantity: 'Quantities',
  coded: 'Coded Data',
  boolean: 'Boolean Data',
  numeric: 'Numeric Primitives',
  textual: 'Textual Data',
  reference: 'Resource-Locator Data and References',
  temporal: 'Temporal Data',
  other: 'Other Data',
  gaps: 'Gaps',
};

/** The direction labels, so tests, renderers, and consumers agree on them. */
export const DIRECTION_LABEL: Readonly<Record<Direction, string>> = {
  toFhir: '→ FHIR',
  toOpenehr: '→ openEHR',
};

/**
 * Whether the guide publishes a per-mapping field table for this mapping.
 *
 * This mirrors the rule in `regionRenderers()`: the `gaps` category's rows are
 * published by the four `gaps:*` inventories, which derive their tables from
 * the whole ledger, so no `mapping:` region is registered for them. Without
 * this guard a link would carry a fragment for an anchor the guide never
 * emits — a dead link that looks exactly like a working one.
 */
export function hasFieldTable(mapping: Mapping): boolean {
  return mapping.category !== 'gaps';
}

/** Lowercase, non-alphanumerics to `-`, runs collapsed, edges trimmed. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** The `id` the renderer emits on a mapping's field table. */
export function mappingAnchorId(mappingId: string): string {
  return `mapping-${mappingId}`;
}

/**
 * The `id` the renderer emits on one `<tr>` of a mapping's field table.
 *
 * The double separator keeps the two halves legible and unambiguous: a slug
 * never contains a run of two or more `-`, so `--` cannot appear inside either
 * half and the join stays readable in a URL bar.
 */
export function rowAnchorId(mappingId: string, rowId: string): string {
  return `row-${mappingId}--${slugify(rowId)}`;
}

/** The page a mapping is published on. */
export function pageFor(mapping: Mapping): string {
  return CATEGORY_PAGE[mapping.category];
}

/** A link to a mapping: its page, plus its table anchor where one is published. */
export function mappingHref(mapping: Mapping): string {
  return hasFieldTable(mapping)
    ? `${pageFor(mapping)}#${mappingAnchorId(mapping.id)}`
    : pageFor(mapping);
}

/** A link to one row: its page, plus its row anchor where one is published. */
export function rowHref(mapping: Mapping, rowId: string): string {
  return hasFieldTable(mapping)
    ? `${pageFor(mapping)}#${rowAnchorId(mapping.id, rowId)}`
    : pageFor(mapping);
}
