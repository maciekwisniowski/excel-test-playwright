import {
  expect,
  FrameLocator,
  Locator,
  Page,
} from '@playwright/test';

export class ExcelWorkbookPage {
  private static readonly NAVIGATION_TIMEOUT = 60_000;
  private static readonly EXCEL_READY_TIMEOUT = 90_000;
  private static readonly DEFAULT_TIMEOUT = 30_000;
  private static readonly CELL_SELECTION_TIMEOUT = 10_000;
  private static readonly CLIPBOARD_TIMEOUT = 5_000;

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
      timeout: ExcelWorkbookPage.NAVIGATION_TIMEOUT,
    });

    await this.waitUntilReady();
  }

  public async waitUntilReady(): Promise<void> {
    const excelIframe = this.page.locator(
      'iframe[name^="WacFrame_Excel"]'
    );

    await expect(excelIframe).toBeVisible({
      timeout: ExcelWorkbookPage.EXCEL_READY_TIMEOUT,
    });

    await expect(this.sheetCanvas).toBeVisible({
      timeout: ExcelWorkbookPage.EXCEL_READY_TIMEOUT,
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
          timeout: ExcelWorkbookPage.EXCEL_READY_TIMEOUT,
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
      timeout: ExcelWorkbookPage.DEFAULT_TIMEOUT,
    });

    await nameBox.click();

    await nameBox.fill(normalisedCellReference);

    await nameBox.press('Enter');


    await expect(nameBox).not.toBeFocused({
      timeout: ExcelWorkbookPage.CELL_SELECTION_TIMEOUT,
    });
  }

  public async enterFormula(): Promise<void> {
    const formula = '=TODAY()';

    await this.selectCell('A2');

    const formulaBar = this.getFormulaBar();

    await expect(formulaBar).toBeVisible({
      timeout: ExcelWorkbookPage.DEFAULT_TIMEOUT,
    });

    await formulaBar.click();

    await formulaBar.press('ControlOrMeta+A');

    await formulaBar.press('Backspace');

 
    await formulaBar.pressSequentially(formula, {
      delay: 100,
    });

    await formulaBar.press('Enter');
  }

  public async getCellDisplayedValue(
    cellReference: string
  ): Promise<string> {
    await this.selectCell(cellReference);

    await this.clearClipboard();

    await this.page.keyboard.press('Control+C');

    const clipboardValue =
      await this.waitForClipboardValue(cellReference);

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

  private async waitForClipboardValue(
    cellReference: string
  ): Promise<string> {
    let clipboardValue = '';

    await expect
      .poll(
        async () => {
          clipboardValue = await this.readClipboard();

          return clipboardValue.trim();
        },
        {
          timeout: ExcelWorkbookPage.CLIPBOARD_TIMEOUT,
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

    if (!normalisedValue) {
      throw new Error(
        `Clipboard contains no value for cell ${cellReference}.`
      );
    }

    return normalisedValue;
  }
}