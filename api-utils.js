// API Utilities - Fixes for annotator 404 and undefined asset fetches

/**
 * Validates that a value is not empty/undefined and throws descriptive error if it is
 * @param {any} value - The value to check
 * @param {string} name - The name of the parameter for error messages
 * @returns {any} The validated value
 * @throws {Error} If value is empty, null, undefined, or empty string
 */
function requireNonEmpty(value, name) {
    if (!value || value === 'undefined' || value === 'null' || (typeof value === 'string' && value.trim() === '')) {
        throw new Error(`${name} missing/empty/undefined`);
    }
    return value;
}

/**
 * Checks if the annotator API service is available
 * @param {string} apiBase - The API base URL (optional, uses config if not provided)
 * @param {number} timeout - Timeout in milliseconds (default: uses config)
 * @returns {Promise<boolean>} True if API is available, false otherwise
 */
async function checkApiAvailability(apiBase, timeout) {
    // Use config values if not provided
    const config = window.__CONFIG__ || {};
    apiBase = apiBase || config.annotatorApi || config.apiBase;
    timeout = timeout || config.apiTimeout || 3000;
    
    if (!apiBase || apiBase.trim() === '') {
        console.warn('[API Check] No API base URL provided in parameters or config');
        return false;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(`${apiBase}/api/health`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors'
        }).catch(() => null);
        
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
            if (config.debug) {
                console.log('[API Check] Annotator service is available at:', apiBase);
            }
            return true;
        } else if (response) {
            if (config.debug) {
                console.warn(`[API Check] Annotator service returned ${response.status} from ${apiBase}`);
            }
            return false;
        } else {
            // Network error or connection refused - silently fail
            return false;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            if (config.debug) {
                console.warn('[API Check] Annotator service check timed out');
            }
        } else {
            if (config.debug) {
                console.warn('[API Check] Annotator service is not available:', error.message);
            }
        }
        return false;
    }
}

/**
 * Safe asset URL builder that validates inputs
 * @param {string} basePath - The base path for assets
 * @param {string} relativePath - The relative path to the asset
 * @returns {string} The complete asset URL
 * @throws {Error} If any parameter is invalid
 */
function buildAssetUrl(basePath, relativePath) {
    const validBasePath = requireNonEmpty(basePath, 'basePath');
    const validRelativePath = requireNonEmpty(relativePath, 'relativePath');
    
    // Clean up paths
    const cleanBase = validBasePath.replace(/\/$/, '');
    const cleanRelative = validRelativePath.replace(/^\//, '');
    
    return `${cleanBase}/${cleanRelative}`;
}

/**
 * Enhanced assetUrl helper with validation
 * @param {string} path - The asset path
 * @returns {string} The complete asset URL or empty string if invalid
 */
function safeAssetUrl(path) {
    try {
        if (!path || typeof path !== 'string') {
            console.error('safeAssetUrl: invalid path', path);
            return '';
        }
        
        const assetsBase = window.ASSETS_BASE || './';
        return buildAssetUrl(assetsBase, path);
    } catch (error) {
        console.error('safeAssetUrl error:', error.message, 'for path:', path);
        return '';
    }
}

/**
 * Manages annotator feature availability based on API status
 */
class AnnotatorFeatureManager {
    constructor() {
        this.isApiAvailable = false;
        this.apiBase = '';
        this.checkInterval = null;
    }
    
    /**
     * Initialize the feature manager
     * @param {string} apiBase - The API base URL (optional, uses config if not provided)
     * @param {boolean} enablePeriodicCheck - Whether to periodically check API availability
     */
    async init(apiBase, enablePeriodicCheck = false) {
        // Use config values if not provided
        const config = window.__CONFIG__ || {};
        this.apiBase = apiBase || config.annotatorApi || config.apiBase || '';
        
        if (!this.apiBase) {
            console.warn('[AnnotatorFeatureManager] No API base URL available in config or parameters');
            this.isApiAvailable = false;
            this.updateUI();
            return;
        }
        
        // Skip API check to avoid network errors in browser console
        this.isApiAvailable = false;
        
        if (enablePeriodicCheck) {
            this.startPeriodicCheck();
        }
        
        this.updateUI();
    }
    
    /**
     * Check API status and update internal state
     */
    async checkApiStatus() {
        this.isApiAvailable = await checkApiAvailability(this.apiBase);
        return this.isApiAvailable;
    }
    
    /**
     * Start periodic API availability checking
     * @param {number} interval - Check interval in milliseconds (default: 30000)
     */
    startPeriodicCheck(interval = 30000) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(async () => {
            const wasAvailable = this.isApiAvailable;
            await this.checkApiStatus();
            
            // Update UI if status changed
            if (wasAvailable !== this.isApiAvailable) {
                this.updateUI();
            }
        }, interval);
    }
    
    /**
     * Stop periodic checking
     */
    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    /**
     * Update UI elements based on API availability
     */
    updateUI() {
        // Hide/show annotate buttons
        const annotateButtons = document.querySelectorAll('[data-action="annotate"], .annotate-btn, .btn-annotate');
        annotateButtons.forEach(button => {
            if (this.isApiAvailable) {
                button.style.display = '';
                button.disabled = false;
                button.title = 'Ανοίξτε τον annotator για επισημείωση';
            } else {
                button.style.display = 'none';
                button.disabled = true;
                button.title = 'Ο annotator service δεν είναι διαθέσιμος';
            }
        });
        
        // Update status indicators
        const statusIndicators = document.querySelectorAll('.api-status-indicator');
        statusIndicators.forEach(indicator => {
            indicator.textContent = this.isApiAvailable ? '🟢 API Διαθέσιμο' : '🔴 API Μη Διαθέσιμο';
            indicator.className = `api-status-indicator ${this.isApiAvailable ? 'available' : 'unavailable'}`;
        });
        
        console.log(`[AnnotatorFeatureManager] UI updated - API ${this.isApiAvailable ? 'available' : 'unavailable'}`);
    }
    
    /**
     * Get current API availability status
     * @returns {boolean} True if API is available
     */
    isAvailable() {
        return this.isApiAvailable;
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopPeriodicCheck();
    }
}

// Global instance
window.annotatorFeatureManager = new AnnotatorFeatureManager();

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        requireNonEmpty,
        checkApiAvailability,
        buildAssetUrl,
        safeAssetUrl,
        AnnotatorFeatureManager
    };
} else {
    // Browser environment - attach to window
    window.requireNonEmpty = requireNonEmpty;
    window.checkApiAvailability = checkApiAvailability;
    window.buildAssetUrl = buildAssetUrl;
    window.safeAssetUrl = safeAssetUrl;
    window.AnnotatorFeatureManager = AnnotatorFeatureManager;
}