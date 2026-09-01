/** Reference converters for the remaining data types. */

import { register } from '../registry.ts';
import { resultFor, type Issue, type MappingResult } from '../result.ts';
import type { DvMultimedia, DvParsable, DvState } from '../types/openehr/other.ts';
import type { Attachment } from '../types/fhir/other.ts';
import { TEXT_EXT, type Extension, type FhirStringElement } from '../types/fhir/textual.ts';
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

  return resultFor(
    compact({
      _type: 'DV_MULTIMEDIA' as const,
      media_type: {
        _type: 'CODE_PHRASE' as const,
        terminology_id: { value: 'IANA_media-types' },
        code_string: source.contentType ?? 'application/octet-stream',
      },
      size: source.size ?? 0,
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
  const extension: Extension[] = [{ url: TEXT_EXT.mimeType, valueString: source.formalism }];
  return resultFor({ value: source.value, extension }, []);
}

export function stringToDvParsable(source: FhirStringElement): MappingResult<DvParsable> {
  const formalism = source.extension?.find((e) => e.url === TEXT_EXT.mimeType)?.valueString;
  return resultFor(
    {
      _type: 'DV_PARSABLE' as const,
      value: source.value ?? '',
      formalism: formalism ?? 'text/plain',
    },
    [],
  );
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
  ]);
}

export function codeableConceptToDvState(source: CodeableConcept): MappingResult<DvState> {
  const coded = codeableConceptToDvCodedText(source);
  return resultFor(
    {
      _type: 'DV_STATE' as const,
      value: coded.value as DvCodedText,
      is_terminal: false,
    },
    // Nothing arrives to drop: `is_terminal` is mandatory in openEHR and is
    // inferred from the state machine the archetype defines. An inference is
    // not a dropped source field, so it is not reported as one.
    [],
  );
}

register<DvState, CodeableConcept>('dv-state-to-codeable-concept', {
  toFhir: dvStateToCodeableConcept,
  toOpenehr: codeableConceptToDvState,
});
