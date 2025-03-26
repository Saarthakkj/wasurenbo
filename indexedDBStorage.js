// IndexedDB storage manager for Wasurenbo
class IndexedDBStorage {
  constructor() {
    this.dbName = 'wasurenboBookmarks';
    this.dbVersion = 1;
    this.storeName = 'bookmarks';
    this.db = null;
    this.initDB();
  }

  // Initialize the database
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('IndexedDB connection established');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for bookmarks if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          
          // Create indexes for faster queries
          store.createIndex('url', 'url', { unique: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          
          console.log('Object store created');
        }
      };
    });
  }

  // Save bookmarks to IndexedDB
  async saveBookmarks(bookmarks) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each bookmark
      bookmarks.forEach(bookmark => {
        // Generate a unique ID if not present
        if (!bookmark.id) {
          bookmark.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        
        // Add timestamp if not present
        if (!bookmark.timestamp) {
          bookmark.timestamp = new Date().toISOString();
        }
        
        // Check for duplicates using the URL index
        const urlIndex = store.index('url');
        const urlRequest = urlIndex.getKey(bookmark.url);
        
        urlRequest.onsuccess = (e) => {
          if (e.target.result) {
            // URL already exists, update the bookmark
            const updateRequest = store.put(bookmark);
            
            updateRequest.onsuccess = () => {
              successCount++;
              if (successCount + errorCount === bookmarks.length) {
                resolve({ added: successCount, errors: errorCount });
              }
            };
            
            updateRequest.onerror = (error) => {
              console.error('Error updating bookmark:', error);
              errorCount++;
              if (successCount + errorCount === bookmarks.length) {
                resolve({ added: successCount, errors: errorCount });
              }
            };
          } else {
            // New URL, add the bookmark
            const addRequest = store.add(bookmark);
            
            addRequest.onsuccess = () => {
              successCount++;
              if (successCount + errorCount === bookmarks.length) {
                resolve({ added: successCount, errors: errorCount });
              }
            };
            
            addRequest.onerror = (error) => {
              console.error('Error adding bookmark:', error);
              errorCount++;
              if (successCount + errorCount === bookmarks.length) {
                resolve({ added: successCount, errors: errorCount });
              }
            };
          }
        };
      });
      
      transaction.onerror = (event) => {
        console.error('Transaction error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Get all bookmarks from IndexedDB
  async getAllBookmarks() {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting bookmarks:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Get a random bookmark
  async getRandomBookmark() {
    const bookmarks = await this.getAllBookmarks();
    
    if (bookmarks.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * bookmarks.length);
    return bookmarks[randomIndex];
  }

  // Delete a bookmark by URL
  async deleteBookmark(url) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('url');
      const request = index.getKey(url);
      
      request.onsuccess = (event) => {
        const key = event.target.result;
        if (key) {
          const deleteRequest = store.delete(key);
          
          deleteRequest.onsuccess = () => {
            resolve(true);
          };
          
          deleteRequest.onerror = (error) => {
            console.error('Error deleting bookmark:', error);
            reject(error);
          };
        } else {
          resolve(false); // Bookmark not found
        }
      };
      
      request.onerror = (event) => {
        console.error('Error finding bookmark:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Get the total number of bookmarks
  async getBookmarkCount() {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        resolve(countRequest.result);
      };
      
      countRequest.onerror = (event) => {
        console.error('Error counting bookmarks:', event.target.error);
        reject(event.target.error);
      };
    });
  }
}

// Make the class available globally for service worker
self.IndexedDBStorage = IndexedDBStorage;
