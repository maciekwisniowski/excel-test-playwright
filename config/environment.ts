import 'dotenv/config';

interface TestEnvironment {
  excelWorkbookUrl: string;
  timeZone: string;
}

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(
      `Required environment variable "${name}" is not configured. ` +
        'Create a local .env file based on .env.example.'
    );
  }

  return value.trim();
}

export const environment: TestEnvironment = {
  excelWorkbookUrl: getRequiredEnvironmentVariable(
    'EXCEL_WORKBOOK_URL'
  ),
  timeZone:
    process.env.TEST_TIME_ZONE?.trim() || 'Europe/London',
};