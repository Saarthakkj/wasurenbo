const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AuthManager {
    constructor() {
        this.browser = null;
        this.page = null;
        this.sessionPath = path.join(__dirname, 'session.json');
        this.timeout = 30000; // 30 seconds
    }

    async initialize() {
        try {
            // Launch browser with existing session if available
            this.browser = await puppeteer.launch({
                headless: false,
                userDataDir: './user_data',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.page = await this.browser.newPage();
            this.page.setDefaultTimeout(this.timeout);

            // Load existing session if available
            if (fs.existsSync(this.sessionPath)) {
                const cookies = JSON.parse(fs.readFileSync(this.sessionPath));
                await this.page.setCookie(...cookies);
            }

            return { browser: this.browser, page: this.page };
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async saveSession() {
        const cookies = await this.page.cookies();
        fs.writeFileSync(this.sessionPath, JSON.stringify(cookies));
    }

    handleError(error) {
        console.error(`[AUTH ERROR] ${new Date().toISOString()} - ${error.message}`);
        // Continue execution as per error handling strategy
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

module.exports = AuthManager;