(async function() {
  // --- HELPER FUNCTIONS ---

  function highlightElement(element, status = 'FAIL') {
    if (!element) return;
    const color = status === 'FAIL' ? '#ff3b30' : '#ff9500';
    element.style.border = `3px solid ${color}`;
    element.style.scrollMarginTop = '100px';
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // --- CRITICAL QA CHECKS ---

  /**
   * Checks all links on the page for broken or empty hrefs.
   */
  async function checkBrokenLinks() {
    const links = document.querySelectorAll('a');
    const issues = [];
    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href || href.trim() === '' || href.startsWith('#')) {
        issues.push(`Empty or hash link found: "${link.textContent.trim()}"`);
        highlightElement(link, 'WARN');
      }
    }
    return { status: issues.length ? 'WARN' : 'PASS', issues, title: "Broken Links" };
  }

  /**
   * Checks for any visible "out of stock" text on the page.
   */
  async function checkOutOfStock() {
    const issues = [];
    constoosElements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.innerText?.toLowerCase().includes('out of stock') && el.offsetParent !== null
    );

    if (oosElements.length > 0) {
        issues.push(`Found ${oosElements.length} "out of stock" messages.`);
        oosElements.forEach(el => highlightElement(el));
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues, title: "Out of Stock Products" };
  }

  /**
   * Checks for untranslated placeholders in the page text.
   */
  async function checkTechnicalErrors() {
    const text = document.body.innerText;
    const issues = [];
    if (text.includes('{{') || text.includes('$t(')) {
      issues.push('Found untranslated placeholders like {{ or $t(.');
    }
    return { status: issues.length ? 'FAIL' : 'PASS', issues, title: "Technical Errors" };
  }

  // --- CRITICAL SEO CHECKS ---

  function getSeoData() {
    const get = (selector, attribute) => {
      const element = document.querySelector(selector);
      return element ? (element[attribute] || element.textContent.trim()) : null;
    };

    const altIssues = [];
    document.querySelectorAll('img:not([alt]), img[alt=""]').forEach(img => {
        altIssues.push(`Image missing alt text: ${img.src.split('/').pop()}`);
        highlightElement(img, 'WARN');
    });

    const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim());
    let h1Status = 'PASS';
    if (h1s.length === 0) h1Status = 'FAIL';
    if (h1s.length > 1) h1Status = 'WARN';

    return {
      pageTitle: {
        value: document.title,
        status: document.title ? 'PASS' : 'FAIL',
        title: 'Page Title'
      },
      metaDescription: {
        value: get('meta[name="description"]', 'content'),
        status: get('meta[name="description"]', 'content') ? 'PASS' : 'FAIL',
        title: 'Meta Description'
      },
      h1Tag: {
        value: h1s.join(', '),
        status: h1Status,
        issues: h1s.length !== 1 ? [`Found ${h1s.length} H1 tags. Expected 1.`] : [],
        title: 'H1 Tag'
      },
      altText: {
          value: `${altIssues.length} images missing alt text.`,
          status: altIssues.length > 0 ? 'FAIL' : 'PASS',
          issues: altIssues,
          title: 'Image Alt Text'
      }
    };
  }

  // --- MAIN EXECUTION ---
  (async () => {
    try {
      const qaReport = {
        brokenLinks: await checkBrokenLinks(),
        outOfStock: await checkOutOfStock(),
        technicalErrors: await checkTechnicalErrors(),
      };

      const seoReport = getSeoData();

      chrome.runtime.sendMessage({ type: 'QA_REPORT', data: { ...qaReport, ...seoReport } });

    } catch (err) {
      chrome.runtime.sendMessage({ type: 'QA_ERROR', error: { message: err.message, stack: err.stack } });
    }
  })();
})();