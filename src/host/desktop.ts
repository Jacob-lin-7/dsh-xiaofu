import { spawn, type ChildProcess } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { resolveDshHome } from './config.js';

export type DesktopStatus = 'stopped' | 'starting' | 'running' | 'failed';

export interface DesktopAnimation {
  name: string;
  path: string;
  mode: 'loop' | 'once';
  fps?: number;
}

export interface DesktopStartOptions {
  petId: string;
  name?: string;
  videoPath: string;
  idleVideoPaths?: string[];
  clickVideoPath?: string;
  clickVideoPaths?: string[];
  doubleClickVideoPath?: string;
  doubleClickVideoPaths?: string[];
  animations?: DesktopAnimation[];
  animationsFile?: string;
  packsFile?: string;
  currentPack?: string;
  dshUrl?: string;
  iconPath?: string;
  size: number;
  corner: string;
  marginX: number;
  marginY: number;
  x?: number;
  y?: number;
  /** 0 = 无限期隐藏；正数 = 恢复时间戳；undefined = 立即可见 */
  hiddenUntil?: number;
  soundClick?: boolean;
  soundVolume?: number;
  soundFile?: string;
  bubbleQuotes?: string[];
  bubbleDuration?: number;
  bubbleStyle?: Record<string, string | number>;
  emojiFile?: string;
  fontFamily?: string;
  fontSize?: number;
  clickAction?: string;
  doubleClickAction?: string;
  clickEnabled?: boolean;
  roamEnabled?: boolean;
}

export interface DesktopWindow {
  petId: string;
  pid?: number;
  restarts?: number;
}

export interface DesktopSnapshot {
  status: DesktopStatus;
  pid?: number;
  error?: string;
  windows: DesktopWindow[];
  failed?: Array<{ petId: string; error: string }>;
}

const MAX_RESTARTS = 3;

function hostLog(message: string): void {
  try {
    appendFileSync(join(tmpdir(), 'dsh-xiaofu-host.log'), `${new Date().toISOString()} ${message}\n`);
  } catch {
    // ignore
  }
}

export class DesktopManager {
  private children = new Map<string, ChildProcess>();
  private desired = new Map<string, DesktopStartOptions>();
  private attempts = new Map<string, number>();
  private timers = new Map<string, NodeJS.Timeout>();
  private failedPets = new Map<string, string>();
  private intentional = new Set<string>();
  private errorValue: string | undefined;
  private requestHandler:
    | ((message: Record<string, unknown>) => Promise<Record<string, unknown>>)
    | undefined;

  constructor() {
    const killChildren = () => {
      for (const child of this.children.values()) {
        try {
          child.kill();
        } catch {
          // ignore
        }
      }
    };
    process.on('exit', killChildren);
    process.on('SIGINT', () => {
      killChildren();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      killChildren();
      process.exit(0);
    });
  }

  setRequestHandler(
    handler: (message: Record<string, unknown>) => Promise<Record<string, unknown>>,
  ): void {
    this.requestHandler = handler;
  }

  status(): DesktopSnapshot {
    const windows = [...this.children.entries()].map(([petId, child]) => ({
      petId,
      pid: child.pid,
      restarts: this.attempts.get(petId) ?? 0,
    }));
    const failed = [...this.failedPets.entries()].map(([petId, error]) => ({ petId, error }));
    const status: DesktopStatus =
      windows.length > 0 ? 'running' : failed.length > 0 ? 'failed' : 'stopped';
    return {
      status,
      pid: windows[0]?.pid,
      error: this.errorValue ?? failed[0]?.error,
      windows,
      failed,
    };
  }

