import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { citesOf, type Cite } from '../src/model/types.ts';
import { ledger } from '../src/model/load.ts';
import { envVarFor, resolveMirror, SPEC_MIRRORS } from '../src/model/spec-mirror-map.ts';

/**
 * Every `spec-local` citation in the ledger resolves to a real page in a local
 * mirror of the specification it claims to cite.
 *
 * Scope is deliberately narrow. `spec-remote` citations (THO, Jira, and openEHR
 * pages absent from the mirror) and `extension-unverified` citations (the FHIR
 * extension pack, which the R5 mirror does not contain) are **out of scope** —
 * they are host-allow-listed and well-formed only, and `conventions.html`
 * carries a standing footnote saying so.
 *
 * The test is portable: it skips unless both mirror roots are configured.
 */

const ROOTS: Readonly<Record<'openehr' | 'fhir', string | undefined>> = {
  openehr: process.env['OPENEHR_SPEC_DIR'],
  fhir: process.env['FHIR_R5_DIR'],
};

const CONFIGURED = ROOTS.openehr !== undefined && ROOTS.fhir !== undefined;

const SKIP_MESSAGE =
  'set OPENEHR_SPEC_DIR and FHIR_R5_DIR to local specification mirrors to run this test';

/** Every citation in the ledger, with a label saying where it came from. */
function allCites(): readonly { readonly where: string; readonly cite: Cite }[] {
  const out: { where: string; cite: Cite }[] = [];
  for (const mapping of ledger()) {
    for (const cite of mapping.sources) out.push({ where: `${mapping.id} sources`, cite });
    for (const row of mapping.rows) {
      for (const cite of citesOf(row)) out.push({ where: `${mapping.id}/${row.id}`, cite });
    }
  }
  return out;
}

test('every spec-local citation resolves to a file in the local mirrors', (t) => {
  if (!CONFIGURED) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  const unresolved: string[] = [];
  const missing: string[] = [];

  for (const { where, cite } of allCites()) {
    if (cite.verification !== 'spec-local') continue;
    const entry = resolveMirror(cite.url);
    if (entry === undefined) {
      unresolved.push(`${where}: ${cite.url}`);
      continue;
    }
    const root = ROOTS[entry.root];
    if (root === undefined) continue;
    const file = join(root, entry.file);
    if (!existsSync(file)) {
      missing.push(`${where}: ${cite.url} → ${envVarFor(entry.root)}/${entry.file}`);
    }
  }

  assert.deepEqual(
    unresolved,
    [],
    `spec-local citations with no spec-mirror-map.ts entry:\n${unresolved.join('\n')}`,
  );
  assert.deepEqual(
    missing,
    [],
    `spec-local citations whose mirror file is absent:\n${missing.join('\n')}`,
  );
});

test('the mirror map itself points at files that exist', (t) => {
  if (!CONFIGURED) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  // Imported statically; the ledger is not read at all when the test skips.
  const missing: string[] = [];
  for (const entry of SPEC_MIRRORS) {
    const root = ROOTS[entry.root];
    if (root === undefined) continue;
    if (!existsSync(join(root, entry.file))) {
      missing.push(`${entry.prefix} → ${envVarFor(entry.root)}/${entry.file}`);
    }
  }
  assert.deepEqual(missing, [], `mirror entries with no file:\n${missing.join('\n')}`);
});
