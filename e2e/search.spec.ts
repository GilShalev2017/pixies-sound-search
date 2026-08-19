import { expect, test, type Page } from '@playwright/test';

/**
 * These specs drive the app the way a reviewer would: through roles and
 * accessible names only. If an assertion here passes, the flow is also
 * reachable by a screen reader.
 */

const searchBox = (page: Page) => page.getByRole('searchbox', { name: /search tracks/i });
const resultsList = (page: Page) => page.getByRole('list', { name: /search results for/i });
const resultButtons = (page: Page) => resultsList(page).getByRole('button');
const stage = (page: Page) => page.getByRole('region', { name: /now showing/i });
const recents = (page: Page) => page.getByRole('region', { name: /recent searches/i });
/** Scoped so Next.js's own route announcer (also role="alert") is never matched. */
const results = (page: Page) => page.locator('#search-results');

async function search(page: Page, term: string) {
  await searchBox(page).fill(term);
  await searchBox(page).press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('prompts for a search before anything is typed', async ({ page }) => {
  await expect(page.getByText(/start with a search/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
});

test('shows six results at a time and pages with the provider cursor', async ({ page }) => {
  await search(page, 'adele');

  await expect(resultButtons(page)).toHaveCount(6);
  await expect(page.getByText('Page 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();

  const firstPageTitle = await resultButtons(page).first().innerText();

  // Forward through every page: 23 mock results → 6 + 6 + 6 + 5.
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Page 2')).toBeVisible();
  await expect(resultButtons(page)).toHaveCount(6);
  await expect(resultButtons(page).first()).not.toHaveText(firstPageTitle);
  await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Page 3')).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Page 4')).toBeVisible();
  await expect(resultButtons(page)).toHaveCount(5);

  // No further cursor from the provider → Next must be disabled, not silently empty.
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

  // Previous walks back to the remembered cursor of the page before.
  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.getByText('Page 3')).toBeVisible();
  await expect(resultButtons(page)).toHaveCount(6);
});

test('rapid Next clicks cannot run the cursor past the data', async ({ page }) => {
  await search(page, 'adele');
  await expect(resultButtons(page)).toHaveCount(6);

  const next = page.getByRole('button', { name: 'Next' });
  await next.click();
  await next.click({ force: true, trial: false }).catch(() => undefined);
  await next.click({ force: true, trial: false }).catch(() => undefined);

  // At most one page advanced, and the page that is shown is fully loaded.
  await expect(page.getByText(/Page [23]/)).toBeVisible();
  await expect(resultButtons(page)).toHaveCount(6);
});

test('flies a result into the image stage, moves focus, and plays it', async ({ page }) => {
  await search(page, 'adele');

  const third = resultButtons(page).nth(2);
  const title = (await third.innerText()).split('\n')[0];
  await third.click();

  // The cover lands on the stage with its metadata.
  await expect(stage(page).getByText(title)).toBeVisible();
  await expect(stage(page).getByRole('img', { name: new RegExp(`artwork for`, 'i') })).toBeVisible();

  // Focus followed the flight to the play control.
  const play = stage(page).getByRole('button', { name: /^Play / });
  await expect(play).toBeFocused();

  // Clicking the central image embeds the player underneath it.
  await play.click();
  await expect(stage(page).locator('iframe')).toBeVisible();
  await expect(stage(page).getByText(/playing/i)).toBeVisible();
});

test('keeps the last five searches, without duplicates, across a reload', async ({ page }) => {
  // Six distinct terms: the oldest must fall off the end of the list.
  for (const term of ['adele', 'jazz', 'house', 'techno', 'ambient', 'dub']) {
    await search(page, term);
    await expect(recents(page).getByRole('button', { name: new RegExp(`^${term}$`, 'i') })).toBeVisible();
  }

  await expect(recents(page).getByRole('listitem')).toHaveCount(5);
  await expect(recents(page).getByRole('button', { name: /^adele$/i })).toHaveCount(0);

  // Re-searching an existing term moves it to the top instead of duplicating it.
  await search(page, 'jazz');
  await expect(recents(page).getByRole('button', { name: /^jazz$/i })).toHaveCount(1);

  await page.reload();

  const entries = recents(page).getByRole('listitem');
  await expect(entries).toHaveCount(5);
  await expect(entries.nth(0)).toContainText('jazz');
  await expect(entries.nth(1)).toContainText('dub');
  await expect(entries.nth(4)).toContainText('house');
});

test('clicking a recent search runs it again', async ({ page }) => {
  await search(page, 'adele');
  await search(page, 'jazz');
  await expect(resultButtons(page).first()).toContainText('Jazz');

  await recents(page).getByRole('button', { name: /^adele$/i }).click();

  await expect(searchBox(page)).toHaveValue('adele');
  await expect(resultButtons(page).first()).toContainText('Adele');
});

test('remembers the tile/list choice for the next visit', async ({ page }) => {
  await search(page, 'adele');
  await page.getByRole('button', { name: 'Tile view' }).click();
  await expect(page.getByRole('button', { name: 'Tile view' })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Tile view' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'List view' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
});

test('explains an empty result set and recovers from a failure', async ({ page }) => {
  await search(page, 'zzz nothing here');
  await expect(page.getByText(/no results for/i).first()).toBeVisible();
  await expect(page.getByRole('status')).toContainText(/no results/i);

  await search(page, 'boom');
  const alert = results(page).getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert.getByRole('button', { name: /try again/i })).toBeVisible();

  await alert.getByRole('button', { name: /try again/i }).click();
  await expect(results(page).getByRole('alert')).toBeVisible(); // the mock keeps failing — no dead page

  await search(page, 'adele');
  await expect(resultButtons(page)).toHaveCount(6);
  await expect(results(page).getByRole('alert')).toHaveCount(0);
});

test('a slow response for an abandoned term never overwrites the current results', async ({ page }) => {
  // Hold back the request for the half-typed term until well after the next one.
  await page.route('**/api/tracks/search**', async (route) => {
    const term = new URL(route.request().url()).searchParams.get('q') ?? '';
    if (term === 'ade') await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });

  await searchBox(page).pressSequentially('ade', { delay: 30 });
  await page.waitForTimeout(400); // let the debounce fire for "ade"
  await searchBox(page).pressSequentially('le', { delay: 30 });

  await expect(resultButtons(page)).toHaveCount(6);
  await expect(resultButtons(page).first()).toContainText('Adele');

  // Give the stale response time to land; it must be ignored.
  await page.waitForTimeout(2800);
  const titles = await resultButtons(page).allInnerTexts();
  expect(titles.every((text) => text.startsWith('Adele'))).toBe(true);
});

test('is operable from the keyboard alone', async ({ page }) => {
  await page.keyboard.press('/');
  await expect(searchBox(page)).toBeFocused();

  await page.keyboard.type('adele');
  await expect(resultButtons(page)).toHaveCount(6);

  // Tab from the input to the first result: clear button → Go → first result.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  await expect(stage(page).getByRole('button', { name: /^Play / })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(stage(page).locator('iframe')).toBeVisible();

  await searchBox(page).focus();
  await page.keyboard.press('Escape');
  await expect(searchBox(page)).toHaveValue('');
});
