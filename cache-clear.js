// Cache Clear Utility for Development
// Clears service workers, cache, and storage for fresh development environment

(function() {
    'use strict';
    
    console.log('[CACHE-CLEAR] Starting cache clearing process...');
    
    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.port === '3000' ||
                         window.location.port === '8080';
    
    if (!isDevelopment) {
        console.log('[CACHE-CLEAR] Not in development mode, skipping cache clear');
        return;
    }
    
    /**
     * Clear all service workers
     */
    async function clearServiceWorkers() {
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log(`[CACHE-CLEAR] Found ${registrations.length} service worker registrations`);
                
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log('[CACHE-CLEAR] ✅ Service worker unregistered:', registration.scope);
                }
                
                if (registrations.length === 0) {
                    console.log('[CACHE-CLEAR] ✅ No service workers to clear');
                }
            } catch (error) {
                console.error('[CACHE-CLEAR] ❌ Error clearing service workers:', error);
            }
        } else {
            console.log('[CACHE-CLEAR] ✅ Service workers not supported');
        }
    }
    
    /**
     * Clear all caches
     */
    async function clearCaches() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                console.log(`[CACHE-CLEAR] Found ${cacheNames.length} caches`);
                
                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                    console.log('[CACHE-CLEAR] ✅ Cache deleted:', cacheName);
                }
                
                if (cacheNames.length === 0) {
                    console.log('[CACHE-CLEAR] ✅ No caches to clear');
                }
            } catch (error) {
                console.error('[CACHE-CLEAR] ❌ Error clearing caches:', error);
            }
        } else {
            console.log('[CACHE-CLEAR] ✅ Cache API not supported');
        }
    }
    
    /**
     * Clear local storage (development keys only)
     */
    function clearDevelopmentStorage() {
        try {
            const keysToRemove = [];
            
            // Find development-related keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.includes('dev-') ||
                    key.includes('debug-') ||
                    key.includes('cache-') ||
                    key.includes('temp-') ||
                    key.startsWith('_')
                )) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('[CACHE-CLEAR] ✅ Removed localStorage key:', key);
            });
            
            if (keysToRemove.length === 0) {
                console.log('[CACHE-CLEAR] ✅ No development storage keys to clear');
            }
        } catch (error) {
            console.error('[CACHE-CLEAR] ❌ Error clearing development storage:', error);
        }
    }
    
    /**
     * Clear session storage
     */
    function clearSessionStorage() {
        try {
            const sessionKeys = Object.keys(sessionStorage);
            sessionStorage.clear();
            console.log(`[CACHE-CLEAR] ✅ Cleared ${sessionKeys.length} session storage items`);
        } catch (error) {
            console.error('[CACHE-CLEAR] ❌ Error clearing session storage:', error);
        }
    }
    
    /**
     * Clear IndexedDB databases (development only)
     */
    async function clearIndexedDB() {
        if ('indexedDB' in window) {
            try {
                // Note: We can't easily enumerate all databases, so we'll try common ones
                const commonDbNames = ['cache-db', 'temp-db', 'dev-db', 'debug-db'];
                
                for (const dbName of commonDbNames) {
                    try {
                        const deleteReq = indexedDB.deleteDatabase(dbName);
                        await new Promise((resolve, reject) => {
                            deleteReq.onsuccess = () => {
                                console.log('[CACHE-CLEAR] ✅ IndexedDB deleted:', dbName);
                                resolve();
                            };
                            deleteReq.onerror = () => resolve(); // Ignore errors for non-existent DBs
                            deleteReq.onblocked = () => resolve();
                        });
                    } catch (error) {
                        // Ignore errors for non-existent databases
                    }
                }
            } catch (error) {
                console.error('[CACHE-CLEAR] ❌ Error clearing IndexedDB:', error);
            }
        }
    }
    
    /**
     * Main cache clearing function
     */
    async function clearAllCaches() {
        console.log('[CACHE-CLEAR] 🧹 Starting comprehensive cache clear...');
        
        await clearServiceWorkers();
        await clearCaches();
        clearDevelopmentStorage();
        clearSessionStorage();
        await clearIndexedDB();
        
        console.log('[CACHE-CLEAR] 🎉 Cache clearing completed!');
        
        // Show notification if possible
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Cache Cleared', {
                body: 'Development cache has been cleared successfully',
                icon: '/favicon.ico'
            });
        }
    }
    
    /**
     * Add cache clear button to page (development only)
     */
    function addClearCacheButton() {
        // Only add button if we're in development
        if (!isDevelopment) return;
        
        // Check if button already exists
        if (document.getElementById('dev-cache-clear-btn')) return;
        
        const button = document.createElement('button');
        button.id = 'dev-cache-clear-btn';
        button.innerHTML = '🧹 Clear Cache';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #ff4444;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-family: monospace;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.innerHTML = '🧹 Clearing...';
            
            await clearAllCaches();
            
            button.innerHTML = '✅ Cleared!';
            setTimeout(() => {
                button.innerHTML = '🧹 Clear Cache';
                button.disabled = false;
            }, 2000);
        });
        
        document.body.appendChild(button);
        console.log('[CACHE-CLEAR] 🔘 Cache clear button added to page');
    }
    
    // Auto-clear cache on page load in development
    if (isDevelopment) {
        // Clear cache automatically
        clearAllCaches();
        
        // Add clear button when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addClearCacheButton);
        } else {
            addClearCacheButton();
        }
        
        // Add keyboard shortcut (Ctrl+Shift+C)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                clearAllCaches();
            }
        });
        
        console.log('[CACHE-CLEAR] 🎯 Development cache management active');
        console.log('[CACHE-CLEAR] 💡 Use Ctrl+Shift+C to manually clear cache');
    }
    
    // Export for manual use
    window.clearDevelopmentCache = clearAllCaches;
    
})();