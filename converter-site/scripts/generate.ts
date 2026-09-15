/**
 * The single entry point every generator is invoked from.
 *
 * `pretypecheck`, `pretest` and `prebuild` all call this, so one command
 * refreshes everything under `src/generated/` and nothing in the workspace has
 * to remember which generators exist.
 */

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { generateFixtureCatalog } from './generate-fixture-catalog.ts';
import { generateProvenance } from './generate-provenance.ts';

const GENERATED = fileURLToPath(new URL('../src/generated/', import.meta.url));

mkdirSync(GENERATED, { recursive: true });
const examples = generateFixtureCatalog();
generateProvenance();
process.stdout.write(`generate — ${examples} fixture example(s), provenance written.\n`);
