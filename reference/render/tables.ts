/**
 * The region renderers.
 *
 * Each renderer turns part of the ledger into the body of one managed region.
 * Renderers are registered by **region id**; `render-pages.ts` treats a region
 * id in a page that no renderer claims, and a renderer whose region has no home
 * in any page, as **errors**. That is why a region and its renderer always land
 * in the same commit.
 *
 * Region bodies are **final HTML**, produced by `html.ts`, not markdown the
 * publisher is asked to reinterpret. Markdown survives in exactly two places:
 * the `####` headings of `open-items`, which the template builds in-page
 * navigation from, and the JSON fences of `example:` regions. Everything else —
 * tables, the `**Sources:**` line, the archetype note, the empty-state
 * paragraphs — goes through the serializer, which is the only thing that decides
 * escaping. Ledger prose is authored in markdown and is converted by `inline()`;
 * identifiers and paths go through `code()`; everything else through
 * `escapeText()`.
 *
 * Nothing here writes files. `render-pages.ts` does the I/O.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  endpointsOf,
  isNoCounterpart,
  type Category,
  type Cite,
  type Direction,
  type Endpoint,
  type Fidelity,
  type Mapping,
  type NoCounterpart,
  type Row,
  type Verdict,
} from '../src/model/types.ts';
import { aggregateVerdict, categories, ledger, mappingsFor } from '../src/model/load.ts';
import {
  CATEGORY_LABEL,
  CATEGORY_PAGE,
  DIRECTION_LABEL,
  mappingAnchorId,
  mappingHref,
  rowAnchorId,
} from '../src/publish/guide-links.ts';
import { ISO8601_FORMS } from '../src/shared/iso8601-subset.ts';
import { OPEN_ITEMS, type Side } from '../content/open-items.ts';
import {
  BR,
  anchor,
  code,
  em,
  escapeText,
  htmlTable,
  inline,
  paragraph,
  strong,
  sup,
} from './html.ts';

/** Where `example:` regions read their fixtures from. */
export const FIXTURES_ROOT = new URL('../fixtures/', import.meta.url);

/**
 * Re-exported for the call sites that read them from this module.
 *
 * They are **declared** in `../src/publish/guide-links.ts`, which is
 * browser-safe and is the one place the guide's link surface lives. Re-exporting
 * keeps a single declaration while leaving importers free to reach for either
 * module; duplicating the tables here would be the drift channel that move was
 * made to close.
 */
export { CATEGORY_LABEL, CATEGORY_PAGE, DIRECTION_LABEL };

// ── cell helpers ─────────────────────────────────────────────────────────────

/** A link to a citation, with the extension-tier marker where it applies. */
export function citeAnchor(cite: Cite, label: string): string {
  const marker = cite.verification === 'extension-unverified' ? sup('†') : '';
  return `${anchor(cite.url, label)}${marker}`;
}

/** The rendered form of one fidelity value. */
export function fidelityCell(verdict: Verdict): string {
  return code(verdict.fidelity);
}

/** The rendered form of an aggregate (mapping-level) fidelity value. */
export function aggregateCell(fidelity: Fidelity): string {
  return code(fidelity);
}

/** A Jira browse URL for an owner that names a ticket. */
export function ownerCell(owner: string): string {
  return /^(FHIR|HTA)-\d+$/.test(owner)
    ? anchor(`https://jira.hl7.org/browse/${owner}`, owner)
    : code(owner);
}

/** The Notes cell: drop list, unmapped reason, owner, and the row's own note. */
export function notesCell(row: Row): string {
  const parts: string[] = [];

  const describe = (verdict: Verdict, arrow: string): void => {
    if (verdict.fidelity === 'lossy') {
      const drops = verdict.drops
        .map((d) => `${code(d.path)} — ${inline(d.reason)}`)
        .join('; ');
      parts.push(`${escapeText(arrow)} drops ${drops}`);
    }
    if (verdict.fidelity === 'unmapped') {
      const owner = verdict.owner === undefined ? '' : ` (owner: ${ownerCell(verdict.owner)})`;
      parts.push(`${escapeText(arrow)} ${inline(verdict.reason)}${owner}`);
    }
  };

  describe(row.toFhir, '→ FHIR:');
  describe(row.toOpenehr, '→ openEHR:');
  if (row.note !== undefined) parts.push(inline(row.note));

  return parts.join(' ');
}

