// Content script to display the daily bookmark
(function() {
  console.log('Bookmark display script loaded');
  
  // Check if we should display a bookmark
  chrome.storage.local.get(['currentBookmark', 'lastUpdated'], (result) => {
    console.log('Retrieved from storage:', result);
    if (result.currentBookmark) {
      displayBookmark(result.currentBookmark);
    } else {
      console.log('No current bookmark found in storage');
    }
  });
  
  // Listen for keyboard shortcut (Alt+B) to toggle bookmark visibility
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'b') {
      toggleBookmarkVisibility();
    }
  });
  
  function toggleBookmarkVisibility() {
    const container = document.getElementById('wasurenbo-bookmark-container');
    if (container) {
      container.remove();
    } else {
      chrome.storage.local.get(['currentBookmark'], (result) => {
        if (result.currentBookmark) {
          displayBookmark(result.currentBookmark);
        } else {
          console.log('No bookmark found to display');
          // Try to get a random bookmark if none is currently selected
          chrome.runtime.sendMessage({action: 'getRandomBookmark'}, (response) => {
            if (response && response.bookmark) {
              displayBookmark(response.bookmark);
            }
          });
        }
      });
    }
  }
  
  function displayBookmark(bookmark) {
    console.log('Displaying bookmark:', bookmark);
    
    // Remove existing container if present
    const existingContainer = document.getElementById('wasurenbo-bookmark-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create the bookmark display container
    const container = document.createElement('div');
    container.id = 'wasurenbo-bookmark-container';
    container.style.position = 'fixed';
    container.style.right = '10px';
    container.style.top = '50%';
    container.style.transform = 'translateY(-50%)';
    container.style.width = '300px';
    container.style.backgroundColor = '#000000'; // Changed to black
    container.style.color = '#ffffff'; // Added white text for contrast
    container.style.padding = '10px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
    container.style.zIndex = '9999';
    container.style.maxHeight = '400px';
    container.style.overflowY = 'auto';
    container.style.transition = 'opacity 0.3s, transform 0.3s';
    container.style.opacity = '0';
    
    // Create the header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '10px';
    
    const title = document.createElement('h3');
    title.textContent = 'Wasurenbo';
    title.style.margin = '0';
    
    // Create the content
    const content = document.createElement('div');
    content.textContent = bookmark.content || 'No content available';
    content.style.marginBottom = '10px';
    
    // Create the link if URL exists
    let link = null;
    if (bookmark.url) {
      link = document.createElement('a');
      link.href = bookmark.url;
      link.textContent = 'View on X';
      link.style.display = 'block';
      link.style.marginTop = '10px';
      link.style.color = '#1DA1F2';
      link.target = '_blank';
    }
    
    // Add "Show Another" button
    const showAnotherButton = document.createElement('button');
    showAnotherButton.textContent = 'Show Another';
    showAnotherButton.style.marginTop = '10px';
    showAnotherButton.style.padding = '5px 10px';
    showAnotherButton.style.backgroundColor = '#1DA1F2';
    showAnotherButton.style.color = 'white';
    showAnotherButton.style.border = 'none';
    showAnotherButton.style.borderRadius = '4px';
    showAnotherButton.style.cursor = 'pointer';
    showAnotherButton.onclick = () => {
      chrome.runtime.sendMessage({action: 'getRandomBookmark'}, (response) => {
        if (response && response.bookmark) {
          displayBookmark(response.bookmark);
        }
      });
    };
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => {
      container.style.opacity = '0';
      container.style.transform = 'translateY(-50%) translateX(100%)';
      setTimeout(() => container.remove(), 300);
    };
    
    // Assemble the container
    header.appendChild(title);
    header.appendChild(closeButton);
    
    container.appendChild(header);
    container.appendChild(content);
    if (link) {
      container.appendChild(link);
    }
    container.appendChild(showAnotherButton);
    
    // Add to the page
    document.body.appendChild(container);
    
    // Trigger animation
    setTimeout(() => {
      container.style.opacity = '1';
    }, 10);
    
    // Add click outside to minimize
    document.addEventListener('click', function clickOutside(event) {
      if (!container.contains(event.target)) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(-50%) translateX(100%)';
        setTimeout(() => container.remove(), 300);
        document.removeEventListener('click', clickOutside);
      }
    });
  }
})();