export function formatTag(tag: string): string {
  const clean = tag.trim().toUpperCase().replace(/^#/, '');
  return `#${clean}`;
}
