const AuthManager = require('./auth');
const NavigationManager = require('./navigation');
const DataExtractor = require('./dataExtractor');
const DynamicLoader = require('./dynamicLoader');
const DataStorage = require('./dataStorage');
const authManager = new AuthManager();

(async () => {
    try {
        const { browser, page } = await authManager.initialize();
        
        // Navigation Phase
        const navigationManager = new NavigationManager(page);
        await navigationManager.navigate();
        
        // Data Extraction Phase
        const dataExtractor = new DataExtractor(page);
        const dynamicLoader = new DynamicLoader(page, dataExtractor);
        
        // Dynamic Loading Phase
        const allData = await dynamicLoader.loadAllContent();
        
        // Data Storage Phase
        const dataStorage = new DataStorage();
        const savedFilePath = await dataStorage.save(allData);
        console.log('Data saved to:', savedFilePath);
        
        // Continue with scheduled task phase
    } catch (error) {
        console.error('Process failed:', error);
    } finally {
        await authManager.close();
    }
})();