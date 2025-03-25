const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');

class DataStorage {
    constructor() {
        this.storageDir = path.join(__dirname, 'storage');
        this.ensureStorageDirectory();
    }

    ensureStorageDirectory() {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir);
        }
    }

    async save(data, format = 'csv') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `bookmarks_${timestamp}.${format}`;
            const filePath = path.join(this.storageDir, filename);

            if (format === 'csv') {
                const csvData = stringify(data, {
                    header: true,
                    columns: ['content', 'url', 'image_url', 'timestamp']
                });
                fs.writeFileSync(filePath, csvData);
            } else if (format === 'json') {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            }

            return filePath;
        } catch (error) {
            this.handleError(error);
            return null;
        }
    }

    handleError(error) {
        console.error(`[DATA STORAGE ERROR] ${new Date().toISOString()} - ${error.message}`);
        // Continue execution as per error handling strategy
    }
}

module.exports = DataStorage;