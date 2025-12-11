# Playwright Test Suite

**Project:** Playwright-based end-to-end tests for the target application.

**Quick summary:** This repository contains Playwright tests, helpers, page objects and scripts to run tests against different environments (sit/staging/etc.). Tests produce HTML reports, screenshots, and test-results artifacts.

**Prerequisites:**
- Node.js (v16+ recommended)
- npm (bundled with Node.js)

**Setup**

1. Install dependencies:

```powershell
npm install
```

2. (Optional) If you need to record authentication state, there is a helper script:

```powershell
node scripts\recordAuth.js
```

Note: files like `auth.sit1.json` and `auth-sit1.json` may contain authentication snapshots — do not commit secrets.

**Run tests**

- Run the full Playwright test suite:

```powershell
npx playwright test
```

- Run a single spec (example):

```powershell
npx playwright test tests\BookingandCancellation.spec.js
```

- The project also uses npm scripts. Example (as used in this workspace):

```powershell
npm run test:sit1 -- tests\BookingandCancellation.spec.js
```

**Reports & artifacts**
- HTML report is generated under `playwright-report/` (open `playwright-report\index.html`).
- Screenshots are saved in `Screenshots/`.
- Raw test-results may be found in `test-results/`.

**Project structure (high level)**
- `tests/` - test specs (e.g., `BookingandCancellation.spec.js`).
- `pages/` - page objects used by tests.
- `helpers/` - helper utilities and shared functions.
- `scripts/` - helper scripts such as `recordAuth.js`.

**Debugging & development tips**
- Run a single test while watching browser (headed) by setting Playwright options or use the CLI `--headed --debug` flags.
- If snapshots mismatch, update snapshots intentionally after review.
- When running on Windows PowerShell, use backslashes in paths or quote paths as needed.

**Contributing**
- Open an issue or create a PR with test or helper improvements.

**Contact / Next steps**
- If you want, I can:
  - run the test suite here and report failures,
  - add a short CONTRIBUTING.md with branching and test guidelines,
  - or include a short `Makefile` / `npm` scripts summary in this README.

---
Generated: README for local Playwright repo.
