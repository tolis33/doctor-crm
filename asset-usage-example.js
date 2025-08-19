// asset-usage-example.js - Παράδειγμα χρήσης του asset-config.js
// Δείχνει πως να φορτώνεις CSS/JS assets με default values

(function() {
    'use strict';
    
    // Περίμενε να φορτωθεί το asset-config.js
    function waitForAssetConfig(callback) {
        if (window.assetConfig && window.safeLoadCss) {
            callback();
        } else {
            setTimeout(() => waitForAssetConfig(callback), 100);
        }
    }
    
    // Παράδειγμα 1: Φόρτωση CSS με default values
    function loadEssentialStyles() {
        // Χρήση των helper functions
        window.assetHelpers.loadFontAwesome();
        window.assetHelpers.loadTheme();
        window.assetHelpers.loadMainCss();
        
        console.log('✅ Essential styles loaded with defaults');
    }
    
    // Παράδειγμα 2: Φόρτωση με custom configuration
    function loadCustomAssets() {
        // Διάβασε από storage με fallback
        const customConfig = {
            annotatorCss: window.storageGet('annotatorCss') || './annotator.css',
            faCss: window.storageGet('faCss') || './assets/fa/all.min.css',
            themeCss: window.storageGet('themeCss') || './css/theme.css'
        };
        
        // Φόρτωσε με validation
        window.safeLoadCss(customConfig.annotatorCss, 'annotatorCss');
        window.safeLoadCss(customConfig.faCss, 'faCss');
        window.safeLoadCss(customConfig.themeCss, 'themeCss');
        
        console.log('✅ Custom assets loaded:', customConfig);
    }
    
    // Παράδειγμα 3: Batch loading με error handling
    async function loadAssetsWithErrorHandling() {
        try {
            // Φόρτωσε όλα τα essential CSS
            const cssResults = await window.batchLoaders.loadEssentialCss();
            console.log('CSS loading results:', cssResults);
            
            // Φόρτωσε όλα τα essential JS
            const jsResults = await window.batchLoaders.loadEssentialJs();
            console.log('JS loading results:', jsResults);
            
            // Φόρτωσε annotator assets
            const annotatorResults = await window.batchLoaders.loadAnnotatorAssets();
            console.log('Annotator loading results:', annotatorResults);
            
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }
    
    // Παράδειγμα 4: Conditional loading βάσει page type
    function loadPageSpecificAssets(pageType) {
        const assetMap = {
            'annotator': () => {
                window.assetHelpers.loadAnnotatorCss();
                window.assetHelpers.loadAnnotatorJs();
            },
            'crm': () => {
                window.assetHelpers.loadMainCss();
                window.assetHelpers.loadBootstrap();
                window.assetHelpers.loadFontAwesome();
            },
            'analysis': () => {
                window.assetHelpers.loadMainCss();
                window.assetHelpers.loadFontAwesome();
                window.assetHelpers.loadUtils();
            }
        };
        
        const loader = assetMap[pageType];
        if (loader) {
            loader();
            console.log(`✅ ${pageType} assets loaded`);
        } else {
            console.warn(`Unknown page type: ${pageType}`);
        }
    }
    
    // Παράδειγμα 5: Dynamic asset loading με user preferences
    function loadUserPreferredAssets() {
        // Διάβασε user preferences από storage
        const userPrefs = window.storageGet('userPreferences', {});
        
        // Theme selection με fallback
        const selectedTheme = userPrefs.theme || 'default';
        const themeMap = {
            'default': window.assetConfig.themeCss,
            'dark': window.storageGet('darkThemeCss') || './css/dark-theme.css',
            'light': window.storageGet('lightThemeCss') || './css/light-theme.css'
        };
        
        const themePath = themeMap[selectedTheme] || themeMap.default;
        window.safeLoadCss(themePath, `theme-${selectedTheme}`);
        
        // Font size preference
        const fontSize = userPrefs.fontSize || 'medium';
        if (fontSize !== 'medium') {
            const fontCssPath = window.storageGet(`font${fontSize}Css`) || `./css/font-${fontSize}.css`;
            window.safeLoadCss(fontCssPath, `font-${fontSize}`);
        }
        
        console.log(`✅ User preferred assets loaded: theme=${selectedTheme}, fontSize=${fontSize}`);
    }
    
    // Παράδειγμα 6: Asset validation και debugging
    function validateAndDebugAssets() {
        if (window.debugAssets) {
            console.log('🔍 Asset Configuration:');
            window.debugAssets.showConfig();
            
            console.log('🔍 Asset Validation:');
            const validationResults = window.debugAssets.validateAll();
            
            // Βρες τα assets που έχουν πρόβλημα
            const invalidAssets = Object.entries(validationResults)
                .filter(([key, isValid]) => !isValid)
                .map(([key]) => key);
            
            if (invalidAssets.length > 0) {
                console.warn('⚠️ Invalid assets found:', invalidAssets);
                
                // Προσπάθησε να τα φορτώσεις με fallbacks
                invalidAssets.forEach(assetName => {
                    console.log(`🔧 Testing asset: ${assetName}`);
                    window.debugAssets.testAsset(assetName);
                });
            } else {
                console.log('✅ All assets are valid');
            }
        }
    }
    
    // Εξαγωγή functions για global χρήση
    window.assetUsageExamples = {
        loadEssentialStyles,
        loadCustomAssets,
        loadAssetsWithErrorHandling,
        loadPageSpecificAssets,
        loadUserPreferredAssets,
        validateAndDebugAssets
    };
    
    // Auto-initialization όταν φορτωθεί η σελίδα
    waitForAssetConfig(() => {
        console.log('📦 Asset Usage Examples loaded');
        
        // Αν είμαστε σε development mode, κάνε validation
        if (window.APP_ENV === 'development') {
            validateAndDebugAssets();
        }
        
        // Φόρτωσε essential assets αυτόματα
        loadEssentialStyles();
    });
    
})();

/* 
=== ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ ===

1. Βασική χρήση:
   window.assetUsageExamples.loadEssentialStyles();

2. Φόρτωση για συγκεκριμένη σελίδα:
   window.assetUsageExamples.loadPageSpecificAssets('annotator');

3. Φόρτωση με error handling:
   window.assetUsageExamples.loadAssetsWithErrorHandling();

4. Debug και validation:
   window.assetUsageExamples.validateAndDebugAssets();

5. Custom configuration:
   // Στο localStorage ή sessionStorage:
   localStorage.setItem('annotatorCss', './custom/annotator.css');
   localStorage.setItem('faCss', './custom/fontawesome.css');
   
   // Μετά φόρτωσε:
   window.assetUsageExamples.loadCustomAssets();

6. User preferences:
   localStorage.setItem('userPreferences', JSON.stringify({
     theme: 'dark',
     fontSize: 'large'
   }));
   window.assetUsageExamples.loadUserPreferredAssets();
*/