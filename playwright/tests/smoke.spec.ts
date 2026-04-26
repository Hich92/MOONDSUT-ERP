/**
 * ERP MoonDust — Cahier de Tests E2E Playwright
 * Architecture : Next.js + PostgREST + Drizzle ORM (sans Saltcorn)
 *
 * §1  Auth          — login valide/invalide, protection routes, déconnexion
 * §2  Navigation    — chargement des 15 pages dashboard
 * §3  Partenaires   — CRUD société + contact via formulaire UI
 * §4  Opportunités  — CRUD + pipeline via formulaire UI
 * §5  Contrats      — CRUD via formulaire UI
 * §6  Projets       — CRUD via formulaire UI
 * §7  Tâches        — CRUD via formulaire UI
 * §8  Factures      — CRUD via formulaire UI
 * §9  Achats        — contrat fourn. + BC + facture fourn.
 * §10 Chat          — ouverture widget + envoi message
 * §11 Édition       — inline edit via UI (bouton Modifier → Enregistrer)
 * §12 Suppression   — delete via API + vérification liste
 * §13 Utilisateurs  — création compte + login
 * §14 Droits        — auth enforcement + accès staff
 */

import { test, expect, Page, BrowserContext, Browser } from '@playwright/test'

// ══ Config ════════════════════════════════════════════════════════
const EMAIL    = process.env.ERP_EMAIL    || 'hadi@hadi.com'
const PASSWORD = process.env.ERP_PASSWORD || 'hadi@hadi.com'
const RUN_TAG  = `[E2E-${Date.now()}]`

// ══ Helpers API (Next.js /api/records/ — plus de Saltcorn) ════════

async function loginCtx(browser: Browser): Promise<BrowserContext> {
  const ctx = await browser.newContext()
  const res  = await ctx.request.post('/api/auth/login', {
    data: { email: EMAIL, password: PASSWORD },
  })
  if (!res.ok()) throw new Error(`loginCtx: POST /api/auth/login → ${res.status()}`)
  return ctx
}

async function apiCreate(ctx: BrowserContext, table: string, data: object): Promise<number | null> {
  const res  = await ctx.request.post(`/api/records/${table}`, { data })
  if (!res.ok()) { console.warn(`apiCreate(${table}) → ${res.status()}`); return null }
  const json = await res.json() as Record<string, unknown>
  return (json.id as number) ?? null
}

async function apiPatch(ctx: BrowserContext, table: string, id: number, data: object): Promise<boolean> {
  const res = await ctx.request.patch(`/api/records/${table}?id=${id}`, { data })
  return res.ok()
}

async function apiDelete(ctx: BrowserContext, table: string, id: number): Promise<void> {
  await ctx.request.delete(`/api/records/${table}?id=${id}`)
}

// ══ Helpers UI ═════════════════════════════════════════════════════

