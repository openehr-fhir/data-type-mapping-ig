/**
 * Reference converters for the numeric primitives.
 *
 * These look like identity functions, and for `Integer` they are. The value of
 * writing them down is in what they *report*: `Integer64` names the values that
 * do not fit a FHIR `integer`, and `Real` names the lexical precision that a
 * FHIR `decimal` carries and openEHR does not.
 */

import { register } from '../registry.ts';
import { resultFor, type Issue, type MappingResult } from '../result.ts';
import type {
  OpenehrInteger,
  OpenehrInteger64,
  OpenehrReal,
} from '../types/openehr/primitives.ts';
import {
  INT32_MAX,
  INT32_MIN,
  type FhirDecimal,
  type FhirInteger,
  type FhirInteger64,
} from '../types/fhir/primitives.ts';

/** Drop and unmapped paths, named once so the ledger and the code cannot drift. */
export const NUMERIC_PATH = {
  integer64Overflow: 'Integer64[overflow]',
  decimalPrecision: 'decimal',
} as const;

// ── Integer ↔ integer ────────────────────────────────────────────────────────

export function integerToInteger(source: OpenehrInteger): MappingResult<FhirInteger> {
  return resultFor(source, []);
}

export function integerToOpenehrInteger(source: FhirInteger): MappingResult<OpenehrInteger> {
  return resultFor(source, []);
}

register<OpenehrInteger, FhirInteger>('integer-to-integer', {
  toFhir: integerToInteger,
  toOpenehr: integerToOpenehrInteger,
});

// ── Integer64 ↔ integer64 ────────────────────────────────────────────────────

function overflowIssue(): Issue {
  return {
    path: NUMERIC_PATH.integer64Overflow,
    message:
      'the value exceeds the 32-bit range of the FHIR integer type; an element typed ' +
      'integer cannot carry it, and which extension should is element-specific',
  };
}

export function integer64ToInteger64(
  source: OpenehrInteger64,
): MappingResult<FhirInteger64> {
  const issues = source > INT32_MAX || source < INT32_MIN ? [overflowIssue()] : [];
  return resultFor(source, issues);
}

export function integer64ToOpenehrInteger64(
  source: FhirInteger64,
): MappingResult<OpenehrInteger64> {
  return resultFor(source, []);
}

register<OpenehrInteger64, FhirInteger64>('integer64-to-integer64', {
  toFhir: integer64ToInteger64,
  toOpenehr: integer64ToOpenehrInteger64,
});

// ── Real / Double ↔ decimal ──────────────────────────────────────────────────

export function realToDecimal(source: OpenehrReal): MappingResult<FhirDecimal> {
  return resultFor(source, []);
}

export function decimalToReal(source: FhirDecimal): MappingResult<OpenehrReal> {
  return resultFor(source, [
    {
      path: NUMERIC_PATH.decimalPrecision,
      message:
        'FHIR treats trailing zeros in the lexical form of a decimal as significant; ' +
        'openEHR Real and Double do not carry lexical precision, so the significance is ' +
        'lost unless a receiving DV_QUANTITY.precision is available to take it',
    },
  ]);
}

register<OpenehrReal, FhirDecimal>('real-to-decimal', {
  toFhir: realToDecimal,
  toOpenehr: decimalToReal,
});