/** The cell an endpoint that has no counterpart at all renders as. */
function noCounterpartCell(side: NoCounterpart): string {
  return `—${BR}${em('no counterpart')} (${anchor(side.cite.url, 'inventory')})`;
}

/** The openEHR side of a row, as a cell. */
export function openehrCell(side: Endpoint | NoCounterpart): string {
  if (isNoCounterpart(side)) return noCounterpartCell(side);
  const cardinality = side.cardinality === undefined ? '' : ` ${code(side.cardinality)}`;
  return `${citeAnchor(side.cite, side.path)}${cardinality}`;
}

/** The FHIR side of a row, as a cell. One line per candidate target. */
export function fhirCell(side: readonly Endpoint[] | NoCounterpart): string {
  if (isNoCounterpart(side)) return noCounterpartCell(side);
  return side
    .map((endpoint) => {
      const when = endpoint.when === undefined ? '' : `${em('when')} ${inline(endpoint.when)}: `;
      const kind = endpoint.kind === 'extension' ? ` ${em('(extension)')}` : '';
      return `${when}${citeAnchor(endpoint.cite, endpoint.path)}${kind}`;
    })
    .join(BR);
}

// ── the mapping: renderer ────────────────────────────────────────────────────

const FIELD_HEADER = [
  'openEHR field',
  'FHIR target',
  '→ FHIR',
  '→ openEHR',
  'Maturity',
  'Notes',
];

/** The per-type field table, preceded by its `**Sources:**` line. */
export function renderMappingTable(mapping: Mapping): string {
  const sources = mapping.sources.map((c) => citeAnchor(c, c.label)).join(' · ');
  const blocks: string[] = [paragraph(`${strong('Sources:')} ${sources}`)];

  if (mapping.scope === 'archetype') {
    blocks.push(
      paragraph(
        em(
          `This mapping is ${code('archetype')} scope: it is not expressible between the ` +
            'two data types alone and needs the surrounding openEHR archetype and FHIR ' +
            'resource.',
        ),
      ),
    );
  }

  const rows =
    mapping.rows.length === 0
      ? [['—', '—', '—', '—', '—', 'No field rows recorded yet.']]
      : mapping.rows.map((row) => [
          openehrCell(row.openehr),
          fhirCell(row.fhir),
          fidelityCell(row.toFhir),
          fidelityCell(row.toOpenehr),
          code(row.maturity),
          notesCell(row),
        ]);

  // The empty-rows placeholder is not a ledger row and gets no anchor: an id
  // derived from a row that does not exist would be a link to nothing.
  blocks.push(
    htmlTable(FIELD_HEADER, rows, {
      id: mappingAnchorId(mapping.id),
      rowIds: mapping.rows.map((row) => rowAnchorId(mapping.id, row.id)),
    }),
  );
  return blocks.join('\n\n');
}

// ── the summary: renderers ───────────────────────────────────────────────────

const SUMMARY_HEADER = [
  'openEHR type',
  'FHIR type',
  '→ FHIR',
  '→ openEHR',
  'Maturity',
  'Scope',
];

/** The coarsest maturity present in a mapping: the least settled row wins. */
export function mappingMaturity(mapping: Mapping): string {
  if (mapping.rows.some((r) => r.maturity === 'not-discussed')) return 'not-discussed';
  if (mapping.rows.some((r) => r.maturity === 'open')) return 'open';
  return 'settled';
}

