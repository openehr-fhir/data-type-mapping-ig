import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { citesOf, type Mapping } from '../src/model/types.ts';
import { ledger } from '../src/model/load.ts';
import {
  EXTENSION_TYPES,
  EXTENSION_URL_PREFIX,
  extensionType,
} from '../src/model/extension-types.ts';

/**
 * The gate that makes a wrong extension use impossible to reintroduce.
 *
 * Every published worked example in this guide **is** a fixture — the
 * `example:` managed regions are rendered from `reference/fixtures/` — so
 * checking the fixtures checks the guide. Each extension a fixture carries must
 * resolve to an entry in `src/model/extension-types.ts`, emit the `value[x]`
 * JSON property that entry declares, and sit on an element the declared context
 * admits.
 *
 * The table is hand-authored on the working group's authority, for the reason
 * its own doc comment gives: the local FHIR R5 mirror holds no extension
 * definitions. This gate therefore checks the guide against its own declared
 * table, not against the extension registry. That is the strongest check
 * available in this repository, and saying so is part of the check.
 */

const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));

/** One extension instance found in a fixture, with where it was found. */
interface FoundExtension {
  readonly mapping: Mapping;
  readonly file: string;
  /** The property the extension array hangs off, or `''` at the fixture root. */
  readonly owner: string;
  readonly url: string;
  /** The `value[x]` property names present on the extension object. */
  readonly valueProperties: readonly string[];
}

/**
 * The FHIR type of the element an `extension` array hangs off, keyed by the
 * property name that holds it. A fixture carries no type discriminator, so the
 * root falls back to the mapping's own `fhirType`.
 */
const NESTED_ELEMENT_TYPE: Readonly<Record<string, string>> = {
  numerator: 'Quantity',
  denominator: 'Quantity',
  low: 'SimpleQuantity',
  high: 'SimpleQuantity',
  coding: 'Coding',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Every extension instance in one FHIR fixture, at any depth. */
function findExtensions(
  mapping: Mapping,
  file: string,
  node: unknown,
  owner: string,
  out: FoundExtension[],
): void {
  if (Array.isArray(node)) {
    for (const item of node) findExtensions(mapping, file, item, owner, out);
    return;
  }
  if (!isRecord(node)) return;

  for (const [key, value] of Object.entries(node)) {
    if (key === 'extension' && Array.isArray(value)) {
      for (const entry of value) {
        if (!isRecord(entry)) continue;
        out.push({
          mapping,
          file,
          owner,
          url: String(entry['url'] ?? ''),
          valueProperties: Object.keys(entry).filter((k) => k.startsWith('value')),
        });
      }
      continue;
    }
    findExtensions(mapping, file, value, key, out);
  }
}

function publishedExtensions(): readonly FoundExtension[] {
  const out: FoundExtension[] = [];
  for (const mapping of ledger()) {
    const dir = join(FIXTURES, mapping.id);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.fhir.json')) continue;
      const body: unknown = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      findExtensions(mapping, file, body, '', out);
    }
  }
  return out;
}

/** The FHIR types a fixture's extension could be sitting on. */
function candidateTypes(found: FoundExtension): readonly string[] {
  const nested = NESTED_ELEMENT_TYPE[found.owner];
  if (nested !== undefined) return [nested];
  return found.mapping.fhirType.split('|').map((part) => part.trim());
}

