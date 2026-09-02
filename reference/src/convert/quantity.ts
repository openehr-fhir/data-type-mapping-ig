/**
 * Reference converters for the quantity category.
 *
 * Every converter returns a `MappingResult<T>` carrying the fidelity it
 * actually achieved and one `Issue` per piece of information it could not
 * carry. **An `Issue.path` is exactly the ledger path it corresponds to** —
 * either a `drops[].path` of a `lossy` row, or the source-side path of an
 * `unmapped` row. `roundtrip.test.ts` holds the two to that contract in both
 * directions.
 *
 * Converters never throw for a mapping-level problem; an unmappable field is
 * data, not an exception.
 *
 * **The mandatory-attribute rule.** A converter never invents a value for an
 * attribute the target standard declares mandatory. Where the source carries
 * nothing for such an attribute the converter returns `unmapped`, naming the
 * absent source path, rather than substituting a constant and calling the
 * result `lossless`.
 */

import { register } from '../registry.ts';
import { issuesOf, resultFor, unmapped, type Issue, type MappingResult } from '../result.ts';
import {
  type DvCount,
  type DvIntervalQuantity,
  type DvProportion,
  type DvQuantity,
} from '../types/openehr/quantity.ts';
import {
  EXT,
  ISO_4217,
  UCUM,
  extensionValue,
  type Count,
  type Extension,
  type Money,
  type Quantity,
  type Range,
  type Ratio,
  type SimpleQuantity,
} from '../types/fhir/quantity.ts';

/** The `magnitude_status` values FHIR R5 `Quantity.comparator` can carry. */
const COMPARATORS = ['<', '<=', '>', '>='];

/** Drop and unmapped paths, named once so the ledger and the code cannot drift. */
export const PATH = {
  accuracyIsPercent: 'DV_QUANTITY.accuracy_is_percent',
  approximateStatus: 'DV_QUANTITY.magnitude_status[~]',
  comparatorAd: 'Quantity.comparator[ad]',
  countSystem: 'Count.system',
  countCode: 'Count.code',
  proportionType: 'DV_PROPORTION.type',
  ratioUnits: 'Ratio.numerator.code',
  ratioNumeratorValue: 'Ratio.numerator.value',
  ratioDenominatorValue: 'Ratio.denominator.value',
  ratioNumeratorPrecision: 'Ratio.numerator.extension[quantity-precision]',
  lowerIncluded: 'DV_INTERVAL.lower_included',
  upperIncluded: 'DV_INTERVAL.upper_included',
  simpleMagnitudeStatus: 'DV_QUANTITY.magnitude_status',
  moneyUnitsSystem: 'DV_QUANTITY.units_system',
  quantityValueAbsent: 'Quantity.value[absent]',
  quantityCodeAbsent: 'Quantity.code[absent]',
  countValueAbsent: 'Count.value[absent]',
  simpleQuantityValueAbsent: 'SimpleQuantity.value[absent]',
  simpleQuantityCodeAbsent: 'SimpleQuantity.code[absent]',
  moneyValueAbsent: 'Money.value[absent]',
  moneyCurrencyAbsent: 'Money.currency[absent]',
  rangeLow: 'Range.low',
  rangeHigh: 'Range.high',
} as const;

/**
 * The mandatory-attribute rule's issue list for a quantity flavour: one entry
 * per mandatory `DV_QUANTITY` attribute the FHIR source cannot supply.
 *
 * `magnitude` and `units` are both `1..1` in the openEHR RM while every FHIR
 * quantity flavour makes `value` and `code` optional, so an incoming instance
 * that omits either cannot become a `DV_QUANTITY` at all. Called only when at
 * least one is absent, so the tuple is non-empty by construction.
 */
function absentQuantityIssues(
  value: number | undefined,
  code: string | undefined,
  valuePath: string,
  codePath: string,
  fhirType: string,
): readonly [Issue, ...Issue[]] {
  const magnitude: Issue = {
    path: valuePath,
    message:
      `DV_QUANTITY.magnitude is mandatory (1..1) and ${fhirType} supplies no value; the ` +
      'mandatory-attribute rule forbids inventing one, so nothing is produced',
  };
  const units: Issue = {
    path: codePath,
    message:
      `DV_QUANTITY.units is mandatory (1..1) and ${fhirType} supplies no unit code; the ` +
      'mandatory-attribute rule forbids inventing one, so nothing is produced',
  };
  if (value === undefined && code === undefined) return [magnitude, units];
  return value === undefined ? [magnitude] : [units];
}

function extension(url: string, key: 'valueInteger' | 'valueDecimal', value: number): Extension {
  return key === 'valueInteger' ? { url, valueInteger: value } : { url, valueDecimal: value };
}