function summaryRow(mapping: Mapping, withLink: boolean): readonly string[] {
  const name = withLink
    ? anchor(mappingHref(mapping), mapping.openehrType)
    : code(mapping.openehrType);
  return [
    name,
    code(mapping.fhirType),
    aggregateCell(aggregateVerdict(mapping, 'toFhir')),
    aggregateCell(aggregateVerdict(mapping, 'toOpenehr')),
    code(mappingMaturity(mapping)),
    code(mapping.scope),
  ];
}

/** Every mapping in the ledger, one row each, linked to its category page. */
export function renderSummaryAll(): string {
  if (ledger().length === 0) {
    return `${htmlTable(SUMMARY_HEADER, [])}\n\n${paragraph('No mappings recorded yet.')}`;
  }
  const rows: (readonly string[])[] = [];
  for (const category of categories()) {
    for (const mapping of mappingsFor(category)) rows.push(summaryRow(mapping, true));
  }
  return htmlTable(SUMMARY_HEADER, rows);
}

/** Every mapping in one category, one row each. */
export function renderSummaryCategory(category: Category): string {
  const mappings = mappingsFor(category);
  if (mappings.length === 0) {
    return `${htmlTable(SUMMARY_HEADER, [])}\n\n${paragraph('No mappings recorded yet.')}`;
  }
  return htmlTable(
    SUMMARY_HEADER,
    mappings.map((mapping) => summaryRow(mapping, false)),
  );
}

// ── the example: renderer ────────────────────────────────────────────────────

/**
 * A worked example, read **verbatim from the fixture** the converters are
 * tested against. The published example *is* the fixture, so there is no
 * drift channel between the guide and the code.
 */
export function renderExample(fixturePath: string): string {
  const file = join(fileURLToPath(FIXTURES_ROOT), fixturePath);
  const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\s+$/, '');
  return ['```json', raw, '```'].join('\n');
}

// ── the gaps: renderers ──────────────────────────────────────────────────────

const GAP_HEADER = ['Feature', 'Counterpart', 'Fidelity', 'Maturity', 'Owner', 'Why'];

/** The owner named by a row's verdict in one direction, if any. */
function verdictOwner(verdict: Verdict): string {
  return verdict.fidelity === 'unmapped' && verdict.owner !== undefined
    ? ownerCell(verdict.owner)
    : '—';
}

/** The reason a direction is a gap: the unmapped reason, or the drop list. */
function gapReason(verdict: Verdict): string {
  if (verdict.fidelity === 'unmapped') return inline(verdict.reason);
  if (verdict.fidelity === 'lossy') {
    return verdict.drops.map((d) => `${code(d.path)} — ${inline(d.reason)}`).join('; ');
  }
  return '';
}

/** Rows that are a gap in one direction, gathered from the **whole** ledger. */
/**
 * The rows one directional gap inventory publishes.
 *
 * Three conditions, and the third is the one the headings depend on. A gap in
 * the **openEHR → FHIR** direction is a fact an openEHR instance carries that
 * FHIR cannot receive, so the row must have a real **openEHR** endpoint; a row
 * whose openEHR side is `NoCounterpart` is a FHIR-only feature and belongs in
 * the other table. Symmetrically for FHIR → openEHR. Without that the two
 * inventories were populated by the same predicate and each contained rows its
 * own heading disclaimed.
 *
 * The FHIR → openEHR table additionally excludes the rows already published by
 * `gaps:fhir-no-counterpart` — the FHIR types with no openEHR counterpart at
 * all — so nothing is listed twice; the page prose says where those rows live.
 */
function gapRows(direction: Direction): readonly { mapping: Mapping; row: Row }[] {
  const out: { mapping: Mapping; row: Row }[] = [];
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      if (row.maturity === 'not-discussed') continue;
      if (row[direction].fidelity === 'lossless') continue;
      const source = direction === 'toFhir' ? row.openehr : row.fhir;
      if (isNoCounterpart(source)) continue;
      // A row with no openEHR counterpart at all is published in full by
      // `gaps:fhir-no-counterpart`; listing it here as well would say the same
      // thing twice under two headings.
      if (direction === 'toOpenehr' && isNoCounterpart(row.openehr)) continue;
      out.push({ mapping, row });
    }
  }
  return out;
}

