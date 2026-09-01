/**
 * The region renderers.
 *
 * Each renderer turns part of the ledger into the markdown body of one managed
 * region. Renderers are registered by **region id**; `render-pages.ts` treats a
 * region id in a page that no renderer claims, and a renderer whose region has
 * no home in any page, as **errors**. That is why a region and its renderer
 * always land in the same commit.
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
import { ISO8601_FORMS } from '../src/shared/iso8601-subset.ts';
import { OPEN_ITEMS, type Side } from '../content/open-items.ts';

/** Where `example:` regions read their fixtures from. */
export const FIXTURES_ROOT = new URL('../fixtures/', import.meta.url);

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

// ── cell helpers ─────────────────────────────────────────────────────────────

/** One markdown table row from its cells. */
export function tableRow(cells: readonly string[]): string {
  return `| ${cells.join(' | ')} |`;
}

/** Escape the characters that would break out of a markdown table cell. */
export function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/** A markdown link to a citation, with the extension-tier marker where it applies. */
export function citeLink(cite: Cite, label: string): string {
  const marker = cite.verification === 'extension-unverified' ? '<sup>†</sup>' : '';
  return `[${cell(label)}](${cite.url})${marker}`;
}

/** The rendered form of one fidelity value. */
export function fidelityCell(verdict: Verdict): string {
  switch (verdict.fidelity) {
    case 'lossless':
      return '`lossless`';
    case 'lossy':
      return '`lossy`';
    case 'unmapped':
      return '`unmapped`';
  }
}

/** The rendered form of an aggregate (mapping-level) fidelity value. */
export function aggregateCell(fidelity: Fidelity): string {
  return `\`${fidelity}\``;
}

/** A Jira browse URL for an owner that names a ticket. */
export function ownerCell(owner: string): string {
  return /^(FHIR|HTA)-\d+$/.test(owner)
    ? `[${owner}](https://jira.hl7.org/browse/${owner})`
    : `\`${owner}\``;
}

/** The Notes cell: drop list, unmapped reason, owner, and the row's own note. */
export function notesCell(row: Row): string {
  const parts: string[] = [];

  const describe = (verdict: Verdict, arrow: string): void => {
    if (verdict.fidelity === 'lossy') {
      const drops = verdict.drops
        .map((d) => `\`${d.path}\` — ${d.reason}`)
        .join('; ');
      parts.push(`${arrow} drops ${drops}`);
    }
    if (verdict.fidelity === 'unmapped') {
      const owner = verdict.owner === undefined ? '' : ` (owner: ${ownerCell(verdict.owner)})`;
      parts.push(`${arrow} ${verdict.reason}${owner}`);
    }
  };

  describe(row.toFhir, '→ FHIR:');
  describe(row.toOpenehr, '→ openEHR:');
  if (row.note !== undefined) parts.push(row.note);

  return parts.length === 0 ? '' : cell(parts.join(' '));
}

/** The openEHR side of a row, as a cell. */
export function openehrCell(side: Endpoint | NoCounterpart): string {
  if (isNoCounterpart(side)) return `— <br/>*no counterpart* ([inventory](${side.cite.url}))`;
  const cardinality = side.cardinality === undefined ? '' : ` \`${side.cardinality}\``;
  return `${citeLink(side.cite, side.path)}${cardinality}`;
}

/** The FHIR side of a row, as a cell. One line per candidate target. */
export function fhirCell(side: readonly Endpoint[] | NoCounterpart): string {
  if (isNoCounterpart(side)) return `— <br/>*no counterpart* ([inventory](${side.cite.url}))`;
  const lines = side.map((endpoint) => {
    const when = endpoint.when === undefined ? '' : `*when* ${endpoint.when}: `;
    const kind = endpoint.kind === 'extension' ? ' *(extension)*' : '';
    return `${when}${citeLink(endpoint.cite, endpoint.path)}${kind}`;
  });
  return cell(lines.join(' <br/>'));
}

// ── the mapping: renderer ────────────────────────────────────────────────────

const FIELD_HEADER = [
  '| openEHR field | FHIR target | → FHIR | → openEHR | Maturity | Notes |',
  '|-|-|-|-|-|-|',
];

