import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import AxeBuilder from '@axe-core/playwright';

test('content is preserved and all local media loads', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Extraordinary growth.');
  await expect(page.locator('.service-card')).toHaveCount(9);
  await expect(page.locator('.case-card')).toHaveCount(3);
  await expect(page.locator('.faq-item')).toHaveCount(5);
  const original = parseHTML(readFileSync('docs/source-snapshot.html', 'utf8')).document;
  const selectors = ['.service-card p', '.service-features li', '.case-content p', '.result-value', '.result-label', '.process-step p', '.faq-answer', '.testimonial-text', '.author-info', '.award-title', '.award-badge p', '#about p'];
  const sourceText = selectors.flatMap(selector => [...original.querySelectorAll(selector)].map(node => node.textContent.replaceAll('"', '').replace(/\s+/g, ' ').trim()));
  const currentText = await page.locator('body').evaluate(node => node.textContent.replaceAll('"', '').replace(/\s+/g, ' ').trim());
  for (const text of sourceText) expect(currentText).toContain(text);
  for (const image of await page.locator('img').all()) {
    if (!(await image.isVisible())) {
      const response = await page.request.get(await image.getAttribute('src'));
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toMatch(/^image\//);
      continue;
    }
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('service filtering, expansion and enquiry preselection work', async ({ page }) => {
  await page.goto('/#services');
  await page.locator('[data-filter="create"]').click();
  await expect(page.locator('.service-card:visible')).toHaveCount(1);
  await page.locator('#content-creation summary').click();
  await expect(page.locator('#content-creation .service-body')).toBeVisible();
  await page.locator('#content-creation [data-service]').click();
  await expect(page.locator('[name="service"]')).toHaveValue('content');
  await page.locator('[data-filter="all"]').click();
  await expect(page.locator('.service-card:visible')).toHaveCount(9);
});

test('language selection persists and translates content', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-lang="zh"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('h1')).toContainText('非凡增长');
  await page.reload();
  await expect(page.locator('[data-lang="zh"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#kol-marketing summary').click();
  await expect(page.locator('#kol-marketing .service-body')).toContainText('战略性KOL选择和审查');
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('FAQs and testimonials are keyboard accessible', async ({ page }) => {
  await page.goto('/#faq');
  const question = page.locator('.faq-item summary').first();
  await question.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq-answer').first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq-answer').first()).not.toBeVisible();
  await page.locator('#quote-next').click();
  await expect(page.locator('.testimonial-card:visible')).toContainText('Chen Liu');
  await page.locator('#quote-prev').click();
  await expect(page.locator('.testimonial-card:visible')).toContainText('Stefan Lin');
});

test('enquiry validates required fields and never claims delivery', async ({ page }) => {
  await page.goto('/#contact');
  await page.locator('.submit-btn').click();
  expect(await page.locator('#contact-name').evaluate(input => input.validity.valueMissing)).toBe(true);
  await expect(page.locator('#form-status')).toBeEmpty();
  await page.getByLabel('Name *', { exact: true }).fill('Sparz Test');
  await page.getByLabel('Email *', { exact: true }).fill('test@example.com');
  await page.getByLabel('Message *', { exact: true }).fill('Test only. Nothing should be submitted to a server.');
  await page.locator('.submit-btn').click();
  await expect(page.locator('#form-status')).toContainText('it has not been sent');
  await expect(page.locator('#form-status a')).toHaveAttribute('href', /^mailto:contactus@sparzmkt.com\?/);
  await expect(page.getByLabel('Name *', { exact: true })).toHaveValue('Sparz Test');
});

test('reduced motion, mobile menu and narrow layouts work', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/motion-paused/);
  await expect(page.locator('.hero-spark')).toHaveCSS('animation-name', 'none');
  if (isMobile) {
    await page.locator('.menu-toggle').click();
    await expect(page.locator('#main-nav')).toBeVisible();
    await page.locator('#main-nav a[href="#cases"]').click();
    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('legacy service routes open the corresponding detail', async ({ page, request }) => {
  await page.goto('/seo-services-singapore');
  await expect(page.locator('#seo-services')).toHaveAttribute('open', '');
  const health = await request.get('/health');
  expect(await health.json()).toEqual({ status: 'ok', app: 'Sparz' });
  expect((await request.get('/.git/config')).status()).toBe(404);
  expect((await request.get('/missing-file.png')).status()).toBe(404);
  expect((await request.post('/')).status()).toBe(405);
});

test('content remains accessible without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#kol-marketing summary').click();
  await expect(page.locator('#kol-marketing .service-body')).toBeVisible();
  await expect(page.locator('a[href="mailto:contactus@sparzmkt.com"]').first()).toBeVisible();
  await context.close();
});

test('expanded English and Chinese content passes automated accessibility checks', async ({ page }) => {
  await page.goto('/');
  await page.locator('details').evaluateAll(elements => elements.forEach(element => { element.open = true; }));
  for (const language of ['en', 'zh']) {
    await page.locator(`[data-lang="${language}"]`).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('unavailable source pages explain their status without fabricated content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('wasn’t available on the original Sparz website');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
