document.addEventListener('DOMContentLoaded', function() {
  // Toggle bookmark display button
  document.getElementById('toggleBookmark').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleBookmarkVisibility'});
    });
  });
  
  // Get new random bookmark button
  document.getElementById('refreshBookmark').addEventListener('click', function() {
    chrome.runtime.sendMessage({action: 'getRandomBookmark'}, function(response) {
      if (response && response.success) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'displayBookmark',
            bookmark: response.bookmark
          });
        });
      }
    });
  });
});