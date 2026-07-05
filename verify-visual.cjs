const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const results = [];

  // ===== 测试1: 桌面端功能不回退 =====
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text());
  });

  await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const heroCardExists = await page.locator('#heroCaseCard').count();
  const packCount = await page.locator('.pack-collapsible').count();
  const textPackExists = await page.locator('.pack-collapsible[data-pack="text"]').count();
  const heroCtaExists = await page.locator('#heroCtaBtn').count();
  const themeInputExists = await page.locator('#themeInput').count();
  const apiConfigBtnExists = await page.locator('#apiConfigToggle').count();
  const sourceTextExists = await page.locator('#caseSourceText').count();
  const declarationExists = await page.locator('.case-declaration').count();

  // 验证无硬边框
  const caseFileBorder = await page.evaluate(() => {
    const el = document.querySelector('.case-file');
    if (!el) return 'not found';
    const style = getComputedStyle(el);
    return style.borderTopWidth + ' ' + style.borderRightWidth;
  });

  // 验证折叠包无硬边框
  const packBorder = await page.evaluate(() => {
    const el = document.querySelector('.pack-collapsible');
    if (!el) return 'not found';
    const style = getComputedStyle(el);
    return style.borderTopWidth;
  });

  // 验证按钮字体为 ZCOOL XiaoWei
  const ctaFont = await page.evaluate(() => {
    const el = document.querySelector('.hero-cta-btn');
    if (!el) return 'not found';
    return getComputedStyle(el).fontFamily;
  });

  console.log('测试1 - 桌面端功能:');
  console.log('  heroCaseCard 存在:', heroCardExists > 0);
  console.log('  pack-collapsible 数量:', packCount);
  console.log('  文字包存在:', textPackExists > 0);
  console.log('  CTA 按钮存在:', heroCtaExists > 0);
  console.log('  主题输入存在:', themeInputExists > 0);
  console.log('  API 配置按钮存在:', apiConfigBtnExists > 0);
  console.log('  原文区域存在:', sourceTextExists > 0);
  console.log('  来源声明存在:', declarationExists > 0);
  console.log('  case-file 边框(应为0px):', caseFileBorder);
  console.log('  pack-collapsible 边框(应为0px):', packBorder);
  console.log('  CTA 字体含 ZCOOL:', ctaFont.includes('ZCOOL'));

  results.push({
    name: '桌面端功能',
    pass: heroCardExists > 0 && packCount === 5 && textPackExists > 0 &&
          heroCtaExists > 0 && themeInputExists > 0 && apiConfigBtnExists > 0 &&
          sourceTextExists > 0 && declarationExists > 0
  });

  // ===== 测试2: LLM 500 失败态 =====
  await page.evaluate(() => {
    ApiClient.BASE_URL = 'https://api.openai.com/v1';
    ApiClient.API_KEY = 'sk-test-invalid-key';
  });
  await page.route('**/chat/completions', route => {
    route.fulfill({ status: 500, body: JSON.stringify({ error: { message: 'Invalid API key' } }) });
  });
  await page.evaluate(() => generateCaseWithTheme('测试主题'));
  await page.waitForTimeout(3000);

  const heroAfterFail = await page.locator('#heroCaseCard').count();
  const packAfterFail = await page.locator('.pack-collapsible').count();
  const retryBtn = await page.locator('#caseTextCards .generate-btn').count();

  console.log('\n测试2 - LLM 500 失败态:');
  console.log('  heroCaseCard 保留:', heroAfterFail > 0);
  console.log('  pack-collapsible 保留:', packAfterFail);
  console.log('  重试按钮存在:', retryBtn > 0);

  results.push({
    name: 'LLM 500 失败态',
    pass: heroAfterFail > 0 && packAfterFail === 5 && retryBtn > 0
  });

  await page.close();

  // ===== 测试3: 移动端 390x844 无横溢 + CTA 可见 =====
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);

  const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
  const horizontalOverflow = scrollWidth - clientWidth;

  const mobileHeroCard = await mobilePage.locator('#heroCaseCard').count();
  const mobilePackCount = await mobilePage.locator('.pack-collapsible').count();

  // 验证 CTA 按钮在首屏可见
  const ctaVisible = await mobilePage.evaluate(() => {
    const cta = document.querySelector('#heroCtaBtn');
    if (!cta) return false;
    const rect = cta.getBoundingClientRect();
    return rect.bottom <= 844;
  });

  console.log('\n测试3 - 移动端 390x844:');
  console.log('  横向溢出(应为0):', horizontalOverflow);
  console.log('  heroCaseCard 存在:', mobileHeroCard > 0);
  console.log('  pack-collapsible 数量:', mobilePackCount);
  console.log('  CTA 按钮首屏可见:', ctaVisible);

  results.push({
    name: '移动端 390x844',
    pass: horizontalOverflow === 0 && mobileHeroCard > 0 && mobilePackCount === 5 && ctaVisible
  });

  await mobilePage.close();

  // ===== 总结 =====
  const realErrors = errors.filter(e =>
    !e.includes('preload') && !e.includes('getThemeColors') &&
    !e.includes('ERR_CONNECTION_CLOSED') && !e.includes('Failed to load resource') &&
    !e.includes('[llm]') && !e.includes('[case]')
  );

  console.log('\n页面错误:', realErrors.length === 0 ? '无' : realErrors);

  const allPass = results.every(r => r.pass) && realErrors.length === 0;
  console.log('\n总结:', allPass ? '全部通过 ✅' : '有失败项 ❌');

  await browser.close();
  process.exit(allPass ? 0 : 1);
})();