function gapTable(
  entries: readonly { mapping: Mapping; row: Row }[],
  direction: Direction,
): string {
  if (entries.length === 0) {
    return `${htmlTable(GAP_HEADER, [])}\n\n${paragraph('No gaps recorded yet.')}`;
  }
  const rows = entries.map(({ mapping, row }) => {
    const feature = direction === 'toFhir' ? openehrCell(row.openehr) : fhirCell(row.fhir);
    const counterpart = direction === 'toFhir' ? fhirCell(row.fhir) : openehrCell(row.openehr);
    return [
      `${feature}${BR}${em(anchor(mappingHref(mapping), mapping.title))}`,
      counterpart,
      fidelityCell(row[direction]),
      code(row.maturity),
      verdictOwner(row[direction]),
      gapReason(row[direction]),
    ];
  });
  return htmlTable(GAP_HEADER, rows);
}

/** openEHR features that cannot be carried into FHIR. */
export function renderGapsOpenehrToFhir(): string {
  return gapTable(gapRows('toFhir'), 'toFhir');
}

/** FHIR features that cannot be carried into openEHR. */
export function renderGapsFhirToOpenehr(): string {
  return gapTable(gapRows('toOpenehr'), 'toOpenehr');
}

/** FHIR types for which the openEHR Reference Model has no counterpart at all. */
export function renderGapsFhirNoCounterpart(): string {
  const header = ['FHIR type', 'Why openEHR has no counterpart', 'Owner'];
  const rows: (readonly string[])[] = [];
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      if (!isNoCounterpart(row.openehr)) continue;
      if (row.maturity === 'not-discussed') continue;
      rows.push([
        fhirCell(row.fhir),
        `${inline(row.openehr.reason)} (${anchor(row.openehr.cite.url, 'inventory')})`,
        verdictOwner(row.toOpenehr),
      ]);
    }
  }
  if (rows.length === 0) {
    return `${htmlTable(header, [])}\n\n${paragraph('No types recorded yet.')}`;
  }
  return htmlTable(header, rows);
}

/** Everything on either side the working group has not examined. */
export function renderGapsNotDiscussed(): string {
  const header = ['Construct', 'Side', 'Why it is listed'];
  const rows: (readonly string[])[] = [];
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      if (row.maturity !== 'not-discussed') continue;
      const side = isNoCounterpart(row.openehr) ? 'FHIR' : 'openEHR';
      const feature = isNoCounterpart(row.openehr) ? fhirCell(row.fhir) : openehrCell(row.openehr);
      rows.push([feature, escapeText(side), gapReason(row.toFhir)]);
    }
  }
  if (rows.length === 0) {
    return `${htmlTable(header, [])}\n\n${paragraph('Nothing recorded yet.')}`;
  }
  return htmlTable(header, rows);
}

/** Render the ISO 8601 subset comparison from the capability table itself. */
export function renderIso8601Subset(): string {
  const header = ['Form', 'Example', 'openEHR', 'FHIR', 'Mapping rule'];
  const tick = (accepted: boolean): string => escapeText(accepted ? '✓' : '—');
  const rows = ISO8601_FORMS.map((form) => [
    `${inline(form.description)}${BR}${em(`(${code(form.kind)})`)}`,
    code(form.example),
    tick(form.openehr),
    tick(form.fhir),
    inline(form.action),
  ]);
  return htmlTable(header, rows);
}

// ── the review-coverage and open-items renderers ─────────────────────────────

/** Reviewer coverage, from every `Mapping.review` field. */
export function renderReviewCoverage(): string {
  const header = ['Mapping', 'Category', 'openEHR review', 'FHIR review'];
  const names = (reviewers: readonly string[]): string =>
    reviewers.length === 0
      ? strong('unchecked')
      : `${escapeText('✓')} ${escapeText(reviewers.join(', '))}`;

  const rows = ledger().map((mapping) => [
    anchor(mappingHref(mapping), mapping.title),
    escapeText(CATEGORY_LABEL[mapping.category]),
    names(mapping.review.openehr),
    names(mapping.review.fhir),
  ]);
  return htmlTable(header, rows);
}