/**
 * The `quantity-accuracy` extension declares `value[x]: Quantity`, not
 * `decimal`. An accuracy expressed as a percentage therefore *is* carriable —
 * as a quantity in UCUM `%` — and an absolute one carries the magnitude's own
 * unit.
 */
function accuracyExtension(source: DvQuantity): Extension {
  const percent = source.accuracy_is_percent === true;
  return {
    url: EXT.quantityAccuracy,
    valueQuantity: {
      value: source.accuracy,
      system: percent ? UCUM : (source.units_system ?? UCUM),
      code: percent ? '%' : source.units,
    },
  };
}

/** Drop the `undefined`-valued keys so fixtures and results compare cleanly. */
function compact<T extends object>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v !== undefined) out[key] = v;
  }
  return out as T;
}

// ── DV_QUANTITY ↔ Quantity ───────────────────────────────────────────────────

export function dvQuantityToQuantity(source: DvQuantity): MappingResult<Quantity> {
  const issues: Issue[] = [];
  const extensions: Extension[] = [];

  if (source.precision !== undefined && source.precision >= 0) {
    extensions.push(extension(EXT.quantityPrecision, 'valueInteger', source.precision));
  }

  if (source.accuracy !== undefined) {
    extensions.push(accuracyExtension(source));
  }

  let comparator: string | undefined;
  if (source.magnitude_status === '~') {
    issues.push({
      path: PATH.approximateStatus,
      message:
        'FHIR R5 Quantity.comparator has no code for "approximate"; ~ is added in R6 ' +
        '(FHIR-56000) and is not available in an R5 instance',
    });
  } else if (source.magnitude_status !== undefined && COMPARATORS.includes(source.magnitude_status)) {
    comparator = source.magnitude_status;
  }

  const value: Quantity = compact({
    value: source.magnitude,
    comparator,
    unit: source.units_display_name,
    system: source.units_system ?? UCUM,
    code: source.units,
    extension: extensions.length > 0 ? extensions : undefined,
  });

  return resultFor(value, issues);
}

export function quantityToDvQuantity(source: Quantity): MappingResult<DvQuantity> {
  if (source.value === undefined || source.code === undefined) {
    return unmapped(
      absentQuantityIssues(
        source.value,
        source.code,
        PATH.quantityValueAbsent,
        PATH.quantityCodeAbsent,
        'Quantity',
      ),
    );
  }

  const issues: Issue[] = [];

  if (source.comparator === 'ad') {
    issues.push({
      path: PATH.comparatorAd,
      message:
        'openEHR magnitude_status has no value meaning "sufficient as part of a sum"; the ' +
        'comparator is not carried and the magnitude alone would misstate the value',
    });
  }

  const precision = extensionValue(source, EXT.quantityPrecision)?.valueInteger;
  const accuracyQuantity = extensionValue(source, EXT.quantityAccuracy)?.valueQuantity;
  const accuracy = accuracyQuantity?.value;

  const value: DvQuantity = compact({
    _type: 'DV_QUANTITY' as const,
    magnitude: source.value,
    units: source.code,
    units_system: source.system,
    units_display_name: source.unit,
    precision,
    magnitude_status:
      source.comparator !== undefined && COMPARATORS.includes(source.comparator)
        ? source.comparator
        : undefined,
    accuracy,
    accuracy_is_percent: accuracy === undefined ? undefined : accuracyQuantity?.code === '%',
  });

  return resultFor(value, issues);
}

register<DvQuantity, Quantity>('dv-quantity-to-quantity', {
  toFhir: dvQuantityToQuantity,
  toOpenehr: quantityToDvQuantity,
});

// ── DV_COUNT ↔ Count ─────────────────────────────────────────────────────────

export function dvCountToCount(source: DvCount): MappingResult<Count> {
  const value: Count = compact({
    value: source.magnitude,
    comparator:
      source.magnitude_status !== undefined && COMPARATORS.includes(source.magnitude_status)
        ? source.magnitude_status
        : undefined,
    system: UCUM,
    code: '1',
  });
  return resultFor(value, []);
}

export function countToDvCount(source: Count): MappingResult<DvCount> {
  if (source.value === undefined) {
    return unmapped([
      {
        path: PATH.countValueAbsent,
        message:
          'DV_COUNT.magnitude is mandatory (1..1) and Count carries no value; no magnitude ' +
          'is invented, so nothing is produced',
      },
    ]);
  }

  const issues: Issue[] = [];

  if (source.system !== undefined) {
    issues.push({
      path: PATH.countSystem,
      message:
        'Count.system is fixed to UCUM by invariant cnt-3 and carries no information into ' +
        'openEHR; DV_COUNT is unitless',
    });
  }
  if (source.code !== undefined) {
    issues.push({
      path: PATH.countCode,
      message:
        'Count.code is fixed to 1 by invariant cnt-3 and carries no information into ' +
        'openEHR; DV_COUNT is unitless',
    });
  }

  const value: DvCount = compact({
    _type: 'DV_COUNT' as const,
    magnitude: source.value,
    magnitude_status:
      source.comparator !== undefined && COMPARATORS.includes(source.comparator)
        ? source.comparator
        : undefined,
  });

  return resultFor(value, issues);
}

