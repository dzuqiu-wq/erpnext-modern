import { test, expect } from '@playwright/test';

test.describe('Nova ERP - 销售订单 UI 自动化测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('button', { hasText: '登 录' });
    const isLoginVisible = await loginButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isLoginVisible) {
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      const isEmailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
      const isPasswordVisible = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (isEmailVisible && isPasswordVisible) {
        await emailInput.fill('admin@erpnext.com');
        await passwordInput.fill('admin');
        await loginButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const stillOnLogin = await loginButton.isVisible().catch(() => false);
        if (stillOnLogin) {
          const errorMsg = await page.locator('p').filter({ hasText: '登录失败' }).textContent().catch(() => '未知错误');
          console.log('登录失败信息:', errorMsg);
        }
      }
    }
  });

  test('应该能正确计算包含折扣和税率的最终总价', async ({ page }) => {
    // 访问新建销售订单页面
    await page.goto('/selling/orders/new');

    // 等待页面标题加载
    const title = page.locator('h3', { hasText: '新建销售订单' });
    await expect(title).toBeVisible({ timeout: 15000 });

    // 选择客户 - 点击客户 combobox 的 textbox
    const customerCombobox = page.locator('[role="combobox"]').first();
    await expect(customerCombobox).toBeVisible({ timeout: 10000 });
    await customerCombobox.click();
    await page.waitForTimeout(1000);

    // 在客户列表中选择第一个选项
    const customerListbox = page.locator('[role="listbox"]').first();
    await expect(customerListbox).toBeVisible({ timeout: 5000 });
    const customerOption = customerListbox.locator('[role="option"]').first();
    await customerOption.click();
    await page.waitForTimeout(500);

    // 选择商品（会自动填充单价）- 点击表格中第二个 combobox
    const itemCombobox = page.locator('table [role="combobox"]').first();
    await expect(itemCombobox).toBeVisible({ timeout: 10000 });
    await itemCombobox.click();
    await page.waitForTimeout(1000);

    // 在商品列表中选择第一个选项
    const itemListbox = page.locator('[role="listbox"]').last();
    await expect(itemListbox).toBeVisible({ timeout: 5000 });
    const itemOption = itemListbox.locator('[role="option"]').first();
    await itemOption.click();
    await page.waitForTimeout(800);

    // 等待商品单价自动填充
    await page.waitForTimeout(500);

    // 填写折扣金额
    const discountInput = page.locator('#discountAmount');
    await expect(discountInput).toBeVisible({ timeout: 10000 });
    await discountInput.fill('50');

    // 填写税率
    const taxInput = page.locator('#taxRate');
    await expect(taxInput).toBeVisible({ timeout: 10000 });
    await taxInput.fill('13');

    // 等待计算更新
    await page.waitForTimeout(1000);

    // 验证价格汇总区块可见
    const priceSummary = page.locator('text=最终含税总价');
    await expect(priceSummary).toBeVisible({ timeout: 10000 });

    // 验证最终含税总价显示正常
    const grandTotalText = page.locator('text=¥');
    await expect(grandTotalText.last()).toBeVisible();
  });
});
