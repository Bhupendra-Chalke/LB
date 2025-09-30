document.addEventListener('DOMContentLoaded', () => {
  const scanButton = document.getElementById('scan-button');
  const reportDiv = document.getElementById('report');

  scanButton.addEventListener('click', async () => {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Show a loading message
    reportDiv.textContent = 'Scanning in progress...';

    // Execute the content script in the active tab
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // The result is an array, and we expect one result from our single script
      if (results && results[0] && results[0].result) {
        reportDiv.textContent = results[0].result;
      } else {
        reportDiv.textContent = 'Failed to get a report. The content script might have failed or returned no data.';
      }
    } catch (error) {
      console.error('Error executing script:', error);
      // Check if the error is because the user is on a restricted page
      if (error.message.includes('Cannot access a chrome:// URL') || error.message.includes('No tab with id')) {
          reportDiv.textContent = 'This extension cannot run on special browser pages (e.g., chrome://) or the New Tab page.';
      } else if (error.message.includes('No host permissions for the tab')) {
          reportDiv.textContent = 'This extension does not have permission to run on this page. Please ensure you are on a "https://www.canon.ie/store/" URL.';
      }
      else {
        reportDiv.textContent = `An error occurred: ${error.message}`;
      }
    }
  });
});