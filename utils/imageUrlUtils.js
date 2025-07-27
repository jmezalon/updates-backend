/**
 * Backend utility to handle image URL conversion
 * Ensures production URLs are stored and served correctly
 */

/**
 * Get the base URL for the current environment
 * @returns {string} The base URL for the current environment
 */
function getBaseUrl() {
    // Check if we're in production (Heroku)
    if (process.env.NODE_ENV === 'production' || process.env.HEROKU_APP_NAME) {
        return `https://${process.env.HEROKU_APP_NAME || 'updates-backend-api-beebc8cc747c'}.herokuapp.com`;
    }
    
    // Check for custom production URL
    if (process.env.PRODUCTION_URL) {
        return process.env.PRODUCTION_URL;
    }
    
    // Default to localhost for development
    return `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Convert a file path to a full URL
 * @param {string} filePath - The file path (e.g., '/uploads/image.png')
 * @returns {string} The full URL
 */
function getFullImageUrl(filePath) {
    if (!filePath) return null;
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    
    // If it's a relative path, make it absolute
    const baseUrl = getBaseUrl();
    return filePath.startsWith('/') ? `${baseUrl}${filePath}` : `${baseUrl}/${filePath}`;
}

/**
 * Fix existing localhost URLs in database records
 * @param {string} imageUrl - The image URL to fix
 * @returns {string} The corrected URL
 */
function fixImageUrl(imageUrl) {
    if (!imageUrl) return imageUrl;
    
    const localhostPatterns = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'localhost:3000',
        '127.0.0.1:3000'
    ];
    
    const productionBaseUrl = getBaseUrl();
    
    // Replace localhost patterns with production URL
    for (const pattern of localhostPatterns) {
        if (imageUrl.includes(pattern)) {
            return imageUrl.replace(new RegExp(pattern, 'g'), productionBaseUrl);
        }
    }
    
    // If it's a relative path, make it absolute
    if (imageUrl.startsWith('/uploads/')) {
        return `${productionBaseUrl}${imageUrl}`;
    }
    
    return imageUrl;
}

/**
 * Middleware to fix image URLs in API responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function fixImageUrlsMiddleware(req, res, next) {
    const originalJson = res.json;
    
    res.json = function(data) {
        // Fix image URLs in the response data
        const fixedData = fixImageUrlsInObject(data);
        return originalJson.call(this, fixedData);
    };
    
    next();
}

/**
 * Recursively fix image URLs in an object
 * @param {any} obj - The object to process
 * @returns {any} The object with fixed URLs
 */
function fixImageUrlsInObject(obj) {
    if (!obj) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => fixImageUrlsInObject(item));
    }
    
    if (typeof obj === 'object') {
        const fixed = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key.includes('image_url') || key.includes('avatar') || key.includes('logo')) {
                fixed[key] = fixImageUrl(value);
            } else {
                fixed[key] = fixImageUrlsInObject(value);
            }
        }
        return fixed;
    }
    
    return obj;
}

module.exports = {
    getBaseUrl,
    getFullImageUrl,
    fixImageUrl,
    fixImageUrlsMiddleware,
    fixImageUrlsInObject
};
