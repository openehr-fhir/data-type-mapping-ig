/**
 * Reference converters for the remaining data types.
 *
 * **The mandatory-attribute rule** applies here as everywhere: a converter with
 * no source for an attribute the target standard declares mandatory returns
 * `unmapped` naming the absent source path, rather than substituting a
 * constant. `DV_STATE.is_terminal` is the one recorded exception — see
 * `codeableConceptToDvState`.
 */

import { register } from '../registry.ts';
import { issuesOf, resultFor, unmapped, type Issue, type MappingResult } from '../result.ts';
import type { DvMultimedia, DvParsable, DvState } from '../types/openehr/other.ts';
import type { Attachment } from '../types/fhir/other.ts';
import type { FhirStringElement } from '../types/fhir/textual.ts';
import {
  codeableConceptToDvCodedText,
  dvCodedTextToCodeableConcept,
} from './coded.ts';
import type { CodeableConcept } from '../types/fhir/coded.ts';
import type { DvCodedText } from '../types/openehr/coded.ts';

/** Drop and unmapped paths, named once so the ledger and the code cannot drift. */
export const OTHER_PATH = {
  integrityCheckAlgorithm: 'DV_MULTIMEDIA.integrity_check_algorithm',
  compressionAlgorithm: 'DV_MULTIMEDIA.compression_algorithm',
  thumbnail: 'DV_MULTIMEDIA.thumbnail',
  charset: 'DV_MULTIMEDIA.charset',
  attachmentCreation: 'Attachment.creation',
  isTerminal: 'DV_STATE.is_terminal',
  attachmentContentTypeAbsent: 'Attachment.contentType[absent]',
  attachmentSizeAbsent: 'Attachment.size[absent]',
  stringValueAbsent: 'string.value[absent]',
  stringMimeTypeAbsent: 'string.extension[mimeType][absent]',
  stringValue: 'string.value',
  parsableFormalism: 'DV_PARSABLE.formalism',
  codeableConceptUnconvertible: 'CodeableConcept.coding',
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

// ── DV_MULTIMEDIA ↔ Attachment ───────────────────────────────────────────────

export function dvMultimediaToAttachment(source: DvMultimedia): MappingResult<Attachment> {
  const issues: Issue[] = [];

  if (source.integrity_check_algorithm !== undefined) {
    issues.push({
      path: OTHER_PATH.integrityCheckAlgorithm,
      message:
        'Attachment.hash is SHA-1 by definition and R5 has no element naming a different ' +
        'algorithm; FHIR-55422 adds a core alternate-hash extension that is not published yet',
    });
  }
  if (source.compression_algorithm !== undefined) {
    issues.push({
      path: OTHER_PATH.compressionAlgorithm,
      message:
        'FHIR Attachment has no element naming a compression algorithm; FHIR-56003 requests ' +
        'one and the pragmatic alternative is to decompress during conversion',
    });
  }
  if (source.thumbnail !== undefined) {
    issues.push({
      path: OTHER_PATH.thumbnail,
      message:
        'a nested thumbnail has no FHIR home; a new extension on Attachment is requested as ' +
        'FHIR-56002 and is not yet published',
    });
  }
  if (source.charset !== undefined) {
    issues.push({
      path: OTHER_PATH.charset,
      message:
        'FHIR has no charset element on an Attachment; where the charset applies to the ' +
        'attached bytes it belongs in the contentType MIME parameter instead',
    });
  }

  return resultFor(
    compact({
      contentType: source.media_type.code_string,
      data: source.data,
      url: source.uri?.value,
      size: source.size,
      hash: source.integrity_check,
      title: source.alternate_text,
    }),
    issues,
  );
}

export function attachmentToDvMultimedia(source: Attachment): MappingResult<DvMultimedia> {
  // `Attachment.creation`, `.height`, `.width`, `.frames`, `.duration`, and
  // `.pages` are `archetype`-scope rows: they belong to the openEHR extended
  // media-details archetype rather than to `DV_MULTIMEDIA`, so a data-type
  // converter is not the thing that reports them.
  const issues: Issue[] = [];

  // `DV_MULTIMEDIA.media_type` and `.size` are both mandatory (1..1) while
  // `Attachment.contentType` and `.size` are `0..1`, so an Attachment that
  // omits either cannot become a DV_MULTIMEDIA.
  if (source.contentType === undefined || source.size === undefined) {
    const mediaType: Issue = {
      path: OTHER_PATH.attachmentContentTypeAbsent,
      message:
        'DV_MULTIMEDIA.media_type is mandatory (1..1) and the Attachment supplies no ' +
        'contentType; the mandatory-attribute rule forbids inventing one, so nothing is ' +
        'produced',
    };
    const size: Issue = {
      path: OTHER_PATH.attachmentSizeAbsent,
      message:
        'DV_MULTIMEDIA.size is mandatory (1..1) and the Attachment supplies no size; the ' +
        'mandatory-attribute rule forbids inventing one — 0 is a real size, not a missing ' +
        'one — so nothing is produced',
    };
    if (source.contentType === undefined && source.size === undefined) {
      return unmapped([mediaType, size]);
    }
    return unmapped(source.contentType === undefined ? [mediaType] : [size]);
  }

  return resultFor(
    compact({
      _type: 'DV_MULTIMEDIA' as const,
      media_type: {
        _type: 'CODE_PHRASE' as const,
        terminology_id: { value: 'IANA_media-types' },
        code_string: source.contentType,
      },
      size: source.size,
      data: source.data,
      uri:
        source.url === undefined
          ? undefined
          : { _type: 'DV_URI' as const, value: source.url },
      alternate_text: source.title,
      integrity_check: source.hash,
    }),
    issues,
  );
}

register<DvMultimedia, Attachment>('dv-multimedia-to-attachment', {
  toFhir: dvMultimediaToAttachment,
  toOpenehr: attachmentToDvMultimedia,
});

// ── DV_PARSABLE ↔ string ─────────────────────────────────────────────────────

export function dvParsableToString(source: DvParsable): MappingResult<FhirStringElement> {
  return resultFor({ value: source.value }, [
    {
      path: OTHER_PATH.parsableFormalism,
      message:
        'no FHIR element or extension carries the syntax a parsable instance is written ' +
        'in, so the formalism is not carried and the resulting string cannot be read back ' +
        'as a DV_PARSABLE',
    },
  ]);
}

export function stringToDvParsable(source: FhirStringElement): MappingResult<DvParsable> {
  // `DV_PARSABLE.formalism` is mandatory (1..1) and **nothing in FHIR states
  // it**, so a data-type conversion cannot produce a DV_PARSABLE at all. The
  // formalism has to come from the element definition, which a data-type
  // converter never sees.
  return unmapped([
    {
      path: OTHER_PATH.stringValue,
      message:
        'a FHIR string carries no statement of the syntax its value is written in, and ' +
        'DV_PARSABLE.formalism is mandatory, so no DV_PARSABLE is produced; the formalism ' +
        'must come from the element definition',
    },
  ]);
}

register<DvParsable, FhirStringElement>('dv-parsable-to-string', {
  toFhir: dvParsableToString,
  toOpenehr: stringToDvParsable,
});

// ── DV_STATE ↔ CodeableConcept ───────────────────────────────────────────────

export function dvStateToCodeableConcept(source: DvState): MappingResult<CodeableConcept> {
  const concept = dvCodedTextToCodeableConcept(source.value);
  return resultFor(concept.value as CodeableConcept, [
    {
      path: OTHER_PATH.isTerminal,
      message:
        'FHIR has no data type for a state-machine value and no element carries a terminal ' +
        'flag; carrying it would require an extension, and none is invented here',
    },
    ...issuesOf(concept),
  ]);
}

export function codeableConceptToDvState(source: CodeableConcept): MappingResult<DvState> {
  const coded = codeableConceptToDvCodedText(source);
  if (coded.value === undefined) {
    return unmapped([
      {
        path: OTHER_PATH.codeableConceptUnconvertible,
        message:
          'DV_STATE.value is mandatory (1..1) and the CodeableConcept is not convertible ' +
          'to a DV_CODED_TEXT, so no DV_STATE is produced',
      },
      ...issuesOf(coded),
    ]);
  }

  return resultFor(
    {
      _type: 'DV_STATE' as const,
      value: coded.value,
      // `is_terminal: false` is the **one recorded exception** to the
      // mandatory-attribute rule in this module: nothing in a CodeableConcept
      // can source it, and the openEHR-only gap is already published, so the
      // flag is inferred from the state machine the archetype defines rather
      // than carried. `contract.test.ts` pins the exception.
      is_terminal: false,
    },
    issuesOf(coded),
  );
}

register<DvState, CodeableConcept>('dv-state-to-codeable-concept', {
  toFhir: dvStateToCodeableConcept,
  toOpenehr: codeableConceptToDvState,
});
