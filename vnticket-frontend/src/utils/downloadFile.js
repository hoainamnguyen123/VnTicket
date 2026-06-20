const EXTENSIONS = {
  pdf: 'pdf',
  excel: 'xlsx',
};

const toSafeFilename = (value) => {
  const normalized = String(value || 'event-report')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalized || 'event-report';
};

export const downloadBlob = (blob, eventName, format) => {
  const extension = EXTENSIONS[format] || format;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = `bookings-${toSafeFilename(eventName)}.${extension}`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
};
