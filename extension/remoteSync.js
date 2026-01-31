// remoteSync.js — fetch a remote URL (JSON or PDF) and import tasks

async function parseTasksFromJsonString(jsonText){
  try{
    const data = JSON.parse(jsonText);
    if(!Array.isArray(data)) throw new Error('Expected JSON array of tasks');
    const tasks = data.map(item => ({
      id: item.id || crypto.randomUUID(),
      title: item.title || item.name || 'Untitled',
      dueDate: new Date(item.dueDate || item.due || item.date).toISOString(),
      recurrence: item.recurrence || null,
      completed: !!item.completed
    }));
    return tasks;
  }catch(e){ throw new Error('Invalid JSON tasks format: ' + e.message); }
}

async function fetchRemoteAndImport(url){
  const resp = await fetch(url, { cache: 'no-store' });
  if(!resp.ok) throw new Error('HTTP error ' + resp.status);
  const ct = resp.headers.get('content-type') || '';
  if(ct.includes('application/json') || url.endsWith('.json')){
    const text = await resp.text();
    const tasks = await parseTasksFromJsonString(text);
    return { tasks };
  }
  // If PDF and pdfjs available, try parsing PDF text
  if(ct.includes('pdf') || url.endsWith('.pdf')){
    if(typeof PdfParser === 'undefined') throw new Error('PDF parsing not available (pdf.js missing)');
    const ab = await resp.arrayBuffer();
    // pdfParser has extractTextFromArrayBuffer in this implementation
    if(typeof PdfParser.extractTextFromArrayBuffer === 'function'){
      const text = await PdfParser.extractTextFromArrayBuffer(ab);
      const parsed = PdfParser.parseTasksFromText(text);
      // ensure ids
      parsed.forEach(p => p.id = p.id || crypto.randomUUID());
      return { tasks: parsed };
    }else throw new Error('PDF parsing helper not implemented');
  }
  throw new Error('Unsupported content-type: ' + ct);
}

// Expose API on the service worker/global scope (use `self` so it works in SW or window when available)
self.RemoteSync = { fetchRemoteAndImport };
