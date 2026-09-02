/**
 * Reference converter for `DV_TEXT` ↔ a FHIR `string` element.
 *
 * The FHIR side is the primitive **plus its `_`-sibling**, because the
 * `formatting` and `language` rows target extensions that live there.
 */

import { register } from '../registry.ts';
import { resultFor, unmapped, type Issue, type MappingResult } from '../result.ts';
import { narrowLanguageTag } from '../shared/language.ts';
import { TEXT_FORMATTING, type DvText } from '../types/openehr/textual.ts';
import { TEXT_EXT, type Extension, type FhirStringElement } from '../types/fhir/textual.ts';
import type { CodePhrase } from '../types/openehr/coded.ts';

/** Drop and unmapped paths, named once so the ledger and the code cannot drift. */
export const TEXTUAL_PATH = {
  formatting: 'DV_TEXT.formatting',
  encoding: 'DV_TEXT.encoding',
  hyperlink: 'DV_TEXT.hyperlink',
  mappings: 'DV_TEXT.mappings',
  stringValueAbsent: 'string.value[absent]',
  renderingXhtml: 'string.extension[rendering-xhtml]',
  languageTerminology: 'DV_TEXT.language.terminology_id',
  languageRegionSubtag: 'string.extension[language][region-subtag]',
  languageOutsideCodeSet: 'string.extension[language][outside-code-set]',
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

function findExtension(
  element: FhirStringElement,
  url: string,
): Extension | undefined {
  return element.extension?.find((e) => e.url === url);
}

/**
 * The `formatting` values that change what FHIR does, and how they are carried.
 *
 * Only `markdown`. RM § 5.1.7 enumerates `formatting` exhaustively and **has no
 * `html` value**, so there is no openEHR input that selects `rendering-xhtml`
 * and the guide emits none. XHTML on the openEHR side awaits a Reference Model
 * change request; until it lands, it is published as a gap.
 */
const RENDERING: Readonly<Record<string, { readonly url: string; readonly markdown: boolean }>> = {
  [TEXT_FORMATTING.markdown]: { url: TEXT_EXT.renderingMarkdown, markdown: true },
};

export function dvTextToString(source: DvText): MappingResult<FhirStringElement> {
  const issues: Issue[] = [];
  const extensions: Extension[] = [];

  if (source.formatting !== undefined) {
    const rendering = RENDERING[source.formatting];
    if (rendering === undefined) {
      issues.push({
        path: TEXTUAL_PATH.formatting,
        message:
          'the distinction between plain and plain_no_newlines has no FHIR representation, ' +
          'and neither does the legacy CSS string; only markdown changes what FHIR does',
      });
    } else if (rendering.markdown) {
      // `rendering-markdown` declares `value[x]: markdown`.
      extensions.push({ url: rendering.url, valueMarkdown: source.value });
    }
  }

  if (source.encoding !== undefined) {
    issues.push({
      path: TEXTUAL_PATH.encoding,
      message:
        'FHIR mandates UTF-8 and has no element recording a character set; the sender is ' +
        'responsible for converting before mapping',
    });
  }

  if (source.hyperlink !== undefined) {
    issues.push({
      path: TEXTUAL_PATH.hyperlink,
      message:
        'DV_TEXT.hyperlink is deprecated and a FHIR string has no associated link element; ' +
        'a link belongs in the content itself or on the enclosing resource',
    });
  }

  if (source.mappings !== undefined && source.mappings.length > 0) {
    issues.push({
      path: TEXTUAL_PATH.mappings,
      message:
        'a FHIR string cannot carry codings; a DV_TEXT with term mappings should be mapped ' +
        'as a CodeableConcept instead',
    });
  }

  if (source.language !== undefined) {
    // The `language` extension declares `value[x]: code 1..1` with a required
    // binding to `all-languages`, so it carries the tag and nothing else: the
    // CODE_PHRASE's terminology identifier has no home on a bare `code`.
    issues.push({
      path: TEXTUAL_PATH.languageTerminology,
      message:
        'the language extension is a code required-bound to all-languages, so it carries ' +
        'the tag alone; the CODE_PHRASE.terminology_id naming openEHR\u2019s ISO_639-1 ' +
        'code set has nowhere to live on a bare code',
    });
    extensions.push({ url: TEXT_EXT.language, valueCode: source.language.code_string });
  }

  return resultFor(
    compact({ value: source.value, extension: extensions }),
    issues,
  );
}

export function stringToDvText(source: FhirStringElement): MappingResult<DvText> {
  // `DV_TEXT.value` is mandatory (1..1) and a FHIR primitive element may carry
  // extensions with no value at all.
  if (source.value === undefined) {
    return unmapped([
      {
        path: TEXTUAL_PATH.stringValueAbsent,
        message:
          'DV_TEXT.value is mandatory (1..1) and the string element supplies no value; the ' +
          'mandatory-attribute rule forbids inventing one, so nothing is produced. A ' +
          'value-less primitive carrying only a data-absent-reason maps to a null flavour ' +
          'instead',
      },
    ]);
  }

  const languageExtension = findExtension(source, TEXT_EXT.language);
  // FHIR's binding is BCP 47 and openEHR's code set is ISO 639-1, which BCP 47
  // strictly contains. The narrowing is shared with `attachmentToDvMultimedia`
  // so the two cannot diverge again.
  const narrowed = narrowLanguageTag(languageExtension?.valueCode, {
    regionSubtag: TEXTUAL_PATH.languageRegionSubtag,
    outsideCodeSet: TEXTUAL_PATH.languageOutsideCodeSet,
  });
  const language: CodePhrase | undefined = narrowed.language;

  const formatting =
    findExtension(source, TEXT_EXT.renderingMarkdown) !== undefined
      ? TEXT_FORMATTING.markdown
      : undefined;

  // `rendering-xhtml` has **no** openEHR home: RM § 5.1.7 enumerates
  // `formatting` exhaustively and rejects HTML as a formatting approach, so
  // there is no value to write. `DV_TEXT.value` converts faithfully, and
  // refusing the whole conversion would discard text that maps perfectly well,
  // so the extension is a named drop rather than a refusal.
  const renderingXhtml: readonly Issue[] =
    findExtension(source, TEXT_EXT.renderingXhtml) === undefined
      ? []
      : [
          {
            path: TEXTUAL_PATH.renderingXhtml,
            message:
              'DV_TEXT.formatting has no value for XHTML rendering \u2014 the Reference ' +
              'Model enumerates the set exhaustively and rejects HTML as a formatting ' +
              'approach \u2014 so the rendering instruction is not carried. XHTML support ' +
              'on the openEHR side is pending a Reference Model change request',
          },
        ];

  return resultFor(
    compact({
      _type: 'DV_TEXT' as const,
      value: source.value,
      formatting,
      language,
    }),
    [...renderingXhtml, ...narrowed.issues],
  );
}

register<DvText, FhirStringElement>('dv-text-to-string', {
  toFhir: dvTextToString,
  toOpenehr: stringToDvText,
});
