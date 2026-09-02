/**
 * The ledger checks TypeScript cannot express.
 *
 * `types.ts` makes a malformed row a compile error. What it cannot do is see
 * across rows (uniqueness), parse a URL (host allow-listing and citation
 * tiering), or relate one field to another (drop-path containment). Those
 * checks live here.
 *
 * `validateLedger` returns **one message per violation** and never throws;
 * `load.ts` throws when the list is non-empty, and `test/ledger.test.ts`
 * asserts that each rule rejects a crafted violation.
 */

import {
  citesOf,
  endpointsOf,
  isNoCounterpart,
  type Cite,
  type Mapping,
  type Row,
  type Verdict,
} from './types.ts';
import { resolveMirror } from './spec-mirror-map.ts';

/**
 * The only hosts a citation may name.
 *
 * `build.fhir.org` is deliberately **absent**: continuous-build snapshots rot,
 * and a published guide may not cite one.
 */
export const ALLOWED_CITE_HOSTS: readonly string[] = [
  'specifications.openehr.org',
  'hl7.org',
  'terminology.hl7.org',
  'jira.hl7.org',
];

/** Hosts that exist in neither local mirror and are therefore always remote. */
const ALWAYS_REMOTE_HOSTS: readonly string[] = ['terminology.hl7.org', 'jira.hl7.org'];

/** The FHIR extension pack, which the local R5 mirror does not contain. */
const EXTENSION_PATH_PREFIX = '/fhir/extensions/';

const MAPPING_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The mapping that publishes the FHIR types with no openEHR counterpart. */
export const FHIR_NO_COUNTERPART_ID = 'fhir-types-with-no-openehr-counterpart';

function nonEmpty(value: string | undefined, what: string, out: string[]): void {
  if (value !== undefined && value.trim() === '') out.push(`${what}: empty string`);
}

/** The three verification tiers, applied to one citation. */
function checkCite(cite: Cite, where: string, out: string[]): void {
  nonEmpty(cite.url, `${where} cite.url`, out);
  nonEmpty(cite.label, `${where} cite.label`, out);

  let url: URL;
  try {
    url = new URL(cite.url);
  } catch {
    out.push(`${where}: cite url is not a well-formed URL: ${cite.url}`);
    return;
  }

  if (url.protocol !== 'https:') {
    out.push(`${where}: cite url must be https: ${cite.url}`);
  }

  if (!ALLOWED_CITE_HOSTS.includes(url.host)) {
    out.push(
      `${where}: cite host '${url.host}' is not allow-listed ` +
        `(allowed: ${ALLOWED_CITE_HOSTS.join(', ')}): ${cite.url}`,
    );
    return;
  }

  const isExtension = url.host === 'hl7.org' && url.pathname.startsWith(EXTENSION_PATH_PREFIX);
  const alwaysRemote = ALWAYS_REMOTE_HOSTS.includes(url.host);

  if (isExtension) {
    if (cite.verification !== 'extension-unverified') {
      out.push(
        `${where}: extension-pack citation must be tiered 'extension-unverified', ` +
          `found '${cite.verification}': ${cite.url}`,
      );
    }
    return;
  }

  if (cite.verification === 'extension-unverified') {
    out.push(
      `${where}: 'extension-unverified' is reserved for ` +
        `hl7.org${EXTENSION_PATH_PREFIX}… citations: ${cite.url}`,
    );
    return;
  }

  if (alwaysRemote) {
    if (cite.verification !== 'spec-remote') {
      out.push(
        `${where}: '${url.host}' exists in no local mirror and must be tiered ` +
          `'spec-remote', found '${cite.verification}': ${cite.url}`,
      );
    }
    return;
  }

  const mirrored = resolveMirror(cite.url) !== undefined;
  if (cite.verification === 'spec-local' && !mirrored) {
    out.push(
      `${where}: cite is tiered 'spec-local' but no prefix in spec-mirror-map.ts ` +
        `resolves it — add the entry or tier it 'spec-remote': ${cite.url}`,
    );
  }
  if (cite.verification === 'spec-remote' && mirrored) {
    out.push(
      `${where}: cite resolves through spec-mirror-map.ts and must therefore be ` +
        `tiered 'spec-local', found 'spec-remote': ${cite.url}`,
    );
  }
}

