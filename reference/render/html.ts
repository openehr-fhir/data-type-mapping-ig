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
 * Complete code spans keep their payload literal. Complete links likewise
 * protect their destinations from enclosing formatting boundaries. Link labels,
 * `**strong**` and `*em*` contain recursively converted prose, with adjoining
 * closers assigned to the pending inner-to-outer marker widths. The ledger
 * nests these constructs — `**only `DV_TEXT.value` participates**` is a real
 * ledger string.
 * Anything the subset does not cover stays literal text; the residual-markdown
 * guard in `reference/test/render.test.ts` is what makes that visible rather
 * than silent, and widening the subset is a deliberate change here rather than
 * an escape hatch at a call site.
 */
export function inline(prose: string): string {
  type Span = { html: string; end: number };
  type Width = 1 | 2;

  function readCode(at: number, limit: number): Span | undefined {
    if (prose[at] !== '`') return undefined;
    const end = prose.indexOf('`', at + 1);
    if (end < 0 || end >= limit) return undefined;
    return { html: code(prose.slice(at + 1, end)), end: end + 1 };
  }

  function readSpan(at: number, limit: number, parents: readonly Width[]): Span | undefined {
    if (prose[at] === '`') return readCode(at, limit);

    if (prose[at] === '[') {
      let labelEnd = at + 1;
      while (labelEnd < limit && prose[labelEnd] !== ']') {
        const span = readCode(labelEnd, limit);
        labelEnd = span === undefined ? labelEnd + 1 : span.end;
      }
      if (labelEnd >= limit || prose[labelEnd + 1] !== '(') return undefined;
      const targetEnd = prose.indexOf(')', labelEnd + 2);
      if (targetEnd < 0 || targetEnd >= limit) return undefined;
      const target = prose.slice(labelEnd + 2, targetEnd);
      if (target.length === 0 || /\s/.test(target)) return undefined;
      return {
        html: `<a href="${escapeAttr(target)}">${readInline(at + 1, labelEnd)}</a>`,
        end: targetEnd + 1,
      };
    }

    if (prose[at] === '*') {
      for (const width of [2, 1] as const) {
        if (width === parents[0] || at + width > limit ||
            !prose.startsWith('*'.repeat(width), at)) continue;
        const body = readBody(at + width, limit, width, parents, at + width);
        if (body !== undefined) {
          return { html: width === 2 ? strong(body.html) : em(body.html), end: body.end };
        }
      }
    }
    return undefined;
  }

  function readBody(
    from: number,
    limit: number,
    width: Width,
    parents: readonly Width[],
    bodyStart: number,
  ): Span | undefined {
    let html = '';
    let rawStart = from;
    let at = from;
    while (at < limit) {
      if (prose[at] === '*') {
        let runEnd = at + 1;
        while (runEnd < limit && prose[runEnd] === '*') runEnd += 1;
        const run = runEnd - at;
        const canClose = at > bodyStart && run >= width;
        const parent = parents[0];
        const close = (): Span => ({
          html: html + escapeText(prose.slice(rawStart, at)),
          end: at + width,
        });

        // A run can close pending wrappers or end this span before an adjacent
        // opener. Consume this wrapper's width, not the longest marker.
        if (canClose && (run === width || run > 2 ||
            (parent !== undefined && run >= width + parent))) return close();

        const child = readSpan(at, limit, [width, ...parents]);
        if (child !== undefined) {
          // A speculative formatting child is kept only if this wrapper can
          // still close; a failed attempt cannot consume its caller's boundary.
          const rest = readBody(child.end, limit, width, parents, bodyStart);
          if (rest !== undefined) {
            return {
              html: html + escapeText(prose.slice(rawStart, at)) + child.html + rest.html,
              end: rest.end,
            };
          }
        }
        if (canClose && (parent === undefined || run < parent)) return close();
        if (parent !== undefined && run >= parent) return undefined;
        at = runEnd;
        continue;
      }

      const child = readSpan(at, limit, [width, ...parents]);
      if (child === undefined) {
        at += 1;
      } else {
        html += escapeText(prose.slice(rawStart, at)) + child.html;
        at = child.end;
        rawStart = at;
      }
    }
    return undefined;
  }

  function readInline(from: number, limit: number): string {
    let html = '';
    let rawStart = from;
    let at = from;
    while (at < limit) {
      const span = readSpan(at, limit, []);
      if (span === undefined) {
        at += 1;
      } else {
        html += escapeText(prose.slice(rawStart, at)) + span.html;
        at = span.end;
        rawStart = at;
      }
    }
    return html + escapeText(prose.slice(rawStart, limit));
  }

  return readInline(0, prose.length);
}