/** The per-type field table, preceded by its `**Sources:**` line. */
export function renderMappingTable(mapping: Mapping): string {
  const sources = mapping.sources.map((c) => citeLink(c, c.label)).join(' · ');
  const lines: string[] = [`**Sources:** ${sources}`, ''];

  if (mapping.scope === 'archetype') {
    lines.push(
      '*This mapping is `archetype` scope: it is not expressible between the two data ' +
        'types alone and needs the surrounding openEHR archetype and FHIR resource.*',
      '',
    );
  }

  lines.push(...FIELD_HEADER);
  if (mapping.rows.length === 0) {
    lines.push(tableRow(['—', '—', '—', '—', '—', 'No field rows recorded yet.']));
  }
  for (const row of mapping.rows) {
    lines.push(
      tableRow([
        openehrCell(row.openehr),
        fhirCell(row.fhir),
        fidelityCell(row.toFhir),
        fidelityCell(row.toOpenehr),
        `\`${row.maturity}\``,
        notesCell(row),
      ]),
    );
  }
  return lines.join('\n');
}

// ── the summary: renderers ───────────────────────────────────────────────────

const SUMMARY_HEADER = [
  '| openEHR type | FHIR type | → FHIR | → openEHR | Maturity | Scope |',
  '|-|-|-|-|-|-|',
];

/** The coarsest maturity present in a mapping: the least settled row wins. */
export function mappingMaturity(mapping: Mapping): string {
  if (mapping.rows.some((r) => r.maturity === 'not-discussed')) return 'not-discussed';
  if (mapping.rows.some((r) => r.maturity === 'open')) return 'open';
  return 'settled';
}

function summaryRow(mapping: Mapping, withLink: boolean): string {
  const page = CATEGORY_PAGE[mapping.category];
  const name = withLink
    ? `[${cell(mapping.openehrType)}](${page})`
    : `\`${cell(mapping.openehrType)}\``;
  return tableRow([
    name,
    `\`${cell(mapping.fhirType)}\``,
    aggregateCell(aggregateVerdict(mapping, 'toFhir')),
    aggregateCell(aggregateVerdict(mapping, 'toOpenehr')),
    `\`${mappingMaturity(mapping)}\``,
    `\`${mapping.scope}\``,
  ]);
}

/** Every mapping in the ledger, one row each, linked to its category page. */
export function renderSummaryAll(): string {
  const all = ledger();
  const lines = [...SUMMARY_HEADER];
  if (all.length === 0) {
    lines.push('');
    lines.push('No mappings recorded yet.');
    return lines.join('\n');
  }
  for (const category of categories()) {
    for (const mapping of mappingsFor(category)) lines.push(summaryRow(mapping, true));
  }
  return lines.join('\n');
}

/** Every mapping in one category, one row each. */
export function renderSummaryCategory(category: Category): string {
  const mappings = mappingsFor(category);
  const lines = [...SUMMARY_HEADER];
  if (mappings.length === 0) {
    lines.push('');
    lines.push('No mappings recorded yet.');
    return lines.join('\n');
  }
  for (const mapping of mappings) lines.push(summaryRow(mapping, false));
  return lines.join('\n');
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

const GAP_HEADER = [
  '| Feature | Counterpart | Fidelity | Maturity | Owner | Why |',
  '|-|-|-|-|-|-|',
];

/** The owner named by a row's verdict in one direction, if any. */
function verdictOwner(verdict: Verdict): string {
  return verdict.fidelity === 'unmapped' && verdict.owner !== undefined
    ? ownerCell(verdict.owner)
    : '—';
}

/** The reason a direction is a gap: the unmapped reason, or the drop list. */
function gapReason(verdict: Verdict): string {
  if (verdict.fidelity === 'unmapped') return cell(verdict.reason);
  if (verdict.fidelity === 'lossy') {
    return cell(verdict.drops.map((d) => `\`${d.path}\` — ${d.reason}`).join('; '));
  }
  return '';
}

/** Rows that are a gap in one direction, gathered from the **whole** ledger. */
function gapRows(direction: Direction): readonly { mapping: Mapping; row: Row }[] {
  const out: { mapping: Mapping; row: Row }[] = [];
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      if (row.maturity === 'not-discussed') continue;
      if (row[direction].fidelity === 'lossless') continue;
      out.push({ mapping, row });
    }
  }
  return out;
}

