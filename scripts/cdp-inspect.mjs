const token = process.argv[2];
const url = `http://127.0.0.1:3099/?token=${token}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const page = targets.find((target) => target.type === 'page');
if (!page) throw new Error('no page target');

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
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url });
await sleep(5000);

console.log('TITLE:', await evaluate('document.title'));
console.log('HAS_SETTINGS_TEXT:', await evaluate("document.body.innerText.includes('设置')"));
console.log(
  'BUTTONS:',
  JSON.stringify(
    await evaluate(
      "Array.from(document.querySelectorAll('button')).map((b) => ({ text: (b.innerText||'').trim().slice(0,20), label: b.getAttribute('aria-label') })).filter((x) => x.text || x.label).slice(0,30)",
    ),
    null,
    2,
  ),
);

console.log('LOGS:', logs.join('\n'));
ws.close();
