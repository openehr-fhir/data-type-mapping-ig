import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveMirror } from '../src/model/spec-mirror-map.ts';
import { UNKNOWN_TERMINOLOGY } from '../src/convert/coded.ts';
import { TEXT_FORMATTING } from '../src/types/openehr/textual.ts';
import { ISO8601_FORMS, type TemporalKind } from '../src/shared/iso8601-subset.ts';

/**
 * Every openEHR vocabulary literal this harness writes, checked against the
 * published openEHR specification.
 *
 * The ledger's own gates cannot see these. A code-set identifier lives in
 * `src/convert/`, a `formatting` value in `src/types/openehr/`, and an ISO 8601
 * lexical form in `src/shared/` — none of them is a `Cite`, so `validate.ts`
 * and `cite-local.test.ts` never look at one. Three separate Blockers reached
 * the guide through that hole, so this file closes it for the **class**: each
 * inventory is derived from the code or the fixture tree, never restated, so a
 * literal added tomorrow is checked without anyone editing this file.
 *
 * Opt-in, in the same shape as `cite-local.test.ts`, and on `OPENEHR_SPEC_DIR`
 * **alone** — nothing here reads the FHIR mirror.
 */

const OPENEHR_ROOT = process.env['OPENEHR_SPEC_DIR'];

const SKIP_MESSAGE =
  'set OPENEHR_SPEC_DIR to a local openEHR specification mirror to run this test';

/** Published URLs, resolved through the mirror map so no file name is written twice. */
const SPEC_URL = {
  terminology: 'https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html',
  dataTypes: 'https://specifications.openehr.org/releases/RM/latest/data_types.html',
  foundation: 'https://specifications.openehr.org/releases/BASE/latest/foundation_types.html',
} as const;

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));

// ── the ratchet ──────────────────────────────────────────────────────────────

/**
 * The violations this gate finds on the day it lands, one entry per check.
 *
 * The gate is **red on arrival** — it exists because three published Blockers
 * were live when it was written — so it lands with a closing list rather than
 * with the fixes it is meant to protect. The assertion is an **equality**, not
 * a containment: an entry that is fixed without being removed fails exactly as
 * loudly as a new violation, so the list can only ever shrink deliberately.
 *
 * **This mechanism is deleted by the phase that empties it, and must never be
 * extended.** A new violation is a defect to fix, not an entry to add.
 */
const KNOWN_VIOLATIONS: readonly string[] = [
  // B8 — `html` is not a `DV_TEXT.formatting` value; RM § 5.1.7 enumerates the
  // set exhaustively and rejects HTML explicitly. Removed by Phase 38, which
  // also deletes this constant.
  'formatting: html',
];

/** One entry per check, or none when the check is clean. */
function emit(label: string, offenders: readonly string[]): readonly string[] {
  if (offenders.length === 0) return [];
  return [`${label}: ${[...offenders].sort().join(', ')}`];
}

/** The subset of the ratchet a given check owns. */
function knownFor(label: string): readonly string[] {
  return KNOWN_VIOLATIONS.filter((entry) => entry.startsWith(`${label}: `));
}

// ── mirror access ────────────────────────────────────────────────────────────

const mirrorCache = new Map<string, string>();

/** The raw HTML of the mirror page a published URL resolves to. */
function mirrorHtml(url: string): string {
  const cached = mirrorCache.get(url);
  if (cached !== undefined) return cached;
  const entry = resolveMirror(url);
  assert.ok(entry !== undefined, `no spec-mirror-map.ts entry for ${url}`);
  assert.ok(OPENEHR_ROOT !== undefined);
  const file = join(OPENEHR_ROOT, entry.file);
  assert.ok(existsSync(file), `mirror file absent: ${entry.file}`);
  const html = readFileSync(file, 'utf8');
  mirrorCache.set(url, html);
  return html;
}

/**
 * Tag-stripped, entity-decoded text.
 *
 * The mirrors are rendered HTML: a code-set identifier sits inside `<em>`, and
 * the XML sample that names the openEHR terminology is syntax-highlighted into
 * one `<span>` per token. Matching the specification's own prose therefore
 * means reading the text, not the markup.
 */
function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Every `.ts` file under `reference/src/`. */
function sourceFiles(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (entry.name.endsWith('.ts')) out.push(path);
  }
  return out;
}

/** Every openEHR-side fixture instance. */
function openehrFixtures(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...openehrFixtures(path));
    else if (entry.name.endsWith('.openehr.json')) out.push(path);
  }
  return out;
}

// ── inventory 1: code-set identifiers ────────────────────────────────────────

