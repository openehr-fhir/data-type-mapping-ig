/**
 * Boolean data: the simplest mapping in the guide.
 */

import type { Cite, Mapping, Review } from '../src/model/types.ts';

const RM = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const R5 = 'https://hl7.org/fhir/R5/datatypes.html';

const DV_BOOLEAN: Cite = {
  url: `${RM}#_dv_boolean_class`,
  label: 'openEHR RM — DV_BOOLEAN',
  verification: 'spec-local',
};

const FHIR_BOOLEAN: Cite = {
  url: `${R5}#boolean`,
  label: 'FHIR R5 — boolean',
  verification: 'spec-local',
};

const REVIEW: Review = { openehr: [], fhir: [] };

const dvBooleanToBoolean = {
  id: 'dv-boolean-to-boolean',
  category: 'boolean',
  openehrType: 'DV_BOOLEAN',
  fhirType: 'boolean',
  title: 'DV_BOOLEAN ↔ boolean',
  scope: 'datatype',
  sources: [DV_BOOLEAN, FHIR_BOOLEAN],
  review: REVIEW,
  rows: [
    {
      id: 'dv-boolean.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_BOOLEAN.value',
        cardinality: '1..1',
        type: 'Boolean',
        kind: 'element',
        cite: DV_BOOLEAN,
      },
      fhir: [
        {
          path: 'boolean',
          cardinality: '0..1',
          type: 'boolean',
          kind: 'element',
          cite: FHIR_BOOLEAN,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'A direct 1:1 mapping with no transformation: neither side carries precision, ' +
        'accuracy, or auxiliary metadata. The one asymmetry is **optionality**. ' +
        '`DV_BOOLEAN.value` is **mandatory** in the Reference Model — a `DV_BOOLEAN` that ' +
        'exists has a value — while a FHIR `boolean` element may be absent, with the reason ' +
        'for its absence carried by an extension on the element rather than by a value. An ' +
        'absent FHIR `boolean` therefore has no `DV_BOOLEAN` to become; see ' +
        '[null_flavour](mapping-coded.html) for how "why is this absent" is carried. This ' +
        'row is `open` because the section has not yet been reviewed from either side.',
    },
  ],
} satisfies Mapping;

export default [dvBooleanToBoolean] satisfies readonly Mapping[];
