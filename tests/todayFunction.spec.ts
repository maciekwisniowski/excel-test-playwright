
import { expect, test } from '@playwright/test';
import { environment } from '../config/environment';
import { ExcelWorkbookPage } from '../pages/ExcelWorkbookPage';
import {
  getExpectedDate,
  parseExcelDisplayedDate,
  toComparableDate,
} from '../utils/dateUtils';

test.describe('Excel Online TODAY function', () => {
  test('returns the date on which the test is executed', async ({ page }) => {
    const workbookPage = new ExcelWorkbookPage(page);

    await test.step('Open the prepared Excel Online workbook', async () => {
      await workbookPage.open(environment.excelWorkbookUrl);
    });

    await test.step('Enter TODAY formula into cell A2', async () => {
      await workbookPage.enterFormula();
    });

    await test.step(
      'Verify that cell A2 contains the current date',
      async () => {
        const displayedCellValue =
          await workbookPage.getSelectedCellDisplayedValue();

        const expectedDate = getExpectedDate(
          environment.timeZone
        );

        const actualDate = parseExcelDisplayedDate(
          displayedCellValue,
          environment.timeZone
        );

        expect(
          toComparableDate(actualDate),
          `Expected TODAY() to return ${toComparableDate(
            expectedDate
          )}, but Excel displayed "${displayedCellValue}".`
        ).toBe(toComparableDate(expectedDate));
      }
    );
  });
});

