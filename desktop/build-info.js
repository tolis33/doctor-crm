// Build Information Script
// This script provides build version, commit, and timestamp information
// for both desktop and web versions to ensure synchronization

(function() {
    'use strict';
    
    // Generate current timestamp for this build
    const buildTimestamp = new Date().toISOString();
    
    // Build information object
    window.BUILD_INFO = {
        version: '1.4.2',
        commit: 'f8a9b2c', // This should be updated by build process
        builtAt: '2025-01-17T15:45:00Z',
        environment: typeof window.require !== 'undefined' ? 'desktop' : 'web',
        userAgent: navigator.userAgent.substring(0, 50) + '...'
    };
    
    // Log build information to console
    console.info('[BUILD]', window.BUILD_INFO);
    
    // Add build info to page title for easy identification
    if (document.title) {
        document.title += ` (v${window.BUILD_INFO.version})`;
    }
    
    // Create a global function to display build info
    window.showBuildInfo = function() {
        const info = window.BUILD_INFO;
        const message = `
Build Information:
` +
            `Version: ${info.version}
` +
            `Commit: ${info.commit}
` +
            `Built At: ${info.builtAt}
` +
            `Environment: ${info.environment}
` +
            `User Agent: ${info.userAgent}`;
        
        console.log(message);
        alert(message);
        return info;
    };
    
    // Add keyboard shortcut Ctrl+Shift+B to show build info
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'B') {
            e.preventDefault();
            window.showBuildInfo();
        }
    });
    
})();