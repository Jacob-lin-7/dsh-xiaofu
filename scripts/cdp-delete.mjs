const token = process.argv[2];
const url = `http://127.0.0.1:3099/?token=${token}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const page = targets.find((target) => target.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});
let nextId = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
};
function send(method, params = {}) {
  const id = ++nextId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url });
await sleep(5000);
await evaluate(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText||'').includes('稍后配置')); if (b) b.click(); })()`);
await sleep(600);
await evaluate(`document.querySelector('button[aria-label="设置"]')?.click()`);
await sleep(1000);
await evaluate(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText||'').trim() === 'Hex 桌宠'); if (b) b.click(); })()`);
await sleep(1200);

const first = await evaluate(`(() => {
  const rows = Array.from(document.querySelectorAll('div')).filter((d) => (d.innerText || '').includes('sample-cat') && d.querySelectorAll('button').length > 0 && d.querySelectorAll('button').length <= 3);
  if (!rows.length) return { error: 'no row', count: document.querySelectorAll('button').length };
  const row = rows[rows.length - 1];
  const btn = Array.from(row.querySelectorAll('button')).find((b) => (b.innerText || '').trim() === '删除');
  if (!btn) return { error: 'no delete button', buttons: Array.from(row.querySelectorAll('button')).map((b) => b.innerText) };
  btn.click();
  return { clicked: true };
})()`);
console.log('FIRST_CLICK:', JSON.stringify(first));
await sleep(800);

const second = await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.innerText || '').trim() === '再点一次确认');
  if (!btn) return { error: 'no confirm button', texts: Array.from(document.querySelectorAll('button')).map((b) => (b.innerText||'').trim()).filter(Boolean).slice(-10) };
  btn.click();
  return { clicked: true };
})()`);
console.log('SECOND_CLICK:', JSON.stringify(second));
await sleep(2500);

const text = await evaluate('document.body.innerText');
console.log('HAS_SAMPLE:', text.includes('Sample Cat'));
console.log('HAS_NOTICE:', text.includes('已删除形象包'));
console.log('TAIL:', JSON.stringify(text.slice(text.indexOf('自定义形象'), text.indexOf('自定义形象') + 400)));
ws.close();
