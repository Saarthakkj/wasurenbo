// Helper function to convert data to CSV
function convertToCSV(data) {
    // Add header row
    const header = ['content', 'url', 'image_url', 'timestamp'];
    const csvRows = [header.join(',')];
    
    // Add data rows
    for (const item of data) {
        const values = header.map(key => {
            const value = item[key] || '';
            // Escape quotes and wrap in quotes if contains comma
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

// Browser-compatible DataExtractor class
class DataExtractor {
    constructor() {
        this.selectors = {
            // Target the article elements which contain each bookmark
            content: 'article[data-testid="tweet"]',
            // Target the actual tweet text
            tweetText: '[data-testid="tweetText"]',
            // Target the tweet URL (which appears in the timestamp link)
            tweetUrl: 'a[href*="/status/"]',
                // Target actual tweet images, not profile pictures
            tweetImages: 'div[data-testid="tweetPhoto"] img',
            // Target retweet information
            retweetIndicator: '[data-testid="socialContext"]',
            // Target quoted tweet container
            quotedTweet: '[data-testid="tweet"] [role="link"][tabindex="0"]'
        };
        this.extractedData = [];
    }

    async extract() {
        try {
            const bookmarks = document.querySelectorAll(this.selectors.content);
            const extractedData = [];
            
            bookmarks.forEach(bookmark => {
                // Extract tweet text
                const tweetTextElement = bookmark.querySelector(this.selectors.tweetText);
                const content = tweetTextElement ? tweetTextElement.textContent.trim() : '';
                
                // Extract tweet URL
                const tweetUrlElement = bookmark.querySelector(this.selectors.tweetUrl);
                const tweetUrl = tweetUrlElement ? tweetUrlElement.href : '';
                
                // Extract tweet image (if any)
                const tweetImageElement = bookmark.querySelector(this.selectors.tweetImages);
                const imageUrl = tweetImageElement ? tweetImageElement.src : '';
                
                // Check if this is a retweet
                const retweetElement = bookmark.querySelector(this.selectors.retweetIndicator);
                const isRetweet = retweetElement !== null;
                const retweetedBy = isRetweet ? retweetElement.textContent.trim() : '';
                
                // Check if this is a quoted tweet
                const quotedTweetElement = bookmark.querySelector(this.selectors.quotedTweet);
                const hasQuotedTweet = quotedTweetElement !== null;
                
                // Extract quoted tweet info if present
                let quotedTweet = null;
                if (hasQuotedTweet) {
                    const quotedTextElement = quotedTweetElement.querySelector(this.selectors.tweetText);
                    const quotedUrlElement = quotedTweetElement.querySelector(this.selectors.tweetUrl);
                    const quotedImageElement = quotedTweetElement.querySelector(this.selectors.tweetImages);
                    
                    quotedTweet = {
                        content: quotedTextElement ? quotedTextElement.textContent.trim() : '',
                        url: quotedUrlElement ? quotedUrlElement.href : '',
                        image_url: quotedImageElement ? quotedImageElement.src : ''
                    };
                }
                
                // Only add if we have at least content or URL
                if (content || tweetUrl) {
                    extractedData.push({
                        content,
                        url: tweetUrl,
                        image_url: imageUrl,
                        timestamp: new Date().toISOString(),
                        isRetweet,
                        retweetedBy,
                        hasQuotedTweet,
                        quotedTweet
                    });
                }
            });
            
            console.log(`Extracted ${extractedData.length} bookmarks`);
            return extractedData;
        } catch (error) {
            console.error('Error extracting data:', error);
            return [];
        }
    }
}

// Browser-compatible DynamicLoader class
class DynamicLoader {
    constructor(dataExtractor) {
        this.dataExtractor = dataExtractor;
        this.scrollDelay = 5000; // Increased from 3000 to 5000 ms to avoid rate limiting
        this.maxIterations = 20; // Reduced from 50 to 20
        this.patienceThreshold = 5;
    }

    async loadBookmarks() {
        console.log('Starting bookmark extraction...');
        let previousHeight = 0;
        let patience = 0;
        let bookmarks = [];
        let iteration = 0;

        while (iteration < this.maxIterations && patience < this.patienceThreshold) {
            iteration++;
            
            // Extract bookmarks from current view
            const newBookmarks = await this.dataExtractor.extract();
            
            // Merge with existing bookmarks (avoiding duplicates)
            bookmarks = this.mergeBookmarks(bookmarks, newBookmarks);
            
            console.log('Current data: ', bookmarks);
            
            // Scroll down to load more content
            await this.scrollPage();
            
            // Wait for content to load - increased delay
            await new Promise(resolve => setTimeout(resolve, this.scrollDelay));
            
            // Check if we've reached the end
            const newHeight = document.documentElement.scrollHeight;
            console.log(`Iteration ${iteration}: Previous height = ${previousHeight}, New height = ${newHeight}, Patience = ${patience}`);
            
            if (newHeight === previousHeight) {
                patience++;
            } else {
                patience = 0;
                previousHeight = newHeight;
            }
            
            // Add a longer pause every 3 iterations to avoid rate limiting
            if (iteration % 3 === 0) {
                console.log('Taking a longer break to avoid rate limiting...');
                await new Promise(resolve => setTimeout(resolve, 8000));
            }
        }
        
        console.log(`Extraction complete. Found ${bookmarks.length} bookmarks.`);
        return bookmarks;
    }

    // Alias method to match the call in the main execution code
    async loadAllContent() {
        return this.loadBookmarks();
    }

    async scrollPage() {
        window.scrollBy(0, window.innerHeight / 2); // Scroll half a page to be less aggressive
    }

    mergeBookmarks(existingBookmarks, newBookmarks) {
        // Create a map of existing URLs for quick lookup
        const existingUrls = new Set(existingBookmarks.map(b => b.url));
        
        // Filter out duplicates from new bookmarks
        const uniqueNewBookmarks = newBookmarks.filter(bookmark => !existingUrls.has(bookmark.url));
        
        // Return combined array
        return [...existingBookmarks, ...uniqueNewBookmarks];
    }
}

(async () => {
    try {
        console.log('Starting bookmark extraction...');
        
        // Create a status indicator
        const statusDiv = document.createElement('div');
        statusDiv.setAttribute('data-wasurenbo-status', 'true');
        statusDiv.style.position = 'fixed';
        statusDiv.style.top = '10px';
        statusDiv.style.right = '10px';
        statusDiv.style.padding = '10px';
        statusDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        statusDiv.style.color = 'white';
        statusDiv.style.borderRadius = '5px';
        statusDiv.style.zIndex = '9999';
        statusDiv.textContent = 'Extracting bookmarks...';
        document.body.appendChild(statusDiv);
        
        // Initialize and run the bookmark extraction
        const dataExtractor = new DataExtractor();
        const dynamicLoader = new DynamicLoader(dataExtractor);
        const allData = await dynamicLoader.loadAllContent();
        
        statusDiv.textContent = `Extracted ${allData.length} bookmarks. Saving...`;
        
        // Save data to Chrome storage only - removed CSV functionality
        await saveData(allData);
        
        // Update status message
        statusDiv.textContent = `Saved ${allData.length} bookmarks to Chrome storage.`;
        setTimeout(() => {
            statusDiv.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error extracting bookmarks: ' + error.message);
    }
})();

// Update the saveData function in your content.js
// Update the saveData function to use chrome.storage.local instead of IndexedDB
async function saveData(data) {
    try {
        // Save directly to chrome.storage.local instead of sending to background script
        return new Promise((resolve, reject) => {
            // Get existing bookmarks first
            chrome.storage.local.get(['allBookmarks'], (result) => {
                const existingBookmarks = result.allBookmarks || [];
                
                // Merge with new bookmarks (avoiding duplicates)
                const existingUrls = new Set(existingBookmarks.map(b => b.url));
                const uniqueNewBookmarks = data.filter(bookmark => !existingUrls.has(bookmark.url));
                const allBookmarks = [...existingBookmarks, ...uniqueNewBookmarks];
                
                // Store in chrome.storage.local
                chrome.storage.local.set({
                    allBookmarks: allBookmarks,
                    totalBookmarkCount: allBookmarks.length,
                    lastUpdated: new Date().toISOString()
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error saving to chrome.storage.local:', chrome.runtime.lastError);
                        reject(chrome.runtime.lastError);
                    } else {
                        console.log(`Saved ${uniqueNewBookmarks.length} new bookmarks, total: ${allBookmarks.length}`);
                        
                        // Update status message
                        const statusDiv = document.querySelector('[data-wasurenbo-status]');
                        if (statusDiv) {
                            statusDiv.textContent = `Saved ${uniqueNewBookmarks.length} new bookmarks (total: ${allBookmarks.length})`;
                            setTimeout(() => {
                                statusDiv.remove();
                            }, 3000);
                        }
                        
                        resolve({ added: uniqueNewBookmarks.length, total: allBookmarks.length });
                    }
                });
            });
        });
    } catch (error) {
        console.error(`[SAVE ERROR] ${new Date().toISOString()} - ${error.message}`);
        
        // Show error in status div
        const statusDiv = document.querySelector('[data-wasurenbo-status]');
        if (statusDiv) {
            statusDiv.textContent = `Error saving bookmarks: ${error.message}`;
            statusDiv.style.color = 'red';
        }
        throw error;
    }
}