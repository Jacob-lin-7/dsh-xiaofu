const { app, BrowserWindow, Menu, Tray, dialog, ipcMain, nativeImage, screen, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const readline = require('node:readline');
const { pathToFileURL } = require('node:url');
const { buildMessage } = require('./protocol.cjs');
app.setName('dsh-xiaofu');

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

// Electron 的 Display.workArea 已经是 DIP（逻辑像素），不要再乘/除缩放。
// 之前误按 scaleFactor 归一化，把 1600×952 的活动区缩成了 800×476。
function dipArea(display) {
  const area = display.workArea;
  return { x: area.x, y: area.y, width: area.width, height: area.height };
}

const videoPathArg = arg('video', '');
const idleVideoPaths = (() => {
  try {
    const raw = arg('idle-videos', '');
    if (!raw) return [];
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
})();
const clickVideoArg = arg('click-video', '');
const doubleClickVideoArg = arg('double-click-video', '');
const parseVideoList = (name) => {
  try {
    const raw = arg(name, '');
    if (!raw) return [];
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};
const clickVideoPaths = parseVideoList('click-videos');
const doubleClickVideoPaths = parseVideoList('double-click-videos');
const animations = (() => {
  try {
    const file = arg('animations-file', '');
    const raw = file ? fs.readFileSync(file, 'utf8') : arg('animations', '[]');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();
const idleItem = animations.find((item) => item.mode === 'loop') ?? animations[0];
const clickItem =
  animations.find((item) => /(^|\/)(click|tap|点击)/i.test(item.name)) ??
  animations.find((item) => item.mode === 'once');
const videoPath = videoPathArg || idleItem?.path;
const clickVideoPath = clickVideoArg || clickItem?.path;
const doubleClickVideoPath = doubleClickVideoArg || clickVideoPath;
const iconPath = arg('icon', '');
const petName = arg('name', '桌宠');
const petId = arg('pet-id', '');
const size = Number(arg('size', '420'));
const screenshotPath = arg('screenshot', '');
const marginX = Number(arg('margin-x', '24'));
const marginY = Number(arg('margin-y', '100'));
const corner = arg('corner', 'top-right');
const xArg = Number(arg('x', 'NaN'));
const yArg = Number(arg('y', 'NaN'));
const trayEnabled = arg('tray', '1') !== '0';
const initialHiddenArg = arg('hidden-until', '');
const soundClickEnabled = arg('sound-click', '0') === '1';
const soundVolume = Math.min(1, Math.max(0, Number(arg('sound-volume', '0.6')) || 0.6));
const clickAction = arg('click-action', 'animation');
const doubleClickAction = arg('double-click-action', 'none');
const clickEnabled = arg('click-enabled', '1') !== '0';
const roamEnabled = arg('roam', '1') !== '0';
const soundFile = arg('sound-file', '');
const emojiFile = arg('emoji-file', '');
const BUBBLE_SPACE = 72;
const bubbleDuration = Math.max(1200, Number(arg('bubble-duration', '8000')) || 8000);
const bubbleStyle = (() => {
  try {
    const raw = arg('bubble-style-b64', '');
    return raw ? JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) : {};
  } catch {
    return {};
  }
})();
const fontFamily = arg('font-family', 'system');
const fontSize = Math.max(9, Number(arg('font-size', '13')) || 13);
const bubbleQuotes = (() => {
  try {
    const raw = arg('bubbles-b64', '');
    const parsed = raw ? JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
})();
const dshUrl = (() => {
  try {
    const encoded = arg('dsh-url-b64', '');
    return encoded ? Buffer.from(encoded, 'base64').toString('utf8') : '';
  } catch {
    return '';
  }
})();

let log = () => {};

function requestDisplay(display) {
  if (!petId) return;
  process.stdout.write(
    `HEX_PET:${JSON.stringify({ type: 'set-display', petId, display })}\n`,
  );
  if (display === 'web' || display === 'none') {
    setTimeout(() => app.quit(), 50);
  }
}

let requestSeq = 0;
const pendingRequests = new Map();
let packCache = (() => {
  try {
    const file = arg('packs-file', '');
    const raw = file ? fs.readFileSync(file, 'utf8') : '[]';
    const parsed = JSON.parse(raw);
    return {
      packs: Array.isArray(parsed) ? parsed : [],
      current: arg('current-pack', ''),
    };
  } catch {
    return { packs: [], current: arg('current-pack', '') };
  }
})();

function request(type, payload = {}, timeoutMs = 1500) {
  if (!petId) return Promise.resolve({ ok: false, error: 'no pet' });
  const requestId = ++requestSeq;
  return new Promise((resolve) => {
    pendingRequests.set(requestId, resolve);
    // petId 默认注入：set-position / reset-position / reload-desktop 都靠它定位宠物。
    process.stdout.write(
      `HEX_PET:${JSON.stringify(buildMessage(petId, type, payload, requestId))}\n`,
    );
    setTimeout(() => {
      if (pendingRequests.delete(requestId)) resolve({ ok: false, error: 'timeout' });
    }, timeoutMs);
  });
}

let quitting = false;
function quitWindow() {
  if (quitting) return;
  quitting = true;
  // 先让宿主把这只从 desired 里移除，避免宿主把主动退出当成崩溃后重启。
  void request('quit-pet').finally(() => app.quit());
}

function openDshUrl(mode) {
  // 桌面宠物的「打开 DSH / 打开对话」应聚焦桌面客户端，不再打开浏览器。
  if (mode !== 'settings') {
    try {
      shell.openExternal('dsh://open');
      return;
    } catch {
      // 协议不可用时回退到网页地址
    }
  }
  const open = (raw) => {
    if (!raw) return;
    try {
      const url = new URL(raw);
      if (mode === 'settings') url.searchParams.set('dsh-xiaofu', 'settings');
      else if (mode === 'chat') url.searchParams.set('dsh-xiaofu', 'chat');
      else url.searchParams.delete('dsh-xiaofu');
      shell.openExternal(url.toString());
    } catch {
      shell.openExternal(raw);
    }
  };
  if (dshUrl) {
    open(dshUrl);
    return;
  }
  void request('open-dsh').then((result) => {
    if (result.ok && result.url) open(result.url);
  });
}

async function refreshPackCache() {
  const started = Date.now();
  const result = await request('list-packs');
  if (result.ok) {
    packCache = { packs: result.packs ?? [], current: result.current ?? '' };
    log(`pack cache refreshed: ${packCache.packs.length} packs in ${Date.now() - started}ms`);
  } else {
    log(`pack cache refresh failed: ${result.error ?? 'unknown'}`);
  }
}

function cornerPoint() {
  const area = dipArea(screen.getPrimaryDisplay());
  const height = Math.round((size * 9) / 16) + BUBBLE_SPACE;
  const x = corner.includes('left') ? area.x + marginX : area.x + area.width - size - marginX;
  const y = corner.includes('top') ? area.y + marginY - BUBBLE_SPACE : area.y + area.height - height - marginY;
  return {
    x: Math.max(area.x, Math.min(x, area.x + area.width - size)),
    y: Math.max(area.y, Math.min(y, area.y + area.height - height)),
  };
}

readline
  .createInterface({ input: process.stdin })
  .on('line', (line) => {
    try {
      const response = JSON.parse(line);
      if (response.requestId && pendingRequests.has(response.requestId)) {
        const resolve = pendingRequests.get(response.requestId);
        pendingRequests.delete(response.requestId);
        resolve(response);
        return;
      }
      if (response.type === 'display-result' && response.ok) {
        if (!['desktop', 'both'].includes(response.display)) {
          app.quit();
        }
      }
    } catch {
      // ignore non-protocol lines
    }
  });

app.disableHardwareAcceleration();

// 宿主进程退出后 stdout 会断开，helper 随之退出，避免留下孤儿窗口
process.stdout.on('error', () => app.quit());

app.whenReady().then(async () => {
  const videoHeight = Math.round((size * 9) / 16);
  const height = videoHeight + BUBBLE_SPACE;
  // 命中区：画布 640×360 的 200..440 × 50..335，按窗口尺寸等比换算
  const hit = {
    x0: (size * 200) / 640,
    x1: (size * 440) / 640,
    y0: BUBBLE_SPACE + (videoHeight * 50) / 360,
    y1: BUBBLE_SPACE + (videoHeight * 335) / 360,
  };
  const hitCenterX = (hit.x0 + hit.x1) / 2;
  const hitCenterY = (hit.y0 + hit.y1) / 2;
  const EDGE_MARGIN = 24;
  const hasPoint = Number.isFinite(xArg) && Number.isFinite(yArg);
  const display = hasPoint
    ? screen.getDisplayNearestPoint({ x: xArg, y: yArg })
    : screen.getPrimaryDisplay();
  const area = dipArea(display);

  let x;
  let y;
  if (hasPoint) {
    x = xArg;
    y = yArg;
  } else {
    x = corner.includes('left') ? area.x + marginX : area.x + area.width - size - marginX;
    y = corner.includes('top') ? area.y + marginY - BUBBLE_SPACE : area.y + area.height - height - marginY;
  }
  // 按宠物中心夹紧：中心可覆盖整块屏，贴边时允许身体少量出屏。
  const desiredCenterX = x + hitCenterX;
  const desiredCenterY = y + hitCenterY;
  const centerX = Math.max(
    area.x + EDGE_MARGIN,
    Math.min(desiredCenterX, area.x + area.width - EDGE_MARGIN),
  );
  const centerY = Math.max(
    area.y + EDGE_MARGIN,
    Math.min(desiredCenterY, area.y + area.height - EDGE_MARGIN),
  );
  x = centerX - hitCenterX;
  y = centerY - hitCenterY;

  const win = new BrowserWindow({
    width: size,
    height,
    x,
    y,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      backgroundThrottling: false,
    },
  });

  win.setAlwaysOnTop(true, 'floating');
  win.setSkipTaskbar(true);

  const logPath = path.join(app.getPath('temp'), 'dsh-xiaofu-helper.log');
  log = (message) => {
    try {
      fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
    } catch {
      // ignore
    }
  };
  log(`helper started pet=${petId} focusable=true`);

  const ensureWindowOnScreen = (reason) => {
    try {
      const bounds = win.getBounds();
      const visible = screen.getAllDisplays().some((item) => {
        const work = dipArea(item);
        return (
          bounds.x < work.x + work.width &&
          bounds.x + bounds.width > work.x &&
          bounds.y < work.y + work.height &&
          bounds.y + bounds.height > work.y
        );
      });
      if (visible) return;
      const primary = dipArea(screen.getPrimaryDisplay());
      const nextX = Math.round(primary.x + (primary.width - size) / 2);
      const nextY = Math.round(primary.y + (primary.height - height) / 2);
      win.setPosition(nextX, nextY);
      log(`display fallback (${reason}) -> ${nextX},${nextY}`);
    } catch {
      // 窗口销毁/显示器枚举失败时忽略
    }
  };
  screen.on('display-removed', () => ensureWindowOnScreen('removed'));
  screen.on('display-metrics-changed', () => ensureWindowOnScreen('metrics'));
  log(
    `displays=${JSON.stringify(
      screen.getAllDisplays().map((item) => ({
        id: item.id,
        bounds: item.bounds,
        workArea: item.workArea,
        scaleFactor: item.scaleFactor,
        primary: item.id === screen.getPrimaryDisplay().id,
      })),
    )}`,
  );
  log(
    `position pet=${petId} hasPoint=${hasPoint} xArg=${xArg} yArg=${yArg} area=${JSON.stringify(
      area,
    )} -> ${x},${y}`,
  );

  // 宿主进程消失后自动退出，避免留下孤儿窗口
  const hostPid = process.ppid;
  const hostWatchdog = setInterval(() => {
    try {
      process.kill(hostPid, 0);
    } catch {
      clearInterval(hostWatchdog);
      app.quit();
    }
  }, 3000);
  hostWatchdog.unref();

  log(
    `packs cache=${packCache.packs.length} current=${packCache.current} argLength=${arg('packs', '').length}`,
  );
  log(
    `flags=${process.argv
      .slice(2)
      .filter((item) => item.startsWith('--'))
      .map((item) => item.split('=')[0])
      .join(',')}`,
  );
  if (process.platform === 'darwin') {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  if (process.platform === 'linux') {
    try {
      win.setAlwaysOnTop(true, 'screen-saver');
    } catch {
      // 某些合成器不认该层级，保持 floating
    }
  }
  win.setIgnoreMouseEvents(true, { forward: true });

  let interactive = false;
  let menuOpen = false;
  let dragging = false;
  const pointerTimer = setInterval(() => {
    if (win.isDestroyed() || menuOpen || dragging) return;
    const point = screen.getCursorScreenPoint();
    const bounds = win.getBounds();
    // 透明窗口边缘留一点余量，小尺寸宠物也更容易抓住。
    const pad = 24;
    const inside =
      point.x >= bounds.x + hit.x0 - pad &&
      point.x <= bounds.x + hit.x1 + pad &&
      point.y >= bounds.y + hit.y0 - pad &&
      point.y <= bounds.y + hit.y1 + pad;
    if (inside !== interactive) {
      interactive = inside;
      win.setIgnoreMouseEvents(!inside, { forward: true });
    }
  }, 30);

  let dragOffset = null;
  let dragMoves = 0;
  let hideTimer = null;
  let roamTimer = null;
  const scheduleRoam = () => {
    if (!roamEnabled) return;
    if (roamTimer) clearTimeout(roamTimer);
    const delay = 18000 + Math.random() * 12000;
    roamTimer = setTimeout(() => {
      roamTimer = null;
      try {
        if (!dragging && !menuOpen && win.isVisible() && !win.isDestroyed()) {
          const area = dipArea(screen.getPrimaryDisplay());
          const centerX = area.x + EDGE_MARGIN + Math.random() * (area.width - EDGE_MARGIN * 2);
          const centerY = area.y + EDGE_MARGIN + Math.random() * (area.height - EDGE_MARGIN * 2);
          const x = Math.round(centerX - hitCenterX);
          const y = Math.round(centerY - hitCenterY);
          win.setPosition(x, y);
          log(`roam pet=${petId} -> ${x},${y}`);
        }
      } catch {
        // 窗口已销毁时忽略
      }
      scheduleRoam();
    }, delay);
  };
  const showPet = () => {
    win.showInactive();
    win.moveTop();
  };
  const hideFor = (ms) => {
    if (hideTimer) clearTimeout(hideTimer);
    win.hide();
    const until = Date.now() + ms;
    request('set-hidden', { petId, until });
    hideTimer = setTimeout(() => {
      hideTimer = null;
      showPet();
      request('set-visible', { petId });
      log('shown after hide timer');
    }, ms);
    log(`hidden for ${Math.round(ms / 60000)} minutes`);
  };
  const showNow = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    showPet();
    request('set-visible', { petId });
  };
  let hidePrompt = null;
  const openCustomHide = () => {
    if (hidePrompt) {
      hidePrompt.focus();
      return;
    }
    hidePrompt = new BrowserWindow({
      width: 300,
      height: 170,
      parent: win,
      modal: true,
      alwaysOnTop: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      title: '隐藏时长',
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        sandbox: false,
      },
    });
    hidePrompt.loadFile(path.join(__dirname, 'prompt.html'));
    hidePrompt.on('closed', () => {
      hidePrompt = null;
    });
  };
  ipcMain.on('hex:hide-custom', (_event, minutes) => {
    const value = Number(minutes);
    if (Number.isFinite(value) && value > 0 && value <= 1440) {
      hideFor(value * 60000);
    }
    if (hidePrompt) hidePrompt.close();
  });
  ipcMain.on('hex:drag-start', () => {
    dragging = true;
    interactive = true;
    dragMoves = 0;
    win.setIgnoreMouseEvents(false);
    const cursor = screen.getCursorScreenPoint();
    const bounds = win.getBounds();
    dragOffset = { x: cursor.x - bounds.x, y: cursor.y - bounds.y };
    log(`drag start pet=${petId} at ${cursor.x},${cursor.y} offset=${dragOffset.x},${dragOffset.y}`);
  });
  ipcMain.on('hex:drag-move', () => {
    if (!dragOffset) return;
    // 用系统光标而不是 renderer 的 screenX/Y：光标不会离开真实屏幕，
    // 也不受 Chromium 在混合 DPI 下的坐标换算影响。
    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    const area = dipArea(display);
    // 透明边缘可以出屏；按中心夹紧，宠物可走到屏幕四边。
    const desiredX = Math.round(cursor.x - dragOffset.x);
    const desiredY = Math.round(cursor.y - dragOffset.y);
    const centerX = Math.max(
      area.x + EDGE_MARGIN,
      Math.min(desiredX + hitCenterX, area.x + area.width - EDGE_MARGIN),
    );
    const centerY = Math.max(
      area.y + EDGE_MARGIN,
      Math.min(desiredY + hitCenterY, area.y + area.height - EDGE_MARGIN),
    );
    const x = Math.round(centerX - hitCenterX);
    const y = Math.round(centerY - hitCenterY);
    if (++dragMoves === 1 || dragMoves % 25 === 0) {
      log(`drag move pet=${petId} #${dragMoves} cursor=${cursor.x},${cursor.y} -> ${x},${y}`);
    }
    win.setPosition(x, y);
  });
  ipcMain.on('hex:drag-end', () => {
    dragging = false;
    dragOffset = null;
    const bounds = win.getBounds();
    log(`drag end pet=${petId} at ${bounds.x},${bounds.y} moves=${dragMoves}`);
    request('set-position', { x: bounds.x, y: bounds.y });
  });
  ipcMain.on('hex:quit', () => quitWindow());
  ipcMain.on('hex:open-dsh', (_event, mode) => openDshUrl(mode));
  ipcMain.on('hex:log', (_event, message) => log(`renderer: ${message}`));
  ipcMain.on('hex:blur', () => {
    if (!menuOpen) win.blur();
  });
  ipcMain.on('hex:menu', async () => {
    if (menuOpen) return;
    const menuStart = Date.now();
    menuOpen = true;
    interactive = true;
    win.setIgnoreMouseEvents(false);
    log(`contextmenu requested pet=${petId}`);

    if (packCache.packs.length === 0) {
      void refreshPackCache();
    }
    const packs = packCache.packs;
    const packSubmenu = packs.length
      ? packs.map((item) => ({
          label: `${item.name}${item.id === packCache.current ? ' ✓' : ''}`,
          click: () => request('set-pack', { petId, packId: item.id }),
        }))
      : [{ label: '没有可用形象包', enabled: false }];

    win.focus();
    Menu.buildFromTemplate([
      {
        label: '动作',
        submenu: animations.length
          ? animations.map((item) => ({
              label: item.label ?? item.name.split('/').pop(),
              click: () =>
                win.webContents.send('hex:play', {
                  url: pathToFileURL(item.path).toString(),
                  // 右键手动选动作只播一次，播完回到空闲。
                  mode: 'once',
                }),
            }))
          : [{ label: '没有动画', enabled: false }],
      },
      { label: '切换形象', submenu: packSubmenu },
      {
        label: '查询余额',
        click: async () => {
          const result = await request('query-balance', {}, 20000);
          if (!result.ok) {
            dialog.showMessageBox(win, {
              type: 'error',
              title: '查询余额',
              message: result.error || '查询失败',
            });
            return;
          }
          if (!result.available) {
            dialog.showMessageBox(win, {
              type: 'warning',
              title: '查询余额',
              message: result.error || '当前账户余额不可用',
            });
            return;
          }
          const lines = Object.entries(result.currencies ?? {})
            .map(([currency, amount]) => `${currency}：${Number(amount).toFixed(2)}`)
            .join('\n');
          dialog.showMessageBox(win, {
            type: 'info',
            title: '账户余额',
            message: lines || '没有可用钱包',
          });
        },
      },
      {
        label: '回到左下角',
        click: async () => {
          const area = dipArea(screen.getPrimaryDisplay());
          const height = Math.round((size * 9) / 16) + BUBBLE_SPACE;
          const x = area.x + marginX;
          const y = area.y + area.height - height - marginY;
          win.setPosition(x, y);
          await request('set-position', { x, y });
        },
      },
      {
        label: '隐藏',
        submenu: [
          { label: '5 分钟', click: () => hideFor(5 * 60 * 1000) },
          { label: '10 分钟', click: () => hideFor(10 * 60 * 1000) },
          { label: '30 分钟', click: () => hideFor(30 * 60 * 1000) },
          { label: '1 小时', click: () => hideFor(60 * 60 * 1000) },
          { label: '自定义…', click: openCustomHide },
        ],
      },
      {
        label: '重新加载',
        click: () => request('reload-desktop'),
      },
      {
        label: '打开桌宠设置（网页）',
        click: () => openDshUrl('settings'),
      },
        { type: 'separator' },
        {
          label: '退出',
          submenu: [
            { label: '退出此宠物', click: () => quitWindow() },
            { label: '退出全部宠物', click: () => request('quit-all') },
          ],
        },
      ]).popup({
      window: win,
      callback: () => {
        menuOpen = false;
        interactive = false;
        win.setIgnoreMouseEvents(true, { forward: true });
        win.blur();
      },
    });
    log('menu popup called');
    log(`menu shown in ${Date.now() - menuStart}ms (cache=${packCache.packs.length})`);
  });

  let tray;
  try {
    if (!trayEnabled) throw new Error('tray disabled');
    const image =
      iconPath && fs.existsSync(iconPath)
        ? nativeImage.createFromPath(iconPath)
        : nativeImage.createEmpty();
    tray = new Tray(image);
    tray.setToolTip('dsh-xiaofu');
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: '显示 / 隐藏',
          click: () => {
            if (win.isVisible()) {
              win.hide();
              request('set-hidden', { petId, until: 0 });
            } else {
              showNow();
            }
          },
        },
        { label: '打开桌宠设置（网页）', click: () => openDshUrl('settings') },
        { label: '重新加载', click: () => request('reload-desktop') },
        { type: 'separator' },
        {
          label: '退出',
          submenu: [
            { label: '退出此宠物', click: () => quitWindow() },
            { label: '退出全部宠物', click: () => request('quit-all') },
          ],
        },
      ]),
    );
  } catch (error) {
    console.error('tray unavailable', error);
  }

  const videoUrl = videoPath
    ? pathToFileURL(path.resolve(videoPath)).toString()
    : '';
  const clickVideoUrl = clickVideoPath
    ? pathToFileURL(path.resolve(clickVideoPath)).toString()
    : '';
  const clickVideoUrls = (
    clickVideoPaths.length > 0 ? clickVideoPaths : clickVideoPath ? [clickVideoPath] : []
  ).map((item) => pathToFileURL(path.resolve(item)).toString());
  const idleVideoUrls = (idleVideoPaths.length > 0 ? idleVideoPaths : [videoPath])
    .filter(Boolean)
    .map((item) => pathToFileURL(path.resolve(item)).toString());
  const doubleClickVideoUrl = doubleClickVideoPath
    ? pathToFileURL(path.resolve(doubleClickVideoPath)).toString()
    : '';
  const doubleClickVideoUrls = (
    doubleClickVideoPaths.length > 0
      ? doubleClickVideoPaths
      : doubleClickVideoPath
        ? [doubleClickVideoPath]
        : []
  ).map((item) => pathToFileURL(path.resolve(item)).toString());

  await win.loadFile(path.join(__dirname, 'index.html'), {
    query: {
      video: videoUrl,
      idleVideos: JSON.stringify(idleVideoUrls),
      click: clickVideoUrl,
      clickVideos: JSON.stringify(clickVideoUrls),
      doubleClick: doubleClickVideoUrl,
      doubleClickVideos: JSON.stringify(doubleClickVideoUrls),
      doubleClickAction,
      sound: soundClickEnabled ? '1' : '0',
      volume: String(soundVolume),
      soundFile: soundFile ? pathToFileURL(path.resolve(soundFile)).toString() : '',
      bubbles: Buffer.from(JSON.stringify(bubbleQuotes), 'utf8').toString('base64'),
      bubbleDuration: String(bubbleDuration),
      bubbleStyle: Buffer.from(JSON.stringify(bubbleStyle), 'utf8').toString('base64'),
      stateEvents: dshUrl
        ? `${dshUrl.replace(/\/$/, '')}/dsh-xiaofu/state/events`
        : '',
      emojiFile: emojiFile ? pathToFileURL(path.resolve(emojiFile)).toString() : '',
      fontFamily,
      fontSize: String(fontSize),
      action: clickAction,
      enabled: clickEnabled ? '1' : '0',
    },
  });

  const initialHidden = initialHiddenArg === '' ? Number.NaN : Number(initialHiddenArg);
  if (initialHidden === 0) {
    log('started hidden until shown manually');
  } else if (Number.isFinite(initialHidden) && initialHidden > Date.now()) {
    const remaining = initialHidden - Date.now();
    hideTimer = setTimeout(() => {
      hideTimer = null;
      showPet();
      request('set-visible', { petId });
      log('shown after restored hide timer');
    }, remaining);
    log(`started hidden for ${Math.round(remaining / 60000)} more minutes`);
  } else {
    showPet();
  }

  if (screenshotPath) {
    setTimeout(async () => {
      try {
        const image = await win.webContents.capturePage();
        fs.writeFileSync(screenshotPath, image.toPNG());
        console.log(`screenshot written: ${screenshotPath}`);
      } catch (error) {
        console.error('capture failed', error);
      } finally {
        clearInterval(pointerTimer);
        app.quit();
      }
    }, 2500);
  }

  scheduleRoam();
});

app.on('window-all-closed', () => {
  if (!quitting) quitWindow();
});
