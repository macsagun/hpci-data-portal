import { test, expect, type Page } from "@playwright/test";

// Full workflow walkthrough against a real (test) database. Tests run in
// order and share one page/session — later tests depend on state left by
// earlier ones (e.g. approving a report that an earlier test submitted).
// The database is reset to a known state (9 seeded churches, no
// submissions) by tests/global-setup.ts before this file runs.

const ADMIN_PASSPHRASE = process.env.HPCI_ADMIN_PASSPHRASE ?? "hpci-pastors-2026";
const CHURCH = "HPCI North Caloocan";

test.describe.serial("submission + approval workflow", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("root redirects to /submit", async () => {
    await page.goto("/");
    await page.waitForURL("**/submit");
    await expect(page.locator("h1")).toContainText("Submit your monthly report");
  });

  test("submits a guided-form report for a new church+month", async () => {
    await page.selectOption("select >> nth=0", { label: CHURCH });
    await page.selectOption("select >> nth=1", { label: "June" });
    await page.selectOption("select >> nth=2", { value: "2026" });
    await expect(page.getByText("Sunday-by-Sunday")).toBeVisible();

    const regularsInputs = page.locator("input[placeholder='0']");
    await regularsInputs.nth(0).fill("120");
    await regularsInputs.nth(1).fill("8");
    await regularsInputs.nth(2).fill("45000");
    await page.locator("input[placeholder='e.g. Rooted and Established']").first().fill("Rooted and Established");
    await page.locator("input[placeholder='e.g. Ptr. Grace Lim']").first().fill("Ptr. Grace Lim");
    await page.fill("textarea[placeholder='What did God do this month?']", "12 new believers this month.");
    await page.fill(
      "textarea[placeholder='What do you need prayer or help with?']",
      "Need more volunteers for kids ministry."
    );

    await page.click("button:has-text('Submit to leadership')");
    await expect(page.getByText("Sent for approval")).toBeVisible({ timeout: 10_000 });
  });

  test("passphrase gate rejects a wrong passphrase and accepts the real one", async () => {
    await page.goto("/dashboard");
    await expect(page.getByText("Admin access only")).toBeVisible();

    await page.fill("input[placeholder='Passphrase']", "definitely-wrong");
    await page.click("button:has-text('Unlock dashboard')");
    await expect(page.getByText("Incorrect passphrase")).toBeVisible();

    await page.fill("input[placeholder='Passphrase']", ADMIN_PASSPHRASE);
    await page.click("button:has-text('Unlock dashboard')");
    await page.waitForURL("**/dashboard/overview", { timeout: 10_000 });
  });

  test("approves the new report from the Approvals tab", async () => {
    await page.click("a:has-text('Approvals')");
    await page.waitForURL("**/dashboard/approvals");
    await expect(page.getByText(CHURCH)).toBeVisible();
    await expect(page.getByText("✦ New report")).toBeVisible();

    await page.click("button:has-text('Approve & save')");
    await expect(page.getByText("All caught up")).toBeVisible({ timeout: 10_000 });
  });

  test("overview reflects the approved submission", async () => {
    await page.click("a:has-text('Overview')");
    await page.waitForURL("**/dashboard/overview");
    const row = page.locator("tr", { hasText: CHURCH });
    await expect(row).toContainText("Submitted");
  });

  test("trends page renders with data", async () => {
    await page.click("a:has-text('Trends')");
    await page.waitForURL("**/dashboard/trends");
    await expect(page.getByText("Network Sunday Attendance")).toBeVisible();
  });

  test("church detail shows the submitted week and notes", async () => {
    await page.click("a:has-text('Overview')");
    await page.waitForURL("**/dashboard/overview");
    await page.click(`a:has-text('${CHURCH}')`);
    await expect(page.getByText("Back to all churches")).toBeVisible();
    await expect(page.locator("h1")).toContainText(CHURCH);
    await expect(page.getByText("Rooted and Established")).toBeVisible();
    await expect(page.getByText("12 new believers this month.")).toBeVisible();
  });

  test("duplicate-month submission shows the banner and prefills on request", async () => {
    await page.goto("/submit");
    await page.selectOption("select >> nth=0", { label: CHURCH });
    await page.selectOption("select >> nth=1", { label: "June" });
    await page.selectOption("select >> nth=2", { value: "2026" });
    await expect(page.getByText("A report for June 2026 is already on file")).toBeVisible({ timeout: 10_000 });

    await page.click("button:has-text('Load & edit it')");
    await expect(page.locator("input[placeholder='0']").first()).toHaveValue("120");

    await page.locator("input[placeholder='0']").first().fill("150");
    await page.click("button:has-text('Submit changes for approval')");
    await expect(page.getByText("Sent for approval")).toBeVisible({ timeout: 10_000 });
  });

  test("rejecting a pending change leaves the live record untouched", async () => {
    await page.goto("/dashboard/approvals");
    await expect(page.getByText("↻ Change requested")).toBeVisible();

    await page.click("button:has-text('Reject')");
    await expect(page.getByText("All caught up")).toBeVisible({ timeout: 10_000 });

    await page.goto(`/dashboard/church/${encodeURIComponent(CHURCH)}`);
    await expect(page.getByText("Back to all churches")).toBeVisible();
    await expect(page.getByText("120")).toBeVisible();
  });

  test("CSV sample upload parses, previews, and submits", async () => {
    await page.goto("/submit");
    await page.click("button:has-text('Upload a CSV instead')");
    await page.click("button:has-text('Try a filled sample file')");
    await expect(page.getByText("Looks good — review before submitting")).toBeVisible({ timeout: 10_000 });

    await page.click("button:has-text('Submit to leadership')");
    await expect(page.getByText("Sent for approval")).toBeVisible({ timeout: 10_000 });
  });

  test("audit log records the approve and reject actions", async () => {
    await page.goto("/dashboard/audit");
    await expect(page.getByText("✓ Approved")).toBeVisible();
    await expect(page.getByText("✕ Rejected")).toBeVisible();
  });

  test("Lock re-shows the passphrase gate, even on a hard reload", async () => {
    await page.goto("/dashboard/overview");
    await page.click("button:has-text('Lock')");
    await page.waitForURL("**/submit");

    await page.goto("/dashboard");
    await expect(page.getByText("Admin access only")).toBeVisible();
  });
});
