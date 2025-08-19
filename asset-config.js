// asset-config.js - Κεντρική διαχείριση asset paths με default values
// Αποφεύγει undefined URLs στα CSS/JS assets

(function() {
    'use strict';
    
    // Βεβαιωνόμαστε ότι υπάρχει η storageGet function
    if (typeof window.storageGet !== 'function') {
        console.warn('storageGet not available in asset-config.js - using localStorage fallback');
        window.storageGet = function(key, fallback = null) {
            try {
                const value = localStorage.getItem(key);
                if (!value) return fallback;
                
                // Έλεγχος αν η τιμή είναι έγκυρο JSON πριν το parse
                // Αν ξεκινά με { ή [ τότε είναι πιθανώς JSON object/array
                if (value.startsWith('{') || value.startsWith('[')) {
                    try {
                        return JSON.parse(value);
                    } catch (e) {
                        console.warn(`Invalid JSON in localStorage key "${key}":`, value);
                        return fallback;
                    }
                }
                
                // Για απλά strings (URLs, paths κλπ), επέστρεψε την τιμή όπως είναι
                return value;
            } catch (e) {
                console.error('localStorage get error:', e);
                return fallback;
            }
        };
    }
    
    // Κεντρική διαμόρφωση assets με default values
    const assetConfig = {
        // CSS Assets
        annotatorCss: storageGet('annotatorCss') || './annotator.css',
        faCss: storageGet('faCss') || './assets/fa/all.min.css',
        themeCss: storageGet('themeCss') || './css/theme.css',
        mainCss: storageGet('mainCss') || './css/main.css',
        bootstrapCss: storageGet('bootstrapCss') || './css/bootstrap.min.css',
        
        // JavaScript Assets
        mainJs: storageGet('mainJs') || './js/main.js',
        utilsJs: storageGet('utilsJs') || './utils.js',
        storageUtilsJs: storageGet('storageUtilsJs') || './storage-utils.js',
        annotatorJs: storageGet('annotatorJs') || './annotator.js',
        
        // External Library Assets (with CDN fallbacks)
        tensorflowJs: storageGet('tensorflowJs') || './assets/js/tf.min.js',
        dicomParserJs: storageGet('dicomParserJs') || './assets/js/dicom-parser.min.js',
        cornerstoneJs: storageGet('cornerstoneJs') || './assets/js/cornerstone-core.min.js',
        cornerstoneWebImageJs: storageGet('cornerstoneWebImageJs') || './assets/js/cornerstone-web-image-loader.min.js',
        cornerstoneWadoJs: storageGet('cornerstoneWadoJs') || './assets/js/cornerstone-wado-image-loader.min.js',
        cornerstoneToolsJs: storageGet('cornerstoneToolsJs') || './assets/js/cornerstone-tools.min.js',
        jsPdfJs: storageGet('jsPdfJs') || './assets/js/jspdf.umd.min.js',
        niftiReaderJs: storageGet('niftiReaderJs') || './assets/js/nifti-reader.js',
        
        // Image Assets
        logoPath: storageGet('logoPath') || './assets/images/logo.png',
        defaultAvatar: storageGet('defaultAvatar') || './assets/images/default-avatar.png',
        
        // API Endpoints
        apiBase: storageGet('apiBase') || window.API_BASE || 'http://localhost:5000',
        annotatorApiBase: storageGet('annotatorApiBase') || window.API_BASE || 'http://localhost:5000'
    };
    
    // Validation function για asset paths
    function validateAssetPath(path, assetName) {
        if (!path || path === 'undefined' || typeof path !== 'string') {
            console.warn(`Invalid asset path for ${assetName}:`, path, '- using fallback');
            return false;
        }
        return true;
    }
    
    // Enhanced loadCss function με validation
    function safeLoadCss(path, assetName = 'unknown') {
        if (!validateAssetPath(path, assetName)) {
            console.error(`Cannot load CSS asset ${assetName} - invalid path:`, path);
            return false;
        }
        
        const finalUrl = window.assetUrl ? window.assetUrl(path) : path;
        
        if (window.loadCss && typeof window.loadCss === 'function') {
            return window.loadCss(finalUrl);
        } else {
            // Fallback implementation
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = finalUrl;
            link.onerror = () => console.error(`Failed to load CSS: ${finalUrl}`);
            document.head.appendChild(link);
            return true;
        }
    }
    
    // Enhanced loadScript function με validation
    function safeLoadScript(path, assetName = 'unknown') {
        if (!validateAssetPath(path, assetName)) {
            console.error(`Cannot load JS asset ${assetName} - invalid path:`, path);
            return Promise.reject(new Error(`Invalid path for ${assetName}`));
        }
        
        const finalUrl = window.assetUrl ? window.assetUrl(path) : path;
        
        if (window.loadScript && typeof window.loadScript === 'function') {
            return window.loadScript(finalUrl);
        } else {
            // Fallback implementation
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = finalUrl;
                script.onload = resolve;
                script.onerror = () => {
                    console.error(`Failed to load script: ${finalUrl}`);
                    reject(new Error(`Failed to load ${assetName}`));
                };
                document.head.appendChild(script);
            });
        }
    }
    
    // Helper functions για συγκεκριμένα assets
    const assetHelpers = {
        loadAnnotatorCss: () => safeLoadCss(assetConfig.annotatorCss, 'annotatorCss'),
        loadFontAwesome: () => safeLoadCss(assetConfig.faCss, 'faCss'),
        loadTheme: () => safeLoadCss(assetConfig.themeCss, 'themeCss'),
        loadMainCss: () => safeLoadCss(assetConfig.mainCss, 'mainCss'),
        loadBootstrap: () => safeLoadCss(assetConfig.bootstrapCss, 'bootstrapCss'),
        
        loadMainJs: () => safeLoadScript(assetConfig.mainJs, 'mainJs'),
        loadUtils: () => safeLoadScript(assetConfig.utilsJs, 'utilsJs'),
        loadStorageUtils: () => safeLoadScript(assetConfig.storageUtilsJs, 'storageUtilsJs'),
        loadAnnotatorJs: () => safeLoadScript(assetConfig.annotatorJs, 'annotatorJs'),
        
        // External Library Loaders
        loadTensorFlow: () => safeLoadScript(assetConfig.tensorflowJs, 'tensorflowJs'),
        loadDicomParser: () => safeLoadScript(assetConfig.dicomParserJs, 'dicomParserJs'),
        loadCornerstone: () => safeLoadScript(assetConfig.cornerstoneJs, 'cornerstoneJs'),
        loadCornerstoneWebImage: () => safeLoadScript(assetConfig.cornerstoneWebImageJs, 'cornerstoneWebImageJs'),
        loadCornerstoneWado: () => safeLoadScript(assetConfig.cornerstoneWadoJs, 'cornerstoneWadoJs'),
        loadCornerstoneTools: () => safeLoadScript(assetConfig.cornerstoneToolsJs, 'cornerstoneToolsJs'),
        loadJsPdf: () => safeLoadScript(assetConfig.jsPdfJs, 'jsPdfJs'),
        loadNiftiReader: () => safeLoadScript(assetConfig.niftiReaderJs, 'niftiReaderJs')
    };
    
    // Batch loading functions
    const batchLoaders = {
        loadEssentialCss: function() {
            const promises = [
                assetHelpers.loadMainCss(),
                assetHelpers.loadBootstrap(),
                assetHelpers.loadFontAwesome()
            ];
            return Promise.allSettled(promises);
        },
        
        loadEssentialJs: function() {
            const promises = [
                assetHelpers.loadUtils(),
                assetHelpers.loadStorageUtils(),
                assetHelpers.loadMainJs()
            ];
            return Promise.allSettled(promises);
        },
        
        loadAnnotatorAssets: function() {
            const promises = [
                assetHelpers.loadAnnotatorCss(),
                assetHelpers.loadAnnotatorJs()
            ];
            return Promise.allSettled(promises);
        },
        
        loadDicomAssets: function() {
            const promises = [
                assetHelpers.loadDicomParser(),
                assetHelpers.loadCornerstone(),
                assetHelpers.loadCornerstoneWebImage(),
                assetHelpers.loadCornerstoneWado(),
                assetHelpers.loadCornerstoneTools()
            ];
            return Promise.allSettled(promises);
        },
        
        loadAiAssets: function() {
            const promises = [
                assetHelpers.loadTensorFlow()
            ];
            return Promise.allSettled(promises);
        }
    };
    
    // Εξαγωγή στο global scope
    window.assetConfig = assetConfig;
    window.safeLoadCss = safeLoadCss;
    window.safeLoadScript = safeLoadScript;
    window.assetHelpers = assetHelpers;
    window.batchLoaders = batchLoaders;
    
    // Debug information
    if (window.APP_ENV === 'development') {
        console.log('Asset Config initialized:', assetConfig);
        
        // Προσθήκη debug commands
        window.debugAssets = {
            showConfig: () => console.table(assetConfig),
            testAsset: (assetName) => {
                const path = assetConfig[assetName];
                if (path) {
                    console.log(`Testing asset ${assetName}:`, path);
                    if (assetName.includes('Css')) {
                        return safeLoadCss(path, assetName);
                    } else if (assetName.includes('Js')) {
                        return safeLoadScript(path, assetName);
                    }
                } else {
                    console.error(`Asset ${assetName} not found in config`);
                }
            },
            validateAll: () => {
                const results = {};
                Object.entries(assetConfig).forEach(([key, value]) => {
                    results[key] = validateAssetPath(value, key);
                });
                console.table(results);
                return results;
            }
        };
    }
    
    console.log('✅ Asset Config loaded successfully with default fallbacks');
})();