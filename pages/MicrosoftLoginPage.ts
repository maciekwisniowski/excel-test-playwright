import { expect, Locator, Page } from '@playwright/test';

export class MicrosoftLoginPage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly nextButton: Locator;
  private readonly signInButton: Locator;
  private readonly staySignedInYesButton: Locator;

  public constructor(private readonly page: Page) {
    this.emailInput = page.getByRole('textbox', {
      name: /email|phone|skype/i,
    });

    this.passwordInput = page.getByLabel(/password/i);

    this.nextButton = page.getByRole('button', {
      name: /next/i,
    });

    this.signInButton = page.getByRole('button', {
      name: /sign in/i,
    });

    this.staySignedInYesButton = page.getByRole('button', {
      name: /yes/i,
    });
  }

  public async open(): Promise<void> {
    await this.page.goto('https://excel.office.com/', {
      waitUntil: 'domcontentloaded',
    });
  }

  public async login(
    username: string,
    password: string
  ): Promise<void> {
    await expect(this.emailInput).toBeVisible();

    await this.emailInput.fill(username);
    await this.nextButton.click();

    await expect(this.passwordInput).toBeVisible();

    await this.passwordInput.fill(password);
    await this.signInButton.click();

    await this.handleStaySignedInPrompt();
  }

  public async waitForSuccessfulLogin(): Promise<void> {
    await expect(this.emailInput).toBeHidden({
      timeout: 30_000,
    });

    await this.page.waitForLoadState('domcontentloaded');
  }

  private async handleStaySignedInPrompt(): Promise<void> {
    const isPromptVisible = await this.staySignedInYesButton
      .isVisible({
        timeout: 5_000,
      })
      .catch(() => false);

    if (isPromptVisible) {
      await this.staySignedInYesButton.click();
    }
  }
}