/**
 * Every `terminology_id` value the harness writes — from the converters and
 * from the fixtures both, because a literal that reaches an instance is a claim
 * about openEHR whichever file it was typed in.
 *
 * **Absolute URLs are out of scope by construction.** A `CODE_PHRASE` built
 * from a FHIR `Coding` carries the `system` URI opaquely, because the working
 * group has not chosen a `terminology_id` format — that is the standing open
 * item `doc-terminology-id-format`, and `src/convert/coded.ts` documents the
 * opacity as rule 1. Those values are not assertions about openEHR's published
 * code sets, so they are not checked against them. A URN such as
 * `urn:ietf:bcp:47` is **in** scope: it names a code set, and naming one
 * openEHR does not publish is exactly the defect this check exists to find.
 */
function codeSetIdentifiers(): readonly string[] {
  const found = new Set<string>();

  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(
      /terminology_id\s*:\s*\{\s*value\s*:\s*(['"])([^'"]*)\1/g,
    )) {
      const literal = match[2];
      if (literal !== undefined) found.add(literal);
    }
  }

  const collect = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) collect(item);
      return;
    }
    if (node === null || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    const id = record['terminology_id'];
    if (id !== null && typeof id === 'object') {
      const value = (id as Record<string, unknown>)['value'];
      if (typeof value === 'string') found.add(value);
    }
    for (const value of Object.values(record)) collect(value);
  };
  for (const file of openehrFixtures(FIXTURES)) {
    collect(JSON.parse(readFileSync(file, 'utf8')) as unknown);
  }

  return [...found].filter((value) => !/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(value));
}

/**
 * The code-set and terminology identifiers openEHR publishes, read out of the
 * Support Terminology specification rather than restated here.
 */
function publishedIdentifiers(): ReadonlySet<string> {
  const text = plainText(mirrorHtml(SPEC_URL.terminology));
  const published = new Set<string>();
  for (const match of text.matchAll(/^\s*Id: (\S+?),/gm)) {
    const value = match[1];
    if (value !== undefined) published.add(value);
  }
  for (const match of text.matchAll(/External_id: (\S+)\s*$/gm)) {
    const value = match[1];
    if (value !== undefined) published.add(value);
  }
  for (const match of text.matchAll(/terminology name="([^"]+)"/g)) {
    const value = match[1];
    if (value !== undefined) published.add(value);
  }
  return published;
}

function codeSetViolations(): readonly string[] {
  const published = publishedIdentifiers();
  const offenders = codeSetIdentifiers().filter(
    // The one recorded exception to the mandatory-attribute rule, imported from
    // the converter that owns it rather than restated — see the closed list on
    // `conventions.html#mandatory-attributes`.
    (id) => id !== UNKNOWN_TERMINOLOGY && !published.has(id),
  );
  return emit('code-set', offenders);
}

// ── inventory 2: DV_TEXT.formatting values ───────────────────────────────────

/**
 * RM § 5.1.7 *Formatting and Hyperlinking*, delimited from its own heading
 * anchor to the next heading.
 *
 * The delimitation is what makes the check mean anything: the bare token `html`
 * occurs all over the page — in URLs, and in the prose that **rejects** HTML as
 * a formatting approach — while the enumeration quotes each value it defines.
 */
function formattingSection(): string {
  const html = mirrorHtml(SPEC_URL.dataTypes);
  const start = html.indexOf('id="_formatting_and_hyperlinking"');
  assert.ok(start >= 0, 'the RM mirror has no _formatting_and_hyperlinking anchor');
  const rest = html.slice(start);
  const next = rest.slice(1).search(/<h[1-4][ >]/);
  return plainText(next < 0 ? rest : rest.slice(0, next + 1));
}

function formattingViolations(): readonly string[] {
  const section = formattingSection();
  const offenders = Object.values(TEXT_FORMATTING).filter(
    (value) => !section.includes(`"${value}"`),
  );
  return emit('formatting', offenders);
}

// ── inventory 3: ISO 8601 lexical forms ──────────────────────────────────────

/**
 * `valid_iso8601_date`, `valid_iso8601_time` and `valid_iso8601_date_time`,
 * transcribed from *Foundation Types* § *Time_Definitions*.
 *
 * Only the grammar is transcribed; the inventory it is applied to is derived
 * from `ISO8601_FORMS`. `GRAMMAR_RECEIPT` is the transcription's receipt — the
 * specification's own licensing sentences, asserted present in the mirror, so a
 * transcription that silently rots fails rather than passing on stale terms.
 */
