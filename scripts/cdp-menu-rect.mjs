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
await send('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 800,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url });
await sleep(5000);
await evaluate(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText||'').includes('稍后配置')); if (b) b.click(); })()`);
await sleep(800);

const pet = await evaluate(`(() => {
  const video = document.querySelector('video');
  if (!video) return null;
  const r = video.getBoundingClientRect();
  return { left: r.left, top: r.top, x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`);
console.log('PET:', JSON.stringify(pet));

await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pet.x, y: pet.y, button: 'right', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pet.x, y: pet.y, button: 'right', clickCount: 1 });
await sleep(1000);

console.log('MENU:', JSON.stringify(await evaluate(`(() => {
  const menus = Array.from(document.querySelectorAll('div')).filter((d) => {
    const s = getComputedStyle(d);
    return s.position === 'fixed' && (d.innerText||'').includes('显示位置') && (d.innerText||'').includes('关于');
  });
  const menu = menus.sort((a,b) => {
    const ra = a.getBoundingClientRect(); const rb = b.getBoundingClientRect();
    return ra.width * ra.height - rb.width * rb.height;
  })[0];
  if (!menu) return null;
  const r = menu.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, height: r.height, innerHeight: window.innerHeight, innerWidth: window.innerWidth, overflowing: r.bottom > window.innerHeight };
})()`)));

await evaluate(`(() => {
  const menus = Array.from(document.querySelectorAll('div')).filter((d) => {
    const s = getComputedStyle(d);
    return s.position === 'fixed' && (d.innerText||'').includes('显示位置') && (d.innerText||'').includes('关于');
  });
  const menu = menus.sort((a,b) => {
    const ra = a.getBoundingClientRect(); const rb = b.getBoundingClientRect();
    return ra.width * ra.height - rb.width * rb.height;
  })[0];
  if (!menu) return false;
  const item = Array.from(menu.querySelectorAll('div')).find((d) => (d.innerText||'').trim().startsWith('显示位置'));
  if (item) { item.click(); return true; }
  return false;
})()`);
await sleep(600);
console.log('EXPANDED:', JSON.stringify(await evaluate(`(() => {
  const menus = Array.from(document.querySelectorAll('div')).filter((d) => {
    const s = getComputedStyle(d);
    return s.position === 'fixed' && (d.innerText||'').includes('仅网页') && (d.innerText||'').includes('关于');
  });
  const menu = menus.sort((a,b) => {
    const ra = a.getBoundingClientRect(); const rb = b.getBoundingClientRect();
    return ra.width * ra.height - rb.width * rb.height;
  })[0];
  if (!menu) return null;
  const r = menu.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, height: r.height, innerHeight: window.innerHeight, overflowing: r.bottom > window.innerHeight };
})()`)));
ws.close();
