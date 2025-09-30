document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const runQaBtn = document.getElementById('run-qa-btn');
  const initialView = document.getElementById('initial-view');
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const errorContainer = document.getElementById('error-container');
  const errorDetails = document.getElementById('error-details');

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
    if (message.type === 'QA_REPORT') {
      resultsDiv.classList.remove('hidden');
      displayResults(message.data);
    } else if (message.type === 'QA_ERROR') {
      loadingDiv.classList.add('hidden');
      errorContainer.classList.remove('hidden');
      displayError(message.error);
    } else if (message.type === 'QA_COMPLETE') {
      loadingDiv.classList.add('hidden');
      // If no report has been displayed and no error has occurred,
      // it means the check completed with no issues to report.
      if (resultsDiv.children.length === 0 && errorContainer.classList.contains('hidden')) {
        resultsDiv.classList.remove('hidden');
        resultsDiv.innerHTML = `<div class="all-clear-message">✅ No critical issues found.</div>`;
      }
    }
  });

  // --- UI Building Functions ---
  function displayResults(data) {
    resultsDiv.innerHTML = ''; // Clear previous results

    for (const key in data) {
      const result = data[key];
      const item = document.createElement('div');
      item.className = 'result-item';

      const hasIssues = result.issues && result.issues.length > 0;

      const header = document.createElement('div');
      header.className = 'result-header';

      const title = document.createElement('div');
      title.className = 'result-title';
      title.innerHTML = `
        <span class="status-icon status-${result.status}">${getStatusIcon(result.status)}</span>
        <span>${result.title}</span>
      `;

      const value = document.createElement('div');
      value.className = 'result-value';
      value.textContent = truncate(result.value || `${result.issues?.length || 0} issues`, 30);

      header.appendChild(title);
      header.appendChild(value);
      item.appendChild(header);

      if (hasIssues) {
        item.classList.add('is-expandable');
        const details = document.createElement('div');
        details.className = 'result-details';

        const issueList = document.createElement('ul');
        result.issues.forEach(issueText => {
          const listItem = document.createElement('li');
          listItem.textContent = issueText;
          issueList.appendChild(listItem);
        });
        details.appendChild(issueList);
        item.appendChild(details);

        header.addEventListener('click', () => {
          item.classList.toggle('expanded');
        });
      }

      resultsDiv.appendChild(item);
    }
  }

  function displayError(error) {
    errorContainer.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    errorDetails.textContent = `Message: ${error.message}`;
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'WARN': return '⚠️';
      default: return 'ℹ️';
    }
  }

  function truncate(str, n) {
      if (!str) return '';
      return (str.length > n) ? str.slice(0, n-1) + '…' : str;
  }
});