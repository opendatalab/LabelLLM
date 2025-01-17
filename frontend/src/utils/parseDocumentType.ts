export function parseDocumentType(url: string) {
  const urlWithoutQuery = url.split('?')[0];
  const extension = urlWithoutQuery.split('.').pop();
  return extension?.toLowerCase() || '';
}
