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
  const el = video ? video.parentElement : null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
})()`);
console.log('PET_RECT:', JSON.stringify(rect));
if (!rect) { ws.close(); process.exit(1); }

await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'right', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'right', clickCount: 1 });
await sleep(1200);

const text = await evaluate('document.body.innerText');
console.log('MENU_HAS_ACTIONS:', text.includes('动作'));
console.log('MENU_HAS_DISPLAY:', text.includes('显示位置'));
console.log('MENU_HAS_ABOUT:', text.includes('关于'));
const idx = text.indexOf('动作');
console.log('MENU_TEXT:', JSON.stringify(text.slice(Math.max(0, idx - 80), idx + 200)));

const clicked = await evaluate(`(() => {
  const all = Array.from(document.querySelectorAll('div'));
  const item = all.find((el) => (el.innerText || '').trim() === '显示位置');
  if (item) { item.click(); return true; }
  return false;
})()`);
console.log('CLICKED_DISPLAY:', clicked);
await sleep(600);
const after = await evaluate('document.body.innerText');
console.log('HAS_WEB_ONLY:', after.includes('仅网页'), 'HAS_BOTH:', after.includes('网页 + 桌面'));
ws.close();
