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
  renderMappingTable,
  renderSummaryAll,
} from '../render/tables.ts';
import { ledger } from '../src/model/load.ts';
import {
  CATEGORY_PAGE,
  hasFieldTable,
  mappingAnchorId,
  mappingHref,
  rowAnchorId,
  slugify,
} from '../src/publish/guide-links.ts';

/**
 * The managed-region machinery: bytes outside a sentinel pair are never
 * touched, a hand-edited region is detected, an unknown region id is an error,
 * a renderable region with no home is an error, and an `example:` region equals
 * its fixture.
 */

const PAGECONTENT = fileURLToPath(new URL('../../input/pagecontent/', import.meta.url));
const SCROLL_WRAPPER =
  '<div style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">';
const MARKDOWN_SCROLL_WRAPPER = SCROLL_WRAPPER.replace('<div ', '<div markdown="1" ');

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

test('code preserves caller-supplied literal backslashes', () => {
  assert.equal(
    code(String.raw`Range \| Period \| Quantity`),
    String.raw`<code>Range \| Period \| Quantity</code>`,
  );
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
  assert.equal(lines[0], SCROLL_WRAPPER);
  assert.equal(lines[1], '<table class="grid">');
  assert.equal(lines[3], '<tr><th>a</th><th>b</th></tr>');
  assert.equal(lines.filter((l) => l.startsWith('<tr><td>')).length, 2);
  assert.deepEqual(lines.slice(-2), ['</table>', '</div>']);
  assert.equal(table.at(-1), '>');
  // No indentation anywhere: an indented line could be read as a code block.
  assert.deepEqual(lines.filter((l) => /^\s/.test(l)), []);
});

test('htmlTable decorates populated and empty tables with accessible grid overflow', () => {
  for (const rows of [[], [['<code>a | b</code>', '<em>already escaped &amp; composed</em>']]]) {
    const table = htmlTable(['a', 'b'], rows);
    assert.equal(assertGeneratedPresentation('helper', table), 1);
    assert.deepEqual(
      [...table.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]),
      rows.flat(),
      'cell fragments are unchanged, including the zero-row case',
    );
    assert.equal((table.match(/<tr>/g) ?? []).length, rows.length + 1);
  }
});

test('htmlTable keeps only the exact openEHR direction header on one line', () => {
  const ordinary = [
    '→ FHIR', '→ OpenEHR', '→ openEHR ', ' → openEHR', '→  openEHR',
    '→\u00a0openEHR', '<code>→ openEHR</code>', 'Notes',
  ];
  for (const position of [0, 3, ordinary.length]) {
    const headers = [...ordinary.slice(0, position), '→ openEHR', ...ordinary.slice(position)];
    const bodyCells = headers.map(() => '→ openEHR');
    const table = htmlTable(headers, [bodyCells]);
    assert.equal(assertGeneratedPresentation('direction-header', table), 1);
    const emitted = [...table.matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/g)];
    assert.deepEqual(emitted.map((match) => match[2]), headers, 'no label normalization');
    assert.equal(emitted[position]?.[2]?.codePointAt(1), 0x20, 'the space stays U+0020');
    assert.deepEqual(
      [...table.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g)].map((match) => [match[1], match[2]]),
      bodyCells.map((cell) => ['', cell]),
      'an identically worded body cell receives no styling',
    );
  }
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
  // A complete code span keeps its payload literal.
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

for (const [name, input, expected] of [
  ['strong inside emphasis', '*a **b** c*', '<em>a <strong>b</strong> c</em>'],
  ['emphasis inside strong', '**a *b* c**', '<strong>a <em>b</em> c</strong>'],
  ['emphasis around delimiter-bearing code', '*`*_unbounded`*', '<em><code>*_unbounded</code></em>'],
  ['strong around delimiter-bearing code', '**`**_unbounded`**', '<strong><code>**_unbounded</code></strong>'],
  [
    'composed link label',
    '[**only `DV_TEXT.value` participates**](mapping-textual.html)',
    '<a href="mapping-textual.html"><strong>only <code>DV_TEXT.value</code> participates</strong></a>',
  ],
] as const) {
  test(`inline preserves supported nesting: ${name}`, () => {
    assert.equal(inline(input), expected);
  });
}

