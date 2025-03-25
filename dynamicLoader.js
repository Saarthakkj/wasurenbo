class DynamicLoader {
    constructor(page, dataExtractor) {
        this.page = page;
        this.dataExtractor = dataExtractor;
        this.scrollDelay = 2000;
        this.maxIterations = 100;
        this.currentIteration = 0;
    }

    async loadAllContent() {
        try {
            let previousHeight;
            let newHeight = await this.getPageHeight();
            let allData = [];

            do {
                previousHeight = newHeight;
                
                // Extract data from current view
                const currentData = await this.dataExtractor.extract();
                allData = [...allData, ...currentData];
                
                // Scroll and wait for new content
                await this.scrollPage();
                await this.page.waitForTimeout(this.scrollDelay);
                
                newHeight = await this.getPageHeight();
                this.currentIteration++;
                
            } while (newHeight > previousHeight && this.currentIteration < this.maxIterations);

            return allData;
        } catch (error) {
            this.handleError(error);
            return [];
        }
    }

    async scrollPage() {
        await this.page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
    }

    async getPageHeight() {
        return await this.page.evaluate(() => document.body.scrollHeight);
    }

    handleError(error) {
        console.error(`[DYNAMIC LOADING ERROR] ${new Date().toISOString()} - ${error.message}`);
        // Continue execution as per error handling strategy
    }
}

module.exports = DynamicLoader;