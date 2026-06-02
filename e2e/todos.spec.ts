import { expect, test } from '@playwright/test'

/**
 * The one end-to-end journey: a fresh user signs up, manages a todo through the
 * full web → tRPC → Postgres stack, and signs out. A per-run unique email keeps
 * the shared dev `app` DB from accumulating fixture collisions.
 */
test('sign up, manage a todo, then sign out', async ({ page }) => {
  const stamp = Date.now()
  const email = `e2e-${stamp}@example.com`
  const todo = `Buy milk ${stamp}`

  await page.goto('/login')

  // Switch from the default sign-in view to sign-up and register.
  await page.getByRole('button', { name: 'Sign up' }).click()
  await page.getByPlaceholder('Name').fill('E2E User')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign up' }).click()

  // Authenticated → the todos page.
  await expect(page.getByRole('heading', { name: 'Todos' })).toBeVisible()

  // Create.
  await page.getByPlaceholder('What needs doing?').fill(todo)
  await page.getByRole('button', { name: 'Add' }).click()
  const item = page.getByText(todo)
  await expect(item).toBeVisible()

  // Toggle complete → the title gets struck through.
  await page.getByRole('button', { name: 'Toggle todo' }).click()
  await expect(item).toHaveClass(/line-through/)

  // Delete → the item is gone.
  await page.getByRole('button', { name: 'Delete todo' }).click()
  await expect(item).toHaveCount(0)

  // Sign out → back to the landing page.
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(
    page.getByRole('heading', { name: 'The to-do list that stays out of your way.' }),
  ).toBeVisible()
})
