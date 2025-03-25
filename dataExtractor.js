class DataExtractor {
    constructor(page) {
        this.page = page;
        this.selectors = {
            content: '.tweet-text, .post-content',
            urls: 'a[href]',
            images: 'img[src]'
        };
        this.extractedData = [];
    }

    async extract() {
        try {
            // Extract all elements
            const contents = await this.extractContents();
            const urls = await this.extractUrls();
            const images = await this.extractImages();

            // Combine data into structured format
            this.extractedData = contents.map((content, index) => ({
                content,
                url: urls[index] || null,
                image_url: images[index] || null,
                timestamp: new Date().toISOString()
            }));

            return this.extractedData;
        } catch (error) {
            this.handleError(error);
            return [];
        }
    }

    async extractContents() {
        return this.page.$$eval(this.selectors.content, elements => 
            elements.map(el => el.textContent.trim())
        );
    }

    async extractUrls() {
        return this.page.$$eval(this.selectors.urls, elements => 
            elements.map(el => el.href)
        );
    }

    async extractImages() {
        return this.page.$$eval(this.selectors.images, elements => 
            elements.map(el => el.src)
        );
    }

    handleError(error) {
        console.error(`[DATA EXTRACTION ERROR] ${new Date().toISOString()} - ${error.message}`);
        // Continue execution as per error handling strategy
    }
}

module.exports = DataExtractor;