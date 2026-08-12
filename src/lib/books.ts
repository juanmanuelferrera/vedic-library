import { getCollection } from 'astro:content';

/**
 * Get all books (their metadata).
 */
export async function getBooks() {
  const all = await getCollection('bookMeta');
  return all.map(b => b.data);
}

/**
 * Get metadata for a single book by id.
 */
export async function getBook(id: string) {
  const all = await getCollection('bookMeta');
  return all.find(b => b.data.id === id)?.data;
}

/**
 * Get the ordered list of chapters for a book.
 * Filters out hidden chapters.
 */
export async function getChapters(bookId: string) {
  const all = await getCollection('books');
  return all
    .filter(c => c.data.book === bookId && !c.data.hidden)
    .sort((a, b) => a.data.order - b.data.order);
}

/**
 * Get a single chapter by book + slug.
 * Slug is the file basename without extension.
 */
export async function getChapter(bookId: string, slug: string) {
  const chapters = await getChapters(bookId);
  return chapters.find(c => chapterSlug(c.id) === slug);
}

/**
 * The sections a book actually shows, which is not the same as the files it has.
 * A translation that is missing a section still lists it, falling back to the
 * English text, so the table of contents is the same in every language and a
 * reader switching language never lands somewhere unrelated.
 *
 * Returns `{ entry, fallback }`, where `fallback` marks an entry served from
 * English because this language has no translation of it yet.
 */
export async function getSections(bookId: string) {
  const book = await getBook(bookId);
  if (!book) return [];

  const own = await getChapters(bookId);
  if (book.lang === 'en') return own.map(entry => ({ entry, fallback: false }));

  const books = await getBooks();
  const base = seriesId(bookId, book.lang);
  const english = books.find(b => b.lang === 'en' && seriesId(b.id, b.lang) === base);
  if (!english) return own.map(entry => ({ entry, fallback: false }));

  const mine = new Map(own.map(c => [c.data.order, c]));
  const sections = (await getChapters(english.id)).map(ref => {
    const local = mine.get(ref.data.order);
    return local ? { entry: local, fallback: false } : { entry: ref, fallback: true };
  });

  // Anything this language has that English does not keeps its place.
  const covered = new Set(sections.map(s => s.entry.data.order));
  for (const c of own) {
    if (!covered.has(c.data.order)) sections.push({ entry: c, fallback: false });
  }
  return sections.sort((a, b) => a.entry.data.order - b.entry.data.order);
}

/**
 * Build neighbouring (prev/next) chapter refs.
 */
export async function getNeighbours(bookId: string, currentSlug: string) {
  const chapters = (await getSections(bookId)).map(s => s.entry);
  const i = chapters.findIndex(c => chapterSlug(c.id) === currentSlug);
  return {
    prev: i > 0 ? chapters[i - 1] : null,
    next: i < chapters.length - 1 ? chapters[i + 1] : null,
    index: i,
    total: chapters.length,
  };
}

/**
 * Convert a content id like "stolen-words-en/04-bg-2-13.mdx" -> "04-bg-2-13".
 */
export function chapterSlug(id: string): string {
  const last = id.split('/').pop() ?? id;
  return last.replace(/\.(md|mdx)$/, '');
}

/**
 * Render a book's `credit` field to HTML. Accepts only markdown links —
 * `[text](https://host)` — and escapes everything else, so a credit string
 * cannot inject markup into the page.
 */
export function creditHtml(credit: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;');
  return escape(credit).replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_, text, href) => `<a href="${href}" rel="noopener">${text}</a>`
  );
}

/** Display order and button label for each language we publish in. */
const LANGS: Record<string, { rank: number; label: string }> = {
  en: { rank: 1, label: 'EN' },
  es: { rank: 2, label: 'ES' },
  pt: { rank: 3, label: 'PT' },
  hi: { rank: 4, label: 'हि' },
  ru: { rank: 5, label: 'РУ' },
};

/**
 * Strip a book's own language suffix to get the series id shared by its
 * translations. Uses the book's declared `lang` rather than a fixed list,
 * so adding a translation needs no change here.
 * "bg-pt" (lang "pt") -> "bg"
 */
function seriesId(id: string, lang: string): string {
  return id.endsWith(`-${lang}`) ? id.slice(0, -(lang.length + 1)) : id;
}

/**
 * One entry per book for the library index: the English edition stands in
 * for the whole series, and the other languages are reached from inside the
 * book via the switcher. Falls back to the first available edition for a
 * series with no English translation.
 */
export async function getLibrary() {
  const books = await getBooks();
  const series = new Map<string, typeof books>();
  for (const b of books) {
    const key = seriesId(b.id, b.lang);
    series.set(key, [...(series.get(key) ?? []), b]);
  }

  return [...series.values()].map(editions => {
    const primary = editions.find(b => b.lang === 'en') ?? editions[0];
    const langs = editions
      .map(b => ({ lang: b.lang, label: LANGS[b.lang]?.label ?? b.lang.toUpperCase() }))
      .sort((a, c) => (LANGS[a.lang]?.rank ?? 99) - (LANGS[c.lang]?.rank ?? 99));
    return { ...primary, langs };
  });
}

/**
 * Build the language-sibling list for the current book/chapter.
 * Matches sibling books by series id, then picks the chapter in each
 * sibling that shares the same `order`.
 * If no chapter with that order exists in a sibling, fall back to its cover.
 *
 * Pass `currentOrder = null` for cover pages — every sibling will resolve to its cover.
 */
export async function getLangSiblings(currentBookId: string, currentOrder: number | null) {
  const books = await getBooks();
  const current = books.find(b => b.id === currentBookId);
  if (!current) return [];
  const base = seriesId(current.id, current.lang);

  const siblings = [];
  for (const b of books) {
    if (seriesId(b.id, b.lang) !== base) continue;
    let href = `/${b.id}`;
    if (currentOrder !== null) {
      const sections = await getSections(b.id);
      const match = sections.find(s => s.entry.data.order === currentOrder);
      if (match) href = `/${b.id}/${chapterSlug(match.entry.id)}`;
    }
    siblings.push({
      lang: b.lang,
      label: LANGS[b.lang]?.label ?? b.lang.toUpperCase(),
      href,
      isCurrent: b.id === currentBookId,
    });
  }
  return siblings.sort((a, c) => (LANGS[a.lang]?.rank ?? 99) - (LANGS[c.lang]?.rank ?? 99));
}
