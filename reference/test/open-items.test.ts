import test from 'node:test';
import assert from 'node:assert/strict';

import { OPEN_ITEMS } from '../content/open-items.ts';
import { ledger } from '../src/model/load.ts';
import type { Owner } from '../src/model/types.ts';

/**
 * The register and the ledger must agree.
 *
 * A mapping row that blames an owner for a gap has to point somewhere the
 * working group can act. This test is what makes that true: every `Owner`
 * cited anywhere in the ledger appears in the register, so an owner cannot go
 * missing from the page the working group reads.
 */

/** Every owner literal any verdict in the ledger names. */
function ownersCitedInLedger(): ReadonlySet<Owner> {
  const owners = new Set<Owner>();
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      for (const verdict of [row.toFhir, row.toOpenehr]) {
        if (verdict.fidelity === 'unmapped' && verdict.owner !== undefined) {
          owners.add(verdict.owner);
        }
      }
    }
  }
  return owners;
}

test('every open item has a non-empty owner and status', () => {
  const problems: string[] = [];
  for (const item of OPEN_ITEMS) {
    if (item.owner.trim() === '') problems.push(`${item.id}: no owner`);
    if (item.status.trim() === '') problems.push(`${item.id}: no status`);
    if (item.title.trim() === '') problems.push(`${item.id}: no title`);
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('open item ids are unique', () => {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const item of OPEN_ITEMS) {
    if (seen.has(item.id)) duplicates.push(item.id);
    seen.add(item.id);
  }
  assert.deepEqual(duplicates, []);
});

test('every owner cited in the ledger appears in the register', () => {
  const registered = new Set(
    OPEN_ITEMS.map((item) => item.ledgerOwner).filter((o): o is Owner => o !== undefined),
  );
  const missing = [...ownersCitedInLedger()].filter((owner) => !registered.has(owner));
  assert.deepEqual(
    missing.sort(),
    [],
    `owners a mapping row blames but the register does not list: ${missing.join(', ')}`,
  );
});

test('every ticket in the register is an HL7 Jira URL', () => {
  const offenders = OPEN_ITEMS.filter(
    (item) => item.ticket !== undefined && !item.ticket.url.startsWith('https://jira.hl7.org/'),
  ).map((item) => item.id);
  assert.deepEqual(offenders, []);
});

test('every side of the register is populated', () => {
  for (const side of ['fhir', 'openehr', 'documentation'] as const) {
    assert.ok(
      OPEN_ITEMS.some((item) => item.side === side),
      `the register has no ${side} items, which is unlikely to be true`,
    );
  }
});

test('reviewer coverage is recorded for every mapping, including where it is absent', () => {
  for (const mapping of ledger()) {
    assert.ok(Array.isArray(mapping.review.openehr), `${mapping.id}: no openEHR review field`);
    assert.ok(Array.isArray(mapping.review.fhir), `${mapping.id}: no FHIR review field`);
  }
});

test('the guide does not claim complete review coverage it does not have', () => {
  const unchecked = ledger().filter((m) => m.review.fhir.length === 0);
  assert.ok(
    unchecked.length > 0,
    'every mapping claims a FHIR-side review; if that is now true, this test should be ' +
      'deleted rather than weakened',
  );
});
