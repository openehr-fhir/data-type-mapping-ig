/**
 * The browser-facing facade over the reference implementation.
 *
 * This module, and `contract.ts` beside it, are the **only** two a consuming
 * site imports from `reference/`. Everything behind them — the ledger, the
 * registry, the converter modules, the renderer — stays private, so a consumer
 * cannot come to depend on a shape this workspace is free to change.
 *
 * It is browser-safe by construction: nothing it reaches imports a `node:`
 * builtin, and the guide links it hands out come from `../publish/guide-links.ts`,
 * which is the single declaration of where a mapping row is published.
 */

// Populating the registry is an import side effect, exactly as it is for the
// tests and the renderer. It must happen once, at module scope, before any
// call to `converterFor`.
import '../convert/index.ts';

import { aggregateVerdict, ledger, mappingById } from '../model/load.ts';
import { converterFor } from '../registry.ts';
import {
  endpointsOf,
  isNoCounterpart,
  type Direction,
  type Mapping,
  type Row,
} from '../model/types.ts';
import type { Issue } from '../result.ts';
import {
  CATEGORY_LABEL,
  DIRECTION_LABEL,
  mappingHref,
  rowHref,
} from '../publish/guide-links.ts';
import type {
  CatalogueEntry,
  ConversionOutcome,
  ConversionRequest,
  LinkedIssue,
} from './contract.ts';

const DIRECTIONS: readonly Direction[] = ['toFhir', 'toOpenehr'];

function isDirection(value: unknown): value is Direction {
  return value === 'toFhir' || value === 'toOpenehr';
}

/**
 * Every mapping a consumer can actually run, in ledger order.
 *
 * Two filters, and both are the ledger's own rules rather than this module's.
 * `archetype` scope is excluded because its FHIR home is a resource element and
 * a data-type converter never sees a resource. A mapping with no registered
 * pair is excluded because there is nothing to call.
 *
 * **Both directions are always listed**, each carrying what the guide declares
 * for it. A direction the ledger calls `unmapped` stays selectable: running it
 * is how a reader sees the guide's `unmapped` claim demonstrated, and hiding it
 * would make the tool quieter than the specification it is built from.
 */
export function converterCatalogue(): readonly CatalogueEntry[] {
  return ledger()
    .filter((mapping) => mapping.scope === 'datatype' && converterFor(mapping.id) !== undefined)
    .map((mapping) => ({
      id: mapping.id,
      openehrType: mapping.openehrType,
      fhirType: mapping.fhirType,
      title: mapping.title,
      category: mapping.category,
      categoryLabel: CATEGORY_LABEL[mapping.category],
      guideHref: mappingHref(mapping),
      directions: DIRECTIONS.map((direction) => ({
        direction,
        label: DIRECTION_LABEL[direction],
        declaredFidelity: aggregateVerdict(mapping, direction),
      })),
    }));
}

/**
 * Convert one instance, and link every issue back to the row that declares it.
 *
 * Never throws for a mapping-level problem — that is the converter contract in
 * `../result.ts`, and this facade preserves it. An unknown mapping id or a
 * direction string that is neither `toFhir` nor `toOpenehr` comes back as a
 * `ConversionFailure`, because both are ordinary browser input.
 */
export function runConversion(request: ConversionRequest): ConversionOutcome {
  if (!isDirection(request.direction)) return { error: 'invalid-direction' };
  const mapping = mappingById(request.mappingId);
  const pair = converterFor(request.mappingId);
  if (mapping === undefined || pair === undefined) return { error: 'unknown-mapping' };

  const result =
    request.direction === 'toFhir' ? pair.toFhir(request.value) : pair.toOpenehr(request.value);

  const response = {
    fidelity: result.fidelity,
    issues: issueLinksFor(request.mappingId, request.direction, result.issues),
  };
  return result.value === undefined ? response : { ...response, value: result.value };
}

