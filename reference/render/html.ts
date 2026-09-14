/**
 * HTML serialization for generated region bodies.
 *
 * Every table the ledger owns is emitted as **final HTML**, not as markdown the
 * publisher is asked to reinterpret. Two consequences follow, and they are the
 * whole reason this module exists:
 *
 * - **Markdown is not processed inside a raw HTML block.** Anything left in
 *   markdown syntax inside a generated cell publishes literally, so ledger prose
 *   must be converted here (see {@link inline}) rather than passed through.
 * - **Every string reaching this module is ledger text, and this module escapes
 *   it.** Escaping is decided by the serializer at the point of interpolation,
 *   never by the ledger author and never by a call site. That is what makes
 *   `DV_INTERVAL<T>` safe by construction instead of by remembering.
 *
 * There is exactly one distinction a maintainer must hold: `anchor` and `code`
 * take **raw text** and escape it; `em`, `strong` and `sup` take **already
 * escaped HTML** so they can wrap composed fragments.
 */

/** Escape text for an HTML text node, and flatten newlines to a single space. */
export function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, ' ');
}

/** Escape a string for use inside a double- or single-quoted attribute value. */
export function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** A link. `label` is raw text and is escaped here. */
export function anchor(href: string, label: string): string {
  return `<a href="${escapeAttr(href)}">${escapeText(label)}</a>`;
}

/** An inline code span. `text` is raw text and is escaped here. */
export function code(text: string): string {
  return `<code>${escapeText(text)}</code>`;
}

/** Emphasis. `html` is already-escaped HTML. */
export function em(html: string): string {
  return `<em>${html}</em>`;
}

/** Strong emphasis. `html` is already-escaped HTML. */
export function strong(html: string): string {
  return `<strong>${html}</strong>`;
}

/** Superscript. `html` is already-escaped HTML. */
export function sup(html: string): string {
  return `<sup>${html}</sup>`;
}

/** A line break inside a cell. */
export const BR = '<br/>';

/** A one-line paragraph. `html` is already-escaped HTML. */
export function paragraph(html: string): string {
  return `<p>${html}</p>`;
}

/**
 * A table.
 *
 * Cells are **already-escaped HTML fragments**; this function does not escape
 * them. Block tags sit at column 0 with no indentation, so no line can be read
 * as an indented code block, and each row is one line so the generated diff
 * stays reviewable.
 *
 * @throws if any row's length differs from the header's, naming the row index.
 * The column count is therefore enforced at construction rather than asserted
 * after the fact.
 */
export function htmlTable(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  rows.forEach((row, index) => {
    if (row.length !== headers.length) {
      throw new Error(
        `table row ${index} has ${row.length} cell(s) but the header has ${headers.length}`,
      );
    }
  });

  const lines = [
    '<table>',
    '<thead>',
    `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`,
    '</thead>',
    '<tbody>',
    ...rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`),
    '</tbody>',
    '</table>',
  ];
  return lines.join('\n');
}

/**
 * Convert the **closed markdown subset** ledger prose is authored in, and escape
 * everything else.
 *
 * Ledger reasons, notes and conditions carry `` `code` ``, `**strong**`, `*em*`
 * and `[label](target)`, and hundreds of generated rows depend on them. Because
 * markdown is not processed inside a raw HTML block, escaping that prose as
 * plain text would publish the syntax literally and dead-link the guide.
 *
 * Code spans are scanned **first**, so a `|`, `<` or `*` inside one is literal
 * and is never re-interpreted. The body of a link, of `**strong**` and of `*em*`
 * is prose in its own right and is converted recursively, because the ledger
 * nests them — `**only `DV_TEXT.value` participates**` is a real ledger string.
 * Anything the subset does not cover stays literal text; the residual-markdown
 * guard in `reference/test/render.test.ts` is what makes that visible rather
 * than silent, and widening the subset is a deliberate change here rather than
 * an escape hatch at a call site.
 */
export function inline(prose: string): string {
  // One alternation, scanned left to right, so a construct is only ever
  // recognised outside a code span. Strong is tried before emphasis, and its
  // body is lazy so `**a *b* c**` pairs correctly.
  const pattern = /`([^`]*)`|\[([^\]]*)\]\(([^)\s]+)\)|\*\*([\s\S]+?)\*\*|\*([^*]+?)\*/g;

  let out = '';
  let last = 0;
  for (const match of prose.matchAll(pattern)) {
    const at = match.index;
    out += escapeText(prose.slice(last, at));
    const [whole, codeText, linkLabel, linkTarget, strongText, emText] = match;
    if (codeText !== undefined) out += code(codeText);
    else if (linkLabel !== undefined && linkTarget !== undefined) {
      // The label is converted, not escaped: a link label is prose too.
      out += `<a href="${escapeAttr(linkTarget)}">${inline(linkLabel)}</a>`;
    } else if (strongText !== undefined) out += strong(inline(strongText));
    else if (emText !== undefined) out += em(inline(emText));
    last = at + whole.length;
  }
  out += escapeText(prose.slice(last));
  return out;
}
