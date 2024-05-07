export function isUrlMedia(url: string, type: 'mp3' | 'mp4' | 'mov') {
  const urlWithoutQuery = url.split('?')[0];
  const extension = urlWithoutQuery.split('.').pop();
  return extension?.toLowerCase() === type;
}
