// Content script to display the daily bookmark
(function() {
  console.log('Bookmark display script loaded');
  
  // Check if we should display a bookmark and in what state (minimized or not)
  chrome.storage.local.get(['currentBookmark', 'lastUpdated', 'bookmarkVisible', 'bookmarkMinimized'], (result) => {
    console.log('Retrieved from storage:', result);
    
    // Check if we're on X.com or a subdomain
    const isXDomain = window.location.hostname.includes('x.com');
    
    // Debug the condition
    console.log('Current bookmark exists:', !!result.currentBookmark);
    
    // Only display the bookmark if it exists and we're on X.com
    if (result.currentBookmark && isXDomain) {
      // If bookmarkVisible is undefined (first time) or true, display the bookmark
      // Force display for first time use
      const shouldDisplay = result.bookmarkVisible === undefined ? true : result.bookmarkVisible;
      console.log('Should display bookmark:', shouldDisplay);
      
      if (shouldDisplay) {
        displayBookmark(result.currentBookmark, result.bookmarkMinimized || false);
        // Ensure bookmarkVisible is set to true
        chrome.storage.local.set({ bookmarkVisible: true });
      } else {
        console.log('Bookmark is hidden by user preference');
      }
    } else {
      console.log('No current bookmark found in storage or not on X.com');
      
      // Try to get a random bookmark if none is currently selected
      chrome.runtime.sendMessage({action: 'getRandomBookmark'}, (response) => {
        if (response && response.success && response.bookmark && isXDomain) {
          console.log('Retrieved random bookmark:', response.bookmark);
          displayBookmark(response.bookmark, false);
          // Store that the bookmark is now visible and not minimized
          chrome.storage.local.set({ 
            currentBookmark: response.bookmark,
            bookmarkVisible: true,
            bookmarkMinimized: false
          });
        } else {
          console.log('No bookmarks available or error getting random bookmark');
        }
      });
    }
  });
  
  // Listen for keyboard shortcut (Alt+B) to toggle bookmark visibility
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'b') {
      toggleBookmarkVisibility();
    }
  });
  
  // Listen for messages from popup or background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleBookmark') {
      toggleBookmarkVisibility();
      sendResponse({ success: true });
    } else if (message.action === 'refreshBookmark') {
      // Handle refresh bookmark action
      chrome.runtime.sendMessage({action: 'getRandomBookmark'}, (response) => {
        if (response && response.success && response.bookmark) {
          // Get current minimized state
          chrome.storage.local.get(['bookmarkMinimized'], (result) => {
            const minimized = result.bookmarkMinimized || false;
            displayBookmark(response.bookmark, minimized);
            chrome.storage.local.set({ 
              currentBookmark: response.bookmark,
              bookmarkVisible: true
            });
          });
        }
      });
      sendResponse({ success: true });
    }
    return true; // Keep the message channel open for async response
  });
  
  // Listen for page navigation events
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Page has become visible (after navigation or tab switch)
      checkAndRestoreBookmark();
    }
  });

  // Also check when the window is focused
  window.addEventListener('focus', checkAndRestoreBookmark);

  function checkAndRestoreBookmark() {
    // Check if bookmark should be visible
    chrome.storage.local.get(['currentBookmark', 'bookmarkVisible', 'bookmarkMinimized'], (result) => {
      const container = document.getElementById('wasurenbo-bookmark-container');
      const isXDomain = window.location.hostname.includes('x.com');
      if (result.bookmarkVisible && result.currentBookmark && !container && isXDomain) {
        displayBookmark(result.currentBookmark, result.bookmarkMinimized || false);
      }
    });
  }
  
  function toggleBookmarkVisibility() {
    const container = document.getElementById('wasurenbo-bookmark-container');
    const isXDomain = window.location.hostname.includes('x.com');
    if (container) {
      container.remove();
      // Store that the bookmark is now hidden
      chrome.storage.local.set({ bookmarkVisible: false });
    } else if (isXDomain) {
      chrome.storage.local.get(['currentBookmark', 'bookmarkMinimized'], (result) => {
        if (result.currentBookmark) {
          displayBookmark(result.currentBookmark, result.bookmarkMinimized || false);
          // Store that the bookmark is now visible
          chrome.storage.local.set({ bookmarkVisible: true });
        } else {
          console.log('No bookmark found to display');
          // Try to get a random bookmark if none is currently selected
          chrome.runtime.sendMessage({action: 'getRandomBookmark'}, (response) => {
            if (response && response.success && response.bookmark) {
              displayBookmark(response.bookmark, false);
              // Store that the bookmark is now visible and not minimized
              chrome.storage.local.set({ 
                currentBookmark: response.bookmark,
                bookmarkVisible: true,
                bookmarkMinimized: false
              });
            }
          });
        }
      });
    }
  }
  
  function toggleMinimizeState(bookmark) {
    const container = document.getElementById('wasurenbo-bookmark-container');
    const content = document.getElementById('wasurenbo-bookmark-content');
    const minimizeBtn = document.getElementById('wasurenbo-minimize-btn');
    const maximizeBtn = document.getElementById('wasurenbo-maximize-btn');
    
    if (content.style.display === 'none') {
        // Maximize
        content.style.display = 'block';
        minimizeBtn.style.display = 'inline-block';
        maximizeBtn.style.display = 'none';
        container.style.width = '300px';
        
        // Update storage
        chrome.storage.local.set({ bookmarkMinimized: false });
    } else {
        // Minimize
        content.style.display = 'none';
        minimizeBtn.style.display = 'none';
        maximizeBtn.style.display = 'inline-block';
        container.style.width = '150px';
        
        // Update storage
        chrome.storage.local.set({ bookmarkMinimized: true });
    }
  }
  
  function displayBookmark(bookmark, minimized = false) {
    console.log('Displaying bookmark:', bookmark, 'Minimized:', minimized);
    
    // Remove existing container if present
    const existingContainer = document.getElementById('wasurenbo-bookmark-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = 'wasurenbo-bookmark-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: ${minimized ? '150px' : '300px'};
      max-height: ${minimized ? '50px' : '80vh'};
      background-color: #15202b;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #e7e9ea;
      transition: width 0.3s ease, max-height 0.3s ease;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid #38444d;
      background-color: #1d2c3d;
      flex-shrink: 0;
    `;
    
    // Create title container with logo and text
    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    // Create logo
    const logo = document.createElement('a');
    logo.href = 'https://x.com/curlydazai';
    logo.target = '_blank';
    logo.style.cssText = `
      display: block;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      overflow: hidden;
    `;
    
    const logoImg = document.createElement('img');
    logoImg.src = chrome.runtime.getURL('icons/logo.jpg');
    logoImg.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    logo.appendChild(logoImg);
    
    // Create title
    const title = document.createElement('div');
    title.textContent = 'Random Bookmark';
    title.style.cssText = `
      font-weight: bold;
      color: #e7e9ea;
    `;
    
    // Assemble title container
    titleContainer.appendChild(logo);
    titleContainer.appendChild(title);
    
    // Add title container to header
    header.appendChild(titleContainer);
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 8px;
    `;
    
    // Create minimize button
    const minimizeBtn = document.createElement('button');
    minimizeBtn.id = 'wasurenbo-minimize-btn';
    minimizeBtn.innerHTML = '&#8722;'; // Minus sign
    minimizeBtn.style.cssText = `
      background: none;
      border: none;
      color: #e7e9ea;
      font-size: 16px;
      cursor: pointer;
      display: ${minimized ? 'none' : 'inline-block'};
    `;
    
    // Create maximize button
    const maximizeBtn = document.createElement('button');
    maximizeBtn.id = 'wasurenbo-maximize-btn';
    maximizeBtn.innerHTML = '&#9633;'; // Box symbol (□) instead of plus sign
    maximizeBtn.style.cssText = `
      background: none;
      border: none;
      color: #e7e9ea;
      font-size: 16px;
      cursor: pointer;
      display: ${minimized ? 'inline-block' : 'none'};
    `;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#10005;'; // X sign
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #e7e9ea;
      font-size: 16px;
      cursor: pointer;
    `;
    
    // Assemble buttons container
    buttonsContainer.appendChild(minimizeBtn);
    buttonsContainer.appendChild(maximizeBtn);
    buttonsContainer.appendChild(closeBtn);
    
    // Add buttons container to header
    header.appendChild(buttonsContainer);
    
    // Add header to container
    container.appendChild(header);
    
    // Create content container with scrolling
    const content = document.createElement('div');
    content.id = 'wasurenbo-bookmark-content';
    content.style.cssText = `
      padding: 15px;
      display: ${minimized ? 'none' : 'block'};
      overflow-y: auto;
      max-height: calc(80vh - 50px);
      scrollbar-width: thin;
      scrollbar-color: #38444d #15202b;
    `;
    
    // Add custom scrollbar styling for webkit browsers
    const style = document.createElement('style');
    style.textContent = `
      #wasurenbo-bookmark-content::-webkit-scrollbar {
        width: 8px;
      }
      #wasurenbo-bookmark-content::-webkit-scrollbar-track {
        background: #15202b;
      }
      #wasurenbo-bookmark-content::-webkit-scrollbar-thumb {
        background-color: #38444d;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
    
    // Add retweet indicator if this is a retweet
    if (bookmark.isRetweet && bookmark.retweetedBy) {
      const retweetIndicator = document.createElement('div');
      retweetIndicator.style.cssText = `
        color: #8899a6;
        font-size: 13px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
      `;
      
      // Add retweet icon
      const retweetIcon = document.createElement('span');
      retweetIcon.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#8899a6" style="margin-right: 5px;">
          <g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g>
        </svg>
      `;
      
      const retweetText = document.createElement('span');
      retweetText.textContent = bookmark.retweetedBy;
      
      retweetIndicator.appendChild(retweetIcon);
      retweetIndicator.appendChild(retweetText);
      content.appendChild(retweetIndicator);
    }
    
    // Add tweet text
    const tweetText = document.createElement('p');
    tweetText.textContent = bookmark.content;
    tweetText.style.cssText = `
      margin: 0 0 15px 0;
      line-height: 1.4;
      word-break: break-word;
    `;
    content.appendChild(tweetText);
    
    // Add image if available
    if (bookmark.image_url) {
      const image = document.createElement('img');
      image.src = bookmark.image_url;
      image.style.cssText = `
        max-width: 100%;
        border-radius: 8px;
        margin-bottom: 15px;
      `;
      content.appendChild(image);
    }
    
    // Add quoted tweet if available
    if (bookmark.hasQuotedTweet && bookmark.quotedTweet) {
      const quotedTweet = document.createElement('div');
      quotedTweet.style.cssText = `
        border: 1px solid #38444d;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
        background-color: rgba(255, 255, 255, 0.03);
      `;
      
      // Add quoted tweet text
      if (bookmark.quotedTweet.content) {
        const quotedText = document.createElement('p');
        quotedText.textContent = bookmark.quotedTweet.content;
        quotedText.style.cssText = `
          margin: 0 0 10px 0;
          line-height: 1.4;
          font-size: 14px;
          word-break: break-word;
        `;
        quotedTweet.appendChild(quotedText);
      }
      
      // Add quoted tweet image if available
      if (bookmark.quotedTweet.image_url) {
        const quotedImage = document.createElement('img');
        quotedImage.src = bookmark.quotedTweet.image_url;
        quotedImage.style.cssText = `
          max-width: 100%;
          border-radius: 6px;
        `;
        quotedTweet.appendChild(quotedImage);
      }
      
      content.appendChild(quotedTweet);
    }
    
    // Add link to original tweet
    const link = document.createElement('a');
    link.href = bookmark.url;
    link.textContent = 'View on X';
    link.target = '_blank';
    link.style.cssText = `
      display: inline-block;
      color: #1d9bf0;
      text-decoration: none;
      margin-top: 5px;
    `;
    content.appendChild(link);
    
    // Add "View Another Tweet" button
    const viewAnotherBtn = document.createElement('button');
    viewAnotherBtn.textContent = 'View Another Tweet';
    viewAnotherBtn.style.cssText = `
      display: block;
      margin-top: 15px;
      padding: 8px 12px;
      background-color: #1d9bf0;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      width: 100%;
    `;
    viewAnotherBtn.onclick = () => {
      // Request a new random bookmark
      chrome.runtime.sendMessage({action: 'getRandomBookmark'}, (response) => {
        if (response && response.success && response.bookmark) {
          // Display the new bookmark with the same minimized state
          displayBookmark(response.bookmark, minimized);
        }
      });
    };
    content.appendChild(viewAnotherBtn);
    
    // Add timestamp
    if (bookmark.timestamp) {
      const timestamp = document.createElement('div');
      const date = new Date(bookmark.timestamp);
      timestamp.textContent = `Saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      timestamp.style.cssText = `
        color: #8899a6;
        font-size: 12px;
        margin-top: 10px;
      `;
      content.appendChild(timestamp);
    }
    
    // Add content to container
    container.appendChild(content);
    
    // Add to the document
    document.body.appendChild(container);
    
    // Add event listeners
    closeBtn.onclick = toggleBookmarkVisibility;
    minimizeBtn.onclick = () => toggleMinimizeState(bookmark);
    maximizeBtn.onclick = () => toggleMinimizeState(bookmark);
    
    // Store that the bookmark is now visible
    chrome.storage.local.set({ bookmarkVisible: true });
    
    return container;
}

