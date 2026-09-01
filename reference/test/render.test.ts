import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closerFor, openerFor, parseRegions, spliceRegion } from '../render/regions.ts';
import {
  EXAMPLE_PREFIX,
  cell,
  regionRenderers,
  renderExample,
  rendererFor,
  renderSummaryAll,
  tableRow,
} from '../render/tables.ts';

/**
 * The managed-region machinery: bytes outside a sentinel pair are never
 * touched, a hand-edited region is detected, an unknown region id is an error,
 * a renderable region with no home is an error, and an `example:` region equals
 * its fixture.
 */

const PAGECONTENT = fileURLToPath(new URL('../../input/pagecontent/', import.meta.url));

function page(id: string, body: string): string {
  return [
    '### A page',
    '',
    'Hand-authored prose above.',
    '',
    openerFor(id),
    body,
    closerFor(id),
    '',
    'Hand-authored prose below.',
    '',
  ].join('\n');
}

test('a region is parsed with its id and body', () => {
  const regions = parseRegions(page('summary:all', 'old body'));
  assert.equal(regions.length, 1);
  assert.equal(regions[0]?.id, 'summary:all');
  assert.equal(regions[0]?.body, 'old body\n');
});

test('splicing leaves every byte outside the sentinels identical', () => {
  const before = page('summary:all', 'old body');
  const after = spliceRegion(before, 'summary:all', 'new body');

  const cut = (text: string): [string, string] => {
    const start = text.indexOf(openerFor('summary:all'));
    const end = text.indexOf(closerFor('summary:all')) + closerFor('summary:all').length;
    return [text.slice(0, start), text.slice(end)];
  };

  const [beforeHead, beforeTail] = cut(before);
  const [afterHead, afterTail] = cut(after);
  assert.equal(afterHead, beforeHead);
  assert.equal(afterTail, beforeTail);
  assert.match(after, /new body/);
  assert.doesNotMatch(after, /old body/);
});

test('splicing preserves the document line-ending convention', () => {
  const crlf = page('summary:all', 'old body').replace(/\n/g, '\r\n');
  const after = spliceRegion(crlf, 'summary:all', 'new\nbody');
  assert.ok(after.includes('new\r\nbody'));
  assert.doesNotMatch(after.replace(/\r\n/g, ''), /\n/);
});

test('splicing is idempotent', () => {
  const once = spliceRegion(page('summary:all', 'x'), 'summary:all', 'body');
  const twice = spliceRegion(once, 'summary:all', 'body');
  assert.equal(twice, once);
});

test('a hand-edited region is detected by re-rendering', () => {
  const rendered = spliceRegion(page('summary:all', ''), 'summary:all', 'LEDGER-BODY');
  const tampered = rendered.replace('LEDGER-BODY', 'somebody typed here');
  assert.notEqual(tampered, rendered);
  assert.equal(spliceRegion(tampered, 'summary:all', 'LEDGER-BODY'), rendered);
});

test('an unclosed region is an error', () => {
  const broken = ['prose', openerFor('summary:all'), 'body', 'more prose'].join('\n');
  assert.throws(() => parseRegions(broken), /opened but never closed/);
});

test('a closer with no opener is an error', () => {
  const broken = ['prose', closerFor('summary:all'), 'more prose'].join('\n');
  assert.throws(() => parseRegions(broken), /closer with no matching opener/);
});

test('the same region id twice in one page is an error', () => {
  const broken = [page('summary:all', 'a'), page('summary:all', 'b')].join('\n');
  assert.throws(() => parseRegions(broken), /more than once/);
});

test('splicing a region the page does not declare is an error', () => {
  assert.throws(
    () => spliceRegion(page('summary:all', ''), 'summary:quantity', 'x'),
    /no managed region 'summary:quantity'/,
  );
});

test('an unknown region id has no renderer', () => {
  assert.equal(rendererFor('summary:not-a-category', regionRenderers()), undefined);
  assert.equal(rendererFor('mapping:nothing-here', regionRenderers()), undefined);
});

test('every region declared by a page has a renderer', () => {
  const renderers = regionRenderers();
  const orphans: string[] = [];
  for (const file of readdirSync(PAGECONTENT).filter((f) => f.endsWith('.md'))) {
    const body = readFileSync(join(PAGECONTENT, file), 'utf8');
    for (const region of parseRegions(body)) {
      if (rendererFor(region.id, renderers) === undefined) orphans.push(`${file}: ${region.id}`);
    }
  }
  assert.deepEqual(orphans, [], `regions with no renderer:\n${orphans.join('\n')}`);
});

test('every renderer has a home in some page', () => {
  const homed = new Set<string>();
  for (const file of readdirSync(PAGECONTENT).filter((f) => f.endsWith('.md'))) {
    for (const region of parseRegions(readFileSync(join(PAGECONTENT, file), 'utf8'))) {
      homed.add(region.id);
    }
  }
  const homeless = [...regionRenderers().keys()]
    .filter((id) => !id.startsWith(EXAMPLE_PREFIX))
    .filter((id) => !homed.has(id));
  assert.deepEqual(homeless, [], `renderers with no home:\n${homeless.join('\n')}`);
});

test('an example: region equals its fixture after JSON normalization', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-render-'));
  try {
    const fixtures = fileURLToPath(new URL('../fixtures/', import.meta.url));
    mkdirSync(join(fixtures, '_render-test'), { recursive: true });
    const source = { resourceType: 'Quantity', value: 72, unit: 'kg' };
    writeFileSync(
      join(fixtures, '_render-test', '01-sample.fhir.json'),
      `${JSON.stringify(source, null, 2)}\n`,
      'utf8',
    );

    const block = renderExample('_render-test/01-sample.fhir.json');
    assert.ok(block.startsWith('```json\n'));
    assert.ok(block.endsWith('\n```'));
    const body = block.slice('```json\n'.length, -'\n```'.length);
    assert.deepEqual(JSON.parse(body), source);
  } finally {
    rmSync(join(fileURLToPath(new URL('../fixtures/', import.meta.url)), '_render-test'), {
      recursive: true,
      force: true,
    });
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an example: region for a missing fixture is an error', () => {
  assert.throws(() => renderExample('no-such-mapping/99-nope.fhir.json'));
});

test('the empty ledger still renders a summary region', () => {
  const body = renderSummaryAll();
  assert.match(body, /openEHR type \| FHIR type/);
});

test('table cells escape pipes and collapse newlines', () => {
  assert.equal(cell('a|b'), 'a\\|b');
  assert.equal(cell('a\nb'), 'a b');
  assert.equal(tableRow(['a', 'b']), '| a | b |');
});
