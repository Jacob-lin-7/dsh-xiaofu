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

const before = await evaluate(`fetch('/dsh-hex-pet/config').then((r) => r.json()).then((c) => c.pets.map((p) => p.name))`);
console.log('BEFORE:', JSON.stringify(before));

const clicked = await evaluate(`(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText||'').includes('添加宠物'));
  if (!b) return false;
  b.click();
  return true;
})()`);
console.log('CLICKED_ADD:', clicked);
await sleep(2500);

const after = await evaluate(`fetch('/dsh-hex-pet/config').then((r) => r.json()).then((c) => c.pets.map((p) => ({ name: p.name, id: p.id, display: p.display, pack: p.pack })))`);
console.log('AFTER:', JSON.stringify(after));
console.log('VIDEO_COUNT:', await evaluate("document.querySelectorAll('video').length"));
console.log('BODY_HAS_ADD:', (await evaluate('document.body.innerText')).includes('已添加'));
ws.close();
