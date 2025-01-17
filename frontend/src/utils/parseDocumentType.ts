export function parseDocumentType(url: string) {
  const urlWithoutQuery = url.split('?')[0];
  const extension = urlWithoutQuery.split('.').pop();
  console.log(extension);
  return extension?.toLowerCase() || '';
}
