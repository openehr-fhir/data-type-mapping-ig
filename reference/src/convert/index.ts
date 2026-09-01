/**
 * The single module that populates the converter registry.
 *
 * Every converter module registers itself as an import side effect, so
 * importing *this* module is what makes `registered()` complete. Tests and the
 * renderer import this, never an individual converter module.
 *
 * One line per `reference/src/convert/*.ts`, appended by the phase that lands
 * it. The list is static and explicit, for the same reason `load.ts`'s is.
 */

// ── Converter modules ────────────────────────────────────────────────────────

export { registered, converterFor, register } from '../registry.ts';
export type { ConverterPair } from '../registry.ts';