  private electronPath(): string | undefined {
    const candidates = [
      process.env.DSH_PET_ELECTRON_PATH,
      process.platform === 'win32'
        ? join(resolveDshHome(), 'electron', 'electron.exe')
        : undefined,
      process.platform === 'win32'
        ? join(homedir(), '.dsh', 'electron', 'electron.exe')
        : undefined,
      process.platform === 'darwin'
        ? join(resolveDshHome(), 'electron', 'Electron.app', 'Contents', 'MacOS', 'Electron')
        : undefined,
      process.platform === 'darwin'
        ? join(homedir(), '.dsh', 'electron', 'Electron.app', 'Contents', 'MacOS', 'Electron')
        : undefined,
      process.platform === 'linux'
        ? join(resolveDshHome(), 'electron', 'electron')
        : undefined,
      process.platform === 'linux'
        ? join(homedir(), '.dsh', 'electron', 'electron')
        : undefined,
    ].filter((value): value is string => Boolean(value));

    return candidates.find((candidate) => existsSync(candidate));
  }

  private helperPath(): string {
    return fileURLToPath(new URL('../desktop-helper/main.cjs', import.meta.url));
  }

  start(options: DesktopStartOptions): DesktopSnapshot {
    this.desired.set(options.petId, options);
    this.failedPets.delete(options.petId);
    this.errorValue = undefined;
    if (!this.children.has(options.petId)) {
      this.spawn(options);
    }
    return this.status();
  }