/** The open-items register, grouped by side. */
export function renderOpenItems(): string {
  const sides: readonly { readonly side: Side; readonly heading: string }[] = [
    { side: 'fhir', heading: 'FHIR-side actions' },
    { side: 'openehr', heading: 'openEHR-side actions' },
    { side: 'documentation', heading: 'Documentation and tooling' },
  ];
  const header = ['Item', 'Owner', 'Priority', 'Status'];

  // The `####` headings stay markdown: the template builds the page's in-page
  // navigation from them, and a blank line separates each from its table.
  const blocks: string[] = [];
  for (const { side, heading } of sides) {
    const rows = OPEN_ITEMS.filter((item) => item.side === side).map((item) => {
      const title =
        item.ticket === undefined
          ? inline(item.title)
          : `${inline(item.title)}${BR}${anchor(item.ticket.url, item.ticket.label)}`;
      return [title, escapeText(item.owner), code(item.priority), inline(item.status)];
    });
    blocks.push(`#### ${heading}`, htmlTable(header, rows));
  }
  return blocks.join('\n\n');
}

// ── the registry ─────────────────────────────────────────────────────────────

/** Renders the body of one managed region. */
export type RegionRenderer = () => string;

/**
 * Every region this renderer knows how to fill, keyed by region id.
 *
 * Grown by each phase that adds a region. A page carrying an id absent from
 * here is an error, and an id here with no home in any page is an error.
 */
export function regionRenderers(): ReadonlyMap<string, RegionRenderer> {
  const renderers = new Map<string, RegionRenderer>();

  renderers.set('summary:all', () => renderSummaryAll());
  renderers.set('gaps:openehr-to-fhir', () => renderGapsOpenehrToFhir());
  renderers.set('gaps:fhir-to-openehr', () => renderGapsFhirToOpenehr());
  renderers.set('gaps:fhir-no-counterpart', () => renderGapsFhirNoCounterpart());
  renderers.set('gaps:not-discussed', () => renderGapsNotDiscussed());
  renderers.set('iso8601-subset', () => renderIso8601Subset());
  renderers.set('review-coverage', () => renderReviewCoverage());
  renderers.set('open-items', () => renderOpenItems());

  // Only categories the ledger actually holds get a `summary:` renderer, so a
  // category region and its renderer land in the same commit -- the category's
  // own content phase -- rather than the renderer arriving first and reporting
  // itself homeless for ten consecutive phases.
  for (const category of categories()) {
    renderers.set(`summary:${category}`, () => renderSummaryCategory(category));
  }

  for (const mapping of ledger()) {
    // The `gaps` category's rows are published by the four `gaps:*` renderers,
    // which derive their tables from the whole ledger. A per-mapping field
    // table would duplicate them, so none is registered.
    if (mapping.category === 'gaps') continue;
    renderers.set(`mapping:${mapping.id}`, () => renderMappingTable(mapping));
  }

  return renderers;
}

/**
 * `example:` regions are keyed by fixture path rather than enumerated, so they
 * are resolved dynamically rather than registered.
 */
export const EXAMPLE_PREFIX = 'example:';

/** Resolve a region id to a renderer, including the dynamic `example:` family. */
export function rendererFor(
  id: string,
  renderers: ReadonlyMap<string, RegionRenderer>,
): RegionRenderer | undefined {
  const registered = renderers.get(id);
  if (registered !== undefined) return registered;
  if (id.startsWith(EXAMPLE_PREFIX)) {
    const fixture = id.slice(EXAMPLE_PREFIX.length);
    return () => renderExample(fixture);
  }
  return undefined;
}

/** Re-exported so `render-pages.ts` need not import the model directly. */
export { endpointsOf };
