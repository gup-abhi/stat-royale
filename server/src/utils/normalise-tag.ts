export function normaliseTag(tag: string): string {
  return tag.trim().toUpperCase().replace(/^#/, '');
}

export function encodeTag(tag: string): string {
  return `%23${normaliseTag(tag)}`;
}
