// Smoke test: fetch remote tasks JSON and validate basic schema
// Usage: node tests/smoke/test_remote_import.js
// Optionally set REMOTE_URL env var to override the URL

const url = process.env.REMOTE_URL || 'https://raw.githubusercontent.com/mails4rditz/Reminder/master/extension/demo/tasks.json';

async function run() {
  console.log('Fetching remote tasks from', url);
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
      console.warn('Warning: content-type is', contentType, '- attempting to parse as JSON anyway');
    }

    const data = await res.json();

    if (!Array.isArray(data)) throw new Error('Payload is not a JSON array');
    if (data.length === 0) throw new Error('Task array is empty');

    let idx = 0;
    for (const task of data) {
      idx++;
      if (!task || typeof task !== 'object') throw new Error(`Task #${idx} is not an object`);
      if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') throw new Error(`Task #${idx} missing valid title`);
      if (!task.dueDate || typeof task.dueDate !== 'string') throw new Error(`Task #${idx} missing dueDate string`);
      const d = new Date(task.dueDate);
      if (isNaN(d.getTime())) throw new Error(`Task #${idx} has unparseable dueDate: ${task.dueDate}`);
      // Optional recurrence allowed
      if (task.recurrence && typeof task.recurrence !== 'string') throw new Error(`Task #${idx} recurrence must be a string if present`);
    }

    console.log(`OK: ${data.length} tasks validated`);
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
