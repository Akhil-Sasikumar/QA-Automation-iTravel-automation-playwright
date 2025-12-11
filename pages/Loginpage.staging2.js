export class LoginPageStaging2 {
  constructor(page) {
    this.page = page;

    // STAGING2 locators (same as SIT2)
    this.usernameField = '#username1';
    this.nextButton = 'button[ng-click="goNext(loginUserForm)"]';
    this.passwordField = '#password1';
    this.loginButton = 'button[ng-click="submit(loginPassForm)"]';
  }

  async gotoLogin(loginPath) {
    // loginPath comes from .env: STAGING2_LOGIN_URL
    await this.page.goto(loginPath);
  }

  async login(username, password) {
    // 1) Enter username
    await this.page.fill(this.usernameField, username);

    // 2) Click Next
    await this.page.click(this.nextButton);

    // 3) Enter password
    await this.page.fill(this.passwordField, password);

    // 4) Click Login and wait for full load
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.page.click(this.loginButton),
    ]);
  }
}
