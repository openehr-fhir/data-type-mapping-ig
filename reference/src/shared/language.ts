/**
 * Narrowing a FHIR language tag to the code set openEHR actually publishes.
 *
 * The two standards do not bind language to the same set. FHIR's `language`
 * extension and `Attachment.language` are both `code` elements **required**-bound
 * to `all-languages`, whose codes are IETF BCP 47 tags. openEHR's Support
 * Terminology publishes exactly one language code set —
 * `Id: languages, External_id: ISO_639-1` — and both `DV_TEXT` and
 * `DV_ENCAPSULATED` carry the invariant
 * `Language_valid : language /= Void implies code_set (Code_set_id_languages).has_code (language)`.
 *
 * **BCP 47 strictly contains ISO 639-1.** `en` is in both; `en-US` and `zh-Hant`
 * are BCP 47 and are not ISO 639-1 alpha-2, and a three-letter ISO 639-2 tag is
 * neither. So the inbound conversion is a **narrowing**, and it says so:
 *
 * 1. an alpha-2 tag is an ISO 639-1 code and is carried, with no loss;
 * 2. a tag carrying a region or script subtag keeps its alpha-2 prefix and the
 *    subtag is a **named drop**;
 * 3. anything else is outside the code set the invariant requires, so
 *    `language` is **omitted** and the omission is reported.
 *
 * Omission rather than refusal of the whole conversion, because `language` is
 * `0..1` on both `DV_TEXT` and `DV_ENCAPSULATED` and the text itself converts
 * faithfully. Inventing a `terminology_id` for a code the code set does not
 * hold is the defect this module exists to stop.
 *
 * One module and two call sites, because two independent copies of this rule is
 * how the previous defect reached two files at once. The drop paths differ per
 * call site — each row anchors its drops on the FHIR endpoint it declares — so
 * they are a parameter rather than a constant here.
 */

import type { Issue } from '../result.ts';
import type { CodePhrase } from '../types/openehr/coded.ts';

/** The drop paths a caller anchors its narrowing on. */
export interface LanguageDropPaths {
  /** The tag carried a region or script subtag that ISO 639-1 has no code for. */
  readonly regionSubtag: string;
  /** The tag is not an ISO 639-1 code at all, so no `language` is produced. */
  readonly outsideCodeSet: string;
}

/** The `CODE_PHRASE` to write, if any, and everything the narrowing lost. */
export interface NarrowedLanguage {
  readonly language: CodePhrase | undefined;
  readonly issues: readonly Issue[];
}

/** openEHR's `languages` code set, `External_id: ISO_639-1`. */
function iso639_1(code: string): CodePhrase {
  return {
    _type: 'CODE_PHRASE',
    terminology_id: { value: 'ISO_639-1' },
    code_string: code,
  };
}

export function narrowLanguageTag(
  code: string | undefined,
  paths: LanguageDropPaths,
): NarrowedLanguage {
  if (code === undefined) return { language: undefined, issues: [] };

  if (/^[a-z]{2}$/.test(code)) return { language: iso639_1(code), issues: [] };

  const subtagged = /^([a-z]{2})-.+$/.exec(code);
  if (subtagged !== null) {
    const alpha2 = subtagged[1] as string;
    return {
      language: iso639_1(alpha2),
      issues: [
        {
          path: paths.regionSubtag,
          message:
            'the FHIR binding is BCP 47 and openEHR binds language to its own ISO_639-1 ' +
            'code set, which holds alpha-2 codes only; the primary language subtag is ' +
            'carried and the region or script subtag is not',
        },
      ],
    };
  }

  return {
    language: undefined,
    issues: [
      {
        path: paths.outsideCodeSet,
        message:
          'the tag is not an ISO 639-1 alpha-2 code, and openEHR\u2019s Language_valid ' +
          'invariant requires the value to be in its published languages code set; no ' +
          'language is written rather than a terminology_id being invented for a code ' +
          'that code set does not hold',
      },
    ],
  };
}
