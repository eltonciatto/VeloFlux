/**
 * Utilitários comuns
 */

class Logger {
    constructor(name = 'Logger') {
        this.name = name;
        this.level = 'info';
    }

    static setLevel(level) {
        Logger.globalLevel = level;
    }

    info(message, ...args) {
        console.log(`ℹ️  [${this.name}] ${message}`, ...args);
    }

    success(message, ...args) {
        console.log(`✅ [${this.name}] ${message}`, ...args);
    }

    warn(message, ...args) {
        console.log(`⚠️  [${this.name}] ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`❌ [${this.name}] ${message}`, ...args);
    }

    debug(message, ...args) {
        if (this.level === 'debug' || Logger.globalLevel === 'debug') {
            console.log(`🐛 [${this.name}] ${message}`, ...args);
        }
    }
}

class FileUtils {
    static async ensureDirectory(dirPath) {
        const fs = require('fs').promises;
        await fs.mkdir(dirPath, { recursive: true });
    }

    static async fileExists(filePath) {
        const fs = require('fs').promises;
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

class StringUtils {
    static cleanString(str) {
        return str.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    }

    static capitalizeWords(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }
}

module.exports = {
    Logger,
    FileUtils,
    StringUtils
};