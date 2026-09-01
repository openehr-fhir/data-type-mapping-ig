/**
 * Reference converters for the coded category.
 *
 * Two things here are deliberate and load-bearing:
 *
 * 1. **`terminology_id` is treated as opaque.** The registered converters never
 *    split or join a FHIR `system` and `version`, because the working group has
 *    not chosen a format. `joinTerminologyId` and `splitTerminologyId` exist for
 *    the day it does, and they take the format as a **required parameter with no
 *    default value** — so no test, render, or build can quietly bless one
 *    candidate.
 * 2. **Nothing is emitted for `TERM_MAPPING.purpose`.** The representation is
 *    undecided; emitting a candidate would adopt it.
 */

import { register } from '../registry.ts';
import { resultFor, type Issue, type MappingResult } from '../result.ts';
import {
  NULL_FLAVOUR,
  OPENEHR_TERMINOLOGY,
  type CodePhrase,
  type DvCodedText,
  type NullFlavour,
  type TermMapping,
} from '../types/openehr/coded.ts';
import { SYSTEM, type CodeableConcept, type Coding } from '../types/fhir/coded.ts';

/** Drop and unmapped paths, named once so the ledger and the code cannot drift. */
export const CODED_PATH = {
  codingVersion: 'Coding.version',
  codingSystemAbsent: 'Coding.system[absent]',
  userSelected: 'CodeableConcept.coding.userSelected',
  mappingsMatch: 'DV_CODED_TEXT.mappings.match',
  mappingsPurpose: 'DV_CODED_TEXT.mappings.purpose',
  termMappingMatch: 'TERM_MAPPING.match',
  termMappingPurpose: 'TERM_MAPPING.purpose',
  nullFlavourCode: 'NULL_FLAVOUR.defining_code.code_string',
  darCode: 'CodeableConcept.coding.code',
} as const;

function compact<T extends object>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[key] = v;
  }
  return out as T;
}

// ── the undecided terminology_id format ──────────────────────────────────────

/**
 * The three candidate formats for combining a FHIR `system` and `version` into
 * one openEHR `terminology_id`. **None of them is a default.**
 */
export type TerminologyIdFormat = 'pipe' | 'parenthetical' | 'hash';

/**
 * Join a `system` and `version` into a `terminology_id`.
 *
 * `format` has **no default** on purpose: the working group has not chosen one,
 * and a default here would choose it for them.
 */
export function joinTerminologyId(
  system: string,
  version: string | undefined,
  format: TerminologyIdFormat,
): string {
  if (version === undefined || version === '') return system;
  switch (format) {
    case 'pipe':
      return `${system}|${version}`;
    case 'parenthetical':
      return `${system} (${version})`;
    case 'hash':
      return `${system}#${version}`;
  }
}

/** Split a `terminology_id` back into a `system` and `version`. */
export function splitTerminologyId(
  terminologyId: string,
  format: TerminologyIdFormat,
): { readonly system: string; readonly version?: string } {
  const patterns: Readonly<Record<TerminologyIdFormat, RegExp>> = {
    pipe: /^(.*)\|(.+)$/,
    parenthetical: /^(.*?) \((.+)\)$/,
    hash: /^(.*)#(.+)$/,
  };
  const match = patterns[format].exec(terminologyId);
  if (match === null) return { system: terminologyId };
  return { system: match[1] as string, version: match[2] as string };
}

// ── CODE_PHRASE ↔ Coding ─────────────────────────────────────────────────────

/** Placeholder used when an incoming `Coding` omits the mandatory system. */
const UNKNOWN_TERMINOLOGY = 'unknown';

export function codePhraseToCoding(source: CodePhrase): MappingResult<Coding> {
  return resultFor(
    compact({
      system: source.terminology_id.value,
      code: source.code_string,
      display: source.preferred_term,
    }),
    [],
  );
}