register<DvCount, Count>('dv-count-to-count', {
  toFhir: dvCountToCount,
  toOpenehr: countToDvCount,
});

// ── DV_PROPORTION ↔ Ratio ────────────────────────────────────────────────────

export function dvProportionToRatio(source: DvProportion): MappingResult<Ratio> {
  const issues: Issue[] = [
    {
      path: PATH.proportionType,
      message:
        'FHIR Ratio has no discriminator saying how the ratio should be read or rendered; ' +
        'pk_fraction and pk_integer_fraction are display directives with no FHIR home ' +
        '(FHIR-56001)',
    },
  ];

  const numeratorExtensions =
    source.precision !== undefined && source.precision >= 0
      ? [extension(EXT.quantityPrecision, 'valueInteger', source.precision)]
      : undefined;

  const value: Ratio = {
    numerator: compact({ value: source.numerator, extension: numeratorExtensions }),
    denominator: compact({ value: source.denominator }),
  };

  return resultFor(value, issues);
}

export function ratioToDvProportion(source: Ratio): MappingResult<DvProportion> {
  const issues: Issue[] = [];

  if (source.numerator?.code !== undefined || source.denominator?.code !== undefined) {
    issues.push({
      path: PATH.ratioUnits,
      message:
        'DV_PROPORTION carries bare decimals and no units; a Ratio expressed in units — ' +
        '5 mg per 100 mL — is modelled in openEHR as two DV_QUANTITY values at the ' +
        'archetype level instead',
    });
  }

  // `DV_PROPORTION` declares `numerator` and `denominator` as `Real [1..1]` and
  // `type` as `PROPORTION_KIND [1..1]`, while `Ratio.numerator` and
  // `.denominator` are `0..1` and FHIR carries **no** kind discriminator at all.
  // `dv-proportion.type` already publishes the inbound direction as `unmapped`
  // on the stated ground that reading the kind off the denominator "is an
  // inference, not a carried value", so this converter may not perform it — and
  // with a mandatory attribute that nothing can source, **no `Ratio` produces a
  // `DV_PROPORTION` at all**. The paths named are FHIR-side, because those are
  // the source paths of this direction; `DV_PROPORTION.type`'s FHIR side is
  // `NoCounterpart` and contributes nothing here.
  const unsourceable = (endpoint: string): string =>
    `DV_PROPORTION.type is mandatory (1..1) and no Ratio carries a kind discriminator; ` +
    `inferring it from the denominator is an inference rather than a carried value, so ` +
    `nothing at ${endpoint} is produced`;

  return unmapped([
    { path: PATH.ratioNumeratorValue, message: unsourceable('DV_PROPORTION.numerator') },
    { path: PATH.ratioDenominatorValue, message: unsourceable('DV_PROPORTION.denominator') },
    {
      path: PATH.ratioNumeratorPrecision,
      message: unsourceable('DV_PROPORTION.precision'),
    },
    ...issues,
  ]);
}

register<DvProportion, Ratio>('dv-proportion-to-ratio', {
  toFhir: dvProportionToRatio,
  toOpenehr: ratioToDvProportion,
});

// ── DV_INTERVAL<DV_QUANTITY> ↔ Range ─────────────────────────────────────────

function boundToSimpleQuantity(bound: DvQuantity): SimpleQuantity {
  return compact({
    value: bound.magnitude,
    unit: bound.units_display_name,
    system: bound.units_system ?? UCUM,
    code: bound.units,
  });
}

function simpleQuantityToBound(bound: SimpleQuantity): MappingResult<DvQuantity> {
  if (bound.value === undefined || bound.code === undefined) {
    return unmapped(
      absentQuantityIssues(
        bound.value,
        bound.code,
        PATH.simpleQuantityValueAbsent,
        PATH.simpleQuantityCodeAbsent,
        'SimpleQuantity',
      ),
    );
  }

  return resultFor(
    compact({
      _type: 'DV_QUANTITY' as const,
      magnitude: bound.value,
      units: bound.code,
      units_system: bound.system,
      units_display_name: bound.unit,
    }),
    [],
  );
}

