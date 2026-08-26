export function cleanText(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\\u0000-\\u001F\\u007F]/g, ' ').trim().slice(0, max);
}

export function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
}

export function validEmail(value) {
  return (
    typeof value === 'string' &&
    /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value) &&
    value.length <= 254
  );
}

export function normalizeName(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z\\s]/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
}

export function uploadMatchesExtension(buffer, extension) {
  if (!buffer || !buffer.length) return false;
  const head = buffer.subarray(0, 16);
  const ascii = head.toString('ascii');
  const hex = head.toString('hex');
  const isZip = hex.startsWith('504b0304') || hex.startsWith('504b0506') || hex.startsWith('504b0708');
  const isOle = hex.startsWith('d0cf11e0a1b11ae1');

  if (['.txt', '.csv'].includes(extension)) {
    return !buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0);
  }
  if (extension === '.pdf') return ascii.startsWith('%PDF-');
  if (['.jpg', '.jpeg'].includes(extension)) return hex.startsWith('ffd8ff');
  if (extension === '.png') return hex.startsWith('89504e470d0a1a0a');
  if (extension === '.gif') return ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a');
  if (extension === '.webp') return ascii.startsWith('RIFF') && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (extension === '.zip') return isZip;
  if (['.docx', '.pptx', '.xlsx'].includes(extension)) return isZip;
  if (['.doc', '.ppt', '.xls'].includes(extension)) return isOle;
  if (extension === '.mp4') return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  if (extension === '.webm') return hex.startsWith('1a45dfa3');
  if (extension === '.wav') return ascii.startsWith('RIFF') && buffer.subarray(8, 12).toString('ascii') === 'WAVE';
  if (extension === '.mp3') return ascii.startsWith('ID3') || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
  return false;
}\n