# Excel Online TODAY Function Test

## Overview

This solution automates the verification of the Excel Online `TODAY()` function using Playwright and TypeScript.

The test:

1. Opens a prepared Excel Online workbook.
2. Selects cell `A2`.
3. Enters the `TODAY()` formula.
4. Reads the calculated value.
5. Verifies that the returned date matches the current date in the configured time zone.

---

# Authentication

Before running the test, a local Playwright authentication state must be generated.

Run:

```powershell
npx playwright codegen --channel=chrome --save-storage="playwright\.auth\user.json" "https://www.office.com/launch/excel"
```

After the browser opens:

1. Sign in manually.
2. Open Excel Online.
3. Open the workbook that will be used for testing.
4. Close the browser window.

This creates:

```text
playwright/.auth/user.json
```

The solution intentionally uses Playwright Storage State instead of automating the Microsoft sign-in flow.

This approach was chosen because different users and organisations may require different authentication mechanisms, including:

- Multi-Factor Authentication (MFA)
- Microsoft Authenticator
- Passkeys
- Security Keys
- Organisation-specific authentication policies

Using a stored authenticated session makes the Excel test more stable and ensures the test focuses on Excel functionality rather than Microsoft authentication.

---

# Workbook Configuration

Open the `.env` file and provide the workbook URL:

```env
EXCEL_WORKBOOK_URL=
```

To obtain the URL:

1. Open your Excel Online workbook.
2. Copy the workbook URL from the browser.
3. Paste it into:

```env
EXCEL_WORKBOOK_URL=<your workbook URL>
```

This allows the same automation to run against any workbook without changing the test code.

---

# Running the Test

Execute:

```powershell
npm run test:headed
```

The test will:

- Open Excel Online.
- Navigate to the configured workbook.
- Select cell `A2`.
- Enter the TODAY formula.
- Verify that the returned value matches the current date.

---

# Viewing the Results

After execution:

```powershell
npx playwright show-report
```

The Playwright report includes:

- Test results
- Screenshots
- Videos
- Execution traces
- Detailed failure information

This simplifies troubleshooting and analysis when issues occur.

---

# Known Limitations

## Authentication State

The solution relies on a previously generated authentication session stored in:

```text
playwright/.auth/user.json
```

If the session expires:

1. Delete the existing file.
2. Generate a new authentication state using the procedure described in the Authentication section.

---

## Excel Online Canvas Rendering

Excel Online renders worksheet cells inside a canvas.

As a result:

- Traditional DOM locators for cells such as `A1` or `A2` are not available.
- Standard Playwright cell locators cannot be used reliably.

To address this limitation, the implementation uses Excel controls such as:

- Name Box
- Formula Bar

instead of attempting to locate worksheet cells directly.

---

# Alternative Approaches

An alternative implementation could automate Microsoft authentication using a dedicated test account and a Playwright authentication setup project.

However, because Microsoft authentication commonly involves MFA, Authenticator applications, passkeys, and organisation-specific security requirements, a reusable authenticated Playwright session was considered the more stable and maintainable solution for this exercise.

---

# Tech Stack

- Playwright
- TypeScript
- Excel Online (Microsoft 365)
- Playwright Storage State Authentication

---

# Commands

Generate authentication state:

```powershell
npx playwright codegen -