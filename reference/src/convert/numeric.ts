/**
 * Reference converters for the numeric primitives.
 *
 * These look like identity functions, and for `Integer` they are. The value of
 * writing them down is in what they *report*: `Integer64` names the values that
 * do not fit a FHIR `integer`, and `Real` names the lexical precision that a
 * FHIR `decimal` carries and openEHR does not.
 */

import { register } from '../registry.ts';
import { resultFor, unmapped, type Issue, type MappingResult } from '../result.ts';
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
      'the value is outside the 32-bit range \u00b12,147,483,647 that a FHIR integer ' +
      'element can carry; the ledger declares that case unmapped, so nothing is produced ' +
      'and which extension should carry it is element-specific',
  };
}

/**
 * `Integer64` → `integer64`, as the **JSON String** FHIR R5 serialises it as.
 *
 * The range check is the **32-bit** one on purpose: `integer64.overflow`
 * declares that a value outside \u00b12,147,483,647 has no home in an element
 * typed `integer`, and the guide's own advice is to map in-range values into
 * the designated 32-bit element rather than expect an `integer64` element to be
 * there. A row the ledger declares `unmapped` produces no value, so the
 * converter refuses rather than reporting a loss and emitting anyway.
 */
export function integer64ToInteger64(
  source: OpenehrInteger64,
): MappingResult<FhirInteger64> {
  if (source > INT32_MAX || source < INT32_MIN) return unmapped([overflowIssue()]);
  return resultFor(String(source), []);
}

export function integer64ToOpenehrInteger64(
  source: FhirInteger64,
): MappingResult<OpenehrInteger64> {
  // The openEHR side stays a JSON number, because that is openEHR canonical
  // JSON. A value beyond \u00b1(2^53 \u2212 1) cannot be represented exactly by a
  // JavaScript number: that is a limitation of *this* implementation, not a
  // mapping fact, so it is documented in `reference/README.md` and on
  // `reference-implementation.html` rather than invented as a ledger row.
  return resultFor(Number(source), []);
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
