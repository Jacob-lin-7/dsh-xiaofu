const token = process.argv[2];
const zipPath = process.argv[3];
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
const logs = [];
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    logs.push(`console.${message.params.type}: ${message.params.args.map((a) => (a.value !== undefined ? String(a.value) : a.description ?? a.type)).join(' ')}`);
  }
  if (message.method === 'Runtime.exceptionThrown') {
    logs.push(`exception: ${message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text}`);
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
await send('DOM.enable');
await send('Page.navigate', { url });
await sleep(4500);
await evaluate(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText||'').includes('稍后配置')); if (b) b.click(); })()`);
await sleep(500);
await evaluate(`document.querySelector('button[aria-label="设置"]')?.click()`);
await sleep(1000);
await evaluate(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText||'').trim() === 'Hex 桌宠'); if (b) b.click(); })()`);
await sleep(1200);

await evaluate(`(() => {
  window.__hexErrs = [];
  window.addEventListener('error', (e) => window.__hexErrs.push('error: ' + (e.error?.stack || e.message)));
  window.addEventListener('unhandledrejection', (e) => window.__hexErrs.push('rejection: ' + (e.reason?.stack || e.reason)));
})()`);

const doc = await send('DOM.getDocument', { depth: -1 });
const nodes = await send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
for (const nodeId of nodes.nodeIds) {
  const described = await send('DOM.describeNode', { nodeId });
  if ((described.node.attributes ?? []).join(' ').includes('.zip')) {
    await send('DOM.setFileInputFiles', { nodeId, files: [zipPath] });
    console.log('set file on', nodeId);
    break;
  }
}

const dispatched = await evaluate(`(() => {
  const input = Array.from(document.querySelectorAll('input[type=file]')).find((i) => i.accept.includes('.zip'));
  if (!input) return 'no input';
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return 'dispatched';
})()`);
console.log('dispatch:', dispatched);

await sleep(2500);
const text = await evaluate('document.body.innerText');
console.log('LEN:', text.length);
console.log('HAS_UPLOADING:', text.includes('上传并校验中'));
console.log('HAS_OK:', text.includes('已导入'));
console.log('HAS_FAIL:', text.includes('导入失败'));
const index = text.indexOf('自定义形象');
console.log('AROUND:', JSON.stringify(text.slice(index, index + 260)));
console.log('PACKS:', JSON.stringify(await evaluate("fetch('/dsh-hex-pet/packs').then((r) => r.json())")));
console.log('ERRS:', JSON.stringify(await evaluate('window.__hexErrs || []')));
console.log('LOGS:', logs.join('\n'));
ws.close();