function gapTable(
  entries: readonly { mapping: Mapping; row: Row }[],
  direction: Direction,
): string {
  const lines = [...GAP_HEADER];
  if (entries.length === 0) {
    lines.push('', 'No gaps recorded yet.');
    return lines.join('\n');
  }
  for (const { mapping, row } of entries) {
    const feature = direction === 'toFhir' ? openehrCell(row.openehr) : fhirCell(row.fhir);
    const counterpart = direction === 'toFhir' ? fhirCell(row.fhir) : openehrCell(row.openehr);
    lines.push(
      tableRow([
        `${feature} <br/>*[${cell(mapping.title)}](${CATEGORY_PAGE[mapping.category]})*`,
        counterpart,
        fidelityCell(row[direction]),
        `\`${row.maturity}\``,
        verdictOwner(row[direction]),
        gapReason(row[direction]),
      ]),
    );
  }
  return lines.join('\n');
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
  const lines = [
    '| FHIR type | Why openEHR has no counterpart | Owner |',
    '|-|-|-|',
  ];
  let found = 0;
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      if (!isNoCounterpart(row.openehr)) continue;
      if (row.maturity === 'not-discussed') continue;
      found += 1;
      lines.push(
        tableRow([
          fhirCell(row.fhir),
          cell(row.openehr.reason) + ` ([inventory](${row.openehr.cite.url}))`,
          verdictOwner(row.toOpenehr),
        ]),
      );
    }
  }
  if (found === 0) {
    lines.push('', 'No types recorded yet.');
  }
  return lines.join('\n');
}

/** Everything on either side the working group has not examined. */
export function renderGapsNotDiscussed(): string {
  const lines = ['| Construct | Side | Why it is listed |', '|-|-|-|'];
  let found = 0;
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      if (row.maturity !== 'not-discussed') continue;
      found += 1;
      const side = isNoCounterpart(row.openehr) ? 'FHIR' : 'openEHR';
      const feature = isNoCounterpart(row.openehr) ? fhirCell(row.fhir) : openehrCell(row.openehr);
      lines.push(tableRow([feature, side, gapReason(row.toFhir)]));
    }
  }
  if (found === 0) {
    lines.push('', 'Nothing recorded yet.');
  }
  return lines.join('\n');
}

/** Render the ISO 8601 subset comparison from the capability table itself. */
export function renderIso8601Subset(): string {
  const lines = [
    '| Form | Example | openEHR | FHIR | Mapping rule |',
    '|-|-|-|-|-|',
  ];
  const tick = (accepted: boolean): string => (accepted ? '✓' : '—');
  for (const form of ISO8601_FORMS) {
    lines.push(
      tableRow([
        `${cell(form.description)} <br/>*(\`${form.kind}\`)*`,
        `\`${cell(form.example)}\``,
        tick(form.openehr),
        tick(form.fhir),
        cell(form.action),
      ]),
    );
  }
  return lines.join('\n');
}

// ── the review-coverage and open-items renderers ─────────────────────────────

/** Reviewer coverage, from every `Mapping.review` field. */
export function renderReviewCoverage(): string {
  const lines = [
    '| Mapping | Category | openEHR review | FHIR review |',
    '|-|-|-|-|',
  ];
  const names = (reviewers: readonly string[]): string =>
    reviewers.length === 0 ? '**unchecked**' : `✓ ${cell(reviewers.join(', '))}`;

  for (const mapping of ledger()) {
    lines.push(
      tableRow([
        `[${cell(mapping.title)}](${CATEGORY_PAGE[mapping.category]})`,
        CATEGORY_LABEL[mapping.category],
        names(mapping.review.openehr),
        names(mapping.review.fhir),
      ]),
    );
  }
  return lines.join('\n');
}

/** The open-items register, grouped by side. */
export function renderOpenItems(): string {
  const sides: readonly { readonly side: Side; readonly heading: string }[] = [
    { side: 'fhir', heading: 'FHIR-side actions' },
    { side: 'openehr', heading: 'openEHR-side actions' },
    { side: 'documentation', heading: 'Documentation and tooling' },
  ];

  const lines: string[] = [];
  for (const { side, heading } of sides) {
    const items = OPEN_ITEMS.filter((item) => item.side === side);
    lines.push(`#### ${heading}`, '');
    lines.push('| Item | Owner | Priority | Status |', '|-|-|-|-|');
    for (const item of items) {
      const title =
        item.ticket === undefined
          ? cell(item.title)
          : `${cell(item.title)} <br/>[${cell(item.ticket.label)}](${item.ticket.url})`;
      lines.push(
        tableRow([title, cell(item.owner), `\`${item.priority}\``, cell(item.status)]),
      );
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
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

/** The direction labels, exported so tests and renderers agree on them. */
export const DIRECTION_LABEL: Readonly<Record<Direction, string>> = {
  toFhir: '→ FHIR',
  toOpenehr: '→ openEHR',
};

/** Re-exported so `render-pages.ts` need not import the model directly. */
export { endpointsOf };
