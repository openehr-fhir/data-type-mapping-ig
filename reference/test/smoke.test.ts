import test from 'node:test';
import assert from 'node:assert/strict';

import {
  lossless,
  lossy,
  resultFor,
  unmapped,
  type Issue,
  type MappingResult,
} from '../src/result.ts';

test('the runner executes TypeScript under native type stripping', () => {
  const issue: Issue = { path: 'DV_QUANTITY.accuracy', message: 'no FHIR home' };
  assert.equal(issue.path, 'DV_QUANTITY.accuracy');
});

test('lossless carries a value and no issues', () => {
  const r = lossless({ value: 1 });
  assert.equal(r.fidelity, 'lossless');
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.value, { value: 1 });
});

test('lossy requires at least one issue and carries a value', () => {
  const r = lossy({ value: 1 }, [{ path: 'a.b', message: 'dropped' }]);
  assert.equal(r.fidelity, 'lossy');
  assert.equal(r.issues.length, 1);
  assert.deepEqual(r.value, { value: 1 });
});

test('unmapped produces no value', () => {
  const r = unmapped<{ value: number }>([{ path: 'a.b', message: 'no counterpart' }]);
  assert.equal(r.fidelity, 'unmapped');
  assert.equal(r.value, undefined);
});

test('resultFor derives fidelity from the issue list', () => {
  assert.equal(resultFor('x', []).fidelity, 'lossless');
  assert.equal(resultFor('x', [{ path: 'p', message: 'm' }]).fidelity, 'lossy');
});

test('MappingResult narrows on fidelity', () => {
  const results: readonly MappingResult<string>[] = [
    lossless('a'),
    lossy('b', [{ path: 'p', message: 'm' }]),
    unmapped<string>([{ path: 'q', message: 'n' }]),
  ];
  const seen: string[] = [];
  for (const r of results) {
    switch (r.fidelity) {
      case 'lossless':
        assert.equal(r.issues.length, 0);
        seen.push('lossless');
        break;
      case 'lossy':
        assert.ok(r.issues.length > 0);
        seen.push('lossy');
        break;
      case 'unmapped':
        assert.equal(r.value, undefined);
        seen.push('unmapped');
        break;
    }
  }
  assert.deepEqual(seen, ['lossless', 'lossy', 'unmapped']);
});
