/**
 * Tipos HAL (Hypertext Application Language) usados pela API v4 do Kommo.
 *
 * As listagens vêm dentro de `_embedded` e trazem `_links` para navegação.
 * A paginação é por `page`/`limit` (query), e o fim é sinalizado pela ausência
 * de `_links.next` ou por uma página vazia.
 */

/** Recurso HAL genérico com links de navegação. */
export interface HalResource {
  readonly id: number;
  readonly name?: string;
  readonly _links?: HalLinks;
}

/** Links HAL (`self`, `next`, `prev`, etc.). */
export interface HalLinks {
  readonly self?: { href: string };
  readonly next?: { href: string };
  readonly prev?: { href: string };
}

/** Resposta de listagem paginada do Kommo. */
export interface HalCollection<TItem> {
  readonly _page?: number;
  readonly _links?: HalLinks;
  /** Os itens ficam dentro de `_embedded`, numa chave que depende do recurso. */
  readonly _embedded?: Record<string, TItem[]>;
}

export interface PaginateOptions {
  /** Quantidade de itens por página (default 50; máximo 250 na API). */
  readonly limit?: number;
  /** Página inicial (default 1). */
  readonly startPage?: number;
  /** Número máximo de páginas a iterar (default 50) — trava contra loops infinitos. */
  readonly maxPages?: number;
}

/**
 * Itera todas as páginas de uma listagem HAL, concatenando os itens de `_embedded[key]`.
 *
 * @param fetchPage função que recebe `(page, limit)` e devolve a coleção HAL.
 * @param key chave dentro de `_embedded` que contém o array (ex.: `"leads"`).
 *
 * Para de iterar quando a página está vazia, quando não há `_links.next`,
 * ou ao atingir `maxPages`.
 */
export async function paginateHal<TItem>(
  fetchPage: (page: number, limit: number) => Promise<HalCollection<TItem> | undefined>,
  key: string,
  options: PaginateOptions = {}
): Promise<TItem[]> {
  const limit = options.limit ?? 50;
  const maxPages = options.maxPages ?? 50;
  let page = options.startPage ?? 1;
  const all: TItem[] = [];

  while (page <= maxPages) {
    const collection = await fetchPage(page, limit);
    if (collection === undefined) {
      break;
    }
    const items = collection._embedded?.[key] ?? [];
    if (items.length === 0) {
      break;
    }
    all.push(...items);
    // Continua apenas se houver `next` explícito OU a página veio cheia (limite atingido).
    const hasNext = Boolean(collection._links?.next);
    const pageIsFull = items.length >= limit;
    if (!hasNext && !pageIsFull) {
      break;
    }
    page += 1;
  }

  return all;
}