export function dvIntervalToRange(source: DvIntervalQuantity): MappingResult<Range> {
  const issues: Issue[] = [];

  if (source.lower_included !== undefined) {
    issues.push({
      path: PATH.lowerIncluded,
      message:
        'FHIR Range and Period are inclusive only; an exclusive lower boundary can be ' +
        'expressed only as a design-time FHIRPath constraint, or by using ' +
        'Quantity.comparator instead of a Range',
    });
  }
  if (source.upper_included !== undefined) {
    issues.push({
      path: PATH.upperIncluded,
      message:
        'FHIR Range and Period are inclusive only; an exclusive upper boundary can be ' +
        'expressed only as a design-time FHIRPath constraint',
    });
  }

  const value: Range = compact({
    low:
      source.lower_unbounded === true || source.lower === undefined
        ? undefined
        : boundToSimpleQuantity(source.lower),
    high:
      source.upper_unbounded === true || source.upper === undefined
        ? undefined
        : boundToSimpleQuantity(source.upper),
  });

  return resultFor(value, issues);
}

export function rangeToDvInterval(source: Range): MappingResult<DvIntervalQuantity> {
  const low = source.low === undefined ? undefined : simpleQuantityToBound(source.low);
  const high = source.high === undefined ? undefined : simpleQuantityToBound(source.high);

  if (low !== undefined && low.value === undefined) {
    return unmapped([
      {
        path: PATH.rangeLow,
        message:
          'the lower bound is not convertible to a DV_QUANTITY, so the interval as a whole ' +
          'is not produced',
      },
      ...issuesOf(low),
    ]);
  }
  if (high !== undefined && high.value === undefined) {
    return unmapped([
      {
        path: PATH.rangeHigh,
        message:
          'the upper bound is not convertible to a DV_QUANTITY, so the interval as a whole ' +
          'is not produced',
      },
      ...issuesOf(high),
    ]);
  }

  const value: DvIntervalQuantity = compact({
    _type: 'DV_INTERVAL' as const,
    lower: low?.value,
    upper: high?.value,
    lower_unbounded: source.low === undefined,
    upper_unbounded: source.high === undefined,
  });

  return resultFor(value, []);
}

register<DvIntervalQuantity, Range>('dv-interval-to-range', {
  toFhir: dvIntervalToRange,
  toOpenehr: rangeToDvInterval,
});

// ── DV_QUANTITY ↔ Money ──────────────────────────────────────────────────────

export function dvQuantityToMoney(source: DvQuantity): MappingResult<Money> {
  const issues: Issue[] = [];

  if (source.units_system !== undefined) {
    issues.push({
      path: PATH.moneyUnitsSystem,
      message:
        'FHIR Money has no system element; the currency system is implicit in the binding ' +
        'of Money.currency, so urn:iso:std:iso:4217 is not carried',
    });
  }

  return resultFor(compact({ value: source.magnitude, currency: source.units }), issues);
}

export function moneyToDvQuantity(source: Money): MappingResult<DvQuantity> {
  if (source.value === undefined || source.currency === undefined) {
    return unmapped(
      absentQuantityIssues(
        source.value,
        source.currency,
        PATH.moneyValueAbsent,
        PATH.moneyCurrencyAbsent,
        'Money',
      ),
    );
  }

  return resultFor(
    compact({
      _type: 'DV_QUANTITY' as const,
      magnitude: source.value,
      units: source.currency,
      units_system: ISO_4217,
    }),
    [],
  );
}

register<DvQuantity, Money>('dv-quantity-to-money', {
  toFhir: dvQuantityToMoney,
  toOpenehr: moneyToDvQuantity,
});

// ── DV_QUANTITY ↔ SimpleQuantity ─────────────────────────────────────────────

export function dvQuantityToSimpleQuantity(source: DvQuantity): MappingResult<SimpleQuantity> {
  const issues: Issue[] = [];

  if (source.magnitude_status !== undefined) {
    issues.push({
      path: PATH.simpleMagnitudeStatus,
      message:
        'SimpleQuantity forbids comparator by invariant sqty-1; a DV_QUANTITY carrying ' +
        'magnitude_status in a SimpleQuantity slot is a modelling error on the openEHR side',
    });
  }

  const value: SimpleQuantity = compact({
    value: source.magnitude,
    unit: source.units_display_name,
    system: source.units_system ?? UCUM,
    code: source.units,
  });

  return resultFor(value, issues);
}

export function simpleQuantityToDvQuantity(source: SimpleQuantity): MappingResult<DvQuantity> {
  return simpleQuantityToBound(source);
}

register<DvQuantity, SimpleQuantity>('dv-quantity-to-simple-quantity', {
  toFhir: dvQuantityToSimpleQuantity,
  toOpenehr: simpleQuantityToDvQuantity,
});