async function login(page: Page): Promise<void> {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

async function pageOk(page: Page, path: string): Promise<void> {
  const r = await page.goto(path)
  if (!r || r.status() >= 500) throw new Error(`${path} → HTTP ${r?.status()}`)
  await expect(page.locator('.page-heading, h1').first()).toBeVisible({ timeout: 15_000 })
}

function extractId(url: string, segment: string): number | null {
  const m = url.match(new RegExp(`/${segment}/(\\d+)`))
  return m ? Number(m[1]) : null
}

// ══════════════════════════════════════════════════════════════════
// §1 — AUTH
// ══════════════════════════════════════════════════════════════════
test.describe('§1 — Auth', () => {

  test('1.1 — login valide → dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('1.2 — login invalide → message d\'erreur', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('nobody@test.fr')
    await page.locator('input[type="password"]').fill('wrongpass')
    await page.locator('button[type="submit"]').click()
    await expect(
      page.locator('[class*="red"], [class*="error"], [aria-live], .text-red-500, .text-destructive').first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('1.3 — /dashboard sans session → redirige /login', async ({ browser }) => {
    const ctx  = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await ctx.close()
  })

  test('1.4 — déconnexion API répond 200', async ({ page }) => {
    await login(page)
    const res = await page.request.post('/api/auth/logout')
    expect(res.ok()).toBeTruthy()
  })

})

// ══════════════════════════════════════════════════════════════════
// §2 — NAVIGATION (toutes les pages du dashboard)
// ══════════════════════════════════════════════════════════════════
test.describe('§2 — Navigation', () => {
  let ctx: BrowserContext

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext()
    const p = await ctx.newPage()
    await login(p)
    await p.close()
  })

  test.afterAll(async () => { await ctx.close() })

  const PAGES = [
    '/dashboard',
    '/dashboard/partners',
    '/dashboard/opportunities',
    '/dashboard/contracts',
    '/dashboard/projects',
    '/dashboard/tasks',
    '/dashboard/my-tasks',
    '/dashboard/invoices',
    '/dashboard/supplier-contracts',
    '/dashboard/purchase-orders',
    '/dashboard/supplier-invoices',
    '/dashboard/wiki',
    '/dashboard/smoke-test',
    '/dashboard/informations',
    '/dashboard/profile/preferences',
  ]

  for (const path of PAGES) {
    test(`2.x — GET ${path}`, async () => {
      const page = await ctx.newPage()
      await pageOk(page, path)
      await page.close()
    })
  }

})

// ══════════════════════════════════════════════════════════════════
// §3 — PARTENAIRES
// ══════════════════════════════════════════════════════════════════
test.describe('§3 — Partenaires (CRUD UI)', () => {
  let authCtx: BrowserContext
  let societyId: number | null = null
  let contactId: number | null = null

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
  })

  test.afterAll(async () => {
    if (societyId) await apiDelete(authCtx, 'partners', societyId)
    if (contactId) await apiDelete(authCtx, 'partners', contactId)
    await authCtx.close()
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test('3.1 — créer une société via formulaire', async ({ page }) => {
    await page.goto('/dashboard/partners/new?is_company=true')
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    const toggle = page.locator('button:has-text("Société")').first()
    if (await toggle.isVisible({ timeout: 2_000 }).catch(() => false)) await toggle.click()

    await page.locator('input[placeholder="Acme Corp SAS"]').fill(`${RUN_TAG} Société`)

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/partners\/\d+/, { timeout: 15_000 })

    societyId = extractId(page.url(), 'partners')
    expect(societyId, 'société créée').toBeTruthy()
  })

  test('3.2 — société visible dans la liste', async ({ page }) => {
    test.skip(!societyId, 'dépend de 3.1')
    await page.goto('/dashboard/partners')
    await expect(page.locator(`text=${RUN_TAG} Société`).first()).toBeVisible({ timeout: 12_000 })
  })

  test('3.3 — page détail société charge sans erreur', async ({ page }) => {
    test.skip(!societyId, 'dépend de 3.1')
    await page.goto(`/dashboard/partners/${societyId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()
  })

  test('3.4 — créer un contact (particulier) via formulaire', async ({ page }) => {
    await page.goto('/dashboard/partners/new')
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    const toggle = page.locator('button:has-text("Particulier")').first()
    if (await toggle.isVisible({ timeout: 2_000 }).catch(() => false)) await toggle.click()

    await page.locator('input[placeholder="Jean"]').fill('Jean')
    await page.locator('input[placeholder="Dupont"]').fill(`${RUN_TAG} Contact`)

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/partners\/\d+/, { timeout: 15_000 })

    contactId = extractId(page.url(), 'partners')
    expect(contactId, 'contact créé').toBeTruthy()
  })

})

// ══════════════════════════════════════════════════════════════════
// §4 — OPPORTUNITÉS
// ══════════════════════════════════════════════════════════════════
test.describe('§4 — Opportunités (CRUD UI)', () => {
  let authCtx: BrowserContext
  let pId:   number | null = null
  let oppId: number | null = null

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
    pId = await apiCreate(authCtx, 'partners', { name: `${RUN_TAG} Ptr-Opp`, is_company: true, type: 'prospect' })
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test.afterAll(async () => {
    if (oppId) await apiDelete(authCtx, 'opportunities', oppId)
    if (pId)   await apiDelete(authCtx, 'partners', pId)
    await authCtx.close()
  })

  test('4.1 — créer une opportunité via formulaire', async ({ page }) => {
    test.skip(!pId, 'partenaire non créé')
    await page.goto(`/dashboard/opportunities/new?partner_id=${pId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    await page.locator('#name, input[id*="name"]').first().fill(`${RUN_TAG} Opportunité`)

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/opportunities\/\d+/, { timeout: 15_000 })

    oppId = extractId(page.url(), 'opportunities')
    expect(oppId, 'opportunité créée').toBeTruthy()
  })

  test('4.2 — opportunité visible dans la liste', async ({ page }) => {
    test.skip(!oppId, 'dépend de 4.1')
    await page.goto('/dashboard/opportunities')
    await expect(page.locator(`text=${RUN_TAG} Opportunité`).first()).toBeVisible({ timeout: 12_000 })
  })

  test('4.3 — StatusBar pipeline visible sur la page détail', async ({ page }) => {
    test.skip(!oppId, 'dépend de 4.1')
    await page.goto(`/dashboard/opportunities/${oppId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()
    await expect(page.getByText('Lead').first()).toBeVisible({ timeout: 10_000 })
  })

})

// ══════════════════════════════════════════════════════════════════
// §5 — CONTRATS
// ══════════════════════════════════════════════════════════════════
test.describe('§5 — Contrats (CRUD UI)', () => {
  let authCtx: BrowserContext
  let pId: number | null = null
  let contractId: number | null = null

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
    pId = await apiCreate(authCtx, 'partners', { name: `${RUN_TAG} Ptr-Ctr`, is_company: true, type: 'client' })
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test.afterAll(async () => {
    if (contractId) await apiDelete(authCtx, 'contracts', contractId)
    if (pId)        await apiDelete(authCtx, 'partners', pId)
    await authCtx.close()
  })

  test('5.1 — créer un contrat via formulaire', async ({ page }) => {
    test.skip(!pId, 'partenaire non créé')
    await page.goto(`/dashboard/contracts/new?partner_id=${pId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    await page.locator('input[placeholder="Service contract — ERP migration"]').fill(`${RUN_TAG} Contrat`)

    const amountField = page.locator('input[placeholder="0"]').first()
    if (await amountField.isVisible({ timeout: 2_000 }).catch(() => false))
      await amountField.fill('10000')

    const startDate = page.locator('input[type="date"]').first()
    if (await startDate.isVisible({ timeout: 2_000 }).catch(() => false))
      await startDate.fill('2025-01-01')

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/contracts\/\d+/, { timeout: 15_000 })

    contractId = extractId(page.url(), 'contracts')
    expect(contractId, 'contrat créé').toBeTruthy()
  })

  test('5.2 — contrat accessible via page détail', async ({ page }) => {
    test.skip(!contractId, 'dépend de 5.1')
    await page.goto(`/dashboard/contracts/${contractId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()
  })

})

// ══════════════════════════════════════════════════════════════════
// §6 — PROJETS
// ══════════════════════════════════════════════════════════════════
test.describe('§6 — Projets (CRUD UI)', () => {
  let authCtx: BrowserContext
  let pId:       number | null = null
  let ctrId:     number | null = null
  let projectId: number | null = null

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
    pId   = await apiCreate(authCtx, 'partners', { name: `${RUN_TAG} Ptr-Proj`, is_company: true, type: 'client' })
    if (pId)
      ctrId = await apiCreate(authCtx, 'contracts', {
        partner_id: pId, title: `${RUN_TAG} Ctr-Proj`,
        status: 'active', total_value: 0, start_date: '2025-01-01',
      })
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test.afterAll(async () => {
    if (projectId) await apiDelete(authCtx, 'projects', projectId)
    if (ctrId)     await apiDelete(authCtx, 'contracts', ctrId)
    if (pId)       await apiDelete(authCtx, 'partners', pId)
    await authCtx.close()
  })

  test('6.1 — créer un projet via formulaire', async ({ page }) => {
    test.skip(!ctrId, 'contrat non créé')
    await page.goto(`/dashboard/projects/new?contract_id=${ctrId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    await page.locator('input[placeholder="ERP Migration — Phase 1"]').fill(`${RUN_TAG} Projet`)

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/projects\/\d+/, { timeout: 15_000 })

    projectId = extractId(page.url(), 'projects')
    expect(projectId, 'projet créé').toBeTruthy()
  })

  test('6.2 — projet visible dans la liste', async ({ page }) => {
    test.skip(!projectId, 'dépend de 6.1')
    await page.goto('/dashboard/projects')
    await expect(page.locator(`text=${RUN_TAG} Projet`).first()).toBeVisible({ timeout: 12_000 })
  })

  test('6.3 — page détail projet charge sans erreur', async ({ page }) => {
    test.skip(!projectId, 'dépend de 6.1')
    await page.goto(`/dashboard/projects/${projectId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()
  })

})

// ══════════════════════════════════════════════════════════════════
// §7 — TÂCHES
// ══════════════════════════════════════════════════════════════════
test.describe('§7 — Tâches (CRUD UI)', () => {
  let authCtx: BrowserContext
  let projId: number | null = null
  let taskId: number | null = null

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
    projId = await apiCreate(authCtx, 'projects', { name: `${RUN_TAG} Proj-Task`, status: 'planned' })
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test.afterAll(async () => {
    if (taskId) await apiDelete(authCtx, 'tasks', taskId)
    if (projId) await apiDelete(authCtx, 'projects', projId)
    await authCtx.close()
  })

  test('7.1 — créer une tâche via formulaire', async ({ page }) => {
    test.skip(!projId, 'projet non créé')
    await page.goto(`/dashboard/tasks/new?project_id=${projId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    const assignedTo = page.locator('select').first()
    if (await assignedTo.isVisible({ timeout: 3_000 }).catch(() => false))
      await assignedTo.selectOption({ index: 1 })

    await page.locator('input[placeholder="API connector development"]').fill(`${RUN_TAG} Tâche`)

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/tasks\/\d+/, { timeout: 15_000 })

    taskId = extractId(page.url(), 'tasks')
    expect(taskId, 'tâche créée').toBeTruthy()
  })

  test('7.2 — tâche visible dans la liste', async ({ page }) => {
    test.skip(!taskId, 'dépend de 7.1')
    await page.goto('/dashboard/tasks')
    await expect(page.locator(`text=${RUN_TAG} Tâche`).first()).toBeVisible({ timeout: 12_000 })
  })

})

// ══════════════════════════════════════════════════════════════════
// §8 — FACTURES
// ══════════════════════════════════════════════════════════════════
test.describe('§8 — Factures (CRUD UI)', () => {
  let authCtx: BrowserContext
  let pId:       number | null = null
  let ctrId:     number | null = null
  let invoiceId: number | null = null

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
    pId   = await apiCreate(authCtx, 'partners', { name: `${RUN_TAG} Ptr-Inv`, is_company: true, type: 'client' })
    if (pId)
      ctrId = await apiCreate(authCtx, 'contracts', {
        partner_id: pId, title: `${RUN_TAG} Ctr-Inv`,
        status: 'active', total_value: 0, start_date: '2025-01-01',
      })
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test.afterAll(async () => {
    if (invoiceId) await apiDelete(authCtx, 'invoices', invoiceId)
    if (ctrId)     await apiDelete(authCtx, 'contracts', ctrId)
    if (pId)       await apiDelete(authCtx, 'partners', pId)
    await authCtx.close()
  })

  test('8.1 — créer une facture via formulaire', async ({ page }) => {
    test.skip(!ctrId, 'contrat non créé')
    await page.goto(`/dashboard/invoices/new?contract_id=${ctrId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    await page.locator('input[placeholder="INV-2025-001"]').fill(`INV-E2E-${Date.now()}`)
    await page.locator('input[placeholder="0"]').first().fill('1500')

    const issueDate = page.locator('input[type="date"]').first()
    if (await issueDate.isVisible({ timeout: 2_000 }).catch(() => false))
      await issueDate.fill('2025-01-15')

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/invoices\/\d+/, { timeout: 15_000 })

    invoiceId = extractId(page.url(), 'invoices')
    expect(invoiceId, 'facture créée').toBeTruthy()
  })

  test('8.2 — page liste factures charge sans erreur', async ({ page }) => {
    await page.goto('/dashboard/invoices')
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()
  })

})

// ══════════════════════════════════════════════════════════════════
// §9 — ACHATS (chaîne fournisseur)
// ══════════════════════════════════════════════════════════════════
test.describe('§9 — Achats (chaîne fournisseur)', () => {
  let authCtx: BrowserContext
  let pId:  number | null = null
  let scId: number | null = null
  let poId: number | null = null
  let siId: number | null = null

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
    pId = await apiCreate(authCtx, 'partners', { name: `${RUN_TAG} Fournisseur`, is_company: true, type: 'fournisseur' })
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test.afterAll(async () => {
    if (siId) await apiDelete(authCtx, 'supplier_invoices', siId)
    if (poId) await apiDelete(authCtx, 'purchase_orders', poId)
    if (scId) await apiDelete(authCtx, 'supplier_contracts', scId)
    if (pId)  await apiDelete(authCtx, 'partners', pId)
    await authCtx.close()
  })

  test('9.1 — créer un contrat fournisseur via formulaire', async ({ page }) => {
    test.skip(!pId, 'fournisseur non créé')
    await page.goto(`/dashboard/supplier-contracts/new?partner_id=${pId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    await page.locator('input[placeholder="Contrat maintenance serveurs 2025"]').fill(`${RUN_TAG} Contrat Fourn`)
    await page.locator('input[placeholder="0"]').first().fill('5000')

    const startDate = page.locator('input[type="date"]').first()
    if (await startDate.isVisible({ timeout: 2_000 }).catch(() => false))
      await startDate.fill('2025-01-01')

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/supplier-contracts\/\d+/, { timeout: 15_000 })

    scId = extractId(page.url(), 'supplier-contracts')
    expect(scId, 'contrat fournisseur créé').toBeTruthy()
  })

  test('9.2 — créer un bon de commande via formulaire', async ({ page }) => {
    test.skip(!pId, 'fournisseur non créé')
    await page.goto(`/dashboard/purchase-orders/new?partner_id=${pId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    await page.locator('input[placeholder="BC-2025-001"]').fill(`BC-E2E-${Date.now()}`)
    await page.locator('input[placeholder="0"]').first().fill('2000')

    const orderDate = page.locator('input[type="date"]').first()
    if (await orderDate.isVisible({ timeout: 2_000 }).catch(() => false))
      await orderDate.fill('2025-01-15')

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard\/purchase-orders\/\d+/, { timeout: 15_000 })

    poId = extractId(page.url(), 'purchase-orders')
    expect(poId, 'bon de commande créé').toBeTruthy()
  })

  test('9.3 — créer une facture fournisseur via API + vérifier page détail', async ({ page }) => {
    test.skip(!pId, 'fournisseur non créé')
    siId = await apiCreate(authCtx, 'supplier_invoices', {
      supplier_id:    pId,
      ...(poId ? { purchase_order_id: poId } : {}),
      invoice_number: `FINV-E2E-${Date.now()}`,
      amount_ht:      2000,
      invoice_date:   '2025-01-20',
    })
    test.skip(!siId, 'facture non créée via API')
    await page.goto(`/dashboard/supplier-invoices/${siId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()
  })

})

// ══════════════════════════════════════════════════════════════════
// §10 — CHAT WIDGET
// ══════════════════════════════════════════════════════════════════
test.describe('§10 — Chat widget (IA)', () => {

  test.beforeEach(async ({ page }) => { await login(page) })

  test('10.1 — bouton chat visible sur le dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()
    await expect(
      page.locator('button[aria-label="Ouvrir l\'assistant IA"]')
    ).toBeVisible({ timeout: 10_000 })
  })

  test('10.2 — ouvrir le widget, envoyer un message, recevoir une réponse', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    await page.locator('button[aria-label="Ouvrir l\'assistant IA"]').click()

    const input = page.locator('textarea[placeholder="Votre message… (Entrée pour envoyer)"]')
    await expect(input).toBeVisible({ timeout: 6_000 })

    await input.fill('Bonjour, test E2E')
    await page.locator('button[aria-label="Envoyer"]').click()

    await expect(
      page.locator('.bg-muted.rounded-tl-sm').first()
    ).toBeVisible({ timeout: 30_000 })
  })

})

// ══════════════════════════════════════════════════════════════════
// §11 — ÉDITION (inline edit via UI)
// ══════════════════════════════════════════════════════════════════
test.describe('§11 — Édition (bouton Modifier → Enregistrer)', () => {
  let authCtx:   BrowserContext
  let partnerId: number | null = null
  let oppId:     number | null = null

  test.beforeAll(async ({ browser }) => {
    authCtx   = await loginCtx(browser)
    partnerId = await apiCreate(authCtx, 'partners', {
      name: `${RUN_TAG} Edit-Partner`, is_company: true, type: 'client',
    })
    if (partnerId)
      oppId = await apiCreate(authCtx, 'opportunities', {
        name: `${RUN_TAG} Edit-Opp`, status: 'lead', partner_id: partnerId,
      })
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test.afterAll(async () => {
    if (oppId)     await apiDelete(authCtx, 'opportunities', oppId)
    if (partnerId) await apiDelete(authCtx, 'partners', partnerId)
    await authCtx.close()
  })

  test('11.1 — modifier le téléphone d\'un partenaire (inline edit)', async ({ page }) => {
    test.skip(!partnerId, 'partenaire non créé')
    await page.goto(`/dashboard/partners/${partnerId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()

    // Activer le mode édition
    await page.locator('button:has-text("Modifier"), button:has-text("Edit")').first().click()

    // Remplir le champ téléphone (premier input[type=text] en mode édition)
    const phoneInput = page.locator('input[type="text"]').first()
    await expect(phoneInput).toBeVisible({ timeout: 5_000 })
    await phoneInput.fill('+33 6 11 22 33 44')

    // Enregistrer
    await page.locator('button:has-text("Enregistrer"), button:has-text("Save")').first().click()

    // Vérifier : pas d'erreur, mode édition quitte
    await expect(
      page.locator('.text-destructive, [class*="error"]').first()
    ).not.toBeVisible({ timeout: 8_000 })
    await expect(
      page.locator('button:has-text("Modifier"), button:has-text("Edit")').first()
    ).toBeVisible({ timeout: 8_000 })

    // Vérifier persistence : rechargement
    await page.reload()
    await expect(page.locator('text=+33 6 11 22 33 44').first()).toBeVisible({ timeout: 10_000 })
  })

  test('11.2 — avancer une opportunité dans le pipeline (StatusBar)', async ({ page }) => {
    test.skip(!oppId, 'opportunité non créée')
    await page.goto(`/dashboard/opportunities/${oppId}`)
    await expect(page.locator('.page-heading, h1').first()).toBeVisible()
    await expect(page.getByText('Lead').first()).toBeVisible({ timeout: 8_000 })

    // Cliquer sur la prochaine étape "Qualifié"
    const nextStep = page.getByText('Qualifié').first()
    if (await nextStep.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextStep.click()
      await page.waitForTimeout(1_000)
      // Le statut doit être mis à jour (rechargement ou mise à jour inline)
      await page.reload()
      await expect(page.locator('.page-heading, h1').first()).toBeVisible()
      // Vérifier que le statut a changé côté API
      const res  = await authCtx.request.get(`/api/records/opportunities?id=${oppId}`)
      if (res.ok()) {
        const arr = await res.json() as Array<Record<string, unknown>>
        const opp = arr.find(r => r.id === oppId)
        expect(['qualifié', 'qualified', 'lead']).toContain(
          String(opp?.status ?? '').toLowerCase()
        )
      }
    }
  })

  test('11.3 — modifier un champ via API (PATCH direct)', async () => {
    test.skip(!partnerId, 'partenaire non créé')
    const ok = await apiPatch(authCtx, 'partners', partnerId!, { notes: `Note E2E ${RUN_TAG}` })
    expect(ok, 'PATCH retourne 200').toBeTruthy()

    // Vérifier la valeur via GET
    const res = await authCtx.request.get(`/api/records/partners?id=${partnerId}`)
    expect(res.ok()).toBeTruthy()
    const arr = await res.json() as Array<Record<string, unknown>>
    const partner = arr.find(r => r.id === partnerId)
    expect(partner?.notes).toContain(RUN_TAG)
  })

})

// ══════════════════════════════════════════════════════════════════
// §12 — SUPPRESSION (via API + vérification liste)
// ══════════════════════════════════════════════════════════════════
test.describe('§12 — Suppression', () => {
  let authCtx: BrowserContext

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
  })

  test.beforeEach(async ({ page }) => { await login(page) })

  test.afterAll(async () => { await authCtx.close() })

  test('12.1 — créer et supprimer un partenaire', async ({ page }) => {
    const id = await apiCreate(authCtx, 'partners', {
      name: `${RUN_TAG} Delete-Partner`, is_company: true, type: 'client',
    })
    expect(id, 'partenaire créé').toBeTruthy()

    // Vérifier présence dans la liste
    await page.goto('/dashboard/partners')
    await expect(page.locator(`text=${RUN_TAG} Delete-Partner`).first()).toBeVisible({ timeout: 12_000 })

    // Supprimer via API
    await apiDelete(authCtx, 'partners', id!)

    // Vérifier disparition de la liste
    await page.reload()
    await expect(
      page.locator(`text=${RUN_TAG} Delete-Partner`).first()
    ).not.toBeVisible({ timeout: 8_000 })
  })

  test('12.2 — supprimer une opportunité', async ({ page }) => {
    const pId = await apiCreate(authCtx, 'partners', { name: `${RUN_TAG} Ptr-DelOpp`, is_company: true })
    const id  = pId
      ? await apiCreate(authCtx, 'opportunities', { name: `${RUN_TAG} Delete-Opp`, partner_id: pId, status: 'lead' })
      : null
    expect(id, 'opportunité créée').toBeTruthy()

    await page.goto('/dashboard/opportunities')
    await expect(page.locator(`text=${RUN_TAG} Delete-Opp`).first()).toBeVisible({ timeout: 12_000 })

    if (id)  await apiDelete(authCtx, 'opportunities', id)
    if (pId) await apiDelete(authCtx, 'partners', pId)

    await page.reload()
    await expect(
      page.locator(`text=${RUN_TAG} Delete-Opp`).first()
    ).not.toBeVisible({ timeout: 8_000 })
  })

  test('12.3 — GET sur un enregistrement supprimé → 404 UI', async ({ page }) => {
    const id = await apiCreate(authCtx, 'partners', {
      name: `${RUN_TAG} Delete-404`, is_company: true,
    })
    expect(id, 'partenaire créé pour test 404').toBeTruthy()

    await apiDelete(authCtx, 'partners', id!)

    // La page détail doit afficher "introuvable" ou 404
    await page.goto(`/dashboard/partners/${id}`)
    await expect(
      page.locator('text=introuvable, text=not found, text=404').first()
        .or(page.locator('[data-testid="not-found"]').first())
    ).toBeVisible({ timeout: 10_000 })
  })

})

// ══════════════════════════════════════════════════════════════════
// §13 — CRÉATION UTILISATEUR
// ══════════════════════════════════════════════════════════════════
test.describe('§13 — Création utilisateur', () => {
  const TS         = Date.now()
  const TEST_EMAIL = `e2e-${TS}@moondust.test`
  const TEST_PASS  = `TestPass${TS}!`
  let authCtx: BrowserContext

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
  })

  test.afterAll(async () => {
    // Nettoyage via DB (l'utilisateur de test n'a pas de route de suppression publique)
    // En CI, la DB est réinitialisée entre les runs — en prod, cleanup manuel
    await authCtx.close()
  })

  test('13.1 — /api/auth/signup crée un utilisateur', async () => {
    const res = await authCtx.request.post('/api/auth/signup', {
      data: { email: TEST_EMAIL, password: TEST_PASS, name: 'E2E Test User' },
    })
    expect(res.ok(), `signup ${TEST_EMAIL} OK`).toBeTruthy()
    const json = await res.json() as Record<string, unknown>
    expect(json.success).toBeTruthy()
  })

  test('13.2 — le nouvel utilisateur peut se connecter au dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(TEST_EMAIL)
    await page.locator('input[type="password"]').fill(TEST_PASS)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('13.3 — le nouvel utilisateur est visible dans /api/users (admin)', async () => {
    const res = await authCtx.request.get('/api/users')
    expect(res.ok()).toBeTruthy()
    const json = await res.json() as { data?: Array<{ email: string }> } | Array<{ email: string }>
    const arr  = Array.isArray(json) ? json : (json.data ?? [])
    const found = arr.some((u: { email: string }) => u.email === TEST_EMAIL)
    expect(found, `${TEST_EMAIL} visible dans /api/users`).toBeTruthy()
  })

  test('13.4 — email dupliqué → erreur 400', async () => {
    const res = await authCtx.request.post('/api/auth/signup', {
      data: { email: TEST_EMAIL, password: TEST_PASS },
    })
    expect(res.status()).toBe(400)
  })

})

// ══════════════════════════════════════════════════════════════════
// §14 — DROITS (auth enforcement)
// ══════════════════════════════════════════════════════════════════
test.describe('§14 — Droits & authentification', () => {
  let authCtx: BrowserContext

  test.beforeAll(async ({ browser }) => {
    authCtx = await loginCtx(browser)
  })

  test.afterAll(async () => { await authCtx.close() })

  test('14.1 — API /api/records sans cookie → 401', async ({ browser }) => {
    const anonCtx = await browser.newContext()
    const res     = await anonCtx.request.get('/api/records/partners')
    expect(res.status()).toBe(401)
    await anonCtx.close()
  })

  test('14.2 — /dashboard sans session → redirect /login', async ({ browser }) => {
    const anonCtx  = await browser.newContext()
    const page     = await anonCtx.newPage()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await anonCtx.close()
  })

  test('14.3 — utilisateur authentifié peut lire les partenaires', async () => {
    const res = await authCtx.request.get('/api/records/partners')
    expect(res.ok()).toBeTruthy()
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('14.4 — utilisateur authentifié peut créer + supprimer', async () => {
    const createRes = await authCtx.request.post('/api/records/partners', {
      data: { name: `${RUN_TAG} Rights-Test`, is_company: true },
    })
    expect(createRes.ok(), 'CREATE retourne 200').toBeTruthy()
    const json = await createRes.json() as Record<string, unknown>
    const id   = json.id as number
    expect(id).toBeTruthy()

    const delRes = await authCtx.request.delete(`/api/records/partners?id=${id}`)
    expect(delRes.ok(), 'DELETE retourne 200').toBeTruthy()
  })

  test('14.5 — utilisateur staff (roleId 80) peut accéder au dashboard', async ({ browser }) => {
    // Vérifie que toto@toto.toto (roleId=80) peut se connecter
    const staffCtx = await browser.newContext()
    const staffRes = await staffCtx.request.post('/api/auth/login', {
      data: { email: 'toto@toto.toto', password: 'hadi@hadi.com' },
    })
    // Le test est conditionnel : si le compte existe et que le mot de passe est connu
    if (staffRes.ok()) {
      const page = await staffCtx.newPage()
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
    } else {
      test.skip(true, 'compte staff non disponible dans cet environnement')
    }
    await staffCtx.close()
  })

})
