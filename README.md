# Vedic Library

A free, web-native library of books, in the spirit of [Writebook](https://once.com/writebook).
Built with [Astro](https://astro.build), deployed free on [Cloudflare Pages](https://pages.cloudflare.com).

Live at <https://vedic-library.pages.dev>.

## Philosophy
- **Free for everyone.** No paywall, no signup, no tracking.
- **Markdown is the source of truth.** All content lives in `src/content/books/*/`.
- **Permanent links.** Every chapter and every documented edit has its own URL.
- **Bring your own theme.** Reader chooses font, size, and theme; choices are remembered.
- **One book, many languages.** The library index lists each book once; readers switch
  language from inside the book.

## Books

| Book | Languages |
|---|---|
| *Bhagavad-gītā As It Is* (1972) | en, es, pt, hi, ru |
| *Stolen Words* | en, es, hi |

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:4321>.

Search is powered by Pagefind, which only builds in production. Use `npm run build && npm run preview`
to try it locally.

## How a book is organised

One directory per book *and* language, named `<book>-<lang>`:

```
src/content/books/
  bhagavad-gita-en/
    book.json          ← metadata: title, author, lang, license
    01-cover.mdx
    06-chapter-01.mdx
    ...
  bhagavad-gita-es/
```

Two rules keep the translations in sync:

1. **`order` must line up across languages.** The language switcher sends a reader to the
   chapter with the same `order` in the target book, so English chapter 5 and Spanish
   chapter 5 need the same number. When a translation is missing a section, leave its
   `order` unused rather than renumbering the rest — the switcher falls back to the cover.
2. **The `<book>-<lang>` suffix must match `lang` in `book.json`.** That suffix is how
   translations of the same book find each other.

## Add a new chapter

1. Create a new `.mdx` file under `src/content/books/<book-id>/`.
2. Set the frontmatter:
   ```mdx
   ---
   title: "Chapter title"
   order: 5
   book: "stolen-words-en"
   ---
   ```
3. Write in Markdown. Use the `<BeforeAfter />` component for documented edits.
4. `git push` → live in 30 seconds.

## Add a new translation

Copy an existing language directory to `<book>-<lang>`, then edit `book.json`
(`id`, `lang`, and the translated `title`/`subtitle`/`description`). Keep each chapter's
`order` identical to the source language. Titles inside the chapters should be in the
target language.

To give the new language a button label and a position in the switcher, add it to `LANGS`
in `src/lib/books.ts`. Without an entry it still works, falling back to an uppercased code.

## Add a new book

Same as a translation, but pick a new `<book>` prefix. The library index picks it up
automatically, showing the English edition and listing the languages available.

## Deploy

This project is **not** connected to Git on Cloudflare — pushing does not publish anything.
Deploys are direct uploads:

```bash
npm run build
wrangler pages deploy dist --project-name=vedic-library --branch=main
```

See [DEPLOY.md](DEPLOY.md) for the full procedure, verification steps, and how to switch to
automatic deploys if you'd rather push and forget.

## License

The software (templates, components, styles): MIT.
The book content: see each book's `book.json` for its license.