test('every extension a fixture carries resolves to a declared entry', () => {
  const problems: string[] = [];
  for (const found of publishedExtensions()) {
    if (!found.url.startsWith(EXTENSION_URL_PREFIX)) continue;
    const declared = extensionType(found.url);
    if (declared === undefined) {
      problems.push(`${found.mapping.id}/${found.file}: '${found.url}' is not declared`);
      continue;
    }
    if (!declared.published) {
      problems.push(
        `${found.mapping.id}/${found.file}: '${declared.name}' is recorded as not ` +
          'published by this guide, but a fixture carries one',
      );
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test("every extension a fixture carries emits the declared value[x] property", () => {
  const problems: string[] = [];
  for (const found of publishedExtensions()) {
    if (!found.url.startsWith(EXTENSION_URL_PREFIX)) continue;
    const declared = extensionType(found.url);
    if (declared?.valueProperty === undefined) continue;
    if (found.valueProperties.length !== 1) {
      problems.push(
        `${found.mapping.id}/${found.file}: '${declared.name}' carries ` +
          `${found.valueProperties.length} value[x] properties`,
      );
      continue;
    }
    if (found.valueProperties[0] !== declared.valueProperty) {
      problems.push(
        `${found.mapping.id}/${found.file}: '${declared.name}' declares ` +
          `'${declared.valueProperty}' and the fixture emits '${found.valueProperties[0]}'`,
      );
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('every extension a fixture carries sits on an element its context admits', () => {
  const problems: string[] = [];
  for (const found of publishedExtensions()) {
    if (!found.url.startsWith(EXTENSION_URL_PREFIX)) continue;
    const declared = extensionType(found.url);
    if (declared?.contexts === undefined) continue;
    if (declared.contexts.includes('Element')) continue;

    const candidates = candidateTypes(found);
    const admitted = candidates.filter((type) => declared.contexts?.includes(type));
    if (admitted.length === 0) {
      problems.push(
        `${found.mapping.id}/${found.file}: '${declared.name}' declares contexts ` +
          `[${declared.contexts.join(', ')}] and the fixture carries it on ` +
          `[${candidates.join(', ')}]`,
      );
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('every extension URL the ledger cites is declared', () => {
  const missing = new Set<string>();
  for (const mapping of ledger()) {
    const cites = [...mapping.sources, ...mapping.rows.flatMap((row) => citesOf(row))];
    for (const cite of cites) {
      if (cite.verification !== 'extension-unverified') continue;
      const name = /StructureDefinition-(.+)\.html$/.exec(cite.url)?.[1];
      if (name === undefined) {
        missing.add(`${cite.url} (not an extension-pack URL shape)`);
        continue;
      }
      if (extensionType(`${EXTENSION_URL_PREFIX}${name}`) === undefined) {
        missing.add(`${name} (cited by '${mapping.id}')`);
      }
    }
  }
  assert.deepEqual([...missing], [], [...missing].join('\n'));
});

test('every extension this guide publishes declares its type, cardinality, and context', () => {
  const problems: string[] = [];
  for (const entry of EXTENSION_TYPES) {
    if (!entry.url.startsWith(EXTENSION_URL_PREFIX)) {
      problems.push(`${entry.name}: url is not an extension canonical`);
    }
    if (entry.cite.verification !== 'extension-unverified') {
      problems.push(`${entry.name}: an extension citation must be tiered extension-unverified`);
    }
    if (!entry.published) continue;
    if (entry.valueProperty === undefined) problems.push(`${entry.name}: no value[x] declared`);
    if (entry.cardinality === undefined) problems.push(`${entry.name}: no cardinality declared`);
    if (entry.contexts === undefined || entry.contexts.length === 0) {
      problems.push(`${entry.name}: no context declared`);
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('the published flag and the fixture tree agree, in both directions', () => {
  // `published` is defined as "some fixture in this guide carries an instance of
  // it". Until this assertion existed, nothing checked that definition, and one
  // entry claimed a `value[x]` no instance had ever exercised. Both sides are
  // **derived** — iterate the table, walk the fixture tree — so no list has to
  // be kept in step with anything.
  const carried = new Set(
    publishedExtensions()
      .filter((found) => found.url.startsWith(EXTENSION_URL_PREFIX))
      .map((found) => found.url.slice(EXTENSION_URL_PREFIX.length)),
  );

  const unbacked = EXTENSION_TYPES.filter((e) => e.published && !carried.has(e.name)).map(
    (e) => e.name,
  );
  const undeclared = EXTENSION_TYPES.filter((e) => !e.published && carried.has(e.name)).map(
    (e) => e.name,
  );

  assert.ok(carried.size > 0, 'no fixture carries any extension — the gate is inert');
  assert.deepEqual(
    unbacked,
    [],
    'these entries claim a value[x], a cardinality and a context that no published ' +
      `instance exercises: ${unbacked.join(', ')}`,
  );
  assert.deepEqual(
    undeclared,
    [],
    'these entries are recorded as not carried by this guide, and a fixture carries one: ' +
      `${undeclared.join(', ')}`,
  );
});

test('the two withdrawn extensions are recorded as withdrawn, with the reason', () => {  for (const name of ['mimeType', 'timezone']) {
    const entry = EXTENSION_TYPES.find((e) => e.name === name);
    assert.ok(entry, `${name} must stay in the table so the reason survives`);
    assert.equal(entry.published, false, `${name} must not be published by this guide`);
    assert.match(entry.note ?? '', /withdrawn/i, `${name} must say why`);
  }

  // …and nothing in the fixtures carries one.
  const carried = publishedExtensions().filter((found) =>
    found.url.endsWith('/mimeType') || found.url.endsWith('/timezone'),
  );
  assert.deepEqual(
    carried.map((found) => `${found.mapping.id}/${found.file}`),
    [],
  );
});
