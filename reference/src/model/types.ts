/**
 * The mapping ledger's **only** shape declaration.
 *
 * Every mapping fact published by this guide is authored as a `Mapping` in
 * `reference/ledger/*.ts`. The invariants `AGENTS.md` § *Architectural
 * invariants* states as review rules are encoded here as types, so that:
 *
 * - a row with no fidelity verdict in **both** directions does not compile;
 * - a `lossy` verdict that names nothing it drops does not compile
 *   (`drops` is a non-empty tuple);
 * - a row or a side with no citation does not compile;
 * - an `unmapped` verdict with no stated reason does not compile.
 *
 * The checks that types cannot express — uniqueness, URL hosts, citation
 * tiering, drop-path containment — live in `validate.ts`.
 *
 * **Contextual typing is mandatory.** Every ledger module must end its export
 * with `satisfies readonly Mapping[]`. Without it the discriminated unions
 * widen to `string` and every compile-time guarantee above silently
 * evaporates. `test/ledger.test.ts` pins that with a `@ts-expect-error`.
 */

/**
 * Ledger categories. One per `reference/ledger/*.ts` module, and one per
 * `input/pagecontent/mapping-*.md` page (plus `gaps`, whose home is
 * `gaps.md`). Grown by each content phase as it lands its module.
 */
export type Category =
  | 'quantity'
  | 'coded'
  | 'boolean'
  | 'numeric'
  | 'textual'
  | 'gaps';

/**
 * How settled a mapping decision is. This is deliberately **separate** from
 * fidelity: "we have not discussed this" is not a fidelity outcome, and
 * `validate.ts` forbids a `not-discussed` row from claiming one.
 */
export type Maturity = 'settled' | 'open' | 'not-discussed';

/**
 * Who owns an unresolved item. The `FHIR-*` and `HTA-*` literals are HL7 Jira
 * tickets; `openehr-modelling` is the openEHR modelling team; `working-group`
 * is the joint group. `session:<id>` records something raised during authoring
 * that has no ticket yet.
 */
export type Owner =
  | 'FHIR-56000'
  | 'FHIR-56001'
  | 'FHIR-56002'
  | 'FHIR-56003'
  | 'FHIR-55422'
  | 'HTA-170'
  | 'openehr-modelling'
  | 'working-group'
  | `session:${string}`;

/**
 * How far a citation can actually be verified in this repository.
 *
 * - `spec-local` — an openEHR RM page or a FHIR R5 **core** page. Resolved to a
 *   file in the local mirrors by `test/cite-local.test.ts` through
 *   `spec-mirror-map.ts`.
 * - `spec-remote` — `terminology.hl7.org`, `jira.hl7.org`, and openEHR pages
 *   absent from the mirror. Host allow-listed and URL well-formed only.
 * - `extension-unverified` — `hl7.org/fhir/extensions/…`. The local FHIR R5
 *   mirror holds no extension definitions, so these are taken on the working
 *   group's authority and the guide says so in a standing footnote on
 *   `conventions.html`.
 */
export type Verification = 'spec-local' | 'spec-remote' | 'extension-unverified';

/** A citation. Always a **published URL**; never a machine-local path. */
export interface Cite {
  readonly url: string;
  readonly label: string;
  readonly verification: Verification;
}

/** One named piece of information a `lossy` direction does not carry. */
export interface Drop {
  /** Prefixed by the row's own openEHR path or one of its FHIR paths. */
  readonly path: string;
  readonly reason: string;
}

/**
 * The fidelity of **one** direction of **one** row, as a discriminated union.
 *
 * The non-empty `drops` tuple is what makes `AGENTS.md`'s "a `lossy` mapping
 * SHALL name exactly what is lost" a compile error rather than a review
 * finding. There are exactly three fidelity values; there is no `n/a`. A
 * one-way row expresses its reverse direction as `unmapped` with a reason.
 */
export type Verdict =
  | { readonly fidelity: 'lossless' }
  | { readonly fidelity: 'lossy'; readonly drops: readonly [Drop, ...Drop[]] }
  | { readonly fidelity: 'unmapped'; readonly reason: string; readonly owner?: Owner };

/** Whether a mapping is expressible at the data-type level or needs an archetype. */
export type Scope = 'datatype' | 'archetype';

/**
 * The three fidelity values, re-exported from the converter contract so the
 * ledger and the reference implementation share **one** declaration of the
 * vocabulary `AGENTS.md` names.
 */
export type { Fidelity } from '../result.ts';

/** One end of a row: a real field, extension, or resource element. */
export interface Endpoint {
  readonly path: string;
  readonly cardinality?: string;
  readonly type?: string;
  readonly kind: 'element' | 'extension' | 'resource-element';
  /** The scenario in which *this* endpoint is the target, when there are several. */
  readonly when?: string;
  readonly cite: Cite;
}

/**
 * One end of a row where the standard has no counterpart at all.
 *
 * Its `cite` is the **inventory** page of the standard that lacks the
 * counterpart — the openEHR RM *Data Types* page, or the FHIR R5
 * `datatypes.html` anchor for the type with no openEHR home. That is what lets
 * a "no counterpart exists" row still carry both mandatory citations.
 */
export interface NoCounterpart {
  readonly kind: 'none';
  readonly reason: string;
  readonly cite: Cite;
}

/** One field-level mapping fact, in both directions. */
export interface Row {
  /** `<openehr-type>.<field>`, or `fhir:<type>.<field>` for FHIR-origin rows. */
  readonly id: string;
  readonly scope: Scope;
  readonly openehr: Endpoint | NoCounterpart;
  /** A non-empty tuple: scenario-dependent, polymorphic, and one-to-many targets. */
  readonly fhir: readonly [Endpoint, ...Endpoint[]] | NoCounterpart;
  readonly toFhir: Verdict;
  readonly toOpenehr: Verdict;
  readonly maturity: Maturity;
  readonly note?: string;
}

/** Reviewer coverage, carried forward from `support/02-review-doc.md`. */
export interface Review {
  readonly openehr: readonly string[];
  readonly fhir: readonly string[];
}

/** One openEHR type mapped to one FHIR type, with all its field rows. */
export interface Mapping {
  /** `<openehr-type>-to-<fhir-type>` in lower-kebab-case. */
  readonly id: string;
  readonly category: Category;
  readonly openehrType: string;
  readonly fhirType: string;
  readonly title: string;
  readonly scope: Scope;
  /** The per-type `**Sources:**` line, rendered above the field table. */
  readonly sources: readonly [Cite, ...Cite[]];
  readonly review: Review;
  readonly rows: readonly Row[];
}

/** The two directions a verdict can describe. */
export type Direction = 'toFhir' | 'toOpenehr';

/** Narrow a row side to `NoCounterpart`. */
export function isNoCounterpart(
  side: Endpoint | readonly Endpoint[] | NoCounterpart,
): side is NoCounterpart {
  return !Array.isArray(side) && (side as NoCounterpart).kind === 'none';
}

/** Every endpoint on one side of a row, as an array (empty for `NoCounterpart`). */
export function endpointsOf(
  side: Endpoint | readonly Endpoint[] | NoCounterpart,
): readonly Endpoint[] {
  if (Array.isArray(side)) return side as readonly Endpoint[];
  if (isNoCounterpart(side)) return [];
  return [side as Endpoint];
}

/** Every citation a row carries, on both sides. */
export function citesOf(row: Row): readonly Cite[] {
  const cites: Cite[] = [row.openehr.cite];
  if (isNoCounterpart(row.fhir)) cites.push(row.fhir.cite);
  else for (const e of row.fhir) cites.push(e.cite);
  return cites;
}
