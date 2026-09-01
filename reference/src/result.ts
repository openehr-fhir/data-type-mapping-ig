/**
 * The result contract every converter in this workspace returns.
 *
 * A converter never throws for a mapping-level problem. It returns the value it
 * could produce, the fidelity it actually achieved, and one `Issue` per piece of
 * information it could not carry across. The `Issue.path` strings are the join
 * between the converters and the ledger: `roundtrip.test.ts` requires them to
 * match the `drops[].path` values the ledger declares for that direction.
 */

/** The three fidelity values `AGENTS.md` names. There is no fourth. */
export type Fidelity = 'lossless' | 'lossy' | 'unmapped';

/** One piece of information a conversion could not carry across. */
export interface Issue {
  /** The path of the source field that was not carried, e.g. `DV_QUANTITY.accuracy`. */
  readonly path: string;
  /** Why it was not carried, in the same words the ledger uses. */
  readonly message: string;
}

/** What a converter returns. `value` is absent only when nothing could be produced. */
export interface MappingResult<T> {
  readonly value?: T;
  readonly fidelity: Fidelity;
  readonly issues: readonly Issue[];
}

/** Build a `lossless` result. Callers pass no issues by construction. */
export function lossless<T>(value: T): MappingResult<T> {
  return { value, fidelity: 'lossless', issues: [] };
}

/** Build a `lossy` result. At least one issue is required, by type. */
export function lossy<T>(value: T, issues: readonly [Issue, ...Issue[]]): MappingResult<T> {
  return { value, fidelity: 'lossy', issues };
}

/** Build an `unmapped` result: no value was produced at all. */
export function unmapped<T>(issues: readonly [Issue, ...Issue[]]): MappingResult<T> {
  return { fidelity: 'unmapped', issues };
}

/**
 * Collapse a set of issues into the fidelity they imply for a produced value.
 * A converter that produced a value and dropped nothing is `lossless`; one that
 * produced a value and dropped something is `lossy`.
 */
export function resultFor<T>(value: T, issues: readonly Issue[]): MappingResult<T> {
  if (issues.length === 0) return { value, fidelity: 'lossless', issues: [] };
  return { value, fidelity: 'lossy', issues };
}