export function codingToCodePhrase(source: Coding): MappingResult<CodePhrase> {
  const issues: Issue[] = [];

  if (source.version !== undefined) {
    issues.push({
      path: CODED_PATH.codingVersion,
      message:
        'openEHR has no separate version field and no format for combining system and ' +
        'version into terminology_id has been chosen, so the version is not carried',
    });
  }

  if (source.system === undefined) {
    issues.push({
      path: CODED_PATH.codingSystemAbsent,
      message:
        'CODE_PHRASE.terminology_id is mandatory and no default strategy has been chosen; ' +
        'the safe options are degrading to DV_TEXT, injecting a known default system, or ' +
        'treating the value as an exception',
    });
  }

  return resultFor(
    compact({
      _type: 'CODE_PHRASE' as const,
      terminology_id: { value: source.system ?? UNKNOWN_TERMINOLOGY },
      code_string: source.code ?? '',
      preferred_term: source.display,
    }),
    issues,
  );
}

register<CodePhrase, Coding>('code-phrase-to-coding', {
  toFhir: codePhraseToCoding,
  toOpenehr: codingToCodePhrase,
});

// ── DV_CODED_TEXT ↔ CodeableConcept ──────────────────────────────────────────

export function dvCodedTextToCodeableConcept(
  source: DvCodedText,
): MappingResult<CodeableConcept> {
  const issues: Issue[] = [];
  const mappings = source.mappings ?? [];

  if (mappings.length > 0) {
    issues.push({
      path: CODED_PATH.mappingsMatch,
      message:
        'the degree of equivalence has no element on Coding; it is expected to be ' +
        'retrievable from a terminology service through a ConceptMap instead',
    });
    if (mappings.some((m) => m.purpose !== undefined)) {
      issues.push({
        path: CODED_PATH.mappingsPurpose,
        message:
          'no representation has been chosen for TERM_MAPPING.purpose, so nothing is ' +
          'emitted rather than a candidate being adopted by default',
      });
    }
  }

  const coding: Coding[] = [
    codePhraseToCoding(source.defining_code).value as Coding,
    ...mappings.map((m) => codePhraseToCoding(m.target).value as Coding),
  ];

  return resultFor(compact({ coding, text: source.value }), issues);
}

export function codeableConceptToDvCodedText(
  source: CodeableConcept,
): MappingResult<DvCodedText> {
  const issues: Issue[] = [];
  const codings = source.coding ?? [];

  if (codings.some((c) => c.userSelected !== undefined)) {
    issues.push({
      path: CODED_PATH.userSelected,
      message:
        'openEHR has no field marking which coding a user chose; the flag is consumed to ' +
        'select defining_code and is not carried any further',
    });
  }

  // Priority: userSelected, then the first coding. The template-defined
  // terminology takes precedence over both, but a data-type converter does not
  // see the template.
  const definingIndex = Math.max(
    0,
    codings.findIndex((c) => c.userSelected === true),
  );
  const defining = codings[definingIndex];
  const rest = codings.filter((_, index) => index !== definingIndex);

  const mappings: TermMapping[] = rest.map((c) => ({
    _type: 'TERM_MAPPING' as const,
    match: '=',
    target: codingToCodePhrase(c).value as CodePhrase,
  }));

  return resultFor(
    compact({
      _type: 'DV_CODED_TEXT' as const,
      value: source.text ?? defining?.display ?? defining?.code ?? '',
      defining_code:
        defining === undefined
          ? { _type: 'CODE_PHRASE' as const, terminology_id: { value: UNKNOWN_TERMINOLOGY }, code_string: '' }
          : (codingToCodePhrase(defining).value as CodePhrase),
      mappings,
    }),
    issues,
  );
}

register<DvCodedText, CodeableConcept>('dv-coded-text-to-codeable-concept', {
  toFhir: dvCodedTextToCodeableConcept,
  toOpenehr: codeableConceptToDvCodedText,
});

// ── TERM_MAPPING ↔ Coding ────────────────────────────────────────────────────

export function termMappingToCoding(source: TermMapping): MappingResult<Coding> {
  const issues: Issue[] = [
    {
      path: CODED_PATH.termMappingMatch,
      message:
        'Coding has no element expressing the degree of equivalence between two terms; ' +
        'FHIR carries that relationship in a ConceptMap, not in the instance',
    },
  ];

  if (source.purpose !== undefined) {
    issues.push({
      path: CODED_PATH.termMappingPurpose,
      message:
        'no representation has been chosen: neither adding the openEHR purpose values to ' +
        'the FHIR coding-purpose code system nor using openEHR\u2019s own published code ' +
        'system has been adopted, so nothing is emitted',
    });
  }

  return resultFor(codePhraseToCoding(source.target).value as Coding, issues);
}

