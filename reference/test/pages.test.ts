import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { parse } from 'yaml';

/**
 * `AGENTS.md`: **a new page means two edits** — `pages:` *and* `menu:` in
 * `sushi-config.yaml`. This mechanizes that invariant in **both** directions,
 * so a page registered once but not twice fails as loudly as one registered
 * nowhere.
 *
 * It also pins the page count, so an off-by-one in the inventory is a test
 * failure rather than something a reader discovers.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const PAGECONTENT = join(REPO_ROOT, 'input', 'pagecontent');
const CONFIG = join(REPO_ROOT, 'sushi-config.yaml');

/** The number of entries `pages:` is expected to hold. */
const EXPECTED_PAGE_COUNT = 18;

/** Menu leaves the IG template generates; they have no `pages:` entry. */
const TEMPLATE_GENERATED = new Set(['toc.html', 'artifacts.html']);

interface SushiConfig {
  readonly pages?: Record<string, unknown>;
  readonly menu?: Record<string, unknown>;
}

function config(): SushiConfig {
  return parse(readFileSync(CONFIG, 'utf8')) as SushiConfig;
}

function pageKeys(): readonly string[] {
  return Object.keys(config().pages ?? {});
}

function pageFiles(): readonly string[] {
  return readdirSync(PAGECONTENT).filter((f) => f.endsWith('.md'));
}

/** Every `*.html` leaf reachable from `menu:`, at any nesting depth. */
function menuLeaves(): readonly string[] {
  const leaves: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      if (node.endsWith('.html')) leaves.push(node);
      return;
    }
    if (node !== null && typeof node === 'object') {
      for (const value of Object.values(node as Record<string, unknown>)) walk(value);
    }
  };
  walk(config().menu ?? {});
  return leaves;
}

/** `foo.md` → `foo.html`. */
function asHtml(page: string): string {
  return page.replace(/\.md$/, '.html');
}

test('every pages: entry has a matching file in input/pagecontent/', () => {
  const files = new Set(pageFiles());
  const missing = pageKeys().filter((key) => !files.has(key));
  assert.deepEqual(missing, [], `pages: entries with no file: ${missing.join(', ')}`);
});

test('every input/pagecontent/*.md is registered in pages:', () => {
  const keys = new Set(pageKeys());
  const unregistered = pageFiles().filter((file) => !keys.has(file));
  assert.deepEqual(
    unregistered,
    [],
    `page files missing from pages: (they will not be rendered at all): ${unregistered.join(', ')}`,
  );
});

test('every menu: leaf resolves to a pages: entry', () => {
  const pages = new Set(pageKeys().map(asHtml));
  const dangling = menuLeaves().filter(
    (leaf) => !TEMPLATE_GENERATED.has(leaf) && !pages.has(leaf),
  );
  assert.deepEqual(dangling, [], `menu: leaves with no pages: entry: ${dangling.join(', ')}`);
});

test('every pages: entry is reachable from menu:', () => {
  const leaves = new Set(menuLeaves());
  const unreachable = pageKeys()
    .map(asHtml)
    .filter((html) => !leaves.has(html));
  assert.deepEqual(
    unreachable,
    [],
    `pages: entries with no menu: leaf — "a new page means TWO edits": ${unreachable.join(', ')}`,
  );
});

test('pages: holds exactly the expected number of entries', () => {
  assert.equal(
    pageKeys().length,
    EXPECTED_PAGE_COUNT,
    'the page inventory changed; update EXPECTED_PAGE_COUNT deliberately, not reflexively',
  );
});

test('every pages: entry declares a title', () => {
  const pages = config().pages ?? {};
  const untitled = Object.entries(pages)
    .filter(([, value]) => {
      if (value === null || typeof value !== 'object') return true;
      const title = (value as Record<string, unknown>)['title'];
      return typeof title !== 'string' || title.trim() === '';
    })
    .map(([key]) => key);
  assert.deepEqual(untitled, [], `pages: entries with no title: ${untitled.join(', ')}`);
});

test('cross-page links point at generated .html names, never .md sources', () => {
  const offenders: string[] = [];
  for (const file of pageFiles()) {
    const body = readFileSync(join(PAGECONTENT, file), 'utf8');
    for (const match of body.matchAll(/\]\(([^)\s]+\.md)(#[^)\s]*)?\)/g)) {
      offenders.push(`${file}: ${match[1]}`);
    }
  }
  assert.deepEqual(offenders, [], `markdown links to .md sources:\n${offenders.join('\n')}`);
});
