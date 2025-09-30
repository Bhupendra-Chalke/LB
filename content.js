(async function() {
  // --- HELPER FUNCTIONS ---

  /**
   * Highlights an element on the page.
   * @param {HTMLElement} element The element to highlight.
   * @param {string} status 'FAIL' for red, 'WARN' for yellow.
   */
  function highlightElement(element, status = 'FAIL') {
    if (!element) return;
    const color = status === 'FAIL' ? 'red' : 'yellow';
    element.style.border = `3px solid ${color}`;
    element.style.scrollMarginTop = '100px'; // Add margin for better visibility when scrolling
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Checks if a string is in sentence case.
   * @param {string} str The string to check.
   * @returns {boolean}
   */
  function isSentenceCase(str) {
    if (!str || str.length === 0) return true;
    const trimmed = str.trim();
    return trimmed.charAt(0) === trimmed.charAt(0).toUpperCase() && trimmed.slice(1) === trimmed.slice(1).toLowerCase();
  }

  /**
   * Finds an element by its text content.
   * @param {string} selector The element type (e.g., 'h2', 'div').
   * @param {string} text The text to search for (case-insensitive).
   * @returns {HTMLElement | null}
   */
  function findElementByText(selector, text) {
      return Array.from(document.querySelectorAll(selector)).find(el => el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
  }


  // --- QA CHECK FUNCTIONS ---

  async function checkTopNavLinks() {
    const links = document.querySelectorAll('header [role="navigation"] a');
    const issues = [];
    for (const link of links) {
      if (!link.href || link.href.endsWith('#') || link.getAttribute('href').trim() === '') {
        issues.push(`Invalid or empty link found: ${link.textContent.trim()}`);
        highlightElement(link);
      }
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkCategoryLinks() {
    // Note: Replaced brittle, auto-generated selectors like '.css-1ywmljq'
    const subNav = document.querySelector('[data-analytics-nav="sub-navigation"]');
    const links = subNav ? subNav.querySelectorAll('a') : [];
    const issues = [];
    if (!subNav) {
        issues.push('Could not find the main sub-navigation container for categories.');
        return { status: 'FAIL', issues };
    }
    for (const link of links) {
      if (!link.href || link.href.endsWith('#') || link.getAttribute('href').trim() === '') {
        issues.push(`Invalid category link: ${link.textContent.trim()}`);
        highlightElement(link);
      }
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkOffersTab() {
    // Using a more robust selector that looks for text content.
    const offerLink = findElementByText('a', 'Offers');
    if (!offerLink) {
      return { status: 'FAIL', issues: ['Offers tab link not found.'] };
    }
    highlightElement(offerLink, 'PASS');
    return { status: 'PASS', issues: [] };
  }

  async function checkMainBanner() {
    const banner = document.querySelector('.PROMOTION a, .PROMOTION img, [data-analytics-id="hero-banner"] a');
    if (!banner) {
      return { status: 'FAIL', issues: ['Main banner/hero promotion not found.'] };
    }
    highlightElement(banner, 'PASS');
    return { status: 'PASS', issues: [] };
  }

  async function checkCampaignLayout() {
      const pageText = document.body.innerText;
      const hasEndDate = /T&Cs.*(end|expir|valid).*20\d\d/i.test(pageText);
      if(!hasEndDate) {
          return { status: 'WARN', issues: ['Could not find a T&Cs end date. Manual check of layout required.'] };
      }
      return { status: 'PASS', issues: [] };
  }

  async function checkWeRecommendSection() {
    // Note: Replaced brittle selector with a more robust text-based search.
    const sectionHeader = findElementByText('h2', 'We Recommend');
    if (!sectionHeader) return { status: 'FAIL', issues: ['"We Recommend" section header not found.'] };

    // Assuming the blocks are siblings or in the same parent container.
    const section = sectionHeader.closest('section, div');
    const blocks = section ? section.querySelectorAll('[class*="recommend"] a, [class*="product"] a') : [];
    const issues = [];

    // This is a very rough guess, the original selectors were too brittle.
    // A more specific check might require more stable attributes on the page.
    if (blocks.length === 0) {
        issues.push('Could not find any product blocks in the "We Recommend" section.');
        highlightElement(sectionHeader);
    } else if (blocks.length !== 4) {
      issues.push(`Expected 4 RO blocks, but found ${blocks.length}.`);
      highlightElement(sectionHeader);
    }

    const firstBlockText = blocks[0] ? blocks[0].innerText.toLowerCase() : '';
    if (blocks.length > 0 && !firstBlockText.includes('ink') && !firstBlockText.includes('finder')) {
        issues.push('Ink Finder might not be in the first position. Manual check required.');
        highlightElement(blocks[0] || sectionHeader, 'WARN');
    }

    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkROBlockCTAConsistency() {
      const ctas = document.querySelectorAll('[class*="ro-block"] [class*="cta-button"], [data-analytics-type="cta"]');
      if(ctas.length === 0) {
          return { status: 'WARN', issues: ['No RO Block CTAs found to check.'] };
      }
      return { status: 'PASS', details: 'CTA buttons found. Manual visual check recommended for consistency.' };
  }

  async function checkOurTopPicks() {
    const sectionHeader = findElementByText('h2', 'Our Top Picks');
    if (!sectionHeader) return { status: 'PASS', details: '"Our Top Picks" section not found.' };

    const section = sectionHeader.closest('section, div');
    const topPicks = section ? section.querySelectorAll('[class*="product-card"]') : [];
    const issues = [];
    topPicks.forEach(card => {
      if (card.innerText.toLowerCase().includes('out of stock')) {
        issues.push(`Out-of-stock product found: ${card.innerText.trim().split('\n')[0]}`);
        highlightElement(card);
      }
    });
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkRangeExplorer() {
    const sectionHeader = findElementByText('h2', 'Explore our full range');
    if (!sectionHeader) return { status: 'PASS', details: '"Range Explorer" section not found.' };

    const section = sectionHeader.closest('section, div');
    const links = section ? section.querySelectorAll('a') : [];
    const issues = [];
    let oosCount = 0;
    links.forEach(link => {
        if (!link.href || link.href.endsWith('#')) {
            issues.push(`Broken link found in Range Explorer.`);
            highlightElement(link);
        }
        if(link.innerText.toLowerCase().includes('out of stock')) {
            oosCount++;
        }
    });
    if (links.length > 0 && oosCount === links.length) {
        issues.push('All items in Range Explorer are out of stock.');
        highlightElement(section, 'WARN');
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkAdviceInspiration() {
      const sectionHeader = findElementByText('h2', 'Advice & Inspiration');
      if (!sectionHeader) return { status: 'FAIL', issues: ['Advice & Inspiration section not found.'] };

      const section = sectionHeader.closest('section, div');
      // A guess for block selector, looking for articles or advice links.
      const blocks = section ? section.querySelectorAll('a[href*="/advice/"], a[href*="/blog/"]') : [];
      const headers = section ? section.querySelectorAll('h3, h4') : [];
      const issues = [];

      if (blocks.length !== 3) {
          issues.push(`Expected 3 blocks, but found ${blocks.length}.`);
          highlightElement(section);
      }

      headers.forEach(header => {
          if (!isSentenceCase(header.innerText.trim())) {
              issues.push(`Header not in sentence case: "${header.innerText.trim()}"`);
              highlightElement(header, 'WARN');
          }
      });

      return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkFooterLinks() {
    const links = document.querySelectorAll('footer a');
    const issues = [];
    for (const link of links) {
      if (!link.href || link.href.endsWith('#') || link.getAttribute('href').trim() === '') {
        issues.push(`Invalid footer link found: ${link.textContent.trim()}`);
        highlightElement(link);
      }
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkUnexpectedErrors() {
      const text = document.body.innerText;
      const issues = [];
      if (text.includes('{{') || text.includes('$t(')) {
          issues.push('Found untranslated placeholders like {{ or $t(.');
      }
      if (text.toLowerCase().includes('error') && !text.toLowerCase().includes('range explorer')) {
          issues.push('Found the word "Error" on the page (outside of "Range Explorer").');
      }
      return { status: issues.length ? 'WARN' : 'PASS', issues };
  }

  async function checkOffersPageBlockCount() {
      if (!window.location.href.toLowerCase().includes('offers')) {
          return { status: 'N/A', details: 'Not an offers page.' };
      }
      const blocks = document.querySelectorAll('[class*="offer-block"], [class*="promotion-item"]');
      if (blocks.length > 0 && blocks.length < 4) {
          highlightElement(blocks[0].parentElement, 'WARN');
          return { status: 'WARN', issues: [`Found only ${blocks.length} offer blocks. Consider adding generic blocks.`]};
      }
      return { status: 'PASS', details: `Found ${blocks.length} offer blocks.` };
  }

  async function checkWindowHandling() {
      const links = document.querySelectorAll('a[target="_blank"]');
      const issues = [];
      links.forEach(link => {
          // Ignore social media links in the footer, which often open in new tabs.
          if (link.closest('footer') && (link.href.includes('twitter') || link.href.includes('facebook') || link.href.includes('instagram'))) {
              return;
          }
          issues.push(`Link opens in new tab: ${link.href}`);
          highlightElement(link, 'WARN');
      });
      return { status: issues.length ? 'WARN' : 'PASS', issues };
  }

  // --- SEO EXTRACTION FUNCTIONS ---

  function getSeoData() {
    const get = (selector, attribute, all = false) => {
      const elements = document.querySelectorAll(selector);
      if (all) return Array.from(elements).map(el => el[attribute] || el.textContent.trim());
      const element = elements[0];
      return element ? (element[attribute] || element.textContent.trim()) : null;
    };

    // Highlight images with missing or empty alt text
    document.querySelectorAll('img:not([alt]), img[alt=""]').forEach(img => {
        highlightElement(img, 'WARN');
    });

    return {
      pageTitle: document.title,
      metaDescription: get('meta[name="description"]', 'content'),
      metaKeywords: get('meta[name="keywords"]', 'content'),
      canonicalTag: get('link[rel="canonical"]', 'href'),
      h1: get('h1', 'textContent', true),
      h2: get('h2', 'textContent', true),
      h3: get('h3', 'textContent', true),
      altTexts: Array.from(document.querySelectorAll('img:not([alt]), img[alt=""]')).map(img => ({
        src: img.src,
        alt: 'MISSING'
      })),
      structuredData: get('script[type="application/ld+json"]', 'innerHTML')
    };
  }

  // --- MAIN EXECUTION ---

  async function runAllChecks() {
    const qaReport = {
      topNavLinks: await checkTopNavLinks(),
      categoryLinks: await checkCategoryLinks(),
      offersTab: await checkOffersTab(),
      mainBanner: await checkMainBanner(),
      campaignLayout: await checkCampaignLayout(),
      weRecommendSection: await checkWeRecommendSection(),
      roBlockCTAConsistency: await checkROBlockCTAConsistency(),
      ourTopPicks: await checkOurTopPicks(),
      rangeExplorer: await checkRangeExplorer(),
      adviceInspiration: await checkAdviceInspiration(),
      footerLinks: await checkFooterLinks(),
      unexpectedErrors: await checkUnexpectedErrors(),
      offersPageBlockCount: await checkOffersPageBlockCount(),
      windowHandling: await checkWindowHandling(),
    };

    const seoReport = getSeoData();

    chrome.runtime.sendMessage({
      type: 'QA_REPORT',
      data: {
        qa: qaReport,
        seo: seoReport
      }
    });
  }

  try {
    runAllChecks();
  } catch (err) {
    // If any of the checks fail catastrophically, send an error message
    // to the popup to be displayed to the user.
    chrome.runtime.sendMessage({
      type: 'QA_ERROR',
      error: {
        message: err.message,
        stack: err.stack,
      },
    });
  }
})();