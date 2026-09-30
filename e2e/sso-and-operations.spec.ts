import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

function credential(name: string) {
  const content = readFileSync(path.join(process.cwd(), "CREDENTIALS.local.txt"), "utf8");
  const section = content.split(`ATLAS SSO ${name}\n`)[1]?.split("\n\n")[0];
  const username = section?.match(/^username=(.+)$/m)?.[1];
  const password = section?.match(/^password=(.+)$/m)?.[1];
  if (!username || !password) throw new Error(`Kredensial E2E ${name} tidak ditemukan`);
  return { username, password };
}

test("SSO admin membuka panel admin, dashboard, fitur operasional, dan peta", async ({ page }) => {
  test.setTimeout(120_000);
  const admin = credential("admin");

  await page.goto("/login");
  await expect(page.getByRole("button", { name: /pengguna operasional/i })).toBeVisible();
  await page.getByRole("button", { name: /administrator atlas/i }).click();
  await expect(page).toHaveURL(/\/realms\/atlas\/protocol\/openid-connect\/auth/);
  await page.locator("#username").fill(admin.username);
  await page.locator("#password").fill(admin.password);
  await page.locator("#kc-login").click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /administration/i })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("SITUASI NASIONAL", { exact: true })).toBeVisible();
  await expect(page.getByText("EARLY WARNING", { exact: true })).toBeVisible();

  await page.goto("/resources");
  await expect(page.getByRole("heading", { name: /personel & alut/i })).toBeVisible();
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: /laporan/i })).toBeVisible();
  await page.goto("/my-access");
  await expect(page.getByRole("heading", { name: /akses saya/i })).toBeVisible();

  await page.goto("/kodam");
  await expect(page.getByRole("heading", { name: /data kotamaops/i })).toBeVisible();
  await page.getByRole("button", { name: /tambah kotamaops/i }).click();
  await expect(page.getByRole("heading", { name: /data satuan baru/i })).toBeVisible();
  await page.getByRole("button", { name: /tutup/i }).click();

  await page.goto("/map");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.getByRole("button", { name: "EXPORT PNG" })).toBeVisible();
  await expect(page.getByRole("button", { name: "EXPORT PPTX" })).toBeVisible();
  const pngDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "EXPORT PNG" }).click();
  await expect((await pngDownload).suggestedFilename()).toMatch(/atlas-peta-situasi-.+\.png$/);
  const pptxDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "EXPORT PPTX" }).click();
  await expect((await pptxDownload).suggestedFilename()).toMatch(/atlas-peta-situasi-.+\.pptx$/);
});
