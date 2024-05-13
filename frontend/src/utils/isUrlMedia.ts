export function isUrlMedia(url: string, type: 'mp3' | 'mp4' | 'mov') {
  const search = new URL(url);
  const path = search.searchParams.get('path') || '';
  const extension = path.split('.').pop();
  return extension?.toLowerCase() === type;
}
