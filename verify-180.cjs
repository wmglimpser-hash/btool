const { chromium } = require('playwright-core');

(async()=>{
  const browser = await chromium.launch({headless:true, executablePath:'../.pw-browsers/chromium-1228/chrome-win64/chrome.exe'});
  const results = [];
  const test = (name, cond, val) => results.push({name, pass:!!cond, val:String(val)});

  // 桌面 1440×900
  const ctx = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await ctx.newPage();
  let errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:8096/', {waitUntil:'networkidle'});
  await page.waitForTimeout(2500);

  // 1
  test('pageerror=0', errors.length===0, errors.length===0 ? '0' : errors.join(';'));

  // 2 hero-case-card
  const heroExists = await page.evaluate(()=>document.querySelector('.hero-case-card')!==null);
  const hasCover = await page.evaluate(()=>document.querySelector('.hero-cover')!==null);
  const hasSummary = await page.evaluate(()=>document.querySelector('.hero-summary')!==null);
  const hasThumbs = await page.evaluate(()=>document.querySelector('.hero-storyboard-thumbs')!==null);
  const hasCta = await page.evaluate(()=>document.querySelector('.hero-cta-btn')!==null);
  test('hero-case-card含封面+摘要+分镜+CTA', heroExists&&hasCover&&hasSummary&&hasThumbs&&hasCta,
    `hero=${heroExists},cover=${hasCover},summary=${hasSummary},thumbs=${hasThumbs},cta=${hasCta}`);

  // 2b 默认状态下案卷高度（折叠行全折叠）
  const caseHeightDefault = await page.evaluate(()=>document.querySelector('.case-file')?.offsetHeight || 0);
  const themeHeightDefault = await page.evaluate(()=>document.querySelector('.case-file-theme')?.offsetHeight || 0);
  const bodyOnlyDefault = caseHeightDefault - themeHeightDefault;
  test('默认案卷高度(不含主题)≤1150px', bodyOnlyDefault<=1150, `caseFile=${caseHeightDefault}px, bodyOnly=${bodyOnlyDefault}px, theme=${themeHeightDefault}px`);

  // 3 5个折叠行默认折叠
  const packCount = await page.evaluate(()=>document.querySelectorAll('.pack-collapsible').length);
  const allCollapsed = await page.evaluate(()=>
    Array.from(document.querySelectorAll('.pack-collapsible')).every(el=>!el.classList.contains('open'))
  );
  test('5个折叠行默认折叠', packCount===5&&allCollapsed, `count=${packCount}, allCollapsed=${allCollapsed}`);

  // 4 点击可展开
  const firstPackHeader = await page.$('.pack-collapsible-header');
  let firstExpanded = false;
  if(firstPackHeader){
    await firstPackHeader.click();
    await page.waitForTimeout(400);
    firstExpanded = await page.evaluate(()=>document.querySelector('.pack-collapsible')?.classList.contains('open'));
  }
  test('点击折叠行可展开', firstExpanded===true, `firstExpanded=${firstExpanded}`);

  // 5 CTA 展开全部
  await page.click('.hero-cta-btn');
  await page.waitForTimeout(600);
  const allExpanded = await page.evaluate(()=>
    Array.from(document.querySelectorAll('.pack-collapsible')).every(el=>el.classList.contains('open'))
  );
  test('CTA展开全部', allExpanded===true, `allExpanded=${allExpanded}`);

  // 6 场景切换
  await page.click('.scenario-tab[data-scenario="teacher"]');
  await page.waitForTimeout(300);
  const heroText = await page.evaluate(()=>document.getElementById('heroTextLabel')?.textContent || '');
  test('场景切换hero标题→课堂讲解', heroText.includes('课堂讲解'), `text=${heroText}`);

  // 7 无单卡示例数据标签（覆盖 case-card / case-preview-card / case-video-status / case-status-tag）
  const demoCount = await page.evaluate(()=>{
    const cards = document.querySelectorAll('.case-products .case-card, .case-products .case-preview-card, .case-products .case-video-status, .case-products .case-status-tag');
    let n = 0;
    cards.forEach(c => { const t=c.textContent; if(t.includes('示例') && t.length<60) n++; });
    return n;
  });
  test('无单卡示例数据标签', demoCount===0, `demoLabelsInProducts=${demoCount}`);

  // 8 底部apiStatus
  const apiText = await page.evaluate(()=>document.getElementById('apiStatus')?.textContent || '');
  test('底部apiStatus为示例数据', apiText.includes('示例数据'), apiText);

  // 9 展开后案卷高度（信息性，不计入pass/fail）
  const caseHeightExpanded = await page.evaluate(()=>document.querySelector('.case-file')?.offsetHeight || 0);
  const themeHeightExpanded = await page.evaluate(()=>document.querySelector('.case-file-theme')?.offsetHeight || 0);
  const bodyOnlyExpanded = caseHeightExpanded - themeHeightExpanded;
  test('展开后案卷高度(信息项)', true, `caseFile=${caseHeightExpanded}px, bodyOnly=${bodyOnlyExpanded}px, theme=${themeHeightExpanded}px`);

  // 10 900px视口主案例+CTA可见
  const heroRect = await page.evaluate(()=>document.querySelector('.hero-case-card')?.getBoundingClientRect());
  const ctaVisible = await page.evaluate(()=>{
    const el = document.querySelector('.hero-cta-btn');
    if(!el) return false;
    const r = el.getBoundingClientRect();
    return r.top < 900 && r.bottom > 0;
  });
  const sourceVisible = await page.evaluate(()=>{
    const el = document.querySelector('.case-source');
    if(!el) return false;
    const r = el.getBoundingClientRect();
    return r.top < 900 && r.bottom > 0;
  });
  test('900px视口:原文+主案例+CTA可见', sourceVisible&&heroRect&&heroRect.bottom<900&&ctaVisible,
    `heroBottom=${Math.round(heroRect?.bottom||0)}, ctaVisible=${ctaVisible}, sourceVisible=${sourceVisible}`);

  // 11 gsap/html2canvas
  const g = await page.evaluate(()=>typeof gsap?.to);
  const h = await page.evaluate(()=>typeof html2canvas);
  test('gsap+html2canvas可用', g==='function'&&h==='function', `gsap.to=${g}, html2canvas=${h}`);

  // 12 阅读器
  const ws = await page.evaluate(()=>document.querySelector('.workspace')!==null);
  test('阅读器workspace存在', ws, ws);

  // 13 阅读器选文生成不回退
  await page.evaluate(()=>{ const r=document.querySelector('.reader-content p'); if(r){const s=window.getSelection();const r2=document.createRange();r2.selectNodeContents(r);s.removeAllRanges();s.addRange(r2);} });
  await page.waitForTimeout(100);
  const btns = await page.evaluate(()=>Array.from(document.querySelectorAll('.toolbar-btn')).map(b=>!b.disabled));
  test('阅读器选文后工具条可用', btns.length>0&&btns.every(x=>x===true), `btns=${btns.length}, allEnabled=${btns.every(x=>x===true)}`);

  await ctx.close();

  // 移动端 390×844
  const mctx = await browser.newContext({viewport:{width:390,height:844}, isMobile:true});
  const mpage = await mctx.newPage();
  let merrs = [];
  mpage.on('pageerror', e=>merrs.push(e.message));
  await mpage.goto('http://localhost:8096/', {waitUntil:'networkidle'});
  await mpage.waitForTimeout(2500);

  // 14 无横向溢出
  const sw = await mpage.evaluate(()=>document.documentElement.scrollWidth);
  const cw = await mpage.evaluate(()=>document.documentElement.clientWidth);
  test('390px无横向溢出', sw<=cw+1, `scrollWidth=${sw}, clientWidth=${cw}`);

  // 15 首屏无peek
  const noPeek = await mpage.evaluate(()=>!document.getElementById('sidePanel')?.classList.contains('mobile-peek'));
  test('移动端首屏无peek', noPeek, `noPeek=${noPeek}`);

  // 16 移动端hero-card存在且上下布局
  const mHero = await mpage.evaluate(()=>{
    const el=document.querySelector('.hero-case-card'); if(!el) return null;
    const cs=getComputedStyle(el);
    return {cols:cs.gridTemplateColumns, h:el.offsetHeight};
  });
  const isSingleCol = mHero && (mHero.cols==='1fr' || !mHero.cols.includes(' ') || mHero.cols.split(' ').length===1);
  test('移动端hero上下布局', isSingleCol,
    mHero?`cols=${mHero.cols}, h=${mHero.h}px`:'null');

  await mctx.close();

  // reduce-motion
  const rctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
  const rpage = await rctx.newPage();
  await rpage.goto('http://localhost:8096/', {waitUntil:'networkidle'});
  await rpage.waitForTimeout(500);
  const allOpaque = await rpage.evaluate(()=>{
    const els = document.querySelectorAll('.case-file-header, .case-source, .hero-case-card, .pack-collapsible, .case-declaration');
    let bad = [];
    els.forEach((el,i)=>{
      const op = parseFloat(getComputedStyle(el).opacity);
      if(op < 0.95) bad.push(`el${i}=${op}`);
    });
    return bad.length===0 ? true : bad.join(',');
  });
  test('reduce-motion首屏opacity全1', allOpaque===true, allOpaque);
  await rctx.close();

  await browser.close();

  console.log('\n========== 验证结果 ==========');
  results.forEach((r,i)=>{
    console.log(`${i+1}. ${r.pass?'✅PASS':'❌FAIL'}  ${r.name}: ${r.val}`);
  });
  const passed = results.filter(r=>r.pass).length;
  console.log(`\n总计: ${passed}/${results.length}`);
  process.exit(passed===results.length?0:1);
})();
