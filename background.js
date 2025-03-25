// Add scheduled task functionality to the existing background.js
chrome.runtime.onInstalled.addListener(async () => {
  // Set up alarm for daily bookmark selection
  chrome.alarms.create('dailyBookmark', {
    periodInMinutes: 1440 // Once per day (60 min * 24 hours)
  });
  
  // Check if storage already has data before initializing
  const data = await chrome.storage.local.get(['allBookmarks', 'currentBookmark', 'lastUpdated']);
  
  // Only initialize if data doesn't exist
  if (!data.allBookmarks) {
    console.log('Initializing storage with empty values');
    chrome.storage.local.set({ 
      currentBookmark: null,
      lastUpdated: null,
      allBookmarks: [] // Add storage for all bookmarks
    });
  } else {
    console.log(`Found existing data: ${data.allBookmarks.length} bookmarks`);
  }
  
  console.log('Wasurenbo extension installed and initialized');
});

// Handle the alarm event
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyBookmark') {
    selectRandomBookmark();
  }
});

// Handle message from content script for saving bookmarks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.action);
  
  if (request.action === 'saveBookmarks') {
    // Save bookmarks directly to Chrome storage
    saveBookmarksToStorage(request.bookmarks)
      .then(() => {
        console.log('Bookmarks saved successfully');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error saving bookmarks:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async sendResponse
  } else if (request.action === 'download') {
    // Handle CSV download
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: false
    });
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'getRandomBookmark') {
    // Get a random bookmark
    selectRandomBookmark()
      .then(bookmark => {
        console.log('Sending random bookmark to content script:', bookmark);
        sendResponse({ bookmark: bookmark });
      })
      .catch(error => {
        console.error('Error getting random bookmark:', error);
        sendResponse({ error: error.message });
      });
    return true; // Required for async sendResponse
  }
});

// Function to save bookmarks to Chrome storage
async function saveBookmarksToStorage(bookmarks) {
  try {
    console.log(`Attempting to save ${bookmarks.length} bookmarks to storage`);
    
    // Get existing bookmarks first
    const data = await chrome.storage.local.get(['allBookmarks']);
    let allBookmarks = data.allBookmarks || [];
    
    console.log(`Found ${allBookmarks.length} existing bookmarks`);
    
    // Add new bookmarks, avoiding duplicates
    const newBookmarks = bookmarks.filter(newBookmark => 
      !allBookmarks.some(existingBookmark => 
        existingBookmark.url === newBookmark.url
      )
    );
    
    console.log(`Adding ${newBookmarks.length} new bookmarks`);
    
    // Combine existing and new bookmarks
    allBookmarks = [...allBookmarks, ...newBookmarks];
    
    // If we exceed storage limits, keep only the most recent bookmarks
    if (allBookmarks.length > 500) {
      allBookmarks = allBookmarks.slice(-500);
    }
    
    // Save to Chrome storage
    await chrome.storage.local.set({ 
      allBookmarks: allBookmarks,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`Saved ${newBookmarks.length} new bookmarks. Total: ${allBookmarks.length}`);
    
    // Select a random bookmark right away
    await selectRandomBookmark();
    
    return true;
  } catch (error) {
    console.error('Error saving bookmarks to storage:', error);
    throw error;
  }
}

// Function to select a random bookmark from storage
async function selectRandomBookmark() {
  try {
    // Get all bookmarks from storage
    const data = await chrome.storage.local.get(['allBookmarks']);
    const bookmarks = data.allBookmarks || [];
    
    if (bookmarks.length === 0) {
      console.log('No bookmarks found in storage');
      return null;
    }
    
    console.log(`Selecting random bookmark from ${bookmarks.length} bookmarks`);
    
    // Select a random bookmark
    const randomIndex = Math.floor(Math.random() * bookmarks.length);
    const selectedBookmark = bookmarks[randomIndex];
    
    console.log('Selected bookmark:', selectedBookmark);
    
    // Store the selected bookmark
    await chrome.storage.local.set({ 
      currentBookmark: selectedBookmark,
      lastUpdated: new Date().toISOString()
    });
    
    return selectedBookmark;
  } catch (error) {
    console.error('Error selecting random bookmark:', error);
    return null;
  }
}

chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url.includes('x.com/i/bookmarks')) {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    }
});