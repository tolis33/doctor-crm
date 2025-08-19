// Build Information Script
// This script provides build version, commit, and timestamp information
// for both desktop and web versions to ensure synchronization

(function() {
    'use strict';
    
    // Generate current timestamp for this build
    const buildTimestamp = new Date().toISOString();
    
    // Detect environment more accurately
    const isElectron = typeof window.require !== 'undefined' || 
                      typeof window.electronAPI !== 'undefined' ||
                      navigator.userAgent.includes('Electron');
    const isDesktop = isElectron || window.location.protocol === 'https:' && window.location.hostname === 'appassets';
    
    // Build information object - Updated dynamically by build process
    window.BUILD_INFO = {
        version: '1.4.4',
        commit: 'sync-fix-' + Date.now().toString(36), // Will be replaced by build script
        builtAt: buildTimestamp, // Current build timestamp
        environment: isDesktop ? 'desktop' : 'web',
        platform: isElectron ? 'electron' : 'browser',
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        buildNumber: Math.floor(Date.now() / 1000).toString(), // Unix timestamp as build number
        branch: 'main', // Git branch name
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        syncId: Date.now().toString(36) // Unique sync identifier
    };
    
    // Enhanced console logging with better formatting
    console.log('%c🔧 BUILD INFORMATION', 'color: #2196F3; font-weight: bold; font-size: 14px;');
    console.log('%c├─ Version: %c' + window.BUILD_INFO.version, 'color: #666;', 'color: #4CAF50; font-weight: bold;');
    console.log('%c├─ Environment: %c' + window.BUILD_INFO.environment + ' (' + window.BUILD_INFO.platform + ')', 'color: #666;', 'color: #FF9800; font-weight: bold;');
    console.log('%c├─ Commit: %c' + window.BUILD_INFO.commit, 'color: #666;', 'color: #9C27B0;');
    console.log('%c├─ Built At: %c' + window.BUILD_INFO.builtAt, 'color: #666;', 'color: #607D8B;');
    console.log('%c├─ Build Number: %c' + window.BUILD_INFO.buildNumber, 'color: #666;', 'color: #795548;');
    console.log('%c├─ Protocol: %c' + window.BUILD_INFO.protocol + '//' + window.BUILD_INFO.hostname, 'color: #666;', 'color: #E91E63;');
    console.log('%c└─ Sync ID: %c' + window.BUILD_INFO.syncId, 'color: #666;', 'color: #00BCD4; font-weight: bold;');
    
    // Additional sync verification log
    console.info('[BUILD] Sync verification - Environment:', window.BUILD_INFO.environment, 'Build:', window.BUILD_INFO.syncId);
    
    // Add build info to page title for easy identification
    if (document.title) {
        document.title += ` (v${window.BUILD_INFO.version})`;
    }
    
    // Create a global function to display build info
    window.showBuildInfo = function() {
        const info = window.BUILD_INFO;
        const message = `
π”§ BUILD INFORMATION:
` +
            `Version: ${info.version}
` +
            `Commit: ${info.commit}
` +
            `Built At: ${info.builtAt}
` +
            `Environment: ${info.environment}
` +
            `Build Number: ${info.buildNumber}
` +
            `Branch: ${info.branch}
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