export function codingToTermMapping(source: Coding): MappingResult<TermMapping> {
  return resultFor(
    {
      _type: 'TERM_MAPPING' as const,
      match: '=',
      target: codingToCodePhrase(source).value as CodePhrase,
    },
    [],
  );
}

register<TermMapping, Coding>('term-mapping-to-coding', {
  toFhir: termMappingToCoding,
  toOpenehr: codingToTermMapping,
});

// ── null_flavour ↔ data-absent-reason ────────────────────────────────────────

/** openEHR L1 null-flavour code → data-absent-reason code. */
const TO_DAR: Readonly<Record<string, string>> = {
  [NULL_FLAVOUR.unknown]: 'unknown',
  [NULL_FLAVOUR.masked]: 'masked',
  [NULL_FLAVOUR.notApplicable]: 'not-applicable',
  // 271 "no information" has no exact counterpart and falls back to `unknown`.
  [NULL_FLAVOUR.noInformation]: 'unknown',
};

/** data-absent-reason code → openEHR null-flavour code, L2 codes inheriting L1. */
const FROM_DAR: Readonly<Record<string, string>> = {
  unknown: NULL_FLAVOUR.unknown,
  'asked-unknown': NULL_FLAVOUR.unknown,
  'temp-unknown': NULL_FLAVOUR.unknown,
  'not-asked': NULL_FLAVOUR.unknown,
  'not-a-number': NULL_FLAVOUR.unknown,
  'negative-infinity': NULL_FLAVOUR.unknown,
  'positive-infinity': NULL_FLAVOUR.unknown,
  'not-performed': NULL_FLAVOUR.unknown,
  masked: NULL_FLAVOUR.masked,
  'asked-declined': NULL_FLAVOUR.masked,
  'not-permitted': NULL_FLAVOUR.masked,
  'not-applicable': NULL_FLAVOUR.notApplicable,
  unsupported: NULL_FLAVOUR.notApplicable,
  'as-text': NULL_FLAVOUR.noInformation,
  error: NULL_FLAVOUR.noInformation,
};

/** The data-absent-reason codes that correspond exactly to an openEHR L1 code. */
const DAR_EXACT = new Set(['unknown', 'masked', 'not-applicable']);

export function nullFlavourToDataAbsentReason(
  source: NullFlavour,
): MappingResult<CodeableConcept> {
  const issues: Issue[] = [];
  const code = source.defining_code.code_string;

  if (code === NULL_FLAVOUR.noInformation) {
    issues.push({
      path: CODED_PATH.nullFlavourCode,
      message:
        'openEHR 271 (no information) has no data-absent-reason equivalent and falls back ' +
        'to `unknown`, which conflates it with 253',
    });
  }

  return resultFor(
    compact({
      coding: [
        compact({ system: SYSTEM.dataAbsentReason, code: TO_DAR[code] ?? 'unknown' }),
      ],
      text: source.value,
    }),
    issues,
  );
}

export function dataAbsentReasonToNullFlavour(
  source: CodeableConcept,
): MappingResult<NullFlavour> {
  const issues: Issue[] = [];
  const code = source.coding?.[0]?.code ?? 'unknown';

  if (!DAR_EXACT.has(code)) {
    issues.push({
      path: CODED_PATH.darCode,
      message:
        'the data-absent-reason code system is broader than openEHR\u2019s null-flavour ' +
        'set, so codes outside the four mapped parents collapse onto their nearest ' +
        'openEHR ancestor',
    });
  }

  return resultFor(
    {
      _type: 'DV_CODED_TEXT' as const,
      value: source.text ?? code,
      defining_code: {
        _type: 'CODE_PHRASE' as const,
        terminology_id: { value: OPENEHR_TERMINOLOGY },
        code_string: FROM_DAR[code] ?? NULL_FLAVOUR.unknown,
      },
    },
    issues,
  );
}

register<NullFlavour, CodeableConcept>('null-flavour-to-data-absent-reason', {
  toFhir: nullFlavourToDataAbsentReason,
  toOpenehr: dataAbsentReasonToNullFlavour,
});
