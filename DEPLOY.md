# Deploy a Cloudflare Pages (gratis, ~10 minutos)

Esta guía levanta la Vedic Library en Cloudflare Pages a coste cero.
El sitio ya está desplegado en <https://vedic-library.pages.dev>; un dominio propio es opcional (~10 €/año).

## Requisitos previos

- Cuenta gratis en [github.com](https://github.com).
- Cuenta gratis en [cloudflare.com](https://cloudflare.com).
- Dominio registrado (en Cloudflare Registrar a precio de coste, o en Porkbun/Namecheap).
- Node.js 18+ instalado localmente.

## Paso 1 — Probar local (2 min)

```bash
cd ~/git_projects/vedic-library
npm install
npm run dev
```

Abre <http://localhost:4321>. Debes ver la Library con una tarjeta por libro: *Bhagavad-gītā As It Is* y *Stolen Words*.
Navega a `/bhagavad-gita-en/06-chapter-01` para verificar el lector completo.

Cuando estés conforme, prueba el build de producción (incluye índice Pagefind):

```bash
npm run build
npm run preview
```

## Paso 2 — Subir a GitHub (3 min)

```bash
cd ~/git_projects/vedic-library
git init
git add .
git commit -m "Initial commit"
gh repo create vedic-library --public --source=. --remote=origin --push
```

(Si no usas `gh`: crea el repo manualmente en github.com y luego `git remote add origin … && git push -u origin main`.)

## Paso 3 — Conectar a Cloudflare Pages (3 min)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autoriza GitHub y selecciona el repo `vedic-library`.
3. Configuración del build:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** *(vacío)*
   - **Node version:** `20`
4. **Save and Deploy.** Cloudflare construye el sitio y te da una URL del estilo `vedic-library.pages.dev`.

A partir de aquí, cada `git push` en la rama `main` redespliega el sitio automáticamente.

## Paso 4 — Conectar tu dominio (2 min)

Opcional: el sitio ya funciona en `vedic-library.pages.dev`. Si quieres un dominio propio,
en el dashboard del proyecto en Pages:

1. **Custom domains** → **Set up a custom domain**.
2. Escribe tu dominio y confirma.
3. Si el dominio ya está en Cloudflare, todo se configura automáticamente (registros CNAME).
4. Si está en otro registrador, Cloudflare te dirá qué CNAME añadir.

El certificado SSL gratuito se emite solo en 1–5 minutos.

## Paso 5 — Pagefind (búsqueda)

El comando `npm run build` ya genera el índice Pagefind en `dist/pagefind/`.
Cloudflare lo sirve igual que el resto. La búsqueda funciona en producción sin más configuración.

Si abriendo localmente con `npm run dev` la búsqueda dice *"Search index not available yet. Build the site to enable."*, es esperado — Pagefind solo se construye con `npm run build`. Usa `npm run preview` para probarlo localmente con el índice ya generado.

## Paso 6 — Verificaciones rápidas

- `https://vedic-library.pages.dev/` → Library, una tarjeta por libro.
- `https://vedic-library.pages.dev/bhagavad-gita-en` → Cover.
- `https://vedic-library.pages.dev/bhagavad-gita-en/06-chapter-01` → Lector con header, prev/next, drawer, fullscreen, search.
- El selector de idioma de ese capítulo debe ofrecer EN · ES · PT · हि · РУ y llevar al mismo capítulo.
- `https://vedic-library.pages.dev/stolen-words-en/04-the-sacred-gift#bg-2-13` → Permalink directo a una evidencia "Before / After".

## Mantenimiento

- **Añadir un capítulo:** crea un `.mdx` en `src/content/books/<libro>-<idioma>/`, `git push`. Live en 30 s.
- **Añadir una traducción:** copia el directorio entero a `<libro>-<idioma>/`, ajusta `book.json` (`id`, `lang`, títulos) y mantén el mismo `order` en cada capítulo. El selector de idioma la detecta sola.
- **Cambiar el estilo:** edita `src/styles/writebook.css` y/o `src/styles/themes.css`.
- **Editar un icono:** sustituye el archivo en `public/icons/`. El cambio aplica al instante en toda la app gracias al `mask-image`.

## Coste mensual real

| Concepto | Coste |
|---|---|
| Cloudflare Pages | **0 €** (incluye 500 builds/mes y ancho de banda ilimitado) |
| Dominio propio (opcional) | ~10 €/año = **~0,83 €/mes** |
| GitHub público | **0 €** |
| **Total** | **0 €** (o ~10 €/año con dominio propio) |

Si algún día el sitio recibe un pico de tráfico (millones de lectores), sigue siendo 0 € extra.