/**
 * Every path a row's drops may legitimately be prefixed by: the row's own
 * endpoint paths, plus — transitively — the endpoint paths of every row of
 * every mapping the row `delegates` to.
 *
 * The delegated half exists because a composed converter carries its inner
 * result's issues forward. `DV_CODED_TEXT ↔ CodeableConcept` really does drop
 * `Coding.version`, and `Coding.version` is prefixed by none of that row's own
 * endpoints. Widening the anchor set **by declaration** keeps the rule strict
 * for every row that does not delegate, instead of relaxing it for all of them.
 */
function anchorPaths(row: Row, byMappingId: ReadonlyMap<string, Mapping>): readonly string[] {
  const anchors: string[] = [];
  if (!isNoCounterpart(row.openehr)) anchors.push(row.openehr.path);
  for (const endpoint of endpointsOf(row.fhir)) anchors.push(endpoint.path);

  const seen = new Set<string>();
  const queue = [...(row.delegates ?? [])];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (seen.has(id)) continue;
    seen.add(id);
    const delegate = byMappingId.get(id);
    if (delegate === undefined) continue;
    for (const inner of delegate.rows) {
      if (!isNoCounterpart(inner.openehr)) anchors.push(inner.openehr.path);
      for (const endpoint of endpointsOf(inner.fhir)) anchors.push(endpoint.path);
      for (const next of inner.delegates ?? []) queue.push(next);
    }
  }
  return anchors;
}

/**
 * True when `path` names the anchor itself or something **beneath** it.
 *
 * A bare `startsWith` makes a sibling look like a descendant: `Coding.versionable`
 * would pass against `Coding.version`. The test is segment-aware, which matters
 * more once the anchor set is widened by `delegates`.
 */
function isUnderAnchor(path: string, anchor: string): boolean {
  return path === anchor || path.startsWith(`${anchor}.`) || path.startsWith(`${anchor}[`);
}

function checkVerdict(
  verdict: Verdict,
  row: Row,
  where: string,
  byMappingId: ReadonlyMap<string, Mapping>,
  out: string[],
): void {
  if (verdict.fidelity === 'lossy') {
    const anchors = anchorPaths(row, byMappingId);
    for (const drop of verdict.drops) {
      nonEmpty(drop.path, `${where} drop.path`, out);
      nonEmpty(drop.reason, `${where} drop.reason`, out);
      if (!anchors.some((anchor) => isUnderAnchor(drop.path, anchor))) {
        out.push(
          `${where}: drop path '${drop.path}' is not prefixed by any of the row's ` +
            `own endpoint paths (${anchors.join(', ') || 'none'})`,
        );
      }
    }
  }

  if (verdict.fidelity === 'unmapped') {
    nonEmpty(verdict.reason, `${where} unmapped reason`, out);
    if (row.maturity !== 'settled' && verdict.owner === undefined) {
      out.push(
        `${where}: an 'unmapped' verdict on a '${row.maturity}' row must name an owner`,
      );
    }
  }

  if (row.maturity === 'not-discussed' && verdict.fidelity !== 'unmapped') {
    out.push(
      `${where}: a 'not-discussed' row may not claim the fidelity outcome ` +
        `'${verdict.fidelity}' — it has not been discussed`,
    );
  }
}

function checkRow(
  row: Row,
  where: string,
  byMappingId: ReadonlyMap<string, Mapping>,
  out: string[],
): void {
  nonEmpty(row.id, `${where} id`, out);
  if (row.id.trim() !== '' && /\s/.test(row.id)) {
    out.push(`${where}: row id must not contain whitespace: '${row.id}'`);
  }

  // A `delegates` entry naming no mapping is a typo, and a typo would silently
  // narrow the anchor set rather than widening it — the drop it was written to
  // admit would then be rejected for the wrong reason, or admitted for one.
  for (const id of row.delegates ?? []) {
    if (!byMappingId.has(id)) {
      out.push(`${where}: delegates to '${id}', which is not a mapping in this ledger`);
    }
  }

  // The `archetype`-scope exemption's own stated justification is that the
  // row's "FHIR home is a resource element". A row that claims the exemption
  // while targeting an ordinary data-type element is exempting itself from
  // every gate for no reason the guide gives, so the justification is checked.
  if (row.scope === 'archetype' && !isNoCounterpart(row.fhir)) {
    const resourceLevel = endpointsOf(row.fhir).some((e) => e.kind === 'resource-element');
    if (!resourceLevel) {
      out.push(
        `${where}: an 'archetype'-scope row must have a FHIR endpoint of kind ` +
          `'resource-element', or no FHIR counterpart at all — its exemption from the ` +
          `converter, fixture and round-trip gates rests on exactly that`,
      );
    }
  }

  if (isNoCounterpart(row.openehr) && isNoCounterpart(row.fhir)) {
    out.push(`${where}: a row with no counterpart on either side is not a mapping fact`);
  }

  if (isNoCounterpart(row.openehr)) {
    nonEmpty(row.openehr.reason, `${where} openehr no-counterpart reason`, out);
  } else {
    nonEmpty(row.openehr.path, `${where} openehr.path`, out);
  }

  if (isNoCounterpart(row.fhir)) {
    nonEmpty(row.fhir.reason, `${where} fhir no-counterpart reason`, out);
  } else {
    for (const endpoint of row.fhir) nonEmpty(endpoint.path, `${where} fhir path`, out);
    if (row.fhir.length > 1) {
      for (const endpoint of row.fhir) {
        if (endpoint.when === undefined || endpoint.when.trim() === '') {
          out.push(
            `${where}: a row with more than one FHIR endpoint must say 'when' each ` +
              `applies; '${endpoint.path}' does not`,
          );
        }
      }
    }
  }

  for (const cite of citesOf(row)) checkCite(cite, where, out);

  checkVerdict(row.toFhir, row, `${where} → FHIR`, byMappingId, out);
  checkVerdict(row.toOpenehr, row, `${where} → openEHR`, byMappingId, out);
}

