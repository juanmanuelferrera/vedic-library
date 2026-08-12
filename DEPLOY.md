# Deploy a Cloudflare Pages

El sitio está en <https://vedic-library.pages.dev>, alojado gratis en Cloudflare Pages.

> **Importante:** este proyecto usa **subida directa** (*direct upload*), no está conectado a Git.
> `git push` **no** despliega nada. Cada publicación se hace a mano con `wrangler`.
> Puedes confirmarlo con `wrangler pages project list`: la columna *Git Provider* pone `No`.

## Requisitos previos

- Node.js 18+ instalado localmente.
- `wrangler` instalado (`brew install wrangler` o `npm i -g wrangler`) y autenticado (`wrangler login`).
  Comprueba la sesión con `wrangler whoami`; hace falta el permiso `pages (write)`.

## Publicar un cambio

Los dos únicos comandos que importan:

```bash
cd ~/git_projects/vedic-library
npm run build
wrangler pages deploy dist --project-name=vedic-library --branch=main
```

`npm run build` genera `dist/` **y** el índice de búsqueda Pagefind dentro de `dist/pagefind/`.
Por eso siempre se despliega `dist/` completo y nunca hace falta subir el índice aparte.

Wrangler responde con dos URLs: la del deploy concreto (`https://<hash>.vedic-library.pages.dev`,
útil para revisar antes de dar por bueno el cambio) y la de producción, que se actualiza sola.

El commit y el push a GitHub siguen siendo recomendables para tener historial, pero son
independientes del deploy:

```bash
git add <ficheros>
git commit -m "…"
git push origin main
```

## Probar en local antes de publicar

```bash
npm run dev        # http://localhost:4321
```

La búsqueda no funciona con `npm run dev` — Pagefind solo se construye en producción.
Si dice *"Search index not available yet. Build the site to enable."*, es lo esperado.
Para probarla en local:

```bash
npm run build
npm run preview
```

## Verificaciones después de publicar

- `https://vedic-library.pages.dev/` → Library, **una tarjeta por libro** (no una por idioma),
  con las etiquetas de idioma disponibles en cada tarjeta.
- `https://vedic-library.pages.dev/bhagavad-gita-en/06-chapter-01` → lector completo:
  cabecera, prev/next, índice lateral, pantalla completa y búsqueda.
- El selector de idioma de ese capítulo ofrece EN · ES · PT · हि · РУ y lleva **al mismo capítulo**,
  no a la portada.
- `https://vedic-library.pages.dev/bhagavad-gita-hi/03-preface` → sección sin traducir:
  muestra el texto inglés con el aviso en el idioma del lector.
- El sitemap apunta al dominio correcto:
  `curl -s https://vedic-library.pages.dev/sitemap-0.xml | head`.

### Ojo con la caché del edge

Un URL que deja de existir puede seguir respondiendo desde la caché de Cloudflare durante
un buen rato. Para saber si estás viendo el deploy nuevo o una copia cacheada:

```bash
curl -sI https://vedic-library.pages.dev/<ruta>/ | grep -i "cf-cache-status\|age"
curl -sL "https://vedic-library.pages.dev/<ruta>/?v=$(date +%s)"   # salta la caché
```

Si sale `cf-cache-status: HIT` con un `age` alto, es caché, no el deploy. Como `pages.dev`
no es una zona propia, no hay purga por API: o esperas a que caduque, o la fuerzas desde
el panel de Cloudflare.

## Cambiar a deploy automático (opcional)

Si prefieres que cada `git push` publique solo:

1. Cloudflare Dashboard → **Workers & Pages** → `vedic-library` → **Settings** →
   **Builds & deployments** → **Connect to Git**.
2. Autoriza GitHub y selecciona `juanmanuelferrera/vedic-library`.
3. Configuración del build:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** *(vacío)*
   - **Node version:** `20`

A partir de ahí, `wrangler pages deploy` deja de hacer falta y esta guía se queda obsoleta
en su parte principal.

## Dominio propio (opcional)

En el panel del proyecto → **Custom domains** → **Set up a custom domain**. Si el dominio ya
está en Cloudflare, los CNAME se configuran solos; si está en otro registrador, Cloudflare te
dice cuál añadir. El certificado SSL se emite en 1–5 minutos.

Al cambiar de dominio hay que actualizar también `site` en `astro.config.mjs` — de ahí salen
las URLs canónicas y el sitemap, y si apunta a un dominio que no resuelve, los buscadores
reciben una dirección muerta.

## Mantenimiento

- **Añadir un capítulo:** crea un `.mdx` en `src/content/books/<libro>-<idioma>/` con
  `title`, `order` y `book` en el frontmatter. No pongas un `# Título` en el cuerpo: la
  plantilla ya imprime el título y saldría duplicado.
- **Añadir una traducción:** copia el directorio a `<libro>-<idioma>/`, ajusta `book.json`
  (`id`, `lang`, títulos) y **mantén el mismo `order` en cada capítulo** — es lo que usa el
  selector para emparejar secciones entre idiomas. Las secciones que falten mostrarán el
  inglés automáticamente.
- **Idioma nuevo en el selector:** añádelo a `LANGS` en `src/lib/books.ts` para darle
  etiqueta y posición.
- **Cambiar el estilo:** `src/styles/writebook.css` y/o `src/styles/themes.css`.
- **Editar un icono:** sustituye el archivo en `public/icons/`; el cambio se aplica en toda
  la app gracias al `mask-image`.

## Coste real

| Concepto | Coste |
|---|---|
| Cloudflare Pages | **0 €** (500 builds/mes, ancho de banda ilimitado) |
| GitHub público | **0 €** |
| Dominio propio (opcional) | ~10 €/año |
| **Total** | **0 €** (o ~10 €/año con dominio propio) |

Un pico de tráfico no cambia la factura.
