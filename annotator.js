// ---------- Hardening & Validation ----------
const qs = new URLSearchParams(location.search);
const id = qs.get('id') || '';

async function loadRecord(id) {
  // 1) από API, αλλά safe:
  const r = await fetch(`/api/images/${encodeURIComponent(id)}`);
  let rec = null;
  try { rec = await r.json(); } catch {}
  if (!r.ok || !rec) {
    console.warn('API not found, fallback to local store for id:', id);
    // 2) από localStorage/IndexedDB fallback
    try {
      const arr = JSON.parse(localStorage.getItem('images') || '[]');
      rec = arr.find(x => x.id === id) || null;
    } catch {}
  }
  return rec;
}

function pickSrc(rec) {
  return rec?.url || rec?.imageUrl || rec?.dataUrl || rec?.src || null;
}

// Initialize safely with fallback
let meta = null;
let imageId = id;

(async () => {
  if (!id) {
    console.error('No id provided in query');
    document.body.innerHTML = '<div style="padding:16px;color:#f66">Λείπει imageId — κλείστε το παράθυρο και ξαναδοκιμάστε.</div>';
    return;
  }
  const rec = await loadRecord(id);
  if (!rec) {
    console.error('Record not found for id:', id);
    document.body.innerHTML = '<div style="padding:16px;color:#f66">Δεν βρέθηκε η εικόνα για το συγκεκριμένο id.</div>';
    return;
  }
  const src = pickSrc(rec);
  if (!src) {
    console.error('Record found αλλά χωρίς url/src:', rec);
    document.body.innerHTML = '<div style="padding:16px;color:#f66">Η εγγραφή εικόνας δεν έχει URL.</div>';
    return;
  }
  
  // Store globally for use in other functions
  meta = rec;
  window.currentImageId = id;
  window.currentImageMeta = meta;
  
  // Test image loading
  const img = new Image();
  img.onload = () => {
    console.log('Image loaded successfully:', src);
    // Image is ready for Konva stage setup
    setupAnnotatorUI();
  };
  img.onerror = (e) => {
    console.error('Image load failed:', src, e);
    document.body.innerHTML = '<div style="padding:16px;color:#f66">Αποτυχία φόρτωσης εικόνας.</div>';
  };
  img.src = src;
})();

// ---------- Helpers ----------
const apiBase = (window.CONFIG && window.CONFIG.apiBase) ? window.CONFIG.apiBase.trim() : "";

// Enhanced error handling for API calls
function handleApiError(error, context = 'API call') {
  console.error(`[${context}] Error:`, error);
  
  if (error.name === 'AbortError') {
    return { error: 'Request timed out', type: 'timeout' };
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return { error: 'Network error - API service may be down', type: 'network' };
  } else {
    return { error: error.message || 'Unknown error', type: 'unknown' };
  }
}

// Guards για storage functions - αποφεύγει "storageGet is not defined" errors
if (typeof window.storageGet !== 'function') {
  console.warn('storageGet not available in annotator.js - using localStorage fallback');
  window.storageGet = function(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      console.error('localStorage get error:', e);
      return fallback;
    }
  };
  window.storageSet = function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('localStorage set error:', e);
      return false;
    }
  };
}

// Προφυλάξεις για ασφαλή χρήση URLs - χρησιμοποιούμε την ασφαλή συνάρτηση από storage-utils
function safeSetSrc(el, url) {
  if (!el) return;
  if (url && url !== 'undefined') {
    safeSetUrl(el, 'src', url);
  } else {
    el.removeAttribute('src');
  }
}

function safeSetHref(el, url) {
  if (!el) return;
  safeSetUrl(el, 'href', url || '#');
}

// helper για query params
function qs(name, def=null){ 
  return new URLSearchParams(location.search).get(name) || def; 
}

