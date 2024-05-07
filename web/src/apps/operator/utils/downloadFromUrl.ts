export default function downloadFromUrl(url: string, name?: string) {
  const link = document.createElement('a');
  link.href = url;

  if (name) {
    link.setAttribute('download', name);
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