for (const [name, input, expected] of [
  ['strong closes before emphasis', '*a **b***', '<em>a <strong>b</strong></em>'],
  ['emphasis closes before strong', '**a *b***', '<strong>a <em>b</em></strong>'],
  [
    'alternating nested markers',
    '*a **b *c* d** e*',
    '<em>a <strong>b <em>c</em> d</strong> e</em>',
  ],
  ['emphasis then adjacent strong', '*a***b**', '<em>a</em><strong>b</strong>'],
  ['strong then adjacent emphasis', '**a***b*', '<strong>a</strong><em>b</em>'],
  [
    'opaque link target inside emphasis',
    '*see [x](a*b.html) now*',
    '<em>see <a href="a*b.html">x</a> now</em>',
  ],
  [
    'opaque code inside a composed link label',
    '[**a `](*` b**](mapping-textual.html)',
    '<a href="mapping-textual.html"><strong>a <code>](*</code> b</strong></a>',
  ],
  [
    'adjacent emphasis siblings inside strong',
    '**a *b**c* d**',
    '<strong>a <em>b</em><em>c</em> d</strong>',
  ],
  [
    'adjacent emphasis siblings at strong closer',
    '**a *b**c***',
    '<strong>a <em>b</em><em>c</em></strong>',
  ],
  [
    'complete nested child wins over an adjacent interpretation',
    '**a *b**c**d* e**',
    '<strong>a <em>b<strong>c</strong>d</em> e</strong>',
  ],
  [
    'adjacent emphasis siblings under alternating ancestors',
    '*lead **a *b**c* d** tail*',
    '<em>lead <strong>a <em>b</em><em>c</em> d</strong> tail</em>',
  ],
  [
    'delimiter-bearing code in nested adjacent emphasis',
    '**a *`*_unbounded`**c* d**',
    '<strong>a <em><code>*_unbounded</code></em><em>c</em> d</strong>',
  ],
  [
    'nested adjacent emphasis in a composed link label',
    '[**a *b**c* d**](mapping-textual.html)',
    '<a href="mapping-textual.html"><strong>a <em>b</em><em>c</em> d</strong></a>',
  ],
] as const) {
  test(`inline preserves enclosing and adjoining boundaries: ${name}`, () => {
    assert.equal(inline(input), expected);
  });
}

for (const [name, input, expected] of [
  ['unmatched backtick before emphasis', '`unfinished then *ok*', '`unfinished then <em>ok</em>'],
  ['unmatched emphasis before code', '*unfinished then `x`', '*unfinished then <code>x</code>'],
  ['unmatched link before code', '[unfinished `x`', '[unfinished <code>x</code>'],
  ['invalid link target', '[**x**](bad target)', '[<strong>x</strong>](bad target)'],
  ['unsupported underscore syntax', '_literal_ and __literal__', '_literal_ and __literal__'],
  ['empty emphasis is literal', '**', '**'],
  ['empty code span', '``', '<code></code>'],
  ['empty link label', '[](target)', '<a href="target"></a>'],
  ['empty link target is literal', '[x]()', '[x]()'],
  ['escaping inside strong', '**a < b & c**', '<strong>a &lt; b &amp; c</strong>'],
  [
    'failed inner emphasis leaves its parent closer and later span',
    '**a *unfinished** then *ok*',
    '<strong>a *unfinished</strong> then <em>ok</em>',
  ],
  [
    'failed enclosing continuation leaves adjoining spans',
    '*a **b**',
    '<em>a </em><em>b</em>*',
  ],
] as const) {
  test(`inline preserves literal fallback and raw helper contracts: ${name}`, () => {
    assert.equal(inline(input), expected);
  });
}