  private spawn(options: DesktopStartOptions): void {
    if (this.children.has(options.petId)) return;

    const electron = this.electronPath();
    if (!electron) {
      this.failedPets.set(options.petId, 'Electron not found（可设置 DSH_PET_ELECTRON_PATH）');
      return;
    }
    if (!existsSync(options.videoPath)) {
      this.failedPets.set(options.petId, '形象视频不存在');
      return;
    }

    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;

    const args = [
      this.helperPath(),
      '--name',
      options.name ?? 'Hex 桌宠',
      '--pet-id',
      options.petId,
      '--video',
      options.videoPath,
      '--idle-videos',
      Buffer.from(JSON.stringify(options.idleVideoPaths ?? []), 'utf8').toString('base64'),
      '--click-video',
      options.clickVideoPath ?? '',
      '--click-videos',
      Buffer.from(JSON.stringify(options.clickVideoPaths ?? []), 'utf8').toString('base64'),
      '--double-click-video',
      options.doubleClickVideoPath ?? '',
      '--double-click-videos',
      Buffer.from(JSON.stringify(options.doubleClickVideoPaths ?? []), 'utf8').toString('base64'),
      '--animations-file',
      options.animationsFile ?? '',
      '--packs-file',
      options.packsFile ?? '',
      '--current-pack',
      options.currentPack ?? '',
      '--dsh-url-b64',
      Buffer.from(options.dshUrl ?? '', 'utf8').toString('base64'),
      '--icon',
      options.iconPath ?? '',
      '--size',
      String(options.size),
      '--corner',
      options.corner,
      '--margin-x',
      String(options.marginX),
      '--margin-y',
      String(options.marginY),
      '--tray',
      '1',
    ];
    if (typeof options.x === 'number' && typeof options.y === 'number') {
      args.push('--x', String(options.x), '--y', String(options.y));
    }
    if (typeof options.hiddenUntil === 'number') {
      args.push('--hidden-until', String(options.hiddenUntil));
    }
    args.push(
      '--sound-click',
      options.soundClick ? '1' : '0',
      '--sound-volume',
      String(options.soundVolume ?? 0.6),
      '--sound-file',
      options.soundFile ?? '',
      '--click-action',
      options.clickAction ?? 'animation',
      '--double-click-action',
      options.doubleClickAction ?? 'none',
      '--click-enabled',
      options.clickEnabled === false ? '0' : '1',
      '--roam',
      options.roamEnabled === false ? '0' : '1',
      '--bubbles-b64',
      Buffer.from(JSON.stringify(options.bubbleQuotes ?? []), 'utf8').toString('base64'),
      '--bubble-duration',
      String(options.bubbleDuration ?? 8000),
      '--bubble-style-b64',
      Buffer.from(JSON.stringify(options.bubbleStyle ?? {}), 'utf8').toString('base64'),
      '--emoji-file',
      options.emojiFile ?? '',
      '--font-family',
      options.fontFamily ?? 'system',
      '--font-size',
      String(options.fontSize ?? 13),
    );

    const child = spawn(electron, args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    hostLog(`spawn ${args.join(' ')}`);

    child.stderr?.on('data', (chunk) => {
      hostLog(`stderr ${String(chunk).slice(-300)}`);
    });
    child.on('error', (error) => hostLog(`spawn error ${error.message}`));
    child.on('exit', (code) => hostLog(`exit ${code}`));
    child.stdin?.on('error', (error) => hostLog(`stdin error ${error.message}`));

    this.children.set(options.petId, child);

    if (child.stdout) {
      const reader = createInterface({ input: child.stdout });
      reader.on('line', async (line) => {
        hostLog(`line ${line.slice(0, 120)}`);
        if (!line.startsWith('HEX_PET:')) return;
        let message: Record<string, unknown>;
        try {
          message = JSON.parse(line.slice('HEX_PET:'.length)) as Record<string, unknown>;
        } catch {
          return;
        }
        let response: Record<string, unknown> = { ok: false, error: 'no handler' };
        try {
          if (this.requestHandler) response = await this.requestHandler(message);
        } catch (error) {
          response = {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
        if (message.requestId !== undefined) {
          response.requestId = message.requestId;
        }
        try {
          if (child.stdin?.writable) {
            child.stdin.write(`${JSON.stringify(response)}\n`, (error) => {
              if (error) hostLog(`stdin write failed ${error.message}`);
            });
          }
          hostLog(`response ${JSON.stringify(response).slice(0, 120)}`);
        } catch {
          // helper 已退出
        }
      });
    }

    const resetTimer = setTimeout(() => {
      if (this.children.get(options.petId) === child) {
        this.attempts.delete(options.petId);
      }
    }, 15000);

    child.on('exit', (code) => {
      clearTimeout(resetTimer);
      if (this.children.get(options.petId) !== child) return;
      this.children.delete(options.petId);

      const intentional = this.intentional.delete(options.petId);
      if (intentional || !this.desired.has(options.petId)) return;

      const attempts = (this.attempts.get(options.petId) ?? 0) + 1;
      if (attempts > MAX_RESTARTS) {
        this.desired.delete(options.petId);
        this.failedPets.set(
          options.petId,
          `helper 连续退出 ${MAX_RESTARTS} 次（最后一次 code=${code ?? 'null'}）`,
        );
        return;
      }
      this.attempts.set(options.petId, attempts);
      const delay = 1000 * 2 ** (attempts - 1);
      const timer = setTimeout(() => {
        this.timers.delete(options.petId);
        const next = this.desired.get(options.petId);
        if (next && !this.children.has(options.petId)) this.spawn(next);
      }, delay);
      this.timers.set(options.petId, timer);
    });

    child.on('error', (error) => {
      clearTimeout(resetTimer);
      if (this.children.get(options.petId) !== child) return;
      this.children.delete(options.petId);
      this.failedPets.set(options.petId, error.message);
    });
  }

  isRunning(petId: string): boolean {
    return this.children.has(petId);
  }

  updatePosition(petId: string, x: number, y: number): void {
    const options = this.desired.get(petId);
    if (options) {
      options.x = x;
      options.y = y;
    }
  }

  stopPet(petId: string): DesktopSnapshot {
    this.desired.delete(petId);
    this.failedPets.delete(petId);
    const timer = this.timers.get(petId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(petId);
    }
    const child = this.children.get(petId);
    if (child) {
      child.kill();
      this.children.delete(petId);
    }
    this.attempts.delete(petId);
    return this.status();
  }

  stop(): DesktopSnapshot {
    for (const petId of [...this.desired.keys(), ...this.children.keys()]) {
      this.stopPet(petId);
    }
    this.desired.clear();
    this.attempts.clear();
    this.failedPets.clear();
    this.errorValue = undefined;
    return this.status();
  }
}

export const desktopManager = new DesktopManager();
