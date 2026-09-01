/**
 * Projects the mapping ledger into the managed regions of
 * `input/pagecontent/*.md`.
 *
 * Two modes:
 *
 * - default — write every region into its page.
 * - `--check` — re-render in memory and exit `1` on any byte difference. This
 *   is the drift gate: a hand-edited region, or a ledger change nobody
 *   re-rendered, becomes a loud failure instead of a silent divergence.
 *
 * Two conditions are **errors in both modes**, because either one means a page
 * and the renderer have got out of step:
 *
 * - a page declares a region id no renderer claims;
 * - a renderer claims a region id no page has a home for.
 *
 * That is why a region and its renderer always land in the same commit.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseRegions, spliceRegion } from './regions.ts';
import { EXAMPLE_PREFIX, regionRenderers, rendererFor } from './tables.ts';

const PAGECONTENT = fileURLToPath(new URL('../../input/pagecontent/', import.meta.url));

interface PageRegions {
  readonly file: string;
  readonly ids: readonly string[];
}

function pages(): readonly PageRegions[] {
  return readdirSync(PAGECONTENT)
    .filter((f) => f.endsWith('.md'))
    .map((file) => ({
      file,
      ids: parseRegions(readFileSync(join(PAGECONTENT, file), 'utf8')).map((r) => r.id),
    }));
}

/** Render every region of one page, returning the new document text. */
function renderPage(file: string, ids: readonly string[]): string {
  const path = join(PAGECONTENT, file);
  let text = readFileSync(path, 'utf8');
  const renderers = regionRenderers();
  for (const id of ids) {
    const renderer = rendererFor(id, renderers);
    if (renderer === undefined) {
      throw new Error(
        `${file}: managed region '${id}' has no renderer. Either the region was ` +
          `planted before its renderer landed, or the id is a typo.`,
      );
    }
    text = spliceRegion(text, id, renderer());
  }
  return text;
}

/** Every region id declared across all pages. */
function homedIds(all: readonly PageRegions[]): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const page of all) for (const id of page.ids) ids.add(id);
  return ids;
}

/**
 * Renderers that claim a region no page declares.
 *
 * `example:` regions are keyed by fixture path and resolved dynamically, so
 * they cannot be homeless by construction and are excluded.
 */
function homelessRenderers(all: readonly PageRegions[]): readonly string[] {
  const homed = homedIds(all);
  return [...regionRenderers().keys()]
    .filter((id) => !id.startsWith(EXAMPLE_PREFIX))
    .filter((id) => !homed.has(id));
}

function main(): number {
  const check = process.argv.includes('--check');
  const all = pages();

  const homeless = homelessRenderers(all);
  if (homeless.length > 0) {
    process.stderr.write(
      `The renderer produces regions no page has a home for:\n` +
        homeless.map((id) => `  - ${id}\n`).join('') +
        `Add the region to a page, in the same commit as its renderer.\n`,
    );
    return 1;
  }

  const drifted: string[] = [];
  let written = 0;
  let regions = 0;

  for (const page of all) {
    if (page.ids.length === 0) continue;
    regions += page.ids.length;
    const path = join(PAGECONTENT, page.file);
    const before = readFileSync(path, 'utf8');
    const after = renderPage(page.file, page.ids);
    if (before === after) continue;
    if (check) {
      drifted.push(page.file);
    } else {
      writeFileSync(path, after, 'utf8');
      written += 1;
    }
  }

  if (check) {
    if (drifted.length > 0) {
      process.stderr.write(
        `Managed regions differ from what the ledger renders in ${drifted.length} page(s):\n` +
          drifted.map((f) => `  - input/pagecontent/${f}\n`).join('') +
          `Run 'npm --prefix reference run render' and commit the result. If you edited a\n` +
          `region by hand, that edit is about to be lost: move it outside the sentinels.\n`,
      );
      return 1;
    }
    process.stdout.write(`render:check — ${regions} region(s) up to date.\n`);
    return 0;
  }

  process.stdout.write(`render — ${regions} region(s); ${written} page(s) updated.\n`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
