document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggleBookmark');
  const refreshBtn = document.getElementById('refreshBookmark');
  
  // Toggle bookmark visibility
  toggleBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleBookmark'}, function(response) {
        console.log('Toggle bookmark response:', response);
      });
    });
  });
  
  // Refresh bookmark
  refreshBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'refreshBookmark'}, function(response) {
        console.log('Refresh bookmark response:', response);
      });
    });
  });
});