test('inline composes a link label and escapes its quoted target once', () => {
  assert.equal(
    inline('[**a < b & `x>`**](p?q="a"&v=\'b\')'),
    '<a href="p?q=&quot;a&quot;&amp;v=&#39;b&#39;"><strong>a &lt; b &amp; <code>x&gt;</code></strong></a>',
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

function assertGeneratedCellContent(id: string, body: string): number {
  let checked = 0;
  for (const match of body.matchAll(/<t([dh])\b[^>]*>([\s\S]*?)<\/t\1>/g)) {
    const cell = match[2] ?? '';
    for (const span of cell.matchAll(/<code>([\s\S]*?)<\/code>/g)) {
      const payload = span[1] ?? '';
      assert.ok(!payload.includes('\\|'), `${id}: an escaped pipe survived inside code: ${payload}`);
    }
    const text = cell.replace(/<code>[\s\S]*?<\/code>/g, '');
    assert.ok(!text.includes('`'), `${id}: a backtick survived: ${text}`);
    assert.ok(!text.includes(']('), `${id}: a markdown link survived: ${text}`);
    assert.ok(!text.includes('**'), `${id}: markdown strong survived: ${text}`);
    assert.ok(!text.includes('\\|'), `${id}: an escaped pipe survived: ${text}`);
    assert.ok(!text.includes('*'), `${id}: markdown emphasis survived: ${text}`);
    checked += 1;
  }
  return checked;
}

function assertGeneratedPresentation(id: string, body: string): number {
  const tables = [...body.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g)];
  assert.equal((body.match(/<table\b/g) ?? []).length, tables.length, `${id}: closed tables`);
  assert.equal((body.match(/<div\b/g) ?? []).length, tables.length, `${id}: one wrapper per table`);
  assert.equal((body.match(/<\/div>/g) ?? []).length, tables.length, `${id}: closed wrappers`);
  let directionHeaders = 0;
  for (const table of tables) {
    assert.match(
      table[0],
      /^<table class="grid"( id="[^"]+")?>\n<thead>\n/,
      `${id}: native grid table`,
    );
    assert.ok(table[0].endsWith('</tbody>\n</table>'), `${id}: native table body`);
    assert.ok(
      body.slice(0, table.index).endsWith(`${SCROLL_WRAPPER}\n`),
      `${id}: the complete scroll wrapper immediately encloses this table`,
    );
    assert.ok(
      body.slice(table.index + table[0].length).startsWith('\n</div>'),
      `${id}: this table has its own wrapper closer`,
    );
    for (const header of table[0].matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/g)) {
      const target = header[2] === '→ openEHR';
      assert.equal(header[1], target ? ' style="white-space: nowrap;"' : '', `${id}: header styling`);
      if (target) directionHeaders += 1;
    }
  }
  assert.equal(
    (body.match(/white-space:\s*nowrap/g) ?? []).length,
    directionHeaders,
    `${id}: no no-wrap styling outside exact direction headers`,
  );
  return tables.length;
}

function only<T>(values: readonly T[], description: string): T {
  assert.equal(values.length, 1, `expected exactly one ${description}`);
  const value = values[0];
  assert.ok(value !== undefined, `missing ${description}`);
  return value;
}

function generatedCell(id: string, heading: string, label: string, column: string): string {
  const [, body] = only(
    generatedBodies().filter(([candidate]) => candidate === id),
    `${id} registered body`,
  );
  const table = only(
    [...body.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g)]
      .map(([html]) => html)
      .filter((html) =>
        [...html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].some((match) => match[1] === heading),
      ),
    `${id} table headed ${heading}`,
  );
  const [thead] = only([...table.matchAll(/<thead>[\s\S]*?<\/thead>/g)], `${id} thead`);
  const headers = [...thead.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map((match) => match[1]);
  assert.equal(headers.length, 6, `${id}: six header cells`);
  assert.equal(headers[0], heading, `${id}: first header`);
  assert.equal(headers.filter((header) => header === heading).length, 1, `${id}: unique heading`);
  const columnIndex = only(
    headers.flatMap((header, index) => header === column ? [index] : []),
    `${id} ${column} header`,
  );
  const [tbody] = only([...table.matchAll(/<tbody>[\s\S]*?<\/tbody>/g)], `${id} tbody`);
  const rows = [...tbody.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)].map(([row]) =>
    [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]),
  );
  const cells = only(
    rows.filter((row) => {
      const first = row[0];
      assert.ok(first !== undefined, `${id}: row has a first cell`);
      const endpoint = /^<a href="[^"]*">([^<]*)<\/a>/.exec(first);
      return endpoint !== null && endpoint[1] === label;
    }),
    `${id} row with first-cell endpoint ${label}`,
  );
  assert.equal(cells.length, headers.length, `${id}: ${label} has six data cells`);
  const cell = cells[columnIndex];
  assert.ok(cell !== undefined, `${id}: ${label} has a ${column} cell`);
  return cell;
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
  const checked = { tables: 0, headers: 0, rows: 0, cells: 0 };
  for (const [id, body] of generatedBodies()) {
    for (const table of body.match(/<table\b[^>]*>[\s\S]*?<\/table>/g) ?? []) {
      const headers = (table.match(/<th\b[^>]*>/g) ?? []).length;
      assert.ok(headers > 0, `${id}: a table with no header cells`);
      const [, tbody] = only([...table.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)], `${id} tbody`);
      assert.ok(tbody !== undefined, `${id}: a table body`);
      checked.tables += 1;
      checked.headers += headers;
      for (const row of tbody.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []) {
        const cells = (row.match(/<td\b[^>]*>/g) ?? []).length;
        assert.equal(cells, headers, `${id}: ${row}`);
        checked.rows += 1;
        checked.cells += cells;
      }
    }
  }
  for (const [kind, count] of Object.entries(checked)) {
    assert.ok(count > 0, `the guard actually inspected generated ${kind}`);
  }
});