/**
 * Validate a whole ledger.
 *
 * @returns one message per violation; an empty array means the ledger is sound.
 */
export function validateLedger(mappings: readonly Mapping[]): string[] {
  const out: string[] = [];
  const seenMappingIds = new Set<string>();
  const seenRowIds = new Map<string, string>();

  // Built once and threaded down, because `delegates` resolves a mapping id to
  // that mapping's endpoint paths.
  const byMappingId = new Map<string, Mapping>();
  for (const mapping of mappings) {
    if (!byMappingId.has(mapping.id)) byMappingId.set(mapping.id, mapping);
  }

  // A FHIR type this guide **maps** may not also be published as having no
  // openEHR counterpart at all: the guide would be answering the same question
  // two ways on two pages. Keyed on membership of the inventory mapping rather
  // than on bare type names, because a `NoCounterpart` row elsewhere may
  // legitimately name a type that *is* mapped — `CodeableReference` is
  // `link-to-reference`'s own FHIR path.
  const mappedFhirTypes = new Set<string>();
  for (const mapping of mappings) {
    if (mapping.id === FHIR_NO_COUNTERPART_ID) continue;
    for (const part of mapping.fhirType.split('|')) {
      const name = part.trim();
      if (name !== '' && name !== '(none)') mappedFhirTypes.add(name);
    }
  }
  for (const mapping of mappings) {
    if (mapping.id !== FHIR_NO_COUNTERPART_ID) continue;
    for (const row of mapping.rows) {
      if (isNoCounterpart(row.fhir)) continue;
      for (const endpoint of row.fhir) {
        if (!mappedFhirTypes.has(endpoint.path)) continue;
        out.push(
          `mapping '${mapping.id}' row '${row.id}': '${endpoint.path}' is published as ` +
            `having no openEHR counterpart, but it is the FHIR type of a mapping this ` +
            `guide publishes — the two statements cannot both be true`,
        );
      }
    }
  }

  for (const mapping of mappings) {
    const where = `mapping '${mapping.id}'`;

    nonEmpty(mapping.id, `${where} id`, out);
    nonEmpty(mapping.title, `${where} title`, out);
    nonEmpty(mapping.openehrType, `${where} openehrType`, out);
    nonEmpty(mapping.fhirType, `${where} fhirType`, out);

    if (mapping.id.trim() !== '' && !MAPPING_ID.test(mapping.id)) {
      out.push(`${where}: mapping id must be lower-kebab-case`);
    }
    if (seenMappingIds.has(mapping.id)) {
      out.push(`${where}: duplicate mapping id`);
    }
    seenMappingIds.add(mapping.id);

    for (const cite of mapping.sources) checkCite(cite, `${where} sources`, out);

    for (const row of mapping.rows) {
      const rowWhere = `${where} row '${row.id}'`;
      const previous = seenRowIds.get(row.id);
      if (previous !== undefined) {
        out.push(`${rowWhere}: duplicate row id, already used by mapping '${previous}'`);
      }
      seenRowIds.set(row.id, mapping.id);
      checkRow(row, rowWhere, byMappingId, out);
    }
  }

  return out;
}
