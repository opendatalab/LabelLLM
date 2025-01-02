export function isUrlMedia(url: string) {
  const urlWithoutQuery = url.split('?')[0];
  const extension = urlWithoutQuery.split('.').pop();
  return extension?.toLowerCase() || '';
}
