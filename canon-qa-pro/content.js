(() => {
    // ===================================================================================
    //  CONFIGURATION OBJECT: PLEASE UPDATE THE PLACEHOLDER SELECTORS BELOW
    // ===================================================================================
    // Instructions: For the "Site-Specific Checks" to work, replace the 'REPLACE_WITH...'
    // strings with the actual CSS selectors from the Canon store website. The "Generic Checks"
    // will work immediately without any changes.
    const SELECTORS = {
        topNavLinks: '.REPLACE_WITH_YOUR_TOP_NAV_LINK_SELECTOR',
        categoryLinks: '.REPLACE_WITH_YOUR_CATEGORY_LINK_SELECTOR',
        weRecommendSection: '.REPLACE_WITH_WE_RECOMMEND_SECTION_SELECTOR',
        weRecommendBlock: '.REPLACE_WITH_WE_RECOMMEND_BLOCK_SELECTOR',
        weRecommendCta: '.REPLACE_WITH_WE_RECOMMEND_CTA_SELECTOR',
        topPicksSection: '.REPLACE_WITH_TOP_PICKS_SECTION_SELECTOR',
        topPicksProduct: '.REPLACE_WITH_TOP_PICKS_PRODUCT_SELECTOR',
        outOfStockIndicator: '.REPLACE_WITH_OUT_OF_STOCK_SELECTOR',
        adviceInspirationSection: '.REPLACE_WITH_ADVICE_INSPIRATION_SELECTOR',
        adviceInspirationBlock: '.REPLACE_WITH_ADVICE_BLOCK_SELECTOR',
        footerLinks: 'footer a', // This is a common default that may work out-of-the-box
    };
    // ===================================================================================
    //  END OF CONFIGURATION
    // ===================================================================================

    // --- HELPER FUNCTIONS ---
    const isConfigured = (selector) => selector && !selector.startsWith('.REPLACE_WITH');
    const isLinkValid = (href) => href && href.trim() !== '' && href !== '#' && !href.startsWith('javascript:');
    const formatStatus = (text, status) => {
        const statusMap = { ok: 'OK', broken: 'BROKEN', warn: 'WARN', info: 'INFO', manual: 'MANUAL' };
        const colorMap = { ok: 'green', broken: 'red', warn: 'orange', info: 'blue', manual: 'grey' };
        return `${text} - <strong style="color:${colorMap[status] || 'black'};">${statusMap[status] || ''}</strong>`;
    };
    const getElement = (selector) => isConfigured(selector) ? document.querySelector(selector) : null;
    const getElements = (selector) => isConfigured(selector) ? document.querySelectorAll(selector) : [];

    // --- GENERIC CHECKS (RUN IMMEDIATELY) ---
    function runGenericChecks() {
        const report = [];

        // Check for a single H1 tag
        const h1s = document.querySelectorAll('h1');
        if (h1s.length === 1) {
            report.push({ title: 'H1 Tag Presence', status: 'pass', details: [formatStatus('Exactly one H1 tag found', 'ok')] });
        } else {
            report.push({ title: 'H1 Tag Presence', status: 'fail', details: [formatStatus(`Found ${h1s.length} H1 tags, expected 1`, 'broken')] });
        }

        // Check for broken images
        const images = document.querySelectorAll('img');
        let brokenImageCount = 0;
        images.forEach(img => {
            if (!img.src || img.naturalWidth === 0) {
                brokenImageCount++;
            }
        });
        if (brokenImageCount > 0) {
            report.push({ title: 'Broken Images', status: 'fail', details: [formatStatus(`Found ${brokenImageCount} broken images`, 'broken')] });
        } else {
            report.push({ title: 'Broken Images', status: 'pass', details: [formatStatus(`Checked ${images.length} images, none appear broken`, 'ok')] });
        }

        // Check for internal links opening in new tabs
        const internalLinks = Array.from(document.querySelectorAll('a[href]'))
            .filter(link => isLinkValid(link.href) && (link.href.includes(window.location.hostname) || link.href.startsWith('/')));
        const newTabLinks = internalLinks.filter(link => link.target === '_blank');
        if (newTabLinks.length > 0) {
            const details = [formatStatus(`${newTabLinks.length} internal link(s) open in a new tab:`, 'broken')];
            newTabLinks.forEach(l => details.push(`- '${l.innerText.trim()}'`));
            report.push({ title: 'Internal Links in New Tab', status: 'fail', details });
        } else {
            report.push({ title: 'Internal Links in New Tab', status: 'pass', details: [formatStatus('All internal links open in the same window.', 'ok')] });
        }

        return report;
    }

    // --- SITE-SPECIFIC CHECKS (REQUIRE CONFIGURATION) ---
    function runConfigurableChecks() {
        const report = [];

        // Check Links Function
        const checkLinks = (selector, sectionTitle) => {
            if (!isConfigured(selector)) return { title: sectionTitle, status: 'warn', details: [formatStatus('Selector not configured', 'warn')] };
            const links = getElements(selector);
            if (links.length === 0) return { title: sectionTitle, status: 'warn', details: [formatStatus('No links found with selector', 'warn')] };
            let brokenCount = 0;
            links.forEach(link => { if (!isLinkValid(link.href)) brokenCount++; });
            const status = brokenCount > 0 ? 'fail' : 'pass';
            return { title: sectionTitle, status, details: [formatStatus(`Checked ${links.length} links, found ${brokenCount} broken`, status === 'fail' ? 'broken' : 'ok')] };
        };
        report.push(checkLinks(SELECTORS.topNavLinks, 'Top Navigation Links'));
        report.push(checkLinks(SELECTORS.categoryLinks, 'Category & Subcategory Links'));
        report.push(checkLinks(SELECTORS.footerLinks, 'Footer Links'));

        // Check Block Count Function
        const checkBlockCount = (sectionSelector, blockSelector, expectedCount, sectionName) => {
            if (!isConfigured(sectionSelector) || !isConfigured(blockSelector)) return { title: `${sectionName} Block Count`, status: 'warn', details: [formatStatus('Selectors not configured', 'warn')] };
            const section = getElement(sectionSelector);
            if (!section) return { title: `${sectionName} Block Count`, status: 'warn', details: [formatStatus('Section not found', 'warn')] };
            const blocks = section.querySelectorAll(blockSelector);
            const status = blocks.length === expectedCount ? 'pass' : 'fail';
            return { title: `${sectionName} Block Count`, status, details: [formatStatus(`Found ${blocks.length} blocks, expected ${expectedCount}`, status === 'pass' ? 'ok' : 'broken')] };
        };
        report.push(checkBlockCount(SELECTORS.weRecommendSection, SELECTORS.weRecommendBlock, 4, '"We Recommend"'));
        report.push(checkBlockCount(SELECTORS.adviceInspirationSection, SELECTORS.adviceInspirationBlock, 3, '"Advice & Inspiration"'));

        // Check OOS Products
        const checkOOS = () => {
            if (!isConfigured(SELECTORS.topPicksSection) || !isConfigured(SELECTORS.topPicksProduct) || !isConfigured(SELECTORS.outOfStockIndicator)) return { title: 'Our Top Picks - OOS', status: 'warn', details: [formatStatus('Selectors not configured', 'warn')] };
            const section = getElement(SELECTORS.topPicksSection);
            if (!section) return { title: 'Our Top Picks - OOS', status: 'warn', details: [formatStatus('Section not found', 'warn')] };
            let oosCount = 0;
            section.querySelectorAll(SELECTORS.topPicksProduct).forEach(p => { if (p.querySelector(SELECTORS.outOfStockIndicator)) oosCount++; });
            const status = oosCount > 0 ? 'fail' : 'pass';
            return { title: 'Our Top Picks - OOS', status, details: [formatStatus(`${oosCount} OOS product(s) found`, status === 'fail' ? 'broken' : 'ok')] };
        };
        report.push(checkOOS());

        return report;
    }

    // --- MANUAL CHECKS ---
    function runManualChecks() {
        return [{
            title: 'Manual Verification Required',
            status: 'info',
            details: [
                formatStatus('Verify "Offers Tab" content matches the Offers Page.', 'manual'),
                formatStatus('Verify correct promotions are appearing.', 'manual'),
                formatStatus('Verify main banner appearance and redirection logic.', 'manual'),
                formatStatus('Check for any unexpected JavaScript errors in the console.', 'manual'),
                formatStatus('Check for any untranslated content (for non-EN markets).', 'manual'),
            ]
        }];
    }

    // --- MAIN EXECUTION ---
    function runAllChecks() {
        const genericReport = runGenericChecks();
        const configurableReport = runConfigurableChecks();
        const manualReport = runManualChecks();
        return [...genericReport, ...configurableReport, ...manualReport];
    }

    return runAllChecks();
})();