test('every registered generated table has grid presentation and its own scroll wrapper', () => {
  let checked = 0;
  let directionHeaders = 0;
  for (const [id, body] of generatedBodies()) {
    if (id.startsWith(EXAMPLE_PREFIX)) continue;
    checked += assertGeneratedPresentation(id, body);
    directionHeaders += (body.match(/<th\b[^>]*>→ openEHR<\/th>/g) ?? []).length;
  }
  assert.equal(checked, 48, 'all current tables across every registered table family');
  assert.ok(directionHeaders > 0, 'exact direction headers were inspected');
});

test('generated bodies contain only balanced tags from a known vocabulary', () => {
  const allowed = new Set([
    'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'code', 'em', 'strong', 'sup', 'br', 'p',
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
  let checked = 0;
  for (const [id, body] of generatedBodies()) {
    if (id.startsWith(EXAMPLE_PREFIX)) continue;
    checked += assertGeneratedCellContent(id, body);
  }
  assert.ok(checked > 0, 'the guard actually inspected generated cells');
});

test('generated-cell validation inspects attributed header and data cells', () => {
  for (const tag of ['th', 'td']) {
    for (const payload of [
      '`unconverted`', '**strong**', '*emphasis*', '[link](target)',
      String.raw`<code>Range \| Period</code>`,
    ]) {
      assert.throws(
        () => assertGeneratedCellContent('attributed', `<${tag} class="example">${payload}</${tag}>`),
        /survived/,
        `${tag}: attributed cells still reject ${payload}`,
      );
    }
  }
  assert.equal(
    assertGeneratedCellContent(
      'clean-attributed',
      '<table class="grid"><thead><tr><th style="white-space: nowrap;">→ openEHR</th></tr></thead>' +
        '<tbody><tr><td class="example"><code>Range | Period</code></td></tr></tbody></table>',
    ),
    2,
    'both attributed cell kinds are inspected',
  );
  assert.equal(
    assertGeneratedCellContent('not-a-cell', '<thead class="example">**not a cell**</thead>'),
    0,
    'the th tag-name boundary does not match thead',
  );
});

test('generated-cell validation rejects escaped pipes inside code', () => {
  const body = String.raw`<table><thead><tr><th>FHIR type</th></tr></thead><tbody><tr><td><code>Range \| Period \| Quantity</code></td></tr></tbody></table>`;
  assert.equal((body.match(/<th>/g) ?? []).length, 1, 'one header cell');
  assert.equal((body.match(/<td>/g) ?? []).length, 1, 'one data cell matches the header width');
  assert.throws(
    () => assertGeneratedCellContent('escaped-code', body),
    /escaped-code: an escaped pipe survived inside code:/,
  );
});

test('generated-cell validation accepts clean code alternatives', () => {
  const body = '<table><thead><tr><th>FHIR type</th></tr></thead><tbody><tr><td><code>Range | Period | Quantity</code></td></tr></tbody></table>';
  assert.equal((body.match(/<th>/g) ?? []).length, 1, 'one header cell');
  assert.equal((body.match(/<td>/g) ?? []).length, 1, 'one data cell matches the header width');
  assertGeneratedCellContent('clean-code', body);
});

test('generated-cell validation treats Markdown-looking code as opaque', () => {
  const body = '<table><thead><tr><th>FHIR type</th></tr></thead><tbody><tr><td><code>* ** [label](target) `backticks`</code></td></tr></tbody></table>';
  assert.equal((body.match(/<th>/g) ?? []).length, 1, 'one header cell');
  assert.equal((body.match(/<td>/g) ?? []).length, 1, 'one data cell matches the header width');
  assertGeneratedCellContent('opaque-code', body);
});

test('DV_BOOLEAN.value preserves its complete generated Notes cell', () => {
  assert.equal(
    generatedCell('mapping:dv-boolean-to-boolean', 'openEHR field', 'DV_BOOLEAN.value', 'Notes'),
    'A direct 1:1 mapping with no transformation: neither side carries precision, accuracy, or ' +
      'auxiliary metadata. The one asymmetry is <strong>optionality</strong>. ' +
      '<code>DV_BOOLEAN.value</code> is <strong>mandatory</strong> in the Reference Model — a ' +
      '<code>DV_BOOLEAN</code> that exists has a value — while a FHIR <code>boolean</code> element ' +
      'may be absent, with the reason for its absence carried by an extension on the element ' +
      'rather than by a value. An absent FHIR <code>boolean</code> therefore has no ' +
      '<code>DV_BOOLEAN</code> to become; see <a href="mapping-coded.html">null_flavour</a> for ' +
      'how "why is this absent" is carried. This row is <code>open</code> because the section has ' +
      'not yet been reviewed from either side.',
  );
});

test('LINK.meaning preserves its complete generated Notes cell', () => {
  assert.equal(
    generatedCell('mapping:link-to-reference', 'openEHR field', 'LINK.meaning', 'Notes'),
    '→ FHIR: drops <code>LINK.meaning</code> — <code>LINK.meaning</code> is a ' +
      '<code>DV_TEXT [1..1]</code> and <code>Reference.display</code> is a plain <code>string</code>, ' +
      'so <strong>only <code>DV_TEXT.value</code> participates</strong>. <code>formatting</code>, ' +
      '<code>encoding</code>, the deprecated <code>hyperlink</code>, and <code>mappings</code> are ' +
      '<code>lossy</code> or <code>unmapped</code> into a FHIR <code>string</code> — see the ' +
      '<code>DV_TEXT</code> table on <a href="mapping-textual.html">Textual Data</a> — and a ' +
      '<code>Reference.display</code> has no extension slot in this mapping to carry them ' +
      '→ openEHR: No <code>LINK</code> is produced at all, so nothing lands in <code>meaning</code>. ' +
      'See the <code>LINK.type</code> row. (owner: <code>openehr-modelling</code>) The ' +
      '<code>lossless</code> claim this row used to carry was false in both directions: it ignored ' +
      'every <code>DV_TEXT</code> attribute except <code>value</code>, and it depended on ' +
      '<code>referenceToLink</code> fabricating a <code>LINK.type</code>.',
  );
});

for (const [name, label, expected] of [
  ['DV_INTERVAL<T>', 'DV_INTERVAL&lt;T&gt;', '<code>Range | Period | Quantity</code>'],
  ['DV_CODED_TEXT', 'DV_CODED_TEXT', '<code>CodeableConcept | Coding</code>'],
  ['DV_TEXT', 'DV_TEXT', '<code>string | markdown</code>'],
  ['DV_PARAGRAPH', 'DV_PARAGRAPH', '<code>markdown | string</code>'],
  ['DV_URI / DV_EHR_URI', 'DV_URI / DV_EHR_URI', '<code>uri | url</code>'],
  ['LINK', 'LINK', '<code>Reference | CodeableReference</code>'],
  ['DV_DATE', 'DV_DATE', '<code>date | dateTime</code>'],
  ['DV_DATE_TIME', 'DV_DATE_TIME', '<code>dateTime | instant</code>'],
] as const) {
  test(`summary:all preserves its alternative cell: ${name}`, () => {
    assert.equal(generatedCell('summary:all', 'openEHR type', label, 'FHIR type'), expected);
  });
}

test('no hand-authored code span publishes an escaped pipe', () => {
  // Narrow on purpose: `\|` outside a code span is legitimate markdown escaping
  // in a hand-authored table, and only inside a code span does the backslash
  // reach the reader.
  const offenders: string[] = [];
  for (const file of readdirSync(PAGECONTENT).filter((f) => f.endsWith('.md'))) {
    let fence: string | undefined;
    const lines = readFileSync(join(PAGECONTENT, file), 'utf8').split('\n');
    lines.forEach((rawLine, index) => {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      const fenceMatch = /^\s*(```+|~~~+)/.exec(line);
      if (fenceMatch !== null) {
        const marker = fenceMatch[1] as string;
        if (fence === undefined) fence = marker;
        else if (marker.startsWith(fence)) fence = undefined;
        return;
      }
      if (fence !== undefined) return;
      for (const span of line.match(/`[^`]*`/g) ?? []) {
        if (span.includes('\\|')) offenders.push(`${file}:${index + 1}: ${span}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `an escaped pipe publishes literally:\n${offenders.join('\n')}`);
});

function authoredLines(markdown: string): readonly string[] {
  const parts: string[] = [];
  let end = 0;
  for (const region of parseRegions(markdown)) {
    parts.push(markdown.slice(end, region.start));
    end = region.end;
  }
  parts.push(markdown.slice(end));
  let fence: string | undefined;
  return parts.join('\n').split(/\r?\n/).map((line) => {
    const match = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    const marker = match?.[1];
    if (fence !== undefined) {
      if (marker?.startsWith(fence) && (match?.[2] ?? '').trim() === '') fence = undefined;
      return '';
    }
    if (marker !== undefined) {
      fence = marker;
      return '';
    }
    return line;
  });
}

function tagAttribute(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return match?.[1] ?? match?.[2];
}

function assertScrollWrapper(id: string, opening: string, markdown: boolean): void {
  assert.match(opening, /^<div\b[^>]*>$/i, `${id}: a complete div wrapper`);
  assert.equal(tagAttribute(opening, 'tabindex'), '0', `${id}: a keyboard-focusable wrapper`);
  assert.equal(tagAttribute(opening, 'role'), 'group', `${id}: a group, not a landmark`);
  assert.ok(tagAttribute(opening, 'aria-label')?.trim(), `${id}: a named wrapper`);
  const style = tagAttribute(opening, 'style') ?? '';
  assert.match(style, /\bmax-width\s*:\s*100%\s*(?:;|$)/, `${id}: viewport-bounded wrapper`);
  assert.match(style, /\boverflow-x\s*:\s*auto\s*(?:;|$)/, `${id}: local horizontal scrolling`);
  assert.doesNotMatch(style, /white-space\s*:\s*nowrap/, `${id}: ordinary wrapping`);
  if (markdown) assert.equal(tagAttribute(opening, 'markdown'), '1', `${id}: Markdown processing`);
}

function assertAuthoredPresentation(id: string, markdown: string): { markdown: number; html: number } {
  const lines = authoredLines(markdown);
  const checked = { markdown: 0, html: 0 };
  const delimiter = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?\s*$/;
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index]?.includes('|') || !delimiter.test(lines[index + 1] ?? '')) continue;
    let end = index + 2;
    while (lines[end]?.includes('|')) end += 1;
    const attributes = /^\s*\{:\s*([^}]*)\}\s*$/.exec(lines[end] ?? '');
    assert.ok(attributes !== null, `${id}: an immediately attached table attribute`);
    assert.match(attributes[1] ?? '', /(?:^|\s)\.grid(?:\s|$)/, `${id}: the table has .grid`);
    assert.equal(lines[index - 1]?.trim(), '', `${id}: a blank line after the Markdown wrapper`);
    let before = index - 1;
    while (before >= 0 && lines[before]?.trim() === '') before -= 1;
    assertScrollWrapper(id, lines[before]?.trim() ?? '', true);
    assert.equal(lines[end + 1]?.trim(), '', `${id}: a blank line before the wrapper closer`);
    let after = end + 1;
    while (after < lines.length && lines[after]?.trim() === '') after += 1;
    assert.equal(lines[after]?.trim(), '</div>', `${id}: this table has its own wrapper closer`);
    checked.markdown += 1;
    index = end;
  }

  const visible = lines.join('\n');
  const tables = [...visible.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)];
  assert.equal((visible.match(/<table\b/gi) ?? []).length, tables.length, `${id}: closed HTML tables`);
  for (const table of tables) {
    const opening = /^<table\b[^>]*>/i.exec(table[0])?.[0] ?? '';
    assert.ok(tagAttribute(opening, 'class')?.split(/\s+/).includes('grid'), `${id}: HTML table grid`);
    const wrapper = /<div\b[^>]*>\s*$/i.exec(visible.slice(0, table.index))?.[0].trim() ?? '';
    assertScrollWrapper(id, wrapper, false);
    assert.match(
      visible.slice(table.index + table[0].length),
      /^\s*<\/div>/i,
      `${id}: this HTML table has its own wrapper closer`,
    );
    checked.html += 1;
  }
  return checked;
}

test('every authored narrative table has grid presentation and a Markdown scroll wrapper', () => {
  const inventory: Record<string, { markdown: number; html: number }> = {};
  for (const file of readdirSync(PAGECONTENT).filter((f) => f.endsWith('.md'))) {
    const checked = assertAuthoredPresentation(file, readFileSync(join(PAGECONTENT, file), 'utf8'));
    if (checked.markdown + checked.html > 0) inventory[file] = checked;
  }
  assert.deepEqual(inventory, {
    'conventions.md': { markdown: 6, html: 0 },
    'cross-cutting.md': { markdown: 2, html: 0 },
    'mapping.md': { markdown: 1, html: 0 },
    'type-systems.md': { markdown: 1, html: 0 },
  }, 'all ten current authored tables, not fenced examples or managed bodies');
});

test('authored-table coverage rejects missing decorations and ignores fenced examples', () => {
  const rows = '| A | B |\n|-|-|\n| left | right |';
  const decorated = `${MARKDOWN_SCROLL_WRAPPER}\n\n${rows}\n{: .grid}\n\n</div>`;
  assert.deepEqual(assertAuthoredPresentation('valid', decorated), { markdown: 1, html: 0 });
  assert.deepEqual(
    assertAuthoredPresentation('existing-attributes', decorated.replace('{: .grid}', '{: #sample .other .grid}')),
    { markdown: 1, html: 0 },
  );
  for (const broken of [
    rows,
    decorated.replace('{: .grid}', ''),
    decorated.replace('{: .grid}', '{: .gridlike}'),
    decorated.replace(MARKDOWN_SCROLL_WRAPPER, ''),
    decorated.replace('</div>', ''),
    decorated.replace('tabindex="0"', ''),
    decorated.replace('role="group"', ''),
    decorated.replace('aria-label="Scrollable table"', 'aria-label=" "'),
    decorated.replace('markdown="1"', ''),
    decorated.replace('overflow-x: auto;', ''),
    decorated.replace('>\n\n|', '>\n|'),
    decorated.replace('{: .grid}\n\n</div>', '{: .grid}\n</div>'),
  ]) {
    assert.throws(() => assertAuthoredPresentation('missing-decoration', broken));
  }
  for (const fence of ['```', '~~~']) {
    const example = `${fence}markdown\n${rows}\n\n<table><tr><td>example</td></tr></table>\n${fence}`;
    assert.deepEqual(assertAuthoredPresentation('fenced', example), { markdown: 0, html: 0 });
    assert.deepEqual(
      assertAuthoredPresentation('fenced-and-real', `${example}\n\n${decorated}`),
      { markdown: 1, html: 0 },
    );
  }
  assert.deepEqual(
    assertAuthoredPresentation('longer-fence', `\`\`\`\`markdown\n${rows}\n\`\`\`\n${rows}\n\`\`\`\``),
    { markdown: 0, html: 0 },
  );
  assert.deepEqual(
    assertAuthoredPresentation('managed-and-real', `${page('summary:all', rows)}\n${decorated}`),
    { markdown: 1, html: 0 },
  );
});

test('authored HTML tables cannot bypass the grid and scroll-wrapper guard', () => {
  const table = '<table class="other grid"><thead><tr><th>A</th></tr></thead><tbody></tbody></table>';
  const decorated = `${SCROLL_WRAPPER}\n${table}\n</div>`;
  assert.deepEqual(assertAuthoredPresentation('html', decorated), { markdown: 0, html: 1 });
  assert.deepEqual(
    assertAuthoredPresentation(
      'html-uppercase',
      decorated.replace('<table class=', '<TABLE CLASS=').replace('</table>', '</TABLE>'),
    ),
    { markdown: 0, html: 1 },
  );
  for (const broken of [
    table,
    decorated.replace('class="other grid"', 'class="gridlike"'),
    decorated.replace('class="other grid"', '').replaceAll('table', 'TABLE'),
    decorated.replace('</div>', ''),
    decorated.replace('</table>', ''),
    decorated.replace('tabindex="0"', ''),
    `${SCROLL_WRAPPER}\n${table}\n${table}\n</div>`,
  ]) {
    assert.throws(() => assertAuthoredPresentation('undecorated-html', broken));
  }
});

test('regeneration preserves authored table decoration outside sentinels', () => {
  const decorated = `${MARKDOWN_SCROLL_WRAPPER}\n\n| A | B |\n|-|-|\n| left | right |\n{: .grid}\n\n</div>`;
  const before = `Prose above.\n\n${decorated}\n\n${page('summary:all', 'old body')}\n${decorated}\n\nProse below.\n`;
  const after = spliceRegion(before, 'summary:all', htmlTable(['New'], [['body']]));
  const oldRegion = only(parseRegions(before), 'original region');
  const newRegion = only(parseRegions(after), 'regenerated region');
  assert.equal(after.slice(0, newRegion.start), before.slice(0, oldRegion.start));
  assert.equal(after.slice(newRegion.end), before.slice(oldRegion.end));
  assert.deepEqual(assertAuthoredPresentation('preserved', after), { markdown: 2, html: 0 });
  assert.equal(spliceRegion(after, 'summary:all', htmlTable(['New'], [['body']])), after);
});

test('a parameterised type name publishes as text, not as a tag', () => {
  const summary = renderSummaryAll();
  assert.match(summary, /<a href="[^"]*">DV_INTERVAL&lt;T&gt;<\/a>/);
  assert.ok(!summary.includes('</T>'), 'no stray closing tag from a type parameter');

  const notDiscussed = renderGapsNotDiscussed();
  assert.ok(notDiscussed.includes('EVENT&lt;T&gt;'), 'EVENT<T> is escaped');
  assert.ok(!notDiscussed.includes('<T>'), 'EVENT<T> is not parsed as a tag');
});

// ── the published anchor contract ────────────────────────────────────────────

/** Every mapping the guide publishes a field table for. */
function anchoredMappings() {
  return ledger().filter((mapping) => hasFieldTable(mapping));
}

test('a mapping table carries its mapping anchor and one anchor per row', () => {
  let checkedRows = 0;
  for (const mapping of anchoredMappings()) {
    const body = renderMappingTable(mapping);
    const [table] = only(
      [...body.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g)],
      `${mapping.id}: one field table`,
    );
    assert.match(
      table,
      new RegExp(`^<table class="grid" id="${mappingAnchorId(mapping.id)}">`),
      `${mapping.id}: the table carries its mapping anchor`,
    );
    const [, tbody] = only(
      [...table.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)],
      `${mapping.id} tbody`,
    );
    const ids = [...(tbody ?? '').matchAll(/<tr\b([^>]*)>/g)].map(([, attrs]) =>
      /^ id="([^"]*)"$/.exec(attrs ?? '')?.[1],
    );
    assert.deepEqual(
      ids,
      mapping.rows.map((row) => rowAnchorId(mapping.id, row.id)),
      `${mapping.id}: one row anchor per ledger row, in ledger order`,
    );
    checkedRows += ids.length;
  }
  assert.ok(checkedRows > 0, 'the guard actually inspected generated rows');
});

test('every anchor id is unique across the whole ledger', () => {
  const seen = new Map<string, string>();
  for (const mapping of anchoredMappings()) {
    for (const id of [
      mappingAnchorId(mapping.id),
      ...mapping.rows.map((row) => rowAnchorId(mapping.id, row.id)),
    ]) {
      const owner = seen.get(id);
      assert.equal(owner, undefined, `anchor '${id}' is claimed by both ${owner} and ${mapping.id}`);
      assert.match(id, /^[a-z0-9-]+$/, `anchor '${id}' is URL-safe without escaping`);
      seen.set(id, mapping.id);
    }
  }
  assert.ok(seen.size > 0, 'the guard actually inspected anchors');
});

test('a link into the guide only carries a fragment the renderer publishes', () => {
  const renderers = regionRenderers();
  let fragments = 0;
  let bare = 0;
  for (const mapping of ledger()) {
    const href = mappingHref(mapping);
    if (href.includes('#')) {
      assert.ok(
        renderers.has(`mapping:${mapping.id}`),
        `${mapping.id}: a fragment link needs a published mapping: region`,
      );
      assert.equal(
        href,
        `${CATEGORY_PAGE[mapping.category]}#${mappingAnchorId(mapping.id)}`,
        `${mapping.id}: the fragment is the anchor the renderer emits`,
      );
      fragments += 1;
    } else {
      assert.equal(mapping.category, 'gaps', `${mapping.id}: only gaps mappings link bare`);
      assert.ok(
        !renderers.has(`mapping:${mapping.id}`),
        `${mapping.id}: a bare link means no mapping: region is published`,
      );
      bare += 1;
    }
  }
  assert.ok(fragments > 0 && bare > 0, 'both link shapes were inspected');
});

test('slugify collapses a row id to a single URL-safe token', () => {
  assert.equal(slugify('DV_QUANTITY.magnitude'), 'dv-quantity-magnitude');
  assert.equal(slugify('fhir:Quantity.value[x]'), 'fhir-quantity-value-x');
  assert.equal(slugify('--already--'), 'already');
  assert.ok(!slugify('DV_INTERVAL<T>.lower').includes('--'), 'no double separator inside a slug');
});

test('an unadorned table renders exactly as before', () => {
  const table = htmlTable(['a', 'b'], [['1', '2']]);
  assert.ok(table.includes('<table class="grid">'), 'no id attribute on the table');
  assert.ok(!table.includes('id='), 'no id attribute anywhere');
  assert.ok(table.includes('<tr><td>1</td><td>2</td></tr>'), 'no id attribute on a row');
  assert.equal(htmlTable(['a', 'b'], [['1', '2']], {}), table, 'empty options change nothing');
});

test('an anchored table escapes its ids and skips undefined rows', () => {
  const table = htmlTable(['a'], [['1'], ['2']], {
    id: 'x"y',
    rowIds: ['r&1', undefined],
  });
  assert.ok(table.includes('<table class="grid" id="x&quot;y">'), 'the table id is escaped');
  assert.ok(table.includes('<tr id="r&amp;1"><td>1</td></tr>'), 'the row id is escaped');
  assert.ok(table.includes('<tr><td>2</td></tr>'), 'an undefined row id emits no attribute');
});
