## Wasurenbo Extension
Wasurenbo is a Chrome extension designed to extract bookmarks from X.com (formerly Twitter), store them, and display a random bookmark daily. This extension automates the process of fetching bookmarks and provides a user-friendly interface to view them.

### Installation
1. Clone the Repository :
   
   ```bash
   git clone https://github.com/yourusername/wasurenbo.git
    ```
   ```
2. Navigate to the Project Directory :
   
   ```bash
   cd c:\Users\Saarthak\Desktop\personal_projects\wasurenbo
    ```
   ```
3. Load the Extension in Chrome :
   
   - Open Chrome and navigate to chrome://extensions/ .
   - Enable "Developer mode" using the toggle switch.
   - Click "Load unpacked" and select the wasurenbo directory.
### How the Extension Works Bookmark Fetching Process
1. Authentication & Initialization :
   
   - Uses existing user session for authentication.
   - Initializes browser automation tools like Puppeteer or Selenium.
2. Navigation Phase :
   
   - Launches the browser and navigates to the X.com bookmarks page.
   - Verifies successful login state and handles potential redirects.
3. Data Extraction :
   
   - Implements DOM scraping using specified selectors to extract tweet text, URLs, and images.
   - Creates a data structure to store extracted elements.
4. Dynamic Loading :
   
   - Simulates scrolling with a delay to load more bookmarks.
   - Detects new elements loaded after each scroll and repeats extraction.
5. Data Storage :
   
   - Formats extracted data into CSV or JSON.
   - Saves data locally with a unique filename using a timestamp.
6. Scheduled Task :
   
   - Uses Chrome's alarm API for daily scheduling.
   - Fetches a random bookmark from stored data once a day.
7. Rendering :
   
   - Displays the selected bookmark in a side-div element on the page.
   - Provides user interaction handlers for toggling visibility and refreshing bookmarks.
### Problems and Additions (Future Versions) Problems
- Webhook for New Bookmarks : Need to intercept network requests for creating bookmarks.
- Handling Deleted Bookmarks : No network requests available for detecting deletions.
- Large Number of Bookmarks : Chrome storage may fail with more than 100 bookmarks; consider using IndexedDB.
- Dynamically Changing Bookmarks : Handle un-bookmarked tweets effectively. Additions
- Gemini API Integration : Use the Gemini API key to render related search results on the bookmark display.
- Enhanced UI : Improve the user interface with subtle animations and better error handling.
- Advanced Filtering : Allow users to filter bookmarks based on specific criteria.
### Conclusion
Wasurenbo is a powerful tool for managing bookmarks on X.com, providing automation and ease of use. Future versions aim to enhance functionality and address current limitations.