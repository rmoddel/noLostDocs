import { test, expect } from '@playwright/test';

test.describe('NoLostDocs public homepage', () => {
  test('homepage has core crawlable content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /no more lost docs/i })).toBeVisible();
    await expect(page.getByText(/everything you need/i)).toBeVisible();

    const getStartedLink = page.getByRole('link', { name: /get started/i });
    const getStartedButton = page.getByRole('button', { name: /get started/i });
    await expect(getStartedLink.or(getStartedButton)).toBeVisible();
  });

  test('homepage includes document category examples', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/personal/i)).toBeVisible();
    await expect(page.getByText(/driving/i)).toBeVisible();
    await expect(page.getByText(/medical/i)).toBeVisible();
    await expect(page.getByText(/business/i)).toBeVisible();
  });

  test('security and disclaimer copy are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/documents you don’t want floating around|documents you don't want floating around/i)).toBeVisible();
    await expect(page.getByText(/acceptance of digital copies depends/i)).toBeVisible();
  });

  test('metadata is present', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NoLostDocs/);

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
  });
});
