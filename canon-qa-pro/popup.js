document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scan-button');
    const reportContainer = document.getElementById('report-container');
    const loader = document.getElementById('loader');
    const toggleUnconfigured = document.getElementById('toggle-unconfigured');

    scanButton.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url || !tab.url.startsWith('http')) {
            reportContainer.innerHTML = '<div class="report-section"><div class="section-header"><span class="section-title">Error</span></div><div class="section-content" style="display: block;">Cannot run on this page.</div></div>';
            return;
        }

        scanButton.disabled = true;
        loader.style.display = 'block';
        reportContainer.innerHTML = '';

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            if (results && results[0] && results[0].result) {
                const { initialReport, linksToCheck } = results[0].result;
                displayReport(initialReport);
                if (linksToCheck && linksToCheck.length > 0) {
                    checkLinksInBackground(linksToCheck);
                }
            } else {
                throw new Error('The content script did not return a result.');
            }
        } catch (error) {
            handleError(error);
        } finally {
            scanButton.disabled = false;
            loader.style.display = 'none';
        }
    });

    toggleUnconfigured.addEventListener('change', () => {
        const sections = reportContainer.querySelectorAll('.report-section[data-status="warn"]');
        sections.forEach(section => {
            section.style.display = toggleUnconfigured.checked ? 'block' : 'none';
        });
    });

    function displayReport(reportData) {
        reportContainer.innerHTML = ''; // Clear previous report
        reportData.forEach(section => {
            const sectionDiv = createSectionElement(section);
            reportContainer.appendChild(sectionDiv);
        });
        toggleUnconfigured.dispatchEvent(new Event('change'));
    }

    function createSectionElement(section) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'report-section';
        sectionDiv.setAttribute('data-status', section.status);
        sectionDiv.id = `section-${section.title.replace(/\s+/g, '-')}`;

        const header = document.createElement('div');
        header.className = 'section-header';

        const title = document.createElement('span');
        title.className = 'section-title';
        title.innerHTML = `<span class="status-icon status-${section.status}"></span> ${section.title}`;

        const arrow = document.createElement('span');
        arrow.className = 'arrow';

        header.appendChild(title);
        header.appendChild(arrow);

        const content = document.createElement('div');
        content.className = 'section-content';

        const ul = document.createElement('ul');
        section.details.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = item;
            ul.appendChild(li);
        });
        content.appendChild(ul);

        sectionDiv.appendChild(header);
        sectionDiv.appendChild(content);

        header.addEventListener('click', () => {
            header.classList.toggle('open');
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        });

        return sectionDiv;
    }

    function checkLinksInBackground(links) {
        const brokenLinks = [];
        let checkedCount = 0;

        const linkCheckSection = createSectionElement({
            title: 'Broken Link Check',
            status: 'info',
            details: [`Checking ${links.length} links...`]
        });
        reportContainer.prepend(linkCheckSection);

        links.forEach(url => {
            chrome.runtime.sendMessage({ action: "checkLink", url }, response => {
                checkedCount++;
                if (response && (response.status >= 400 || response.status === 'error')) {
                    brokenLinks.push({ url: response.url, status: response.status });
                }

                // Update report when all links are checked
                if (checkedCount === links.length) {
                    const status = brokenLinks.length > 0 ? 'fail' : 'pass';
                    const details = brokenLinks.length > 0
                        ? brokenLinks.map(link => `<a href="${link.url}" target="_blank">${link.url}</a> - Status: ${link.status}`)
                        : ['No broken links found.'];
                    details.unshift(`Checked ${links.length} links. Found ${brokenLinks.length} broken.`);

                    const finishedSection = createSectionElement({title: 'Broken Link Check', status, details});
                    const existingSection = document.getElementById('section-Broken-Link-Check');
                    if(existingSection) {
                        existingSection.replaceWith(finishedSection);
                    }
                }
            });
        });
    }

    function handleError(error) {
        console.error('Error:', error);
        let errorMessage = `An error occurred: ${error.message}`;
        if (error.message.includes('No host permissions')) {
            errorMessage = 'This extension does not have permission to run on this page.';
        } else if (error.message.includes('Cannot access a chrome:// URL')) {
            errorMessage = 'This extension cannot run on special browser pages.';
        }
        reportContainer.innerHTML = `<div class="report-section"><div class="section-header"><span class="status-icon status-fail"></span><span class="section-title">Error</span></div><div class="section-content" style="display: block;">${errorMessage}</div></div>`;
    }
});