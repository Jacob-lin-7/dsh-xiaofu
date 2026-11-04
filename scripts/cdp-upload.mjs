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
    logs.push(`console.${message.params.type}: ${message.params.args.map((arg) => arg.value ?? arg.description).join(' ')}`);
  }
  if (message.method === 'Runtime.exceptionThrown') {
    logs.push(`exception: ${message.params.exceptionDetails.text} ${message.params.exceptionDetails.exception?.description ?? ''}`);
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

await evaluate(`(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').includes('稍后配置'));
  if (b) b.click();
})()`);
await sleep(600);

await evaluate(`document.querySelector('button[aria-label="设置"]')?.click()`);
await sleep(1200);

const clicked = await evaluate(`(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Hex 桌宠');
  if (b) { b.click(); return true; }
  return false;
})()`);
console.log('clicked section:', clicked);
await sleep(1500);

const body = await evaluate('document.body.innerText');
console.log('HAS_UPLOAD_CARD:', body.includes('自定义形象'));
console.log('BODY_TAIL:', body.slice(-600));

const inputs = await evaluate(`Array.from(document.querySelectorAll('input[type=file]')).map((i) => ({ accept: i.accept, display: getComputedStyle(i).display }))`);
console.log('FILE_INPUTS:', JSON.stringify(inputs));

const doc = await send('DOM.getDocument', { depth: -1 });
const nodes = await send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
console.log('NODE_IDS:', JSON.stringify(nodes.nodeIds));

for (const nodeId of nodes.nodeIds) {
  const described = await send('DOM.describeNode', { nodeId });
  const accept = described.node.attributes?.join(' ').includes('.zip');
  if (accept) {
    await send('DOM.setFileInputFiles', { nodeId, files: [zipPath] });
    console.log('set file on node', nodeId);
    await evaluate(`(() => {
      const input = Array.from(document.querySelectorAll('input[type=file]')).find((i) => i.accept.includes('.zip'));
      if (input) input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    break;
  }
}

await sleep(3000);
const after = await evaluate('document.body.innerText');
console.log('AFTER_TAIL:', after.slice(-800));
console.log('LOGS:', logs.join('\n'));
ws.close();
