import {
  expect,
  FrameLocator,
  Locator,
  Page,
} from '@playwright/test';

import { TIMEOUT } from '../config/timeouts';

export class ExcelWorkbookPage {
  private static readonly CLIPBOARD_BUSY_MESSAGE =
    'Retrieving data. Wait a few seconds and try to cut or copy again.';

  private readonly excelFrame: FrameLocator;
  private readonly sheetCanvas: Locator;

  public constructor(private readonly page: Page) {
    this.excelFrame = page.frameLocator(
      'iframe[name^="WacFrame_Excel"]'
    );

    this.sheetCanvas = this.excelFrame
      .locator('[id^="Sheet0_0_0_"] canvas')
      .first();
  }

  public async open(workbookUrl: string): Promise<void> {
    await this.page.goto(workbookUrl, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT.XL,
    });

    await this.waitUntilReady();
  }

  public async waitUntilReady(): Promise<void> {
    const excelIframe = this.page.locator(
      'iframe[name^="WacFrame_Excel"]'
    );

    await expect(excelIframe).toBeVisible({
      timeout: TIMEOUT.XL,
    });

    await expect(this.sheetCanvas).toBeVisible({
      timeout: TIMEOUT.XL,
    });

    await expect
      .poll(
        async () => {
          const boundingBox =
            await this.sheetCanvas.boundingBox();

          if (!boundingBox) {
            return false;
          }

          return (
            boundingBox.width > 300 &&
            boundingBox.height > 200
          );
        },
        {
          message:
            'Waiting for Excel worksheet canvas to be rendered.',
          timeout: TIMEOUT.XL,
        }
      )
      .toBe(true);
  }

  public async selectCell(
    cellReference: string
  ): Promise<void> {
    const normalisedCellReference =
      cellReference.trim().toUpperCase();

    const nameBox = this.getNameBox();

    await expect(nameBox).toBeVisible({
      timeout: TIMEOUT.L,
    });

    await nameBox.click();

    await nameBox.fill(normalisedCellReference);

    await nameBox.press('Enter');

    await expect(nameBox).not.toBeFocused({
      timeout: TIMEOUT.M,
    });
  }

  public async enterFormula(): Promise<void> {
    const cellReference = 'A2';
    const formula = '=TODAY()';

    await this.clearCell(cellReference);

    const formulaBar = this.getFormulaBar();

    await expect(formulaBar).toBeVisible({ timeout: TIMEOUT.L });

    await this.page.keyboard.press('Escape');

    await formulaBar.click();

    await expect(formulaBar).toBeFocused({ timeout: TIMEOUT.M });

    await expect
      .poll(async () => (await formulaBar.innerText()).trim(), {
        timeout: TIMEOUT.M,
        message: 'Waiting for formula bar to be empty and ready.',
      })
      .toBe('');

    await formulaBar.pressSequentially(formula, { delay: 100 });

    await expect
      .poll(async () => (await formulaBar.innerText()).trim(), {
        timeout: TIMEOUT.S,
        message: 'Waiting for "=" to register in formula bar.',
      })
      .toMatch(/^=/);

    await formulaBar.press('Enter');
  }

  public async getCellDisplayedValue(
    cellReference: string
  ): Promise<string> {
    await this.selectCell(cellReference);

    await this.clearClipboard();

    const clipboardValue =
      await this.copyCellValueToClipboard(cellReference);

    return this.normaliseClipboardValue(
      clipboardValue,
      cellReference
    );
  }

  public async clearCell(
    cellReference: string
  ): Promise<void> {
    await this.selectCell(cellReference);

    await this.page.keyboard.press('Delete');
  }

  private getNameBox(): Locator {
    return this.excelFrame
      .locator(
        'input[aria-label*="Name Box"], ' +
          'input[aria-label*="Nazwa"]'
      )
      .first();
  }

  private getFormulaBar(): Locator {
    return this.excelFrame
      .getByRole('textbox', {
        name: /formula bar/i,
      })
      .first();
  }

  private async clearClipboard(): Promise<void> {
    await this.page.evaluate(() => {
      return navigator.clipboard.writeText('');
    });
  }

  private async readClipboard(): Promise<string> {
    return this.page.evaluate(() => {
      return navigator.clipboard.readText();
    });
  }

  private async copyCellValueToClipboard(
    cellReference: string
  ): Promise<string> {
    let clipboardValue = '';

    await expect
      .poll(
        async () => {
          await this.page.bringToFront();

          await this.page.keyboard.press('Control+C');

          clipboardValue = await this.readClipboard();

          const trimmedValue = clipboardValue.trim();

          if (
            trimmedValue ===
            ExcelWorkbookPage.CLIPBOARD_BUSY_MESSAGE
          ) {
            return '';
          }

          return trimmedValue;
        },
        {
          timeout: TIMEOUT.M,
          message:
            `Waiting for the value of ${cellReference} ` +
            'to be copied to the clipboard.',
        }
      )
      .not.toBe('');

    return clipboardValue;
  }

  private normaliseClipboardValue(
    clipboardValue: string,
    cellReference: string
  ): string {
    const normalisedValue = clipboardValue
      .replace(/\r?\n/g, '')
      .replace(/\t/g, '')
      .trim();

    if (
      !normalisedValue ||
      normalisedValue ===
        ExcelWorkbookPage.CLIPBOARD_BUSY_MESSAGE
    ) {
      throw new Error(
        `Clipboard contains no valid value for cell ${cellReference} ` +
          `(got: "${normalisedValue}").`
      );
    }

    return normalisedValue;
  }
}