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
await sleep(800);

const rect = await evaluate(`(() => {
  const video = document.querySelector('video');
  if (!video) return null;
  const r = video.getBoundingClientRect();
  return { left: r.left, top: r.top, x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`);
console.log('BEFORE_RECT:', JSON.stringify(rect));
if (!rect) { ws.close(); process.exit(1); }

const targetX = rect.x - 60;
const targetY = rect.y + 30;
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', buttons: 1, clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: targetX, y: targetY, button: 'left', buttons: 1 });
await sleep(200);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: targetX, y: targetY, button: 'left', buttons: 0, clickCount: 1 });
await sleep(2000);

const config = await evaluate(`fetch('/dsh-hex-pet/config').then((r) => r.json()).then((c) => c.pets[0].position)`);
console.log('CONFIG_POSITION:', JSON.stringify(config));

await send('Page.reload');
await sleep(5000);
await evaluate(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText||'').includes('稍后配置')); if (b) b.click(); })()`);
await sleep(800);
const after = await evaluate(`(() => {
  const video = document.querySelector('video');
  if (!video) return null;
  const r = video.getBoundingClientRect();
  return { left: r.left, top: r.top };
})()`);
console.log('AFTER_RELOAD_RECT:', JSON.stringify(after));
ws.close();
