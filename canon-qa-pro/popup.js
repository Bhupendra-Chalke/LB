document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scan-button');
    const reportContainer = document.getElementById('report-container');
    const loader = document.getElementById('loader');

    scanButton.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url || !tab.url.startsWith('http')) {
            reportContainer.innerHTML = '<div class="report-section"><div class="section-header"><span class="section-title">Error</span></div><div class="section-content" style="display: block;">Cannot run on this page. Please navigate to a valid web page.</div></div>';
            return;
        }

        // Disable button and show loader
        scanButton.disabled = true;
        loader.style.display = 'block';
        reportContainer.innerHTML = '';

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            if (results && results[0] && results[0].result) {
                displayReport(results[0].result);
            } else {
                throw new Error('The content script did not return a result.');
            }
        } catch (error) {
            console.error('Error executing script:', error);
            let errorMessage = `An error occurred: ${error.message}`;
            if (error.message.includes('No host permissions')) {
                errorMessage = 'This extension does not have permission to run on this page. Please ensure you are on a "https://www.canon.ie/store/" URL.';
            } else if (error.message.includes('Cannot access a chrome:// URL')) {
                errorMessage = 'This extension cannot run on special browser pages (e.g., chrome://).';
            }
            reportContainer.innerHTML = `<div class="report-section"><div class="section-header"><span class="status-icon status-fail"></span><span class="section-title">Error</span></div><div class="section-content" style="display: block;">${errorMessage}</div></div>`;
        } finally {
            // Re-enable button and hide loader
            scanButton.disabled = false;
            loader.style.display = 'none';
        }
    });

    function displayReport(reportData) {
        reportContainer.innerHTML = ''; // Clear previous report

        for (const section of reportData) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'report-section';

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
                li.innerHTML = item; // Use innerHTML to render status colors
                ul.appendChild(li);
            });
            content.appendChild(ul);

            sectionDiv.appendChild(header);
            sectionDiv.appendChild(content);
            reportContainer.appendChild(sectionDiv);

            // Add click listener for accordion
            header.addEventListener('click', () => {
                header.classList.toggle('open');
                content.style.display = content.style.display === 'block' ? 'none' : 'block';
            });
        }
    }
});