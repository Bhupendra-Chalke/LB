document.addEventListener('DOMContentLoaded', () => {
  const runQaBtn = document.getElementById('run-qa-btn');
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const errorContainer = document.getElementById('error-container');
  const errorDetails = document.getElementById('error-details');
  const qaOutput = document.getElementById('qa-results');
  const seoOutput = document.getElementById('seo-results');
  const tabs = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  const downloadJsonBtn = document.getElementById('download-json-btn');
  const downloadCsvBtn = document.getElementById('download-csv-btn');

  let fullReport = {};

  runQaBtn.addEventListener('click', () => {
    runQaBtn.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      });
    });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'QA_REPORT') {
      fullReport = message.data;
      loadingDiv.classList.add('hidden');
      resultsDiv.classList.remove('hidden');
      displayResults(fullReport);
    } else if (message.type === 'QA_ERROR') {
      loadingDiv.classList.add('hidden');
      resultsDiv.classList.remove('hidden');
      displayError(message.error);
    }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('active'));
      tab.classList.add('active');

      const target = document.getElementById(tab.dataset.tab);
      tabContents.forEach(content => content.classList.remove('active'));
      target.classList.add('active');
    });
  });

  function displayResults(data) {
    buildQaReport(data.qa);
    buildSeoReport(data.seo);
  }

  function displayError(error) {
    errorContainer.classList.remove('hidden');
    resultsDiv.classList.add('hidden'); // Hide the normal results view
    errorDetails.textContent = `Message: ${error.message}\n\nStack: ${error.stack}`;
  }

  function buildQaReport(qaData) {
    qaOutput.innerHTML = ''; // Clear previous results
    for (const [key, value] of Object.entries(qaData)) {
      const item = document.createElement('div');
      item.className = 'qa-item';

      const statusIcon = getStatusIcon(value.status);
      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const hasIssues = value.issues && value.issues.length > 0;

      let headerHTML = `
        <div class="qa-item-header">
          <span class="status-icon">${statusIcon}</span>
          <span>${title}</span>
        </div>
      `;

      if (hasIssues) {
          item.classList.add('is-expandable');
          let detailsHTML = '<div class="qa-item-details"><ul>';
          value.issues.forEach(issue => {
              detailsHTML += `<li>${issue}</li>`;
          });
          detailsHTML += '</ul></div>';
          item.innerHTML = headerHTML + detailsHTML;

          item.querySelector('.qa-item-header').addEventListener('click', () => {
              item.classList.toggle('expanded');
          });
      } else {
          item.innerHTML = headerHTML;
      }

      qaOutput.appendChild(item);
    }
  }

  function buildSeoReport(seoData) {
    seoOutput.innerHTML = ''; // Clear previous results
    const table = document.createElement('table');
    let tableBody = '<tbody>';

    const friendlyNames = {
        pageTitle: 'Page Title',
        metaDescription: 'Meta Description',
        metaKeywords: 'Meta Keywords',
        canonicalTag: 'Canonical Tag',
        h1: 'H1 Tags',
        h2: 'H2 Tags',
        h3: 'H3 Tags',
        altTexts: 'Images Missing Alt Text',
        structuredData: 'Structured Data (ld+json)'
    };

    for (const [key, value] of Object.entries(seoData)) {
        const name = friendlyNames[key] || key;
        let displayValue = value;

        if (Array.isArray(value)) {
            if (key === 'altTexts' && value.length > 0) {
                displayValue = value.map(img => `<li>${img.src}</li>`).join('');
                displayValue = `<ul>${displayValue}</ul>`;
            } else {
                displayValue = value.join(', ');
            }
        }

        displayValue = displayValue || 'Not Found';

        tableBody += `
            <tr>
                <td>${name}</td>
                <td>${displayValue}</td>
            </tr>
        `;
    }

    tableBody += '</tbody>';
    table.innerHTML = tableBody;
    seoOutput.appendChild(table);
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'WARN': return '⚠️';
      default: return 'ℹ️'; // For N/A or other statuses
    }
  }

  downloadJsonBtn.addEventListener('click', () => {
    downloadFile(JSON.stringify(fullReport, null, 2), 'qa-seo-report.json', 'application/json');
  });

  downloadCsvBtn.addEventListener('click', () => {
    const csv = convertToCsv(fullReport);
    downloadFile(csv, 'qa-seo-report.csv', 'text/csv');
  });

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function convertToCsv(data) {
    let csv = 'Category,Check,Status,Details\n';
    // QA Data
    for (const [key, value] of Object.entries(data.qa)) {
      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const status = value.status || 'N/A';
      const details = (value.issues || []).join('; ');
      csv += `QA,"${title}","${status}","${details.replace(/"/g, '""')}"\n`;
    }
    // SEO Data
    for (const [key, value] of Object.entries(data.seo)) {
      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      let details = Array.isArray(value) ? value.join('; ') : value;
      if (typeof details === 'object' && details !== null) {
        details = JSON.stringify(details);
      }
      csv += `SEO,"${title}","DATA","${(details || 'Not Found').toString().replace(/"/g, '""')}"\n`;
    }
    return csv;
  }
});