import test from 'node:test';
import assert from 'node:assert/strict';

import { converterCatalogue } from '../../reference/src/browser/convert.ts';
import { mappingIdForType, openehrTypeOf } from '../src/preselect.ts';

/**
 * Preselection is only ever a convenience, and a convenience that guesses wrong
 * converts a reader's instance through a mapping they did not choose. So the
 * assertion the tool actually depends on is the **negative** one.
 */

const CATALOGUE = converterCatalogue();

test('an unambiguous openEHR type preselects its one mapping', () => {
  const id = mappingIdForType('DV_BOOLEAN', CATALOGUE);
  assert.equal(id, 'dv-boolean-to-boolean');
});

test('an ambiguous openEHR type preselects nothing', () => {
  const candidates = CATALOGUE.filter((entry) => entry.openehrType === 'DV_QUANTITY');
  assert.ok(candidates.length > 1, `DV_QUANTITY maps to ${candidates.length} FHIR types`);
  assert.equal(mappingIdForType('DV_QUANTITY', CATALOGUE), undefined);
});

test('an unknown openEHR type preselects nothing', () => {
  assert.equal(mappingIdForType('DV_NOT_A_TYPE', CATALOGUE), undefined);
  assert.equal(mappingIdForType('', CATALOGUE), undefined);
});

test('every catalogue type that preselects really is unique', () => {
  const counts = new Map<string, number>();
  for (const entry of CATALOGUE) {
    counts.set(entry.openehrType, (counts.get(entry.openehrType) ?? 0) + 1);
  }
  for (const [type, count] of counts) {
    const id = mappingIdForType(type, CATALOGUE);
    if (count === 1) assert.ok(id !== undefined, `${type} is unique and must preselect`);
    else assert.equal(id, undefined, `${type} maps to ${count} mappings and must not preselect`);
  }
});

test('the _type discriminator is read only from an object that carries one', () => {
  assert.equal(openehrTypeOf({ _type: 'DV_BOOLEAN', value: true }), 'DV_BOOLEAN');
  assert.equal(openehrTypeOf({ value: true }), undefined);
  assert.equal(openehrTypeOf({ _type: '' }), undefined);
  assert.equal(openehrTypeOf({ _type: 7 }), undefined);
  assert.equal(openehrTypeOf([{ _type: 'DV_BOOLEAN' }]), undefined);
  assert.equal(openehrTypeOf(null), undefined);
  assert.equal(openehrTypeOf('DV_BOOLEAN'), undefined);
});
