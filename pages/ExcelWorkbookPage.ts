import {
  expect,
  FrameLocator,
  Locator,
  Page,
} from '@playwright/test';

export class ExcelWorkbookPage {
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
    console.log('Opening Excel Online workbook...');

    await this.page.goto(workbookUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    console.log(`Current URL: ${this.page.url()}`);

    await this.waitUntilReady();
  }

  public async waitUntilReady(): Promise<void> {
    console.log('Waiting for Excel iframe...');

    await expect(
      this.page.locator(
        'iframe[name^="WacFrame_Excel"]'
      )
    ).toBeVisible({
      timeout: 90_000,
    });

    console.log('Excel iframe found.');
    console.log('Waiting for worksheet canvas...');

    await expect(this.sheetCanvas).toBeVisible({
      timeout: 90_000,
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
          timeout: 90_000,
        }
      )
      .toBe(true);

    console.log('Excel worksheet canvas is ready.');
  }

  public async selectCell(
    cellReference: string
  ): Promise<void> {
    const normalisedCellReference =
      cellReference.trim().toUpperCase();

    console.log(
      `Selecting cell ${normalisedCellReference}...`
    );

    const nameBox = this.excelFrame
      .locator(
        'input[aria-label*="Name Box"], input[aria-label*="Nazwa"]'
      )
      .first();

    await expect(nameBox).toBeVisible({
      timeout: 30_000,
    });

    await nameBox.click();
    await nameBox.fill(normalisedCellReference);
    await nameBox.press('Enter');
    await this.page.waitForTimeout(1000);

    console.log(
      `Cell ${normalisedCellReference} selected.`
    );
  }
  public async enterFormula(): Promise<void> {
    const formula = '=TODAY()';

    console.log('Entering formula into A2...');

    await this.selectCell('A2');

    await this.page.keyboard.press('Delete');

    await this.page.waitForTimeout(500);

    const formulaBar = this.excelFrame
      .getByRole('textbox', {
        name: /formula bar/i,
      })
      .first();

    await expect(formulaBar).toBeVisible({
      timeout: 30_000,
    });

    await formulaBar.click();
    await formulaBar.press('ControlOrMeta+A');
    await formulaBar.press('Backspace');

    await formulaBar.pressSequentially(formula, {
      delay: 100,
    });

    console.log(`Formula entered: ${formula}`);

    await this.page.waitForTimeout(500);

    await formulaBar.press('Enter');

    console.log('Formula committed.');

    await this.page.waitForTimeout(2_000);
  }
  public async getSelectedCellDisplayedValue():
    Promise<string> {
    return this.getCellDisplayedValue('A2');
  }

  public async getCellDisplayedValue(
    cellReference: string
  ): Promise<string> {
    console.log(
      `Selecting ${cellReference} to read its value...`
    );

    await this.selectCell(cellReference);
    await this.page.evaluate(async () => {
      await navigator.clipboard.writeText('');
    });

    await this.page.keyboard.press('Control+C');

    await expect
      .poll(
        async () => {
          const clipboardValue =
            await this.page.evaluate(async () => {
              return navigator.clipboard.readText();
            });

          return clipboardValue.trim();
        },
        {
          message:
            `Waiting for the value of ${cellReference} ` +
            'to be copied to the clipboard.',
          timeout: 5_000,
        }
      )
      .not.toBe('');

    const clipboardValue =
      await this.page.evaluate(async () => {
        return navigator.clipboard.readText();
      });

    const normalisedValue = clipboardValue
      .replace(/\r?\n/g, '')
      .replace(/\t/g, '')
      .trim();

    if (!normalisedValue) {
      throw new Error(
        `Clipboard contains no value for cell ${cellReference}.`
      );
    }

    console.log(
      `Value copied from ${cellReference}: "${normalisedValue}"`
    );

    return normalisedValue;
  }

  public async clearCell(
    cellReference: string
  ): Promise<void> {
    console.log(`Clearing cell ${cellReference}...`);

    await this.selectCell(cellReference);

    await this.page.keyboard.press('Delete');

    console.log(
      `Cell ${cellReference} cleared.`
    );
  }
}