// διάβασε από localStorage αν δεν έχεις window.localStore
function getImageLocal(id){ 
  try { 
    const arr = storageGet("images", []); 
    return arr.find(x => x.id === id) || null; 
  } catch { 
    return null; 
  } 
}

// Enhanced fetch που δεν σκάει αν πάρεις 404 ή non-JSON
async function fetchJsonSafe(url, timeout = 5000){ 
  try {
    // Validate URL first
    if (!url || url === 'undefined' || typeof url !== 'string') {
      console.error('fetchJsonSafe: Invalid URL provided:', url);
      return null;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const r = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }); 
    
    clearTimeout(timeoutId);
    
    if (!r.ok) {
      const msg = await r.text().catch(() => r.statusText);
      console.warn(`API Error ${r.status}: ${msg} for URL: ${url}`);
      
      // Provide more specific error information
      if (r.status === 404) {
        console.warn('Resource not found - check if annotator service is running');
      } else if (r.status >= 500) {
        console.warn('Server error - annotator service may have issues');
      }
      
      return null;
    }
    
    const ct = r.headers.get("content-type") || ""; 
    if (!ct.includes("application/json")) {
      console.warn(`Non-JSON response from ${url}, content-type: ${ct}`);
      return null;
    }
    
    return await r.json(); 
  } catch (err) { 
    const errorInfo = handleApiError(err, 'fetchJsonSafe');
    console.error(`Fetch error for ${url}:`, errorInfo);
    return null; 
  } 
}

// ενιαία ανάκτηση εικόνας: πρώτα local, μετά API (αν έχεις apiBase)
async function getImageRecord(id){ 
  const local = getImageLocal(id); 
  if (local) return local; 
  if (apiBase) { 
    const rec = await fetchJsonSafe(`${apiBase}/api/images/${encodeURIComponent(id)}`); 
    if (rec) return rec; 
  } 
  return null; 
}

function setStatus(msg) {
  const el = document.getElementById('status');
  if (el) el.textContent = msg || '';
}

// ---------- Konva setup ----------
let stage, layer, bgImage;

function createStage(w, h) {
  const container = document.getElementById('stageContainer');
  const cw = container.clientWidth || w || 800;
  const ch = container.clientHeight || h || 600;

  stage = new Konva.Stage({
    container: 'stageContainer',
    width: cw,
    height: ch
  });

  layer = new Konva.Layer();
  stage.add(layer);

  // Konva guards για να φύγει το "Cannot read properties of null (reading 'x')"
  let startPoint = null;
  
  stage.on("mousedown touchstart", () => {
    const p = stage.getPointerPosition();
    if (p) startPoint = p;
  });
  
  stage.on("mouseup touchend", () => {
    const p = stage.getPointerPosition();
    if (!p || !startPoint) return; // guard
    startPoint = null;
  });
  
  // Επιπλέον guards για mousemove
  stage.on("mousemove", () => {
    const p = stage.getPointerPosition();
    if (!p) return; // guard για null pointer
    // Εδώ μπορείς να προσθέσεις logic για drawing κλπ
  });
  
  // Guard για wheel events
  stage.on("wheel", (e) => {
    if (!e || !e.evt) return; // guard
    const pointer = stage.getPointerPosition();
    if (!pointer) return; // guard για null pointer
    // Zoom logic θα μπει εδώ αν χρειαστεί
  });
}

function drawBackground(dataUrl, w, h) {
  return new Promise((resolve, reject) => {
    // Έλεγχος για έγκυρο dataUrl
    if (!dataUrl || dataUrl === 'undefined') {
      reject(new Error('Invalid or undefined dataUrl'));
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      // Προσαρμογή stage εάν θέλεις native μέγεθος εικόνας
      if (w && h) {
        stage.size({ width: w, height: h });
      } else {
        w = img.naturalWidth;
        h = img.naturalHeight;
        stage.size({ width: w, height: h });
      }

      bgImage = new Konva.Image({ image: img, x: 0, y: 0, width: w, height: h });
      layer.add(bgImage);
      layer.draw();
      resolve();
    };
    img.onerror = reject;
    safeSetSrc(img, dataUrl);
  });
}

