// Background script for Wasurenbo extension

chrome.runtime.onInstalled.addListener(async () => {
  // Set up alarm for daily bookmark selection
  chrome.alarms.create('dailyBookmark', {
    periodInMinutes: 1440 // Once per day (60 min * 24 hours)
  });
  
  console.log('Wasurenbo extension installed and initialized');
});

// Handle the alarm event
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyBookmark') {
    selectRandomBookmark();
  }
});

// Handle message from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.action);
  
  if (request.action === 'getRandomBookmark') {
    // Handle request for a random bookmark
    selectRandomBookmark()
      .then(bookmark => {
        console.log('Sending random bookmark to content script:', bookmark);
        sendResponse({ success: true, bookmark: bookmark });
      })
      .catch(error => {
        console.error('Error getting random bookmark:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// Function to select a random bookmark
async function selectRandomBookmark() {
  try {
    // Get all bookmarks from Chrome storage
    const data = await chrome.storage.local.get(['allBookmarks']);
    const bookmarks = data.allBookmarks || [];
    
    if (bookmarks.length === 0) {
      console.log('No bookmarks found in storage');
      return null;
    }
    
    // Select a random bookmark
    const randomIndex = Math.floor(Math.random() * bookmarks.length);
    const selectedBookmark = bookmarks[randomIndex];
    
    console.log('Selected bookmark:', selectedBookmark);
    
    // Store the selected bookmark in Chrome storage for quick access
    // Also set bookmarkVisible to true to ensure it displays
    await chrome.storage.local.set({ 
      currentBookmark: selectedBookmark,
      bookmarkVisible: true,
      lastUpdated: new Date().toISOString()
    });
    
    return selectedBookmark;
  } catch (error) {
    console.error('Error selecting random bookmark:', error);
    throw error;
  }
}

// Helper function for making rate-limited requests
async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    if (response.status === 429) {
      // retry after the time specified in the response header
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) {
        console.warn(`Rate limit exceeded. Retrying in ${retryAfter} seconds.`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return makeRequest(url, options);
      } else {
        console.warn(`Rate limit exceeded. Retrying in 10 seconds.`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        return makeRequest(url, options);
      }
    }
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
}

// When extension icon is clicked, redirect to X.com bookmarks page
chrome.action.onClicked.addListener(async (tab) => {
  // Check if we're already on the bookmarks page
  if (tab.url.includes('x.com/i/bookmarks')) {
    // If already on bookmarks page, execute content script to extract bookmarks
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } else {
    // If not on bookmarks page, navigate to it
    await chrome.tabs.update(tab.id, { url: 'https://x.com/i/bookmarks' });
  }
});