const HTML_COMMENT_REGEX = /<!--[\s\S]*?-->/g
const HTML_TAG_REGEX = /<[^>]*>/g
const HTML_ENTITY_REGEX = /&(#\d+|#x[\da-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
}

function decodeEntity(entityBody: string): string {
  if (entityBody.startsWith("#x") || entityBody.startsWith("#X")) {
    const value = Number.parseInt(entityBody.slice(2), 16)
    return Number.isFinite(value) ? String.fromCodePoint(value) : " "
  }

  if (entityBody.startsWith("#")) {
    const value = Number.parseInt(entityBody.slice(1), 10)
    return Number.isFinite(value) ? String.fromCodePoint(value) : " "
  }

  return NAMED_ENTITIES[entityBody.toLowerCase()] ?? " "
}

/**
 * Converts HTML or rich-text content into normalized plain text for previews/search.
 */
export function extractPlainText(content: string | undefined | null): string {
  if (!content) return ""

  return content
    .replace(HTML_COMMENT_REGEX, " ")
    .replace(HTML_TAG_REGEX, " ")
    .replace(HTML_ENTITY_REGEX, (_match, entityBody: string) => decodeEntity(entityBody))
    .replace(/\s+/g, " ")
    .trim()
}

export function truncatePlainText(content: string, maxLength = 120): string {
  const normalized = extractPlainText(content)
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}
