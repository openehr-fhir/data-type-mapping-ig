import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closerFor, openerFor, parseRegions, spliceRegion } from '../render/regions.ts';
import {
  anchor,
  code,
  escapeAttr,
  escapeText,
  htmlTable,
  inline,
} from '../render/html.ts';
import {
  EXAMPLE_PREFIX,
  regionRenderers,
  renderExample,
  rendererFor,
  renderGapsFhirToOpenehr,
  renderGapsNotDiscussed,
  renderGapsOpenehrToFhir,
  renderSummaryAll,
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

test('a spliced body is separated from both sentinels by a blank line', () => {
  const spliced = spliceRegion(page('summary:all', 'x'), 'summary:all', '| a | b |');
  const lines = spliced.split('\n');
  const opener = lines.indexOf(openerFor('summary:all'));
  const closer = lines.indexOf(closerFor('summary:all'));
  assert.ok(opener >= 0 && closer > opener);
  assert.equal(lines[opener + 1], '', 'the line after the opener is blank');
  assert.equal(lines[closer - 1], '', 'the line before the closer is blank');
  assert.equal(lines[opener + 2], '| a | b |');
});

test('splicing a body that already has blank edges stays idempotent', () => {
  const once = spliceRegion(page('summary:all', 'x'), 'summary:all', '\n\nbody\n\n');
  const twice = spliceRegion(once, 'summary:all', '\n\nbody\n\n');
  assert.equal(twice, once);
  const lines = once.split('\n');
  const opener = lines.indexOf(openerFor('summary:all'));
  assert.equal(lines[opener + 1], '');
  assert.equal(lines[opener + 2], 'body');
  assert.equal(lines[opener + 3], '');
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
  assert.match(body, /<th>openEHR type<\/th><th>FHIR type<\/th>/);
});

test('a sentinel inside a fenced code block is documentation, not a region', () => {
  const documented = [
    '### Conventions',
    '',
    'A managed region looks like this:',
    '',
    '```',
    openerFor('<region-id>'),
    closerFor('<region-id>'),
    '```',
    '',
    openerFor('summary:all'),
    'real body',
    closerFor('summary:all'),
    '',
  ].join('\n');

  const regions = parseRegions(documented);
  assert.equal(regions.length, 1);
  assert.equal(regions[0]?.id, 'summary:all');
});

// ── the HTML serialization layer ─────────────────────────────────────────────

test('escapeText escapes the markup characters and flattens newlines', () => {
  assert.equal(escapeText('<T>'), '&lt;T&gt;');
  assert.equal(escapeText('a & b'), 'a &amp; b');
  assert.equal(escapeText('a\nb'), 'a b');
  assert.equal(escapeText('a\r\nb'), 'a b');
  // `&` is replaced first, so an escape is never double-escaped.
  assert.equal(escapeText('&lt;'), '&amp;lt;');
});

test('escapeAttr escapes quotes as well', () => {
  assert.equal(escapeAttr('a"b'), 'a&quot;b');
  assert.equal(escapeAttr("a'b"), 'a&#39;b');
});

test('an anchor label with angle brackets survives as text, not as a tag', () => {
  const link = anchor('mapping-quantity.html', 'DV_INTERVAL<T>');
  assert.equal(link, '<a href="mapping-quantity.html">DV_INTERVAL&lt;T&gt;</a>');
  assert.doesNotMatch(link, /<T>/);
});

test('a code cell keeps a bare pipe and gains no backslash', () => {
  const span = code('Range | Period | Quantity');
  assert.equal(span, '<code>Range | Period | Quantity</code>');
  assert.doesNotMatch(span, /\\/);
});

test('htmlTable enforces the column count at construction', () => {
  assert.throws(
    () => htmlTable(['a', 'b', 'c'], [['1', '2']]),
    /row 0 has 2 cell\(s\) but the header has 3/,
  );
});

test('htmlTable emits one row per line with the header column count', () => {
  const table = htmlTable(['a', 'b'], [['1', '2'], ['3', '4']]);
  const lines = table.split('\n');
  assert.equal(lines[0], '<table>');
  assert.equal(lines[2], '<tr><th>a</th><th>b</th></tr>');
  assert.equal(lines.filter((l) => l.startsWith('<tr><td>')).length, 2);
  assert.equal(table.at(-1), '>');
  // No indentation anywhere: an indented line could be read as a code block.
  assert.deepEqual(lines.filter((l) => /^\s/.test(l)), []);
});

test('inline converts the ledger markdown subset and escapes the rest', () => {
  assert.equal(inline('`DV_TEXT`'), '<code>DV_TEXT</code>');
  assert.equal(inline('**must**'), '<strong>must</strong>');
  assert.equal(inline('*when*'), '<em>when</em>');
  assert.equal(
    inline('[null_flavour](mapping-coded.html)'),
    '<a href="mapping-coded.html">null_flavour</a>',
  );
  assert.equal(inline('a < b'), 'a &lt; b');
  // A marker inside a code span is literal: code spans are scanned first.
  assert.equal(inline('`a|b *c*`'), '<code>a|b *c*</code>');
  // Nested prose is converted, not escaped — the ledger writes this.
  assert.equal(
    inline('**only `DV_TEXT.value` participates**'),
    '<strong>only <code>DV_TEXT.value</code> participates</strong>',
  );
});

test('inline turns a real ledger string into a working anchor', () => {
  assert.equal(
    inline('See [TERM_MAPPING](#term-mapping) below.'),
    'See <a href="#term-mapping">TERM_MAPPING</a> below.',
  );
});

test('each directional gap table contains only what its own heading promises', () => {
  /** The first column of every `<tbody>` row — the **feature** the gap is about. */
  const featureCells = (table: string): readonly string[] =>
    table
      .split('\n')
      .filter((line) => line.startsWith('<tr><td>'))
      .map((line) => line.slice('<tr><td>'.length).split('</td>')[0] ?? '');

  const outbound = featureCells(renderGapsOpenehrToFhir());
  const inbound = featureCells(renderGapsFhirToOpenehr());

  assert.ok(outbound.length > 0 && inbound.length > 0, 'both inventories have rows');

  // openEHR → FHIR is about **openEHR** features FHIR cannot receive, so no row
  // may be one whose openEHR side does not exist.
  const outboundOffenders = outbound.filter((c) => c.includes('no counterpart'));
  assert.deepEqual(outboundOffenders, [], outboundOffenders.join('\n'));

  // FHIR → openEHR is about **FHIR** features openEHR cannot receive, so no row
  // may be one whose FHIR side does not exist — and the FHIR types with no
  // openEHR counterpart at all are published in full by their own inventory.
  const inboundOffenders = inbound.filter((c) => c.includes('no counterpart'));
  assert.deepEqual(inboundOffenders, [], inboundOffenders.join('\n'));
  assert.ok(
    !inbound.some((c) => c.includes('RelativeTime')),
    'a FHIR type with no openEHR counterpart is not listed twice',
  );
});

// ── the converted-output regression guards ───────────────────────────────────

/**
 * Every registered renderer's body, keyed by region id.
 *
 * The guards below iterate this rather than a hand-picked list, so a renderer
 * added later is covered without anybody remembering to add it.
 */
function generatedBodies(): readonly (readonly [string, string])[] {
  return [...regionRenderers()].map(([id, render]) => [id, render()] as const);
}

/** Every `<td>`/`<th>` in a generated body, with its `<code>` spans removed. */
function cellsOutsideCodeSpans(body: string): readonly string[] {
  return [...body.matchAll(/<t[dh]>([\s\S]*?)<\/t[dh]>/g)].map((m) =>
    (m[1] ?? '').replace(/<code>[\s\S]*?<\/code>/g, ''),
  );
}

test('no generated body contains a markdown pipe-table row', () => {
  for (const [id, body] of generatedBodies()) {
    for (const line of body.split('\n')) {
      assert.doesNotMatch(line, /^\s*\|?\s*-{1,}\s*\|/, `${id}: delimiter row: ${line}`);
      assert.ok(!line.startsWith('| '), `${id}: markdown table row: ${line}`);
    }
  }
});

test('every generated table row has its header column count', () => {
  let checked = 0;
  for (const [id, body] of generatedBodies()) {
    for (const table of body.match(/<table>[\s\S]*?<\/table>/g) ?? []) {
      const headers = (table.match(/<th>/g) ?? []).length;
      assert.ok(headers > 0, `${id}: a table with no header cells`);
      const tbody = /<tbody>([\s\S]*?)<\/tbody>/.exec(table)?.[1] ?? '';
      for (const row of tbody.match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
        assert.equal((row.match(/<td>/g) ?? []).length, headers, `${id}: ${row}`);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 0, 'the guard actually inspected generated rows');
});

test('generated bodies contain only balanced tags from a known vocabulary', () => {
  const allowed = new Set([
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'code', 'em', 'strong', 'sup', 'br', 'p',
  ]);
  for (const [id, body] of generatedBodies()) {
    if (id.startsWith(EXAMPLE_PREFIX)) continue;
    const open: string[] = [];
    for (const tag of body.match(/<[^>]*>/g) ?? []) {
      const parsed = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*?)?(\/?)>$/.exec(tag);
      assert.ok(parsed !== null, `${id}: not a well-formed tag: ${tag}`);
      const name = (parsed?.[2] ?? '').toLowerCase();
      assert.ok(allowed.has(name), `${id}: unexpected element <${name}> from ${tag}`);
      if (parsed?.[4] === '/' || name === 'br') continue;
      if (parsed?.[1] === '/') {
        assert.equal(open.pop(), name, `${id}: ${tag} closes the wrong element`);
      } else {
        open.push(name);
      }
    }
    assert.deepEqual(open, [], `${id}: unclosed elements`);
  }
});

test('generated cells contain no residual markdown', () => {
  for (const [id, body] of generatedBodies()) {
    if (id.startsWith(EXAMPLE_PREFIX)) continue;
    for (const text of cellsOutsideCodeSpans(body)) {
      assert.ok(!text.includes('`'), `${id}: a backtick survived: ${text}`);
      assert.ok(!text.includes(']('), `${id}: a markdown link survived: ${text}`);
      assert.ok(!text.includes('**'), `${id}: markdown strong survived: ${text}`);
      assert.ok(!text.includes('\\|'), `${id}: an escaped pipe survived: ${text}`);
      assert.ok(!text.includes('*'), `${id}: markdown emphasis survived: ${text}`);
    }
  }
});

test('ledger prose survives conversion instead of being flattened', () => {
  const bodies = generatedBodies().filter(([id]) => !id.startsWith(EXAMPLE_PREFIX));

  // A link that came from prose, not from a citation: citations are absolute
  // spec URLs, so a relative page link inside a cell can only have come from
  // `inline()` running over ledger markdown.
  const proseLinks = bodies.flatMap(([, body]) =>
    [...body.matchAll(/<td>[\s\S]*?<\/td>/g)].flatMap((cellMatch) =>
      [...(cellMatch[0] ?? '').matchAll(/<a href="([^"]+)"/g)].map((m) => m[1] ?? ''),
    ),
  );
  assert.ok(
    proseLinks.some((href) => href.endsWith('.html') && !href.startsWith('http')),
    'at least one generated cell carries a link converted from ledger prose',
  );

  for (const [id, body] of bodies) {
    assert.ok(!body.includes(']('), `${id}: a literal markdown link reached the page`);
  }
});

test('a parameterised type name publishes as text, not as a tag', () => {
  const summary = renderSummaryAll();
  assert.match(summary, /<a href="[^"]*">DV_INTERVAL&lt;T&gt;<\/a>/);
  assert.ok(!summary.includes('</T>'), 'no stray closing tag from a type parameter');

  const notDiscussed = renderGapsNotDiscussed();
  assert.ok(notDiscussed.includes('EVENT&lt;T&gt;'), 'EVENT<T> is escaped');
  assert.ok(!notDiscussed.includes('<T>'), 'EVENT<T> is not parsed as a tag');
});