// Create buttons container
const buttonsContainer = document.createElement('div');
buttonsContainer.style.cssText = `
  display: flex;
  gap: 8px;
`;

// Create minimize button
const minimizeBtn = document.createElement('button');
minimizeBtn.id = 'wasurenbo-minimize-btn';
minimizeBtn.innerHTML = '&#8722;'; // Minus sign
minimizeBtn.style.cssText = `
  background: none;
  border: none;
  color: #e7e9ea;
  font-size: 16px;
  cursor: pointer;
  display: ${minimized ? 'none' : 'inline-block'};
`;

// Create maximize button
const maximizeBtn = document.createElement('button');
maximizeBtn.id = 'wasurenbo-maximize-btn';
maximizeBtn.innerHTML = '&#43;'; // Plus sign
maximizeBtn.style.cssText = `
  background: none;
  border: none;
  color: #e7e9ea;
  font-size: 16px;
  cursor: pointer;
  display: ${minimized ? 'inline-block' : 'none'}; // Ensure this logic is correct
`;

// Create close button
const closeBtn = document.createElement('button');
closeBtn.innerHTML = '&#10005;'; // X sign
closeBtn.style.cssText = `
  background: none;
  border: none;
  color: #e7e9ea;
  font-size: 16px;
  cursor: pointer;
`;

