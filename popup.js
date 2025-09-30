document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const runQaBtn = document.getElementById('run-qa-btn');
  const initialView = document.getElementById('initial-view');
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const errorContainer = document.getElementById('error-container');
  const errorDetails = document.getElementById('error-details');
  const summaryDashboard = document.getElementById('summary-dashboard');
  const qaOutput = document.getElementById('qa-results');
  const seoOutput = document.getElementById('seo-results');
  const tabs = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  const downloadJsonBtn = document.getElementById('download-json-btn');
  const downloadCsvBtn = document.getElementById('download-csv-btn');

  let fullReport = {};

  // --- Event Listeners ---
  runQaBtn.addEventListener('click', () => {
    initialView.classList.add('hidden');
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
    loadingDiv.classList.add('hidden');
    resultsDiv.classList.remove('hidden');

    if (message.type === 'QA_REPORT') {
      fullReport = message.data;
      displayResults(fullReport);
    } else if (message.type === 'QA_ERROR') {
      displayError(message.error);
    }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('active'));
      tab.classList.add('active');

      tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tab.dataset.tab);
      });
    });
  });

  // --- UI Building Functions ---
  function displayResults(data) {
    buildSummaryDashboard(data);
    buildQaReport(data.qa);
    buildSeoReport(data.seo);
  }

  function buildSummaryDashboard(data) {
      const totalQaChecks = Object.keys(data.qa).length;
      const passedQaChecks = Object.values(data.qa).filter(v => v.status === 'PASS').length;
      const qaScore = Math.round((passedQaChecks / totalQaChecks) * 100);

      const totalSeoIssues = (data.seo.altTexts?.length || 0) +
                             (!data.seo.metaDescription ? 1 : 0) +
                             (!data.seo.canonicalTag ? 1 : 0) +
                             (data.seo.h1?.length === 0 ? 1 : 0);

      summaryDashboard.innerHTML = `
        <div class="summary-card qa-score">
            <div class="value">${qaScore}%</div>
            <div class="label">QA Score (${passedQaChecks}/${totalQaChecks} Passed)</div>
        </div>
        <div class="summary-card seo-issues">
            <div class="value">${totalSeoIssues}</div>
            <div class="label">Critical SEO Issues</div>
        </div>
      `;
  }

  function buildQaReport(qaData) {
    qaOutput.innerHTML = ''; // Clear previous results
    for (const [key, value] of Object.entries(qaData)) {
      const card = document.createElement('div');
      card.className = 'card qa-card';

      const status = value.status || 'INFO';
      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const hasIssues = value.issues && value.issues.length > 0;
      const icon = getStatusIcon(status);

      let headerHTML = `
        <div class="qa-card-header">
          <div class="qa-card-title">
            <span class="status-icon ${status}">${icon}</span>
            <span>${title}</span>
          </div>
          ${hasIssues ? '<span class="expand-arrow">›</span>' : ''}
        </div>
      `;

      if (hasIssues) {
          card.classList.add('is-expandable');
          let detailsHTML = '<div class="qa-card-details"><ul>';
          value.issues.forEach(issue => {
              detailsHTML += `<li>${issue}</li>`;
          });
          detailsHTML += '</ul></div>';
          card.innerHTML = headerHTML + detailsHTML;

          card.addEventListener('click', () => {
              card.classList.toggle('expanded');
          });
      } else {
          card.innerHTML = headerHTML;
      }

      qaOutput.appendChild(card);
    }
  }

  function buildSeoReport(seoData) {
    seoOutput.innerHTML = ''; // Clear previous results
    const seoMetrics = {
        pageTitle: { name: 'Page Title', insight: 'The title tag is a key on-page SEO factor. It should be unique, descriptive, and ideally under 60 characters.' },
        metaDescription: { name: 'Meta Description', insight: 'A good meta description entices users to click. It should be a compelling summary under 160 characters.' },
        canonicalTag: { name: 'Canonical Tag', insight: 'This tells search engines the "master" version of a page, preventing duplicate content issues.' },
        h1: { name: 'H1 Tags', insight: 'There should be one, and only one, H1 tag per page. It acts as the primary headline.' },
        altTexts: { name: 'Images Missing Alt Text', insight: 'Alt text helps search engines understand images and improves accessibility for screen readers.' },
        structuredData: { name: 'Structured Data', insight: 'Schema markup helps search engines understand your content better and can lead to rich snippets in search results.' },
        metaKeywords: { name: 'Meta Keywords', insight: 'This tag is now largely ignored by major search engines, but can still be checked for legacy reasons.' },
    };

    for (const [key, metric] of Object.entries(seoMetrics)) {
        const card = document.createElement('div');
        card.className = 'card seo-card';
        const value = seoData[key];
        let displayValue;

        if (Array.isArray(value)) {
            if (key === 'altTexts' && value.length > 0) {
                displayValue = `${value.length} images are missing alt text.`;
            } else if (value.length > 0) {
                displayValue = `<ul>${value.map(v => `<li>${v}</li>`).join('')}</ul>`;
            } else {
                displayValue = 'None found.';
            }
        } else {
            displayValue = value || 'Not Found';
        }

        card.innerHTML = `
            <div class="seo-card-content">
                <span class="seo-card-title">${metric.name}</span>
                <span class="seo-card-value">${displayValue}</span>
                <p class="seo-card-insight"><strong>Insight:</strong> ${metric.insight}</p>
            </div>
        `;
        seoOutput.appendChild(card);
    }
  }

  function displayError(error) {
    errorContainer.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    errorDetails.textContent = `Message: ${error.message}\n\nStack: ${error.stack}`;
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'WARN': return '⚠️';
      default: return 'ℹ️';
    }
  }

  // --- Data Export ---
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
    for (const [key, value] of Object.entries(data.qa)) {
      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const status = value.status || 'N/A';
      const details = (value.issues || []).join('; ');
      csv += `QA,"${title}","${status}","${details.replace(/"/g, '""')}"\n`;
    }
    for (const [key, value] of Object.entries(data.seo)) {
      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      let details = Array.isArray(value) ? value.map(v => v.src || v).join('; ') : value;
      if (typeof details === 'object' && details !== null) details = JSON.stringify(details);
      csv += `SEO,"${title}","DATA","${(details || 'Not Found').toString().replace(/"/g, '""')}"\n`;
    }
    return csv;
  }
});