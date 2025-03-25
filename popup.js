document.getElementById('extractButton').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.includes('x.com/i/bookmarks')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
        window.close(); // Close the popup after initiating the extraction
    } else {
        document.querySelector('p').textContent = 'Please navigate to X Bookmarks page first!';
        document.querySelector('p').style.color = 'red';
    }
});