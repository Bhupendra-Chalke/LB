(() => {
    // ===================================================================================
    //  CONFIGURATION OBJECT: PLEASE UPDATE THE PLACEHOLDER SELECTORS BELOW
    // ===================================================================================
    const SELECTORS = {
        topNavLinks: '.REPLACE_WITH_YOUR_TOP_NAV_LINK_SELECTOR',
        categoryLinks: '.REPLACE_WITH_YOUR_CATEGORY_LINK_SELECTOR',
        weRecommendSection: '.REPLACE_WITH_WE_RECOMMEND_SECTION_SELECTOR',
        weRecommendBlock: '.REPLACE_WITH_WE_RECOMMEND_BLOCK_SELECTOR',
        topPicksSection: '.REPLACE_WITH_TOP_PICKS_SECTION_SELECTOR',
        topPicksProduct: '.REPLACE_WITH_TOP_PICKS_PRODUCT_SELECTOR',
        outOfStockIndicator: '.REPLACE_WITH_OUT_OF_STOCK_SELECTOR',
        adviceInspirationSection: '.REPLACE_WITH_ADVICE_INSPIRATION_SELECTOR',
        adviceInspirationBlock: '.REPLACE_WITH_ADVICE_BLOCK_SELECTOR',
        footerLinks: 'footer a',
    };
    // ===================================================================================
    //  END OF CONFIGURATION
    // ===================================================================================

    // --- HELPER FUNCTIONS ---
    const isConfigured = (selector) => selector && !selector.startsWith('.REPLACE_WITH');
    const isLinkValid = (href) => href && href.trim() !== '' && href !== '#' && !href.startsWith('javascript:');
    const formatStatus = (text, status) => {
        const statusMap = { ok: 'OK', broken: 'BROKEN', warn: 'WARN', info: 'INFO', manual: 'MANUAL', checking: 'CHECKING...' };
        const colorMap = { ok: 'green', broken: 'red', warn: 'orange', info: 'blue', manual: 'grey', checking: '#666' };
        return `${text} - <strong style="color:${colorMap[status] || 'black'};">${statusMap[status] || ''}</strong>`;
    };
    const getElement = (selector) => isConfigured(selector) ? document.querySelector(selector) : null;
    const getElements = (selector) => isConfigured(selector) ? document.querySelectorAll(selector) : [];

    // --- CHECK FUNCTIONS ---
    function runGenericChecks() {
        const report = [];

        // SEO Details Check
        const checkSeoDetails = () => {
            const details = [];
            let status = 'pass';

            const title = document.title;
            if (!title) { details.push(formatStatus('Title Tag: Missing', 'broken')); status = 'fail'; }
            else if (title.length < 30 || title.length > 65) { details.push(formatStatus(`Title Tag: Length is ${title.length} (warn)`, 'warn')); if(status !== 'fail') status = 'warn'; }
            else { details.push(formatStatus('Title Tag: OK', 'ok')); }

            const metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc || !metaDesc.content) { details.push(formatStatus('Meta Description: Missing', 'warn')); if(status !== 'fail') status = 'warn'; }
            else if (metaDesc.content.length < 70 || metaDesc.content.length > 155) { details.push(formatStatus(`Meta Description: Length is ${metaDesc.content.length} (warn)`, 'warn')); if(status !== 'fail') status = 'warn'; }
            else { details.push(formatStatus('Meta Description: OK', 'ok')); }

            const canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) { details.push(formatStatus('Canonical URL: Missing', 'warn')); if(status !== 'fail') status = 'warn'; }
            else if (canonical.href !== window.location.href) { details.push(formatStatus(`Canonical URL: Mismatched`, 'warn')); if(status !== 'fail') status = 'warn'; }
            else { details.push(formatStatus('Canonical URL: OK', 'ok')); }

            const robots = document.querySelector('meta[name="robots"]');
            if (robots && robots.content && robots.content.includes('noindex')) {
                details.push(formatStatus('Meta Robots: "noindex" found', 'broken'));
                status = 'fail';
            }

            const ogTitle = document.querySelector('meta[property="og:title"]');
            details.push(formatStatus(`Open Graph Title: ${ogTitle ? 'Found' : 'Missing'}`, ogTitle ? 'ok' : 'warn'));

            const schema = document.querySelectorAll('script[type="application/ld+json"]');
            details.push(formatStatus(`Schema Markup (JSON-LD): ${schema.length > 0 ? 'Found' : 'Missing'}`, schema.length > 0 ? 'ok' : 'info'));

            return { title: 'SEO Details', status, details };
        };
        report.push(checkSeoDetails());

        // Check for a single H1 tag
        const h1s = document.querySelectorAll('h1');
        report.push({
            title: 'H1 Tag Presence',
            status: h1s.length === 1 ? 'pass' : 'fail',
            details: [formatStatus(h1s.length === 1 ? 'Exactly one H1 tag found' : `Found ${h1s.length} H1 tags, expected 1`, h1s.length === 1 ? 'ok' : 'broken')]
        });

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

    function runConfigurableChecks() {
        const report = [];
        const linkChecks = [
            { selector: SELECTORS.topNavLinks, title: 'Top Navigation Links' },
            { selector: SELECTORS.categoryLinks, title: 'Category & Subcategory Links' },
            { selector: SELECTORS.footerLinks, title: 'Footer Links' }
        ];
        linkChecks.forEach(({ selector, title }) => {
            if (!isConfigured(selector)) {
                report.push({ title, status: 'warn', details: [formatStatus('Selector not configured', 'warn')] });
            } else {
                const links = getElements(selector);
                report.push({ title, status: 'info', details: [formatStatus(`Found ${links.length} links to check`, 'info')] });
            }
        });

        const blockCountChecks = [
            { section: SELECTORS.weRecommendSection, block: SELECTORS.weRecommendBlock, count: 4, name: '"We Recommend"' },
            { section: SELECTORS.adviceInspirationSection, block: SELECTORS.adviceInspirationBlock, count: 3, name: '"Advice & Inspiration"' }
        ];
        blockCountChecks.forEach(({ section, block, count, name }) => {
            if (!isConfigured(section) || !isConfigured(block)) {
                report.push({ title: `${name} Block Count`, status: 'warn', details: [formatStatus('Selectors not configured', 'warn')] });
            } else {
                const sectionEl = getElement(section);
                if (!sectionEl) {
                    report.push({ title: `${name} Block Count`, status: 'warn', details: [formatStatus('Section not found', 'warn')] });
                } else {
                    const blocks = sectionEl.querySelectorAll(block);
                    const status = blocks.length === count ? 'pass' : 'fail';
                    report.push({ title: `${name} Block Count`, status, details: [formatStatus(`Found ${blocks.length} blocks, expected ${count}`, status === 'pass' ? 'ok' : 'broken')] });
                }
            }
        });

        if (!isConfigured(SELECTORS.topPicksSection) || !isConfigured(SELECTORS.topPicksProduct) || !isConfigured(SELECTORS.outOfStockIndicator)) {
            report.push({ title: 'Our Top Picks - OOS', status: 'warn', details: [formatStatus('Selectors not configured', 'warn')] });
        } else {
            const section = getElement(SELECTORS.topPicksSection);
            if (!section) {
                report.push({ title: 'Our Top Picks - OOS', status: 'warn', details: [formatStatus('Section not found', 'warn')] });
            } else {
                let oosCount = 0;
                section.querySelectorAll(SELECTORS.topPicksProduct).forEach(p => { if (p.querySelector(SELECTORS.outOfStockIndicator)) oosCount++; });
                const status = oosCount > 0 ? 'fail' : 'pass';
                report.push({ title: 'Our Top Picks - OOS', status, details: [formatStatus(`${oosCount} OOS product(s) found`, status === 'fail' ? 'broken' : 'ok')] });
            }
        }
        return report;
    }

    function runManualChecks() {
        return [{
            title: 'Manual Verification Required',
            status: 'info',
            details: [
                formatStatus('Verify "Offers Tab" content matches the Offers Page.', 'manual'),
                formatStatus('Verify correct promotions are appearing.', 'manual'),
                formatStatus('Check for any unexpected JavaScript errors in the console.', 'manual'),
            ]
        }];
    }

    function runAllChecks() {
        const allLinksOnPage = new Set();
        document.querySelectorAll('a[href]').forEach(link => {
            if (isLinkValid(link.href)) {
                allLinksOnPage.add(link.href);
            }
        });

        const genericReport = runGenericChecks();
        const configurableReport = runConfigurableChecks();

        const externalLinks = Array.from(allLinksOnPage).filter(href => !href.includes(window.location.hostname) && href.startsWith('http'));
        if (externalLinks.length > 0) {
            const details = externalLinks.map(href => `<a href="${href}" target="_blank">${href}</a>`);
            configurableReport.push({ title: `External Links Found (${externalLinks.length})`, status: 'info', details });
        } else {
            configurableReport.push({ title: 'External Links Found', status: 'pass', details: [formatStatus('No external links found on the page', 'ok')] });
        }

        const manualReport = runManualChecks();

        return {
            initialReport: [...genericReport, ...configurableReport, ...manualReport],
            linksToCheck: Array.from(allLinksOnPage)
        };
    }

    return runAllChecks();
})();