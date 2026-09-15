/**
 * Rendering a view model into the static shell.
 *
 * This layer holds **no mapping knowledge of its own**: it writes what
 * `view-model.ts` produced and nothing else. Every string that could come from
 * a reader's instance or from ledger prose is set through `textContent`, never
 * `innerHTML`, so the page cannot be made to execute what someone pasted into
 * it.
 */

import type { CatalogueEntry } from '../../reference/src/browser/contract.ts';
import type { FixtureExample } from './generated/fixture-catalog.ts';
import { PROVENANCE } from './generated/provenance.ts';
import type { ViewModel } from './view-model.ts';

export interface Shell {
  readonly direction: HTMLFieldSetElement;
  readonly mapping: HTMLSelectElement;
  readonly example: HTMLSelectElement;
  readonly convert: HTMLButtonElement;
  readonly input: HTMLTextAreaElement;
  readonly output: HTMLPreElement;
  readonly verdict: HTMLElement;
  readonly provenance: HTMLElement;
  readonly guideLink: HTMLAnchorElement;
}

function require<T extends Element>(id: string): T {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`the page shell is missing #${id}`);
  return found as unknown as T;
}

export function shell(): Shell {
  return {
    direction: require<HTMLFieldSetElement>('direction'),
    mapping: require<HTMLSelectElement>('mapping'),
    example: require<HTMLSelectElement>('example'),
    convert: require<HTMLButtonElement>('convert'),
    input: require<HTMLTextAreaElement>('input'),
    output: require<HTMLPreElement>('output'),
    verdict: require<HTMLElement>('verdict'),
    provenance: require<HTMLElement>('provenance'),
    guideLink: require<HTMLAnchorElement>('guide-link'),
  };
}

function option(value: string, label: string): HTMLOptionElement {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = label;
  return element;
}

/** Fill a `<select>` with options, keeping `selected` current where it exists. */
export function fillSelect(
  select: HTMLSelectElement,
  entries: readonly { readonly value: string; readonly label: string }[],
  selected: string | undefined,
): void {
  select.replaceChildren(...entries.map((entry) => option(entry.value, entry.label)));
  select.disabled = entries.length === 0;
  if (selected !== undefined) select.value = selected;
}

/** The label a mapping is offered under, with the guide's declared fidelity. */
export function mappingLabel(entry: CatalogueEntry, direction: string): string {
  const declared = entry.directions.find((candidate) => candidate.direction === direction);
  const fidelity = declared === undefined ? '' : ` — ${declared.declaredFidelity}`;
  return `${entry.openehrType} ↔ ${entry.fhirType}${fidelity}`;
}

/** The label an example is offered under. */
export function exampleLabel(example: FixtureExample): string {
  return example.name.replace(/^(\d+)-/, '$1. ').replace(/-/g, ' ');
}

export function renderProvenance(target: HTMLElement): void {
  target.textContent =
    `Built from guide version ${PROVENANCE.guideVersion}, source commit ${PROVENANCE.commit}.`;
}

function banner(text: string, kind: string): HTMLParagraphElement {
  const element = document.createElement('p');
  element.className = `banner ${kind}`;
  element.textContent = text;
  return element;
}

function issueLine(text: string, href: string, label: string): HTMLLIElement {
  const item = document.createElement('li');
  const body = document.createElement('code');
  body.textContent = text;
  const link = document.createElement('a');
  link.href = href;
  link.rel = 'noopener';
  link.textContent = `See ${label} in the guide`;
  item.append(body, document.createElement('br'), link);
  return item;
}

export function render(view: ViewModel, shellParts: Shell): void {
  switch (view.kind) {
    case 'idle':
      shellParts.verdict.replaceChildren();
      shellParts.output.textContent = '';
      return;

    case 'invalid-json':
      shellParts.verdict.replaceChildren(banner(view.message, 'invalid-json'));
      shellParts.output.textContent = '';
      return;

    case 'unavailable':
      shellParts.verdict.replaceChildren(banner(view.message, 'unavailable'));
      shellParts.output.textContent = '';
      return;

    case 'result': {
      const parts: Node[] = [banner(view.banner, view.fidelity)];
      if (view.issues.length > 0) {
        const list = document.createElement('ul');
        list.className = 'issues';
        list.append(
          ...view.issues.map((issue) => issueLine(issue.text, issue.href, issue.label)),
        );
        parts.push(list);
      }
      shellParts.verdict.replaceChildren(...parts);
      shellParts.output.textContent = view.output ?? '';
      return;
    }
  }
}
