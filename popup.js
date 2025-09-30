document.addEventListener('DOMContentLoaded', () => {
  const runQaBtn = document.getElementById('run-qa-btn');
  const resultsDiv = document.getElementById('results');
  const qaOutput = document.getElementById('qa-output');
  const seoOutput = document.getElementById('seo-output');
  const tabs = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  const downloadJsonBtn = document.getElementById('download-json-btn');
  const downloadCsvBtn = document.getElementById('download-csv-btn');

  let fullReport = {};

  runQaBtn.addEventListener('click', () => {
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
      displayResults(fullReport);
      resultsDiv.classList.remove('hidden');
      runQaBtn.classList.add('hidden');
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
    qaOutput.textContent = JSON.stringify(data.qa, null, 2);
    seoOutput.textContent = JSON.stringify(data.seo, null, 2);
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
      const status = value.status || (value.issues && value.issues.length > 0 ? 'FAIL' : 'PASS');
      const details = value.details || (value.issues ? value.issues.join('; ') : '');
      csv += `QA,"${key}","${status}","${details.replace(/"/g, '""')}"\n`;
    }

    // SEO Data
    for (const [key, value] of Object.entries(data.seo)) {
        const details = Array.isArray(value) ? value.join('; ') : value;
        csv += `SEO,"${key}","DATA","${(details || 'Not Found').toString().replace(/"/g, '""')}"\n`;
    }

    return csv;
  }
});