// Create content container with scrolling
const content = document.createElement('div');
content.id = 'wasurenbo-bookmark-content';
content.style.cssText = `
  padding: 15px;
  display: ${minimized ? 'none' : 'block'};
  overflow-y: auto;
  max-height: calc(80vh - 50px);
  scrollbar-width: thin;
  scrollbar-color: #38444d #15202b;
`;

// Add custom scrollbar styling for webkit browsers
const style = document.createElement('style');
style.textContent = `
  #wasurenbo-bookmark-content::-webkit-scrollbar {
    width: 8px;
  }
  #wasurenbo-bookmark-content::-webkit-scrollbar-track {
    background: #15202b;
  }
  #wasurenbo-bookmark-content::-webkit-scrollbar-thumb {
    background-color: #38444d;
    border-radius: 4px;
  }
`;
document.head.appendChild(style);

// Add retweet indicator if this is a retweet
if (bookmark.isRetweet && bookmark.retweetedBy) {
  const retweetIndicator = document.createElement('div');
  retweetIndicator.style.cssText = `
    color: #8899a6;
    font-size: 13px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
  `;
  
  // Add retweet icon
  const retweetIcon = document.createElement('span');
  retweetIcon.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#8899a6" style="margin-right: 5px;">
      <g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g>
    </svg>
  `;
  
  const retweetText = document.createElement('span');
  retweetText.textContent = bookmark.retweetedBy;
  
  retweetIndicator.appendChild(retweetIcon);
  retweetIndicator.appendChild(retweetText);
  content.appendChild(retweetIndicator);
}

// Add tweet text
const tweetText = document.createElement('p');
tweetText.textContent = bookmark.content;
tweetText.style.cssText = `
  margin: 0 0 15px 0;
  line-height: 1.4;
  word-break: break-word;
`;
content.appendChild(tweetText);

// Add image if available
if (bookmark.image_url) {
  const image = document.createElement('img');
  image.src = bookmark.image_url;
  image.style.cssText = `
    max-width: 100%;
    border-radius: 8px;
    margin-bottom: 15px;
  `;
  content.appendChild(image);
}

// Add quoted tweet if available
if (bookmark.hasQuotedTweet && bookmark.quotedTweet) {
  const quotedTweet = document.createElement('div');
  quotedTweet.style.cssText = `
    border: 1px solid #38444d;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 15px;
    background-color: rgba(255, 255, 255, 0.03);
  `;
  
  // Add quoted tweet text
  if (bookmark.quotedTweet.content) {
    const quotedText = document.createElement('p');
    quotedText.textContent = bookmark.quotedTweet.content;
    quotedText.style.cssText = `
      margin: 0 0 10px 0;
      line-height: 1.4;
      font-size: 14px;
      word-break: break-word;
    `;
    quotedTweet.appendChild(quotedText);
  }
  
  // Add quoted tweet image if available
  if (bookmark.quotedTweet.image_url) {
    const quotedImage = document.createElement('img');
    quotedImage.src = bookmark.quotedTweet.image_url;
    quotedImage.style.cssText = `
      max-width: 100%;
      border-radius: 6px;
    `;
    quotedTweet.appendChild(quotedImage);
  }
  
  content.appendChild(quotedTweet);
}

// Add link to original tweet
const link = document.createElement('a');
link.href = bookmark.url;
link.textContent = 'View on X';
link.target = '_blank';
link.style.cssText = `
  display: inline-block;
  color: #1d9bf0;
  text-decoration: none;
  margin-top: 5px;
`;
content.appendChild(link);

// Add "View Another Tweet" button
const viewAnotherBtn = document.createElement('button');
viewAnotherBtn.textContent = 'View Another Tweet';
viewAnotherBtn.style.cssText = `
  display: block;
  margin-top: 15px;
  padding: 8px 12px;
  background-color: #1d9bf0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
`;
viewAnotherBtn.onclick = () => {
  // Request a new random bookmark
  chrome.runtime.sendMessage({action: 'getRandomBookmark'}, (response) => {
    if (response && response.success && response.bookmark) {
      // Display the new bookmark with the same minimized state
      displayBookmark(response.bookmark, minimized);
    }
  });
};
content.appendChild(viewAnotherBtn);

// Add timestamp
if (bookmark.timestamp) {
  const timestamp = document.createElement('div');
  const date = new Date(bookmark.timestamp);
  timestamp.textContent = `Saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  timestamp.style.cssText = `
    color: #8899a6;
    font-size: 12px;
    margin-top: 10px;
  `;
  content.appendChild(timestamp);
}

// Assemble the components
buttonsContainer.appendChild(minimizeBtn);
buttonsContainer.appendChild(maximizeBtn);
buttonsContainer.appendChild(closeBtn);

header.appendChild(titleContainer);
header.appendChild(buttonsContainer);

container.appendChild(header);
container.appendChild(content);

// Add to the document
document.body.appendChild(container);

// Add event listeners
closeBtn.onclick = toggleBookmarkVisibility;
minimizeBtn.onclick = () => toggleMinimizeState(bookmark);
maximizeBtn.onclick = () => toggleMinimizeState(bookmark);

// Store that the bookmark is now visible
chrome.storage.local.set({ bookmarkVisible: true });

return container;
}
)();
