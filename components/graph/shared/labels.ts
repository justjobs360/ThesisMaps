/**
 * Short, human labels for papers: "Vaswani 2017".
 *
 * Shared by the homepage preview and the real graph so a paper reads the same in
 * both. Also owns author-name normalisation, because the co-author edges and the
 * label both depend on picking the same surname out of messy source data
 * ("Ashish Vaswani", "Vaswani, A.", "A. Vaswani", "Ludwig van Beethoven").
 */

/** Lower-case name particles that belong to the surname, not the given name. */
const PARTICLES = new Set(['van', 'von', 'der', 'den', 'de', 'del', 'della', 'di', 'da', 'dos', 'du', 'la', 'le', 'bin', 'ibn', 'al', 'el']);

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** { surname, given } with the original casing and diacritics preserved. */
export function splitName(raw: string): { surname: string; given: string } {
  const name = raw.replace(/\s+/g, ' ').trim();
  if (!name) return { surname: '', given: '' };

  // "Vaswani, Ashish" — the comma form is unambiguous.
  if (name.includes(',')) {
    const [surname, ...rest] = name.split(',');
    return { surname: surname!.trim(), given: rest.join(' ').trim() };
  }

  const parts = name.split(' ');
  if (parts.length === 1) return { surname: parts[0]!, given: '' };

  let i = parts.length - 1;
  // Walk left over particles so "van der Berg" stays together.
  while (i > 1 && PARTICLES.has(parts[i - 1]!.toLowerCase())) i--;
  return { surname: parts.slice(i).join(' '), given: parts.slice(0, i).join(' ') };
}

export function surnameOf(name: string): string {
  return splitName(name).surname;
}

/**
 * Identity key for matching the same person across papers: surname + first
 * initial, diacritics and case folded. Deliberately loose — names are all the
 * sources give us — so it is a heuristic, not an identity.
 */
export function authorKey(name: string): string {
  const { surname, given } = splitName(name);
  const s = stripDiacritics(surname).toLowerCase().replace(/[^a-z0-9]/g, '');
  const g = stripDiacritics(given).toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return '';
  return g ? `${s}|${g[0]}` : s;
}

type NameLike = string | { name: string };

const nameOf = (a: NameLike) => (typeof a === 'string' ? a : a.name);

/** "Vaswani 2017". Falls back to the first meaningful title word, then "Untitled". */
export function shortLabel(authors: NameLike[], year: number | null | undefined, title?: string): string {
  const first = authors.length ? surnameOf(nameOf(authors[0]!)) : '';
  const lead = first || (title ? title.split(/\s+/).find((w) => w.length > 3) ?? title.split(/\s+/)[0] : '') || 'Untitled';
  return year ? `${lead} ${year}` : lead;
}

/** "Vaswani, Shazeer +5" — the byline in the hover card. */
export function byline(authors: NameLike[], max = 3): string {
  const names = authors.map((a) => surnameOf(nameOf(a))).filter(Boolean);
  if (names.length === 0) return 'Unknown authors';
  const shown = names.slice(0, max).join(', ');
  return names.length > max ? `${shown} +${names.length - max}` : shown;
}

export function compactCount(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${n}`;
}
