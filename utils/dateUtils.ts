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

  const candidates = supportedDateFormats
    .map((format) =>
      DateTime.fromFormat(normalisedValue, format, {
        locale: 'en-GB',
        zone: timeZone,
      })
    )
    .filter((date) => date.isValid)
    .map((date) => date.startOf('day'));

  if (candidates.length > 0) {
    const today = getExpectedDate(timeZone);

    return candidates.reduce((closestDate, candidate) => {
      const closestDifference = Math.abs(
        closestDate.diff(today, 'days').days
      );

      const candidateDifference = Math.abs(
        candidate.diff(today, 'days').days
      );

      return candidateDifference < closestDifference
        ? candidate
        : closestDate;
    });
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