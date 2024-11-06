export function getUrlExtension(url: string): string {
  const urlWithoutQuery = url.split('?')[0];
  return urlWithoutQuery.split('.').pop()?.toLowerCase() || '';
}
