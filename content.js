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
            tweetImages: 'div[data-testid="tweetPhoto"] img'
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
                
                // Only add if we have at least content or URL
                if (content || tweetUrl) {
                    extractedData.push({
                        content,
                        url: tweetUrl,
                        image_url: imageUrl,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            return extractedData;
        } catch (error) {
            console.error(`[DATA EXTRACTION ERROR] ${new Date().toISOString()} - ${error.message}`);
            return [];
        }
    }
}

// Browser-compatible DynamicLoader class
class DynamicLoader {
    constructor(dataExtractor) {
        this.dataExtractor = dataExtractor;
        this.scrollDelay = 2000;
        this.maxIterations = 1000; // Increased from 500 to 1000
        this.currentIteration = 0;
        this.patienceCounter = 0; // Add patience counter
        this.maxPatience = 5; // Try 5 times before giving up
    }

    async loadAllContent() {
        try {
            let previousHeight;
            let newHeight = document.body.scrollHeight;
            let allData = [];
            let statusDiv = document.querySelector('[data-wasurenbo-status]');
            let lastDataLength = 0;

            do {
                previousHeight = newHeight;
                
                // Extract data from current view
                const currentData = await this.dataExtractor.extract();
                
                // Log the data for debugging
                console.log('Current data:', currentData);
                
                if (currentData && currentData.length > 0) {
                    // Filter out duplicates before adding to allData
                    const newItems = currentData.filter(item => 
                        !allData.some(existing => existing.url === item.url)
                    );
                    
                    allData = [...allData, ...newItems];
                    
                    // Reset patience if we found new data
                    if (allData.length > lastDataLength) {
                        this.patienceCounter = 0;
                        lastDataLength = allData.length;
                    }
                }
                
                if (statusDiv) {
                    statusDiv.textContent = `Extracting bookmarks... (${allData.length} found)`;
                }
                
                // Scroll and wait for new content
                window.scrollBy(0, window.innerHeight);
                
                // Wait for content to load
                await new Promise(resolve => setTimeout(resolve, this.scrollDelay));
                
                newHeight = document.body.scrollHeight;
                this.currentIteration++;
                
                // If height didn't change, increment patience counter
                if (newHeight === previousHeight) {
                    this.patienceCounter++;
                } else {
                    // Reset patience if we scrolled successfully
                    this.patienceCounter = 0;
                }
                
                console.log(`Iteration ${this.currentIteration}: Previous height = ${previousHeight}, New height = ${newHeight}, Patience = ${this.patienceCounter}`);
                
            } while ((newHeight > previousHeight || this.patienceCounter < this.maxPatience) && 
                     this.currentIteration < this.maxIterations);

            return allData;
        } catch (error) {
            console.error(`[DYNAMIC LOADING ERROR] ${new Date().toISOString()} - ${error.message}`);
            return [];
        }
    }
}

// Modified version of your existing code to work as content script
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
        
        // Save data to Chrome storage - ACTUALLY CALL THE FUNCTION
        await saveData(allData);
        
        // Also save as CSV for backup
        const blob = new Blob([convertToCSV(allData)], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        chrome.runtime.sendMessage({
            action: 'download',
            filename: `bookmarks_${new Date().toISOString().replace(/:/g, '-')}.csv`,
            url: url
        });
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error extracting bookmarks: ' + error.message);
    }
})();

// Update the saveData function in your content.js
async function saveData(data) {
    try {
        // Send data to background script for storage
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'saveBookmarks',
                bookmarks: data
            }, response => {
                console.log('Bookmarks saved to Chrome storage:', response);
                
                // Update status message
                const statusDiv = document.querySelector('[data-wasurenbo-status]');
                if (statusDiv) {
                    statusDiv.textContent = `Saved ${data.length} bookmarks to Chrome storage.`;
                    setTimeout(() => {
                        statusDiv.remove();
                    }, 3000);
                }
                resolve(response);
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