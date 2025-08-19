// Ενιαίο Configuration System
// Διαχείριση μονοπατιών για desktop vs local περιβάλλοντα

(function() {
  'use strict';
  
  // Ανίχνευση περιβάλλοντος
  const isDesktop = !!(window.electronAPI || window.require || navigator.userAgent.includes('Electron'));
  const isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  
  // Ενιαίο configuration object
  window.__CONFIG__ = {
    // API endpoints
    annotatorApi: isDesktop ? 'http://127.0.0.1:5059' : 'http://localhost:5059',
    apiBase: isDesktop ? 'http://127.0.0.1:5059' : 'http://localhost:5059',
    
    // Asset paths
    assetsBase: './',
    cssBase: './css/',
    jsBase: './js/',
    
    // Environment flags
    isDesktop: isDesktop,
    isLocalDev: isLocalDev,
    isDevelopment: isLocalDev || location.hostname === 'localhost',
    
    // Timeouts and retries
    apiTimeout: 10000,
    maxRetries: 3,
    
    // Debug settings
    debug: false || new URLSearchParams(location.search).has('debug')
  };
  
  // Ασφαλείς συναρτήσεις φόρτωσης resources
  
  /**
   * Ασφαλής φόρτωση CSS αρχείων
   * @param {string} href - Το μονοπάτι του CSS αρχείου
   * @param {string} id - Προαιρετικό ID για το link element
   */
  window.safeLoadCss = function(href, id) {
    if (!href || typeof href !== 'string' || /undefined/.test(href)) {
      console.warn('safeLoadCss: Παράλειψη μη έγκυρου href:', href);
      return false;
    }
    
    // Έλεγχος αν το CSS έχει ήδη φορτωθεί
    if (id && document.getElementById(id)) {
      console.log('safeLoadCss: CSS ήδη φορτωμένο:', id);
      return true;
    }
    
    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = href;
      if (id) link.id = id;
      
      // Error handling
      link.onerror = function() {
        console.error('safeLoadCss: Αποτυχία φόρτωσης CSS:', href);
      };
      
      link.onload = function() {
        if (window.__CONFIG__.debug) {
          console.log('safeLoadCss: Επιτυχής φόρτωση CSS:', href);
        }
      };
      
      document.head.appendChild(link);
      return true;
    } catch (error) {
      console.error('safeLoadCss: Σφάλμα κατά τη φόρτωση CSS:', error);
      return false;
    }
  };
  
  /**
   * Ασφαλής φόρτωση JavaScript αρχείων
   * @param {string} src - Το μονοπάτι του JS αρχείου
   * @param {string} id - Προαιρετικό ID για το script element
   * @param {function} callback - Προαιρετική συνάρτηση callback
   */
  window.safeLoadJs = function(src, id, callback) {
    if (!src || typeof src !== 'string' || /undefined/.test(src)) {
      console.warn('safeLoadJs: Παράλειψη μη έγκυρου src:', src);
      if (callback) callback(false);
      return false;
    }
    
    // Έλεγχος αν το script έχει ήδη φορτωθεί
    if (id && document.getElementById(id)) {
      console.log('safeLoadJs: Script ήδη φορτωμένο:', id);
      if (callback) callback(true);
      return true;
    }
    
    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      if (id) script.id = id;
      
      // Error handling
      script.onerror = function() {
        console.error('safeLoadJs: Αποτυχία φόρτωσης script:', src);
        if (callback) callback(false);
      };
      
      script.onload = function() {
        if (window.__CONFIG__.debug) {
          console.log('safeLoadJs: Επιτυχής φόρτωση script:', src);
        }
        if (callback) callback(true);
      };
      
      document.head.appendChild(script);
      return true;
    } catch (error) {
      console.error('safeLoadJs: Σφάλμα κατά τη φόρτωση script:', error);
      if (callback) callback(false);
      return false;
    }
  };
  
  /**
   * Δημιουργία ασφαλούς URL με βάση το configuration
   * @param {string} path - Το σχετικό μονοπάτι
   * @param {string} type - Ο τύπος του resource ('api', 'css', 'js', 'assets')
   */
  window.buildSafeUrl = function(path, type = 'assets') {
    if (!path || typeof path !== 'string') {
      console.warn('buildSafeUrl: Μη έγκυρο path:', path);
      return '';
    }
    
    const config = window.__CONFIG__;
    let base;
    
    switch (type) {
      case 'api':
        base = config.apiBase;
        break;
      case 'css':
        base = config.cssBase;
        break;
      case 'js':
        base = config.jsBase;
        break;
      case 'assets':
      default:
        base = config.assetsBase;
        break;
    }
    
    // Καθαρισμός και συνδυασμός paths
    const cleanPath = path.replace(/^\/+/, '');
    const cleanBase = base.replace(/\/+$/, '');
    
    return `${cleanBase}/${cleanPath}`;
  };
  
  /**
   * Utility για έλεγχο διαθεσιμότητας API
   */
  window.checkApiHealth = async function() {
    try {
      const response = await fetch(`${window.__CONFIG__.apiBase}/api/health`, {
        method: 'GET',
        timeout: window.__CONFIG__.apiTimeout
      });
      return response.ok;
    } catch (error) {
      console.warn('checkApiHealth: API μη διαθέσιμο:', error.message);
      return false;
    }
  };
  
  // Debug logging
  if (window.__CONFIG__.debug) {
    console.log('Configuration loaded:', window.__CONFIG__);
  }
  
})();