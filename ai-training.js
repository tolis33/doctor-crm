// ai-training.js
const AI = (() => {
  const MODEL_KEY = 'indexeddb://stomadiagnosis-caries-v1';
  const S = 64; // input size
  let samples = []; // {label, dataUrl, ...}
  let model = null;

  const logEl = () => document.getElementById('log');
  const progEl = () => document.getElementById('prog');
  const previewEl = () => document.getElementById('preview');
  const predEl = () => document.getElementById('pred');
  const dsInfoEl = () => document.getElementById('dsInfo');

  function log(msg){ const el=logEl(); el.textContent += msg + '\n'; el.scrollTop=el.scrollHeight; }
  function setProg(v){ progEl().value = v; }

  // --- Dataset ---
  function loadSamplesFromLS(){
    try { return storageGet('ai_samples', []); }
    catch { return []; }
  }

  async function dataUrlToTensor(url){
    return new Promise(resolve=>{
      const img=new Image(); img.crossOrigin='anonymous';
      img.onload=()=>{
        const c=document.createElement('canvas'); c.width=S; c.height=S;
        c.getContext('2d').drawImage(img,0,0,S,S);
        const d=c.getContext('2d').getImageData(0,0,S,S);
        // [0..255] -> [0..1]
        const t=tf.tidy(()=> tf.tensor(d.data, [S,S,4]).slice([0,0,0],[S,S,3]).toFloat().div(255));
        resolve(t);
      };
      img.src=url;
    });
  }

  async function makeTensors(list){
    // Φορτώνει ΟΛΑ τα δείγματα στη μνήμη (ok για εκατοντάδες/λίγα χιλιάδες)
    const xsArr=[], ysArr=[];
    for (let i=0;i<list.length;i++){
      const s=list[i];
      const x = await dataUrlToTensor(s.dataUrl);
      xsArr.push(x);
      ysArr.push(s.label===1 ? 1 : 0);
      if (i%25===0) setProg(i/list.length);
    }
    setProg(1);
    const xs = tf.stack(xsArr); // [N,64,64,3]
    const ys = tf.tensor1d(ysArr).oneHot(2); // δύο κλάσεις: caries/healthy
    xsArr.forEach(t=>t.dispose());
    return { xs, ys };
  }

  // --- Model ---
  function buildModel(){
    const m = tf.sequential();
    m.add(tf.layers.conv2d({filters:16,kernelSize:3,activation:'relu',inputShape:[S,S,3]}));
    m.add(tf.layers.maxPooling2d({poolSize:2}));
    m.add(tf.layers.conv2d({filters:32,kernelSize:3,activation:'relu'}));
    m.add(tf.layers.maxPooling2d({poolSize:2}));
    m.add(tf.layers.conv2d({filters:64,kernelSize:3,activation:'relu'}));
    m.add(tf.layers.flatten());
    m.add(tf.layers.dropout({rate:0.25}));
    m.add(tf.layers.dense({units:64,activation:'relu'}));
    m.add(tf.layers.dense({units:2,activation:'softmax'}));
    m.compile({optimizer:tf.train.adam(1e-3), loss:'categoricalCrossentropy', metrics:['accuracy']});
    return m;
  }

  async function ensureModel(){
    if (model) return model;
    try {
      model = await tf.loadLayersModel(MODEL_KEY);
      log('✅ Φορτώθηκε υπάρχον μοντέλο από IndexedDB.');
    } catch {
      model = buildModel();
      log('🆕 Δημιουργήθηκε νέο μοντέλο.');
    }
    return model;
  }

  // --- API ---
  async function scan(){
    samples = loadSamplesFromLS();
    const pos = samples.filter(s=>s.label===1).length;
    const neg = samples.length - pos;
    dsInfoEl().textContent = `Dataset: σύνολο ${samples.length} (θετικά: ${pos}, αρνητικά: ${neg})`;
    log(`Βρέθηκαν ${samples.length} δείγματα.`);
    if (samples[0]?.dataUrl) previewEl().src = samples[0].dataUrl;
  }

  async function train(){
    if (!samples.length) await scan();
    if (samples.length < 20){ log('❗ Θέλεις τουλάχιστον ~20 δείγματα για να ξεκινήσεις.'); return; }

    const { xs, ys } = await makeTensors(samples);
    const m = await ensureModel();

    log('🚀 Εκπαίδευση...');
    setProg(0);
    await m.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      shuffle: true,
      validationSplit: 0.15,
      callbacks: {
        onEpochEnd: async (ep, logs)=>{
          log(`Epoch ${ep+1}: loss=${logs.loss?.toFixed(4)} acc=${(logs.acc||logs.accuracy)?.toFixed(3)} val_acc=${(logs.val_acc||logs.valAccuracy)?.toFixed(3)}`);
          setProg((ep+1)/10);
          await tf.nextFrame();
        }
      }
    });
    await m.save(MODEL_KEY);
    log('💾 Μοντέλο αποθηκεύτηκε τοπικά.');
    xs.dispose(); ys.dispose();
  }

  async function test(){
    if (!samples.length) await scan();
    const s = samples[Math.floor(Math.random()*samples.length)];
    previewEl().src = s.dataUrl;
    const m = await ensureModel();
    const x = await dataUrlToTensor(s.dataUrl);
    const out = tf.tidy(()=> m.predict(x.expandDims()));
    const p = await out.data();
    out.dispose(); x.dispose();

    const confCaries = p[1], confHealthy = p[0];
    predEl().textContent = `Pred: ${confCaries>confHealthy ? 'caries' : 'healthy'} (caries=${confCaries.toFixed(2)}, healthy=${confHealthy.toFixed(2)})`;
  }

  async function clearModel(){
    try { await indexedDB.deleteDatabase('tensorflowjs'); log('🗑️ Διαγράφηκε τοπικό μοντέλο (IndexedDB).'); }
    catch(e){ log('Σφάλμα διαγραφής: '+e.message); }
  }

  function exportDataset(){
    const data = JSON.stringify(samples, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], {type:'application/json'}));
    a.download = 'ai_samples.json';
    a.click();
  }

  return { scan, train, test, clearModel, exportDataset };
})();