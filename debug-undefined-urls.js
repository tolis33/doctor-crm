/**
 * Εργαλείο εντοπισμού undefined URLs
 * Τρέξτε αυτό το script στη κονσόλα του browser για να βρείτε τα προβληματικά elements
 */

// 1) Σκανάρει DOM attributes για undefined values
(function scanBadAttrs(){
  const bad = [];
  document.querySelectorAll('[src],[href],[style]').forEach(el => {
    const src = el.getAttribute('src') || '';
    const href = el.getAttribute('href') || '';
    const style = el.getAttribute('style') || '';
    
    if (/undefined/.test(String(src))) {
      bad.push({element: el, attribute: 'src', value: src, tagName: el.tagName});
    }
    if (/undefined/.test(String(href))) {
      bad.push({element: el, attribute: 'href', value: href, tagName: el.tagName});
    }
    if (/undefined/.test(String(style))) {
      bad.push({element: el, attribute: 'style', value: style, tagName: el.tagName});
    }
  });
  
  console.group('🔍 BAD ATTR ELEMENTS FOUND:');
  if (bad.length === 0) {
    console.log('✅ Δεν βρέθηκαν elements με undefined attributes');
  } else {
    console.warn(`❌ Βρέθηκαν ${bad.length} προβληματικά elements:`);
    bad.forEach((item, index) => {
      console.log(`${index + 1}. ${item.tagName} [${item.attribute}="${item.value}"]`, item.element);
    });
  }
  console.groupEnd();
  
  return bad;
})();

// 2) Σκανάρει CSS κανόνες για url(undefined)
(function scanBadCss(){
  const hits = [];
  
  for (const ss of document.styleSheets) {
    let rules;
    try {
      rules = ss.cssRules;
    } catch (e) {
      // CORS ή inline stylesheet που δεν μπορούμε να διαβάσουμε
      continue;
    }
    
    if (!rules) continue;
    
    for (const r of rules) {
      const txt = r.cssText || '';
      if (/url\(\s*undefined\s*\)/i.test(txt)) {
        hits.push({
          sheet: ss.href || 'inline',
          rule: txt,
          selector: r.selectorText || 'unknown'
        });
      }
    }
  }
  
  console.group('🎨 BAD CSS URL(undefined) FOUND:');
  if (hits.length === 0) {
    console.log('✅ Δεν βρέθηκαν CSS rules με url(undefined)');
  } else {
    console.warn(`❌ Βρέθηκαν ${hits.length} προβληματικοί CSS κανόνες:`);
    hits.forEach((item, index) => {
      console.log(`${index + 1}. Sheet: ${item.sheet}`);
      console.log(`   Selector: ${item.selector}`);
      console.log(`   Rule: ${item.rule}`);
    });
  }
  console.groupEnd();
  
  return hits;
})();

// 3) Επιπλέον έλεγχος για background-image properties
(function scanBadBackgrounds(){
  const bad = [];
  
  document.querySelectorAll('*').forEach(el => {
    const computed = window.getComputedStyle(el);
    const bgImage = computed.backgroundImage;
    
    if (bgImage && /url\(.*undefined.*\)/i.test(bgImage)) {
      bad.push({
        element: el,
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        backgroundImage: bgImage
      });
    }
  });
  
  console.group('🖼️ BAD BACKGROUND IMAGES FOUND:');
  if (bad.length === 0) {
    console.log('✅ Δεν βρέθηκαν elements με undefined background images');
  } else {
    console.warn(`❌ Βρέθηκαν ${bad.length} elements με προβληματικά background images:`);
    bad.forEach((item, index) => {
      console.log(`${index + 1}. ${item.tagName}${item.id ? '#' + item.id : ''}${item.className ? '.' + item.className.split(' ').join('.') : ''}`);
      console.log(`   Background: ${item.backgroundImage}`, item.element);
    });
  }
  console.groupEnd();
  
  return bad;
})();

console.log('\n📋 ΟΔΗΓΙΕΣ ΔΙΟΡΘΩΣΗΣ:');
console.log('1. Ελέγξτε string interpolation που μπορεί να επιστρέφει undefined');
console.log('2. Προσθέστε default values σε template literals: ${VAR || "default-value"}');
console.log('3. Ελέγξτε τις μεταβλητές πριν τη χρήση τους σε URLs');
console.log('4. Χρησιμοποιήστε conditional rendering για elements που εξαρτώνται από δεδομένα');