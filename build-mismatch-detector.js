// Build Mismatch Detection System
// Ανιχνεύει αλλαγές στο build version και κάνει hard reload

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        CHECK_INTERVAL: 30000, // 30 seconds
        BANNER_DURATION: 10000, // 10 seconds
        STORAGE_KEY: 'stomadiagnosis_build_version',
        API_ENDPOINT: '/health' // Endpoint που επιστρέφει build info
    };
    
    let currentBuild = null;
    let storedBuild = null;
    let checkInterval = null;
    let bannerElement = null;
    
    // Initialize build detection
    function init() {
        // Get current build from global variables
        currentBuild = window.BUILD_INFO?.version || window.APP_BUILD || 'unknown';
        
        // Get stored build from localStorage
        storedBuild = localStorage.getItem(CONFIG.STORAGE_KEY);
        
        console.log('[BuildDetector] Current build:', currentBuild);
        console.log('[BuildDetector] Stored build:', storedBuild);
        
        // If no stored build, save current and start monitoring
        if (!storedBuild) {
            localStorage.setItem(CONFIG.STORAGE_KEY, currentBuild);
            storedBuild = currentBuild;
        }
        
        // Check for immediate mismatch
        if (storedBuild !== currentBuild) {
            handleBuildMismatch();
        }
        
        // Start periodic checking
        startPeriodicCheck();
    }
    
    // Start periodic build checking
    function startPeriodicCheck() {
        if (checkInterval) {
            clearInterval(checkInterval);
        }
        
        checkInterval = setInterval(async () => {
            try {
                await checkForBuildUpdate();
            } catch (error) {
                console.warn('[BuildDetector] Check failed:', error.message);
            }
        }, CONFIG.CHECK_INTERVAL);
        
        console.log('[BuildDetector] Periodic checking started');
    }
    
    // Check for build updates via API
    async function checkForBuildUpdate() {
        if (!window.API_BASE) {
            return; // No API base configured
        }
        
        try {
            const response = await fetch(`${window.API_BASE}${CONFIG.API_ENDPOINT}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            let data = null;
            try { data = await response.json(); } catch {}
            if (!response.ok || !data) {
                throw new Error('Invalid API response');
            }
            const serverBuild = data.build || data.version || 'unknown';
            
            console.log('[BuildDetector] Server build:', serverBuild);
            
            if (serverBuild !== currentBuild && serverBuild !== 'unknown') {
                console.log('[BuildDetector] Build mismatch detected!');
                handleBuildMismatch(serverBuild);
            }
        } catch (error) {
            // Silently fail - server might be down
            console.debug('[BuildDetector] API check failed:', error.message);
        }
    }
    
    // Handle build mismatch
    function handleBuildMismatch(newBuild = null) {
        console.warn('[BuildDetector] Build mismatch detected!');
        console.warn('[BuildDetector] Current:', currentBuild);
        console.warn('[BuildDetector] Expected:', storedBuild);
        if (newBuild) {
            console.warn('[BuildDetector] Server:', newBuild);
        }
        
        // Show banner
        showMismatchBanner(newBuild);
        
        // Update stored build
        if (newBuild) {
            localStorage.setItem(CONFIG.STORAGE_KEY, newBuild);
        }
    }
    
    // Show build mismatch banner
    function showMismatchBanner(newBuild = null) {
        // Remove existing banner
        if (bannerElement) {
            bannerElement.remove();
        }
        
        // Create banner
        bannerElement = document.createElement('div');
        bannerElement.id = 'build-mismatch-banner';
        bannerElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 999999;
            animation: slideDown 0.3s ease-out;
            cursor: pointer;
        `;
        
        const message = newBuild 
            ? `🔄 Νέα έκδοση διαθέσιμη (${newBuild}). Κάντε κλικ για ανανέωση.`
            : `🔄 Ανιχνεύθηκε αλλαγή έκδοσης. Κάντε κλικ για ανανέωση.`;
            
        bannerElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span>${message}</span>
                <button id="reload-btn" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                ">Ανανέωση Τώρα</button>
                <button id="dismiss-btn" style="
                    background: transparent;
                    border: none;
                    color: white;
                    padding: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.7;
                ">×</button>
            </div>
        `;
        
        // Add animation keyframes
        if (!document.getElementById('build-banner-styles')) {
            const style = document.createElement('style');
            style.id = 'build-banner-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                #build-mismatch-banner:hover #reload-btn {
                    background: rgba(255,255,255,0.3);
                    transform: scale(1.05);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add event listeners
        bannerElement.addEventListener('click', (e) => {
            if (e.target.id === 'dismiss-btn') {
                dismissBanner();
            } else {
                performHardReload();
            }
        });
        
        // Insert banner
        document.body.insertBefore(bannerElement, document.body.firstChild);
        
        // Auto-dismiss after duration
        setTimeout(() => {
            if (bannerElement && bannerElement.parentNode) {
                dismissBanner();
            }
        }, CONFIG.BANNER_DURATION);
        
        console.log('[BuildDetector] Banner displayed');
    }
    
    // Dismiss banner
    function dismissBanner() {
        if (bannerElement) {
            bannerElement.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => {
                if (bannerElement && bannerElement.parentNode) {
                    bannerElement.remove();
                    bannerElement = null;
                }
            }, 300);
        }
    }
    
    // Perform hard reload with cache clearing
    function performHardReload() {
        console.log('[BuildDetector] Performing hard reload...');
        
        try {
            // Clear various caches
            clearAllCaches();
            
            // Force reload with cache bypass
            if (window.location.reload) {
                window.location.reload(true); // Force reload
            } else {
                window.location.href = window.location.href;
            }
        } catch (error) {
            console.error('[BuildDetector] Hard reload failed:', error);
            // Fallback to normal reload
            window.location.reload();
        }
    }
    
    // Clear all possible caches
    async function clearAllCaches() {
        const promises = [];
        
        try {
            // Clear localStorage (except essential data)
            const essentialKeys = ['stomadiagnosis_patients', 'stomadiagnosis_settings'];
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !essentialKeys.includes(key)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn('[BuildDetector] Failed to remove localStorage key:', key);
                }
            });
            
            console.log('[BuildDetector] localStorage cleared (except essential data)');
        } catch (error) {
            console.warn('[BuildDetector] localStorage clear failed:', error);
        }
        
        try {
            // Clear sessionStorage
            sessionStorage.clear();
            console.log('[BuildDetector] sessionStorage cleared');
        } catch (error) {
            console.warn('[BuildDetector] sessionStorage clear failed:', error);
        }
        
        try {
            // Clear IndexedDB
            if ('indexedDB' in window) {
                const databases = await indexedDB.databases();
                for (const db of databases) {
                    if (db.name && !db.name.includes('essential')) {
                        promises.push(
                            new Promise((resolve) => {
                                const deleteReq = indexedDB.deleteDatabase(db.name);
                                deleteReq.onsuccess = () => {
                                    console.log('[BuildDetector] IndexedDB cleared:', db.name);
                                    resolve();
                                };
                                deleteReq.onerror = () => {
                                    console.warn('[BuildDetector] IndexedDB clear failed:', db.name);
                                    resolve();
                                };
                            })
                        );
                    }
                }
            }
        } catch (error) {
            console.warn('[BuildDetector] IndexedDB clear failed:', error);
        }
        
        try {
            // Clear Cache API
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    promises.push(
                        caches.delete(cacheName).then(() => {
                            console.log('[BuildDetector] Cache cleared:', cacheName);
                        }).catch((error) => {
                            console.warn('[BuildDetector] Cache clear failed:', cacheName, error);
                        })
                    );
                }
            }
        } catch (error) {
            console.warn('[BuildDetector] Cache API clear failed:', error);
        }
        
        // Wait for all cache clearing operations
        await Promise.allSettled(promises);
        console.log('[BuildDetector] All caches cleared');
    }
    
    // Public API
    window.BuildMismatchDetector = {
        init,
        checkNow: checkForBuildUpdate,
        forceReload: performHardReload,
        showBanner: () => showMismatchBanner(),
        clearCaches: clearAllCaches
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        setTimeout(init, 100);
    }
    
    console.log('[BuildDetector] Module loaded');
})();