/** Reference converter for `DV_BOOLEAN` ↔ `boolean`. */

import { register } from '../registry.ts';
import { resultFor, type MappingResult } from '../result.ts';
import type { DvBoolean } from '../types/openehr/primitives.ts';
import type { FhirBoolean } from '../types/fhir/primitives.ts';

export function dvBooleanToBoolean(source: DvBoolean): MappingResult<FhirBoolean> {
  return resultFor(source.value, []);
}

export function booleanToDvBoolean(source: FhirBoolean): MappingResult<DvBoolean> {
  return resultFor({ _type: 'DV_BOOLEAN' as const, value: source }, []);
}

register<DvBoolean, FhirBoolean>('dv-boolean-to-boolean', {
  toFhir: dvBooleanToBoolean,
  toOpenehr: booleanToDvBoolean,
});