const OPENEHR_GRAMMAR: Readonly<Record<TemporalKind, RegExp>> = {
  // YYYY-MM-DD | YYYY-MM | YYYY (extended) / YYYYMMDD | YYYYMM (compact)
  date: /^\d{4}(-\d{2}(-\d{2})?|\d{2}(\d{2})?)?$/,
  // hh:mm:ss[(,|.)s+][Z|±hh[:mm]] (extended) / hhmmss[(,|.)s+][Z|±hh[mm]] (compact)
  // partials: hh:mm (extended) / hhmm or hh (compact)
  time: /^(\d{2}:\d{2}(:\d{2}([,.]\d+)?)?(Z|[+-]\d{2}(:\d{2})?)?|\d{2}(\d{2}(\d{2}([,.]\d+)?)?)?(Z|[+-]\d{2}(\d{2})?)?)$/,
  // YYYY-MM-DDThh:mm:ss[(,|.)s+][Z|±hh[:mm]] (extended) / YYYYMMDDThhmmss[…] (compact)
  // partials: YYYY-MM-DDThh:mm | YYYY-MM-DDThh (extended) / YYYYMMDDThhmm | YYYYMMDDThh (compact)
  dateTime:
    /^(\d{4}-\d{2}-\d{2}T\d{2}(:\d{2}(:\d{2}([,.]\d+)?(Z|[+-]\d{2}(:\d{2})?)?)?)?|\d{4}\d{2}\d{2}T\d{2}(\d{2}(\d{2}([,.]\d+)?(Z|[+-]\d{2}(\d{2})?)?)?)?)$/,
};

/** Sentences the transcription above is a transcription **of**. */
const GRAMMAR_RECEIPT: readonly string[] = [
  'valid_iso8601_date',
  'valid_iso8601_time',
  'valid_iso8601_date_time',
  'YYYY-MM-DD (extended, preferred) or one of the partial forms YYYY-MM or YYYY',
  'hh:mm:ss[(,|.)s+][Z|\u00b1hh[:mm]] (extended)',
  'hhmmss[(,|.)s+][Z|\u00b1hh[mm]] (compact)',
  'hhmm or hh (compact)',
  'YYYY-MM-DDThh:mm or YYYY-MM-DDThh (extended)',
  'YYYYMMDDThhmm or YYYYMMDDThh (compact)',
];

function iso8601Violations(): readonly string[] {
  const offenders = ISO8601_FORMS.filter((form) => form.openehr)
    .filter((form) => !OPENEHR_GRAMMAR[form.kind].test(form.example))
    .map((form) => form.example);
  return emit('iso8601', offenders);
}

// ── the checks ───────────────────────────────────────────────────────────────

test('every openEHR code-set identifier the harness writes is published by openEHR', (t) => {
  if (OPENEHR_ROOT === undefined) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  const inventory = codeSetIdentifiers();
  assert.ok(
    inventory.length > 0,
    'the code-set inventory is empty, so the derivation is broken rather than clean',
  );
  assert.ok(
    publishedIdentifiers().has('ISO_639-1'),
    'the terminology mirror yielded no ISO_639-1, so the published set was not read',
  );

  assert.deepEqual(
    codeSetViolations(),
    knownFor('code-set'),
    `code-set identifiers openEHR does not publish, from ${inventory.join(', ')}`,
  );
});

test('every DV_TEXT.formatting value the harness writes is enumerated by the RM', (t) => {
  if (OPENEHR_ROOT === undefined) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  const section = formattingSection();
  assert.ok(
    section.includes('The formatting attribute may contain one of the following values'),
    'the RM formatting section was not delimited around its enumeration',
  );

  assert.deepEqual(
    formattingViolations(),
    knownFor('formatting'),
    `TEXT_FORMATTING values absent from RM \u00a7 5.1.7, from ${Object.values(
      TEXT_FORMATTING,
    ).join(', ')}`,
  );
});

test('every ISO 8601 form flagged openehr: true is accepted by the openEHR grammar', (t) => {
  if (OPENEHR_ROOT === undefined) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  const foundation = plainText(mirrorHtml(SPEC_URL.foundation));
  const unlicensed = GRAMMAR_RECEIPT.filter((sentence) => !foundation.includes(sentence));
  assert.deepEqual(
    unlicensed,
    [],
    `the transcribed grammar cites sentences the mirror does not contain:\n${unlicensed.join('\n')}`,
  );

  const inventory = ISO8601_FORMS.filter((form) => form.openehr);
  assert.ok(inventory.length > 0, 'no ISO8601_FORMS row is flagged openehr: true');

  assert.deepEqual(
    iso8601Violations(),
    knownFor('iso8601'),
    'openEHR examples rejected by valid_iso8601_date / _time / _date_time',
  );
});

test('the known-violation ratchet holds exactly the entries not yet remediated', (t) => {
  if (OPENEHR_ROOT === undefined) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  const observed = [
    ...codeSetViolations(),
    ...formattingViolations(),
    ...iso8601Violations(),
  ].sort();

  assert.deepEqual(
    observed,
    [...KNOWN_VIOLATIONS].sort(),
    'KNOWN_VIOLATIONS is an equality, not a floor: a fixed violation must be removed from ' +
      'it in the same commit, and a new one must be fixed rather than added',
  );
});
