/**
 * Published specification URL → local mirror filename.
 *
 * The mirrors are **title-named**, so there is no derivable transform from a
 * published URL to a file on disk; this table is data, not an algorithm.
 *
 * It exists so that `test/cite-local.test.ts` can prove every `spec-local`
 * citation actually resolves to a page in the specification it claims to cite.
 * `validate.ts` requires a `spec-local` cite to have an entry here, which
 * forces the table to grow with the ledger rather than silently degrading the
 * check.
 *
 * The mirror roots are supplied by `OPENEHR_SPEC_DIR` and `FHIR_R5_DIR`; a
 * machine-local path is never written into a citation.
 */

/** Which local mirror an entry resolves against. */
export type MirrorRoot = 'openehr' | 'fhir';

export interface MirrorEntry {
  /** Matched with `url.startsWith(prefix)`; the fragment is ignored. */
  readonly prefix: string;
  readonly root: MirrorRoot;
  /** The file name inside that mirror root. */
  readonly file: string;
}

/**
 * Ordered longest-prefix-first so a more specific entry always wins.
 * Grown by every content phase that cites a page not already listed.
 */
export const SPEC_MIRRORS: readonly MirrorEntry[] = [
  // ── openEHR ───────────────────────────────────────────────────────────────
  {
    prefix: 'https://specifications.openehr.org/releases/RM/latest/data_types.html',
    root: 'openehr',
    file: 'Data Types Information Model.html',
  },
  {
    prefix: 'https://specifications.openehr.org/releases/RM/latest/data_structures.html',
    root: 'openehr',
    file: 'Data Structures Information Model.html',
  },
  {
    prefix: 'https://specifications.openehr.org/releases/RM/latest/common.html',
    root: 'openehr',
    file: 'Common Information Model.html',
  },
  {
    prefix: 'https://specifications.openehr.org/releases/RM/latest/support.html',
    root: 'openehr',
    file: 'Support Information Model.html',
  },
  {
    prefix: 'https://specifications.openehr.org/releases/RM/latest/ehr.html',
    root: 'openehr',
    file: 'EHR Information Model.html',
  },
  {
    prefix: 'https://specifications.openehr.org/releases/BASE/latest/foundation_types.html',
    root: 'openehr',
    file: 'Foundation Types.html',
  },
  {
    prefix: 'https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html',
    root: 'openehr',
    file: 'Support Terminology specification.html',
  },

  // ── FHIR R5 core ──────────────────────────────────────────────────────────
  {
    prefix: 'https://hl7.org/fhir/R5/datatypes.html',
    root: 'fhir',
    file: 'datatypes.html',
  },  {
    prefix: 'https://hl7.org/fhir/R5/extensibility.html',
    root: 'fhir',
    file: 'extensibility.html',
  },
  {
    prefix: 'https://hl7.org/fhir/R5/references.html',
    root: 'fhir',
    file: 'references.html',
  },
  {
    prefix: 'https://hl7.org/fhir/R5/observation.html',
    root: 'fhir',
    file: 'observation.html',
  },
];

/** The entry that resolves `url`, or `undefined` if the table does not know it. */
export function resolveMirror(url: string): MirrorEntry | undefined {
  let best: MirrorEntry | undefined;
  for (const entry of SPEC_MIRRORS) {
    if (!url.startsWith(entry.prefix)) continue;
    if (best === undefined || entry.prefix.length > best.prefix.length) best = entry;
  }
  return best;
}

/** The environment variable naming the root for a mirror. */
export function envVarFor(root: MirrorRoot): string {
  return root === 'openehr' ? 'OPENEHR_SPEC_DIR' : 'FHIR_R5_DIR';
}