/**
 * Resolve each issue to the guide row that accounts for it.
 *
 * Three cases, tried in order:
 *
 * 1. the row that **declares this exact drop** in this direction. This is what
 *    covers a *delegated* drop: a composing row re-declares the inner issue
 *    path it carries forward — `Coding.version` beneath
 *    `DV_CODED_TEXT.defining_code` — so the exact match finds the outer row
 *    rather than guessing;
 * 2. the row with the **longest segment-aware anchor match** among its own
 *    endpoint paths and those of every mapping it delegates to. This is the
 *    safety net for an issue path that a row carries but does not itself
 *    re-declare, and it is what resolves an `unmapped` row, whose issue path is
 *    its own source endpoint;
 * 3. no row at all, and the link falls back to the mapping.
 *
 * Case 2 is **segment-aware** — the same containment rule
 * `../model/validate.ts` applies to drop paths. A bare `startsWith` would let
 * `Coding.versionable` resolve to the row anchored at `Coding.version`, which
 * is precisely the confusion that rule exists to reject.
 */
export function issueLinksFor(
  mappingId: string,
  direction: Direction,
  issues: readonly Issue[],
): readonly LinkedIssue[] {
  const mapping = mappingById(mappingId);
  if (mapping === undefined) return [];

  const byId = new Map(ledger().map((candidate) => [candidate.id, candidate]));
  const anchors = mapping.rows.map((row) => ({ row, paths: anchorPaths(row, byId) }));

  return issues.map((issue) => {
    const row = declaringRow(mapping, direction, issue.path) ?? anchoringRow(anchors, issue.path);
    return {
      path: issue.path,
      message: issue.message,
      href: row === undefined ? mappingHref(mapping) : rowHref(mapping, row.id),
      label: mapping.title,
    };
  });
}

/** The row that declares this exact path as a drop in this direction. */
function declaringRow(mapping: Mapping, direction: Direction, path: string): Row | undefined {
  return mapping.rows.find((row) => {
    const verdict = row[direction];
    return verdict.fidelity === 'lossy' && verdict.drops.some((drop) => drop.path === path);
  });
}

/** The row whose longest matching anchor contains this path. */
function anchoringRow(
  anchors: readonly { readonly row: Row; readonly paths: readonly string[] }[],
  path: string,
): Row | undefined {
  let best: Row | undefined;
  let bestLength = -1;
  for (const { row, paths } of anchors) {
    for (const anchor of paths) {
      if (!isUnderAnchor(path, anchor)) continue;
      if (anchor.length > bestLength) {
        best = row;
        bestLength = anchor.length;
      }
    }
  }
  return best;
}

/**
 * Every endpoint path a row genuinely accounts for: its own, plus those of
 * every mapping it delegates to, transitively.
 *
 * This mirrors `anchorPaths` in `../model/validate.ts`. The duplication is
 * deliberate and small: `validate.ts` computes the set to *reject* an
 * undeclared drop, this computes it to *resolve* a reported one, and merging
 * them would make the validator's rule depend on a consumer-facing module.
 */
function anchorPaths(row: Row, byId: ReadonlyMap<string, Mapping>): readonly string[] {
  const paths: string[] = [];
  if (!isNoCounterpart(row.openehr)) paths.push(row.openehr.path);
  for (const endpoint of endpointsOf(row.fhir)) paths.push(endpoint.path);

  const seen = new Set<string>();
  const queue = [...(row.delegates ?? [])];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);
    const delegate = byId.get(id);
    if (delegate === undefined) continue;
    for (const inner of delegate.rows) {
      if (!isNoCounterpart(inner.openehr)) paths.push(inner.openehr.path);
      for (const endpoint of endpointsOf(inner.fhir)) paths.push(endpoint.path);
      for (const next of inner.delegates ?? []) queue.push(next);
    }
  }
  return paths;
}

/** True when `path` names the anchor itself or something beneath it. */
function isUnderAnchor(path: string, anchor: string): boolean {
  return path === anchor || path.startsWith(`${anchor}.`) || path.startsWith(`${anchor}[`);
}
