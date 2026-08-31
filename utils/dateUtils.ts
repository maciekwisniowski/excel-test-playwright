import { DateTime } from 'luxon';

const supportedDateFormats: readonly string[] = [
  'dd/MM/yyyy',
  'd/M/yyyy',
  'dd-MM-yyyy',
  'd-M-yyyy',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'yyyy-MM-dd',
  'dd MMM yyyy',
  'd MMM yyyy',
  'dd MMMM yyyy',
  'd MMMM yyyy',
];

export function getExpectedDate(timeZone: string): DateTime {
  return DateTime.now()
    .setZone(timeZone)
    .startOf('day');
}

export function parseExcelDisplayedDate(
  value: string,
  timeZone: string
): DateTime {
  const normalisedValue = value
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const format of supportedDateFormats) {
    const parsedDate = DateTime.fromFormat(
      normalisedValue,
      format,
      {
        locale: 'en-GB',
        zone: timeZone,
      }
    );

    if (parsedDate.isValid) {
      return parsedDate.startOf('day');
    }
  }

  const isoDate = DateTime.fromISO(normalisedValue, {
    zone: timeZone,
  });

  if (isoDate.isValid) {
    return isoDate.startOf('day');
  }

  throw new Error(
    `Unable to parse Excel date value "${value}". ` +
      `Supported formats: ${supportedDateFormats.join(', ')}.`
  );
}

export function toComparableDate(date: DateTime): string {
  return date.toFormat('yyyy-MM-dd');
}