/**
 * Reference converters for the resource-locator category.
 *
 * The `system::value` convention these converters implement splits on the
 * **last** `::` in the string, which is why no escaping is needed even though
 * `:` is valid in both URLs and codes.
 */

import { register } from '../registry.ts';
import { resultFor, unmapped, type Issue, type MappingResult } from '../result.ts';
import type { DvIdentifier, DvUri, Link } from '../types/openehr/reference-types.ts';
import {
  OPENEHR_IDENTIFIER_PREFIX,
  joinSystemValue,
  splitSystemValue,
  type FhirUri,
  type Identifier,
  type Reference,
} from '../types/fhir/reference-types.ts';
import type { CodeableConcept, Coding } from '../types/fhir/coded.ts';

/** Drop and unmapped paths, named once so the ledger and the code cannot drift. */
export const REFERENCE_PATH = {
  identifierType: 'Identifier.type',
  identifierAssigner: 'Identifier.assigner',
  identifierUse: 'Identifier.use',
  identifierPeriod: 'Identifier.period',
  referenceReference: 'Reference.reference',
  linkTarget: 'LINK.target',
  identifierValueAbsent: 'Identifier.value[absent]',
  linkMeaning: 'LINK.meaning',
  linkType: 'LINK.type',
  referenceDisplay: 'Reference.display',
  codeableReferenceConcept: 'CodeableReference.concept',
  codeableReference: 'CodeableReference',
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

// ── DV_IDENTIFIER ↔ Identifier ───────────────────────────────────────────────

/** Choose the coding that carries the type: `userSelected`, else the first. */
function typeCoding(type: CodeableConcept | undefined): Coding | undefined {
  const codings = type?.coding ?? [];
  return codings.find((c) => c.userSelected === true) ?? codings[0];
}

export function dvIdentifierToIdentifier(source: DvIdentifier): MappingResult<Identifier> {
  const type = source.type === undefined ? undefined : splitSystemValue(source.type);
  const assigner =
    source.assigner === undefined ? undefined : splitSystemValue(source.assigner);

  return resultFor(
    compact({
      system: source.issuer,
      value: source.id,
      type:
        type === undefined
          ? undefined
          : {
              coding: [
                compact({
                  system: type.system ?? `${OPENEHR_IDENTIFIER_PREFIX}type`,
                  code: type.value,
                }),
              ],
            },
      assigner:
        assigner === undefined
          ? undefined
          : {
              identifier: compact({
                system: assigner.system ?? `${OPENEHR_IDENTIFIER_PREFIX}assigner`,
                value: assigner.value,
              }),
            },
    }),
    [],
  );
}

export function identifierToDvIdentifier(source: Identifier): MappingResult<DvIdentifier> {
  // `DV_IDENTIFIER.id` is mandatory (1..1) and `Identifier.value` is `0..1`.
  if (source.value === undefined) {
    return unmapped([
      {
        path: REFERENCE_PATH.identifierValueAbsent,
        message:
          'DV_IDENTIFIER.id is mandatory (1..1) and the Identifier supplies no value; the ' +
          'mandatory-attribute rule forbids inventing one, so nothing is produced',
      },
    ]);
  }

  const issues: Issue[] = [];

  if (source.type !== undefined) {
    issues.push({
      path: REFERENCE_PATH.identifierType,
      message:
        'openEHR carries the type as one system::value string, so only one coding survives ' +
        'and every other property of a Coding is dropped',
    });
  }
  if (source.assigner !== undefined) {
    issues.push({
      path: REFERENCE_PATH.identifierAssigner,
      message:
        'a FHIR Reference carries more than an identifier, and openEHR reduces the whole ' +
        'thing to one system::value string',
    });
  }
  if (source.use !== undefined) {
    issues.push({
      path: REFERENCE_PATH.identifierUse,
      message:
        'DV_IDENTIFIER has no categorisation field; use is carried by the extended openEHR ' +
        'identifier cluster archetype, not by the data type',
    });
  }
  if (source.period !== undefined) {
    issues.push({
      path: REFERENCE_PATH.identifierPeriod,
      message:
        'DV_IDENTIFIER has no validity period; period is carried by the extended openEHR ' +
        'identifier cluster archetype, not by the data type',
    });
  }

  const coding = typeCoding(source.type);
  const assignerIdentifier = source.assigner?.identifier;

  /** Strip the constructed placeholder prefix again on the way back. */
  const unprefix = (system: string | undefined, suffix: string): string | undefined =>
    system === `${OPENEHR_IDENTIFIER_PREFIX}${suffix}` ? undefined : system;

  return resultFor(
    compact({
      _type: 'DV_IDENTIFIER' as const,
      id: source.value,
      issuer: source.system,
      type:
        coding?.code === undefined
          ? undefined
          : joinSystemValue(unprefix(coding.system, 'type'), coding.code),
      assigner:
        assignerIdentifier?.value === undefined
          ? undefined
          : joinSystemValue(
              unprefix(assignerIdentifier.system, 'assigner'),
              assignerIdentifier.value,
            ),
    }),
    issues,
  );
}

register<DvIdentifier, Identifier>('dv-identifier-to-identifier', {
  toFhir: dvIdentifierToIdentifier,
  toOpenehr: identifierToDvIdentifier,
});

// ── DV_URI / DV_EHR_URI ↔ uri ────────────────────────────────────────────────

const EHR_SCHEME = 'ehr:';

export function dvUriToUri(source: DvUri): MappingResult<FhirUri> {
  return resultFor(source.value, []);
}

export function uriToDvUri(source: FhirUri): MappingResult<DvUri> {
  const isEhr = source.startsWith(EHR_SCHEME);
  const issues: Issue[] = isEhr
    ? []
    : [
        {
          path: REFERENCE_PATH.referenceReference,
          message:
            'the ehr: scheme addresses items inside an openEHR EHR and a FHIR reference ' +
            'addresses a resource; a value that did not originate as an ehr: URI cannot be ' +
            'turned into one',
        },
      ];

  return resultFor(
    { _type: isEhr ? ('DV_EHR_URI' as const) : ('DV_URI' as const), value: source },
    issues,
  );
}

register<DvUri, FhirUri>('dv-uri-to-uri', {
  toFhir: dvUriToUri,
  toOpenehr: uriToDvUri,
});

// ── LINK ↔ Reference ─────────────────────────────────────────────────────────

export function linkToReference(source: Link): MappingResult<Reference> {
  return resultFor(
    compact({ reference: source.target.value, display: source.meaning.value }),
    [
      {
        path: REFERENCE_PATH.linkTarget,
        message:
          'a LINK.target can address a sub-element of a composition and Reference.reference ' +
          'is a resource-level pointer; sub-element granularity is lost unless the ' +
          'targetElement or targetPath extension is used, which this guide does not produce',
      },
      {
        path: REFERENCE_PATH.linkMeaning,
        message:
          'LINK.meaning is a DV_TEXT and Reference.display is a plain string, so only ' +
          'DV_TEXT.value participates: formatting, encoding, the deprecated hyperlink, and ' +
          'term mappings have no home on a Reference',
      },
      {
        path: REFERENCE_PATH.linkType,
        message:
          'LINK.type is a DV_TEXT and its only FHIR home is CodeableReference.concept, ' +
          'which carries a CodeableConcept: only DV_TEXT.value participates, and a plain ' +
          'Reference — what a data-type conversion produces without the archetype-level ' +
          'decision to use a CodeableReference — carries no concept at all, so the link ' +
          'type is not emitted here',
      },
    ],
  );
}

export function referenceToLink(source: Reference): MappingResult<Link> {
  // `LINK` requires `meaning`, `type`, and `target`, all `1..1`. A FHIR
  // `Reference` supplies at most two of them and has **no field at all** that
  // can source `LINK.type`, so no `LINK` is produced: fabricating the literal
  // `'reference'` is exactly the invention the mandatory-attribute rule
  // forbids, and it made `link.target` and `link.meaning` claim a round trip
  // they never made.
  return unmapped([
    {
      path: REFERENCE_PATH.codeableReferenceConcept,
      message:
        'LINK.type is mandatory (1..1) and a FHIR Reference has no field that can source ' +
        'it; only a CodeableReference carries a concept, and choosing to use one is an ' +
        'archetype-level decision a data-type conversion does not make',
    },
    {
      path: REFERENCE_PATH.referenceReference,
      message:
        'no LINK is produced, so LINK.target receives nothing; the reference itself would ' +
        'carry across, but not on its own',
    },
    {
      path: REFERENCE_PATH.referenceDisplay,
      message:
        'no LINK is produced, so LINK.meaning receives nothing; the display text would ' +
        'carry across, but not on its own',
    },
    {
      path: REFERENCE_PATH.codeableReference,
      message:
        'openEHR has no single value combining a coded concept and a reference; splitting ' +
        'a CodeableReference into a coded element alongside a LINK, or into an enclosing ' +
        'CLUSTER, is an archetype decision and nothing here produces one',
    },
  ]);
}

register<Link, Reference>('link-to-reference', {
  toFhir: linkToReference,
  toOpenehr: referenceToLink,
});