// Error rendering and UI disabling functions
function renderError(message) {
  const container = document.getElementById('stageContainer') || document.body;
  container.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: #f8f9fa;
      color: #dc3545;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h2 style="margin-bottom: 10px;">⚠️ Σφάλμα</h2>
        <p style="margin: 0; font-size: 16px;">${message}</p>
      </div>
    </div>
  `;
}

function disableAnnotatorUI() {
  // Disable all interactive elements
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = true);
  
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => input.disabled = true);
  
  // Remove event listeners from stage if it exists
  if (window.stage) {
    window.stage.off();
  }
}

// Global variables for safe access
let currentImage = null;
let currentLayer = null;
let currentTool = null;

// ---------- Init ----------
// Setup Konva stage and event listeners when image is ready
function setupAnnotatorUI() {
  if (!meta || !window.currentImageMeta) {
    console.warn('Meta not ready for UI setup');
    return;
  }
  
  try {
    setStatus('Φόρτωση εικόνας...');
    
    const src = pickSrc(meta);
    if (!src) {
      renderError('Δεν βρέθηκε έγκυρο URL εικόνας');
      disableAnnotatorUI();
      return;
    }
    
    // Μόνο εδώ συνέχισε να στήνεις stage/layers & event listeners
    createStage(meta.width || 1024, meta.height || 768);
    drawBackground(src, meta.width, meta.height).then(() => {
      // Set global variables for safe access
      currentImage = meta;
      currentLayer = layer;
      
      setStatus(`Έτοιμο • ${meta.name || meta.id}`);
      
      // Setup event listeners with guards
      if (stage) {
        stage.on('pointerup', (e) => {
          if (!currentImage || !currentLayer || !currentTool) return; // guard
          if (!e.target || !e.target.getStage) return; // position guard
          const pos = e.target.getStage().getPointerPosition();
          if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return; // null pointer guard
          // ... annotation logic here
        });
        
        stage.on('pointermove', (e) => {
          if (!currentImage || !currentLayer || !currentTool) return; // guard
          if (!e.target || !e.target.getStage) return; // position guard
          const pos = e.target.getStage().getPointerPosition();
          if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return; // null pointer guard
          // ... annotation logic here
        });
      }
      
      // Save button with guards
      document.getElementById('btnSave')?.addEventListener('click', async () => {
        if (!currentImage || !stage) return;
        
        try {
          const dataUrl = stage.toDataURL({ pixelRatio: 1 });
          // Αν έχεις API: στείλε το annotation
          // if (apiBase) await fetch(`${apiBase}/api/images/${encodeURIComponent(currentImage.id)}/annotations`, {...});
          // Αλλιώς, αποθήκευσέ το locally:
          const KEY = 'annotations';
          const ann = storageGet(KEY, []);
          const now = new Date().toISOString();
          const item = { id: currentImage.id, updatedAt: now, dataUrl };
          const ix = ann.findIndex(x => x.id === currentImage.id);
          if (ix >= 0) ann[ix] = item; else ann.push(item);
          storageSet(KEY, ann);
          setStatus('Αποθηκεύτηκε το annotation (local).');
        } catch (e) {
          console.error(e);
          setStatus('Απέτυχε η αποθήκευση.');
        }
      });
    }).catch(e => {
      console.error('Failed to draw background:', e);
      renderError('Αποτυχία φόρτωσης εικόνας στο canvas.');
      disableAnnotatorUI();
    });
    
  } catch (e) {
    console.error('Setup error:', e);
    renderError('Σφάλμα αρχικοποίησης UI.');
    disableAnnotatorUI();
  }
}

// setupAnnotatorUI is now called automatically when image loads successfully
// No need for manual DOM ready setup since we wait for image.onload