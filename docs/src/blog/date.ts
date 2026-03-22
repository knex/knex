const UTC_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
});

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
) {
  return parts.find((part) => part.type === type)?.value ?? '';
}

function formatUtcDate(value: number | string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = UTC_DATE_FORMATTER.formatToParts(date);
  return `${getPart(parts, 'weekday')} ${getPart(parts, 'month')} ${getPart(
    parts,
    'day'
  )} ${getPart(parts, 'year')} ${getPart(parts, 'hour')}:${getPart(
    parts,
    'minute'
  )}:${getPart(parts, 'second')} UTC`;
}

export { formatUtcDate };
