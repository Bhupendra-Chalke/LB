// This script runs in the background and acts as a link-checking service.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message is a request to check a link.
  if (request.action === "checkLink") {
    fetch(request.url, { method: 'HEAD' })
      .then(response => {
        // The link is considered valid if the status is anything other than a client or server error.
        // Statuses like 200 (OK), 301 (Redirect), etc., are considered valid.
        // We are primarily looking for 4xx (Client Error) or 5xx (Server Error).
        sendResponse({ url: request.url, status: response.status });
      })
      .catch(error => {
        // A failed fetch usually indicates a network error, DNS error, or CORS issue
        // that prevents the request. We'll flag this as an error.
        sendResponse({ url: request.url, status: 'error' });
      });
    // Return true to indicate that the response will be sent asynchronously.
    return true;
  }
});