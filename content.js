(async function() {
  // --- HELPER FUNCTIONS ---

  /**
   * Highlights an element on the page.
   * @param {HTMLElement} element The element to highlight.
   * @param {string} status 'FAIL' for red, 'WARN' for yellow.
   */
  function highlightElement(element, status = 'FAIL') {
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
    if (!str || str.length === 0) return true; // Empty strings are considered valid
    return str.charAt(0) === str.charAt(0).toUpperCase() && str.slice(1) === str.slice(1).toLowerCase();
  }

  // --- QA CHECK FUNCTIONS ---

  async function checkTopNavLinks() {
    const links = document.querySelectorAll('header [role="navigation"] a');
    const issues = [];
    for (const link of links) {
      if (!link.href || link.href.endsWith('#')) {
        issues.push(`Invalid link found: ${link.textContent.trim()}`);
        highlightElement(link);
      }
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkCategoryLinks() {
    const links = document.querySelectorAll('.css-1ywmljq a, .css-13swxhn a');
    const issues = [];
    for (const link of links) {
      if (!link.href || link.href.endsWith('#')) {
        issues.push(`Invalid category link: ${link.textContent.trim()}`);
        highlightElement(link);
      }
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkOffersTab() {
    const offerLink = document.querySelector('a[href*="Offers"], #Offers');
    if (!offerLink) {
      return { status: 'FAIL', issues: ['Offers tab link not found.'] };
    }
    highlightElement(offerLink, 'PASS');
    return { status: 'PASS', issues: [] };
  }

  async function checkMainBanner() {
    const banner = document.querySelector('.PROMOTION a, .PROMOTION img');
    if (!banner) {
      return { status: 'FAIL', issues: ['Main banner/hero promotion not found.'] };
    }
    highlightElement(banner, 'PASS');
    return { status: 'PASS', issues: [] };
  }

  async function checkCampaignLayout() {
      // This check is complex to automate fully without more specific selectors.
      // We will check for the presence of a T&C end date as a proxy.
      const pageText = document.body.innerText;
      const hasEndDate = /T&C.*(end|expir|valid).*20\d\d/i.test(pageText);
      if(!hasEndDate) {
          return { status: 'WARN', issues: ['Could not find a T&C end date. Manual check of layout required.'] };
      }
      return { status: 'PASS', issues: [] };
  }

  async function checkWeRecommendSection() {
    const sectionHeader = document.querySelector('.css-16wiahl');
    if (!sectionHeader) return { status: 'FAIL', issues: ['"We Recommend" section header not found.'] };

    const blocks = sectionHeader.parentElement.querySelectorAll('.css-1eeorkb');
    const issues = [];
    if (blocks.length !== 4) {
      issues.push(`Expected 4 RO blocks, but found ${blocks.length}.`);
      highlightElement(sectionHeader);
    }

    const firstBlockText = blocks[0] ? blocks[0].innerText.toLowerCase() : '';
    if (!firstBlockText.includes('ink finder')) {
        issues.push('Ink Finder is not in the first position.');
        highlightElement(blocks[0] || sectionHeader);
    }

    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkROBlockCTAConsistency() {
      // This is a visual check. We'll just confirm the buttons exist.
      const ctas = document.querySelectorAll('.ro-block .cta-button');
      if(ctas.length === 0) {
          return { status: 'WARN', issues: ['No RO Block CTAs found to check.'] };
      }
      return { status: 'PASS', issues: ['CTA buttons found. Manual visual check recommended for consistency.'] };
  }

  async function checkOurTopPicks() {
    const topPicks = document.querySelectorAll('.top-picks .product-card');
    const issues = [];
    topPicks.forEach(card => {
      if (card.querySelector('.out-of-stock')) {
        issues.push(`Out-of-stock product found: ${card.innerText.trim().split('\n')[0]}`);
        highlightElement(card);
      }
    });
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkRangeExplorer() {
    const links = document.querySelectorAll('.range-explorer a');
    const issues = [];
    let oosCount = 0;
    links.forEach(link => {
        if (!link.href || link.href.endsWith('#')) {
            issues.push(`Broken link found in Range Explorer.`);
            highlightElement(link);
        }
        if(link.querySelector('.out-of-stock')) {
            oosCount++;
        }
    });
    if (links.length > 0 && oosCount === links.length) {
        issues.push('All items in Range Explorer are out of stock.');
        highlightElement(document.querySelector('.range-explorer'), 'WARN');
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues };
  }

  async function checkAdviceInspiration() {
      const section = document.querySelector('.css-79, .css-80, .css-71')?.parentElement;
      if (!section) return { status: 'FAIL', issues: ['Advice & Inspiration section not found.'] };

      const blocks = section.querySelectorAll('a[href*="/advice/"]'); // A guess for block selector
      const headers = section.querySelectorAll('h3, h4'); // A guess for header selector
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
    const links = document.querySelectorAll('footer a, .css-k0vxt0 a');
    const issues = [];
    for (const link of links) {
      if (!link.href || link.href.endsWith('#')) {
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
      if (text.toLowerCase().includes('error')) {
          issues.push('Found the word "Error" on the page.');
      }
      return { status: issues.length ? 'WARN' : 'PASS', issues };
  }

  async function checkOffersPageBlockCount() {
      if (!window.location.href.toLowerCase().includes('offers')) {
          return { status: 'N/A', details: 'Not an offers page.' };
      }
      // This selector is a guess, needs to be adapted to the actual offers page
      const blocks = document.querySelectorAll('.offer-block, .promotion-item');
      if (blocks.length > 0 && blocks.length < 4) {
          highlightElement(blocks[0].parentElement, 'WARN');
          return { status: 'WARN', issues: [`Found only ${blocks.length} offer blocks. Consider adding generic blocks.`]};
      }
      return { status: 'PASS', issues: [] };
  }

  async function checkWindowHandling() {
      const links = document.querySelectorAll('a[target="_blank"]');
      const issues = [];
      links.forEach(link => {
          issues.push(`Link opens in new tab: ${link.href}`);
          highlightElement(link, 'WARN');
      });
      return { status: issues.length ? 'WARN' : 'PASS', issues };
  }

  // --- SEO EXTRACTION FUNCTIONS ---

  function getSeoData() {
    const get = (selector, attribute, all = false) => {
      const elements = document.querySelectorAll(selector);
      if (all) return Array.from(elements).map(el => el[attribute] || el.textContent);
      const element = elements[0];
      return element ? element[attribute] || element.textContent : null;
    };

    return {
      pageTitle: document.title,
      metaDescription: get('meta[name="description"]', 'content'),
      metaKeywords: get('meta[name="keywords"]', 'content'),
      canonicalTag: get('link[rel="canonical"]', 'href'),
      h1: get('h1', 'textContent', true),
      h2: get('h2', 'textContent', true),
      h3: get('h3', 'textContent', true),
      altTexts: Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt || 'MISSING'
      })).filter(item => !item.alt || item.alt === 'MISSING'),
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

    // Highlight missing alt texts
    document.querySelectorAll('img:not([alt]), img[alt=""]').forEach(img => {
        highlightElement(img, 'WARN');
    });

    chrome.runtime.sendMessage({
      type: 'QA_REPORT',
      data: {
        qa: qaReport,
        seo: seoReport
      }
    });
  }

  runAllChecks();
})();