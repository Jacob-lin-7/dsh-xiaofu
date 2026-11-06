/**
 * client 半侧外壳（M0）：
 * - 普通副作用脚本，由 DSH 模块系统加载；
 * - 通过 window.__ModuleLoader__.load 注册 factory，factory 内用 require 取平台种子模块；
 * - 不包含顶层 import/export（react 由 factory 的 require 取得）。
 *
 * 参考 早期桌宠项目（MIT）的加载契约，代码为独立实现。
 */
/* global window */
window.__ModuleLoader__.load({
  id: 'dsh-xiaofu',
  factory: (require) => {
    const module = { exports: {} };
    const React = require('react');
    const h = React.createElement;

    const GROUP_LABELS = {
      core: '核心',
      interaction: '互动',
      appearance: '形象',
      display: '显示',
      status: '状态',
      system: '系统',
    };

    const styles = {
      page: {
        padding: '16px 20px',
        maxWidth: 760,
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      },
      sectionNav: {
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        padding: '8px 0',
        margin: '4px 0 10px',
        background: 'Canvas',
        borderBottom: '1px solid rgba(127,127,127,0.2)',
      },
      title: { margin: '0 0 6px', fontSize: 20 },
      hint: { margin: '0 0 14px', opacity: 0.68, fontSize: 13, lineHeight: 1.6 },
      tabs: { display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 18px' },
      tab: {
        padding: '5px 12px',
        borderRadius: 999,
        border: '1px solid rgba(127,127,127,0.35)',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: 13,
      },
      tabActive: { background: 'rgba(127,127,127,0.16)', borderColor: 'rgba(127,127,127,0.6)' },
      group: { margin: '0 0 18px' },
      groupTitle: { margin: '0 0 8px', fontSize: 14, opacity: 0.8 },
      row: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 8,
        cursor: 'pointer',
      },
      label: { flex: 1, fontSize: 14 },
      badge: {
        fontSize: 11,
        padding: '1px 6px',
        borderRadius: 999,
        background: 'rgba(127,127,127,0.16)',
        opacity: 0.8,
      },
      inherit: {
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid rgba(127,127,127,0.35)',
        background: 'transparent',
        cursor: 'pointer',
        opacity: 0.85,
      },
      id: { fontSize: 11, opacity: 0.4, fontFamily: 'monospace' },
      preview: {
        margin: '0 0 18px',
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(127,127,127,0.10)',
      },
      previewItem: { padding: '4px 0', fontSize: 13 },
      previewReason: { opacity: 0.55, fontSize: 12, marginLeft: 6 },
      footer: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 },
      button: {
        padding: '6px 14px',
        borderRadius: 6,
        border: '1px solid rgba(127,127,127,0.4)',
        background: 'transparent',
        cursor: 'pointer',
      },
      danger: {
        padding: '6px 14px',
        borderRadius: 6,
        border: '1px solid rgba(192,57,43,0.45)',
        background: 'transparent',
        color: '#c0392b',
        cursor: 'pointer',
      },
      dangerActive: {
        padding: '6px 14px',
        borderRadius: 6,
        border: '1px solid #c0392b',
        background: 'rgba(192,57,43,0.14)',
        color: '#c0392b',
        cursor: 'pointer',
      },
      thumb: {
        width: 40,
        height: 40,
        borderRadius: 8,
        objectFit: 'contain',
        background: 'rgba(127,127,127,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        opacity: 0.9,
        flexShrink: 0,
      },
      input: {
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid rgba(127,127,127,0.35)',
        background: 'transparent',
        color: 'inherit',
        fontSize: 13,
        minWidth: 160,
      },
      error: { color: '#c0392b', fontSize: 13, margin: '0 0 12px' },
      status: { fontSize: 12, opacity: 0.55 },
      card: {
        margin: '0 0 20px',
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid rgba(127,127,127,0.25)',
      },
      drop: {
        margin: '10px 0',
        padding: '16px',
        borderRadius: 10,
        border: '1px dashed rgba(127,127,127,0.45)',
        textAlign: 'center',
        fontSize: 13,
        opacity: 0.85,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
      },
      packRow: { display: 'flex', gap: 8, fontSize: 13, padding: '4px 0', alignItems: 'baseline' },
      packId: { opacity: 0.5, fontFamily: 'monospace', fontSize: 11 },
      menu: {
        position: 'fixed',
        minWidth: 180,
        padding: 6,
        borderRadius: 10,
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid rgba(127,127,127,0.35)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        zIndex: 2147483001,
        fontSize: 13,
      },
      menuItem: {
        padding: '7px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
      },
      menuItemDisabled: { opacity: 0.45, cursor: 'default' },
      menuSub: { padding: '2px 10px 6px 22px', fontSize: 12, opacity: 0.85 },
      about: {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300,
        padding: 18,
        borderRadius: 12,
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid rgba(127,127,127,0.35)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        zIndex: 2147483002,
        fontSize: 13,
        lineHeight: 1.6,
      },
      snoozePill: {
        position: 'fixed',
        right: 16,
        top: 16,
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(127,127,127,0.35)',
        background: 'Canvas',
        color: 'CanvasText',
        fontSize: 12,
        cursor: 'pointer',
        zIndex: 2147483000,
      },
    };

    const PLACEHOLDER_STYLE = {
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    };

    function HexMascot({ sleeping }) {
      return h(
        'svg',
        {
          viewBox: '0 0 240 240',
          className: sleeping ? 'hexm is-sleeping' : 'hexm',
          style: { width: '100%', height: '100%', overflow: 'visible' },
        },
        h(
          'defs',
          {},
          h(
            'linearGradient',
            { id: 'hexm-body', x1: '0', y1: '0', x2: '1', y2: '1' },
            h('stop', { offset: '0%', stopColor: '#7c3aed' }),
            h('stop', { offset: '48%', stopColor: '#a855f7' }),
            h('stop', { offset: '100%', stopColor: '#e9d5ff' }),
          ),
          h(
            'radialGradient',
            { id: 'hexm-shine', cx: '0.3', cy: '0.2', r: '0.8' },
            h('stop', { offset: '0%', stopColor: '#ffffff', stopOpacity: '0.9' }),
            h('stop', { offset: '45%', stopColor: '#ffffff', stopOpacity: '0.16' }),
            h('stop', { offset: '100%', stopColor: '#ffffff', stopOpacity: '0' }),
          ),
          h(
            'linearGradient',
            { id: 'hexm-rim', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', stopColor: '#f5f3ff' }),
            h('stop', { offset: '100%', stopColor: '#c4b5fd' }),
          ),
          h(
            'filter',
            { id: 'hexm-glow', x: '-40%', y: '-40%', width: '180%', height: '180%' },
            h('feGaussianBlur', { stdDeviation: '6', result: 'blur' }),
            h(
              'feMerge',
              {},
              h('feMergeNode', { in: 'blur' }),
              h('feMergeNode', { in: 'SourceGraphic' }),
            ),
          ),
          h(
            'filter',
            { id: 'hexm-soft', x: '-30%', y: '-30%', width: '160%', height: '160%' },
            h('feGaussianBlur', { stdDeviation: '3' }),
          ),
        ),
        h('style', {}, `
          .hexm .hexm-float { animation: hexm-float 3.4s ease-in-out infinite; transform-origin: 120px 120px; }
          .hexm .hexm-eyes { animation: hexm-blink 4.6s infinite; transform-origin: 120px 118px; }
          .hexm .hexm-eye-closed { display: none; }
          .hexm.is-sleeping .hexm-float { animation-duration: 6s; }
          .hexm.is-sleeping .hexm-eyes { display: none; }
          .hexm.is-sleeping .hexm-eye-closed { display: block; }
          .hexm .hexm-spark { animation: hexm-twinkle 2.6s ease-in-out infinite; transform-origin: center; }
          .hexm .hexm-spark.delay { animation-delay: 1.2s; }
          @keyframes hexm-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
          @keyframes hexm-blink { 0%,92%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } }
          @keyframes hexm-twinkle { 0%,100% { opacity: 0.25; transform: scale(0.85); } 50% { opacity: 0.9; transform: scale(1.15); } }
        `),
        h('ellipse', { cx: 120, cy: 214, rx: 62, ry: 11, fill: '#1e1b4b', opacity: 0.22, filter: 'url(#hexm-soft)' }),
        h(
          'g',
          { className: 'hexm-float' },
          h('path', {
            d: 'M120 26 L203 72 L203 166 L120 212 L37 166 L37 72 Z',
            fill: 'url(#hexm-body)',
            stroke: 'url(#hexm-rim)',
            strokeWidth: 3.5,
            strokeLinejoin: 'round',
            filter: 'url(#hexm-glow)',
          }),
          h('path', {
            d: 'M120 38 L190 77 L190 160 L120 199 L50 160 L50 77 Z',
            fill: 'none',
            stroke: '#f5f3ff',
            strokeOpacity: 0.35,
            strokeWidth: 1.6,
          }),
          h('path', {
            d: 'M120 26 L203 72 L203 166 L120 212 L37 166 L37 72 Z',
            fill: 'url(#hexm-shine)',
          }),
          h('path', {
            d: 'M120 34 C118 20 122 12 132 8',
            fill: 'none',
            stroke: '#c4b5fd',
            strokeWidth: 4,
            strokeLinecap: 'round',
          }),
          h('circle', { cx: 133, cy: 7, r: 6, fill: '#f0abfc', opacity: 0.9, filter: 'url(#hexm-glow)' }),
          h(
            'g',
            { className: 'hexm-eyes' },
            h('ellipse', { cx: 91, cy: 118, rx: 15, ry: 17, fill: '#2e1065' }),
            h('ellipse', { cx: 149, cy: 118, rx: 15, ry: 17, fill: '#2e1065' }),
            h('circle', { cx: 86, cy: 112, r: 5, fill: '#ffffff' }),
            h('circle', { cx: 144, cy: 112, r: 5, fill: '#ffffff' }),
            h('circle', { cx: 95, cy: 124, r: 2.4, fill: '#ffffff', opacity: 0.8 }),
            h('circle', { cx: 153, cy: 124, r: 2.4, fill: '#ffffff', opacity: 0.8 }),
          ),
          h(
            'g',
            { className: 'hexm-eye-closed' },
            h('path', { d: 'M78 118 Q91 130 104 118', fill: 'none', stroke: '#2e1065', strokeWidth: 4, strokeLinecap: 'round' }),
            h('path', { d: 'M136 118 Q149 130 162 118', fill: 'none', stroke: '#2e1065', strokeWidth: 4, strokeLinecap: 'round' }),
          ),
          h('ellipse', { cx: 72, cy: 139, rx: 11, ry: 6, fill: '#fb7185', opacity: 0.38 }),
          h('ellipse', { cx: 168, cy: 139, rx: 11, ry: 6, fill: '#fb7185', opacity: 0.38 }),
          h('path', { d: 'M112 149 Q120 158 128 149', fill: 'none', stroke: '#3b0764', strokeWidth: 3.4, strokeLinecap: 'round' }),
          h('path', { d: 'M43 128 Q26 138 34 154', fill: 'none', stroke: '#c4b5fd', strokeWidth: 7, strokeLinecap: 'round' }),
          h('path', { d: 'M197 128 Q214 138 206 154', fill: 'none', stroke: '#c4b5fd', strokeWidth: 7, strokeLinecap: 'round' }),
          h('circle', { cx: 35, cy: 157, r: 7, fill: '#e9d5ff' }),
          h('circle', { cx: 205, cy: 157, r: 7, fill: '#e9d5ff' }),
        ),
        h('path', { className: 'hexm-spark', d: 'M30 72 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z', fill: '#f0abfc', opacity: 0.6 }),
        h('path', { className: 'hexm-spark delay', d: 'M206 84 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z', fill: '#c4b5fd', opacity: 0.6 }),
      );
    }

    const SETTINGS_PARAM = 'dsh-xiaofu';
    const LEGACY_SETTINGS_PARAM = 'dsh-hex-pet';

    let clickAudioContext = null;
    const focusChatComposer = () => {
      const input = document.querySelector('textarea, [contenteditable="true"]');
      if (!input) return false;
      input.scrollIntoView({ block: 'nearest' });
      input.focus();
      return true;
    };
    const openDshChat = () => {
      if (focusChatComposer()) return;
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set(SETTINGS_PARAM, 'chat');
      window.open(url.toString(), '_blank');
    };
    const playClickSound = (volume = 0.6, file = '') => {
      if (!volume || volume <= 0) return;
      if (file) {
        try {
          const audio = new Audio(`/dsh-xiaofu/sound/asset?t=${Date.now()}`);
          audio.volume = volume;
          void audio.play().catch(() => {});
        } catch {
          // 自定义音效不可用时静默
        }
        return;
      }
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        clickAudioContext = clickAudioContext || new Ctx();
        if (clickAudioContext.state === 'suspended') {
          clickAudioContext.resume().catch(() => {});
        }
        const now = clickAudioContext.currentTime;
        const osc = clickAudioContext.createOscillator();
        const gain = clickAudioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(760, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.07);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, volume * 0.18),
          now + 0.01,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.connect(gain);
        gain.connect(clickAudioContext.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } catch {
        // 音频不可用时静默
      }
    };

    // 打开 DSH 设置，并切到「桌宠配置」分区；等界面挂载后再点，避免早于渲染。
    const openHexSettings = () => {
      const button = document.querySelector('button[aria-label="设置"]');
      if (button) button.click();
      let attempts = 0;
      const clickNav = () => {
        const nav = Array.from(document.querySelectorAll('button')).find(
          (item) => (item.innerText || '').trim() === '桌宠配置',
        );
        if (nav) {
          nav.click();
          return;
        }
        if (++attempts <= 20) window.setTimeout(clickNav, 250);
      };
      window.setTimeout(clickNav, 300);
    };

    // 桌面 helper 打开网页时带 ?dsh-xiaofu=settings|chat，这里消费一次后清掉参数。
    const consumeSettingsDeepLink = () => {
      let url;
      try {
        url = new URL(window.location.href);
      } catch {
        return;
      }
      const mode =
        url.searchParams.get(SETTINGS_PARAM) ??
        url.searchParams.get(LEGACY_SETTINGS_PARAM);
      if (mode !== 'settings' && mode !== 'chat') return;
      url.searchParams.delete(SETTINGS_PARAM);
      url.searchParams.delete(LEGACY_SETTINGS_PARAM);
      try {
        window.history.replaceState(null, '', url.toString());
      } catch {
        // 历史 API 不可用时保持原样
      }
      if (mode === 'chat') {
        let chatAttempts = 0;
        const waitForChat = () => {
          if (focusChatComposer()) return;
          if (++chatAttempts <= 20) window.setTimeout(waitForChat, 250);
        };
        window.setTimeout(waitForChat, 300);
        return;
      }
      let attempts = 0;
      const waitForSettings = () => {
        if (document.querySelector('button[aria-label="设置"]')) {
          openHexSettings();
          return;
        }
        if (++attempts <= 20) window.setTimeout(waitForSettings, 250);
      };
      window.setTimeout(waitForSettings, 300);
    };

    consumeSettingsDeepLink();

    const FONT_STACKS = {
      system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      sans: 'Arial, "Microsoft YaHei", sans-serif',
      serif: 'Georgia, "Songti SC", serif',
      mono: 'ui-monospace, "Cascadia Mono", Consolas, monospace',
      cute: '"YouYuan", "幼圆", "Comic Sans MS", "Microsoft YaHei", sans-serif',
      anime: '"Segoe Print", "Comic Sans MS", "华文琥珀", "Microsoft YaHei", cursive',
      kai: '"KaiTi", "楷体", "STKaiti", serif',
      song: '"SimSun", "宋体", "Songti SC", serif',
      brush: '"STXingkai", "华文行楷", "KaiTi", cursive',
      seal: '"LiSu", "隶书", "STLiti", serif',
      round: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif',
    };
    const BUILTIN_FONTS = {
      kuaile: { label: '可爱·快乐体', file: 'zcool-kuaile.woff2' },
      qingke: { label: '动漫·清刻黄油', file: 'zcool-qingke-huangyou.woff2' },
      mashan: { label: '古风·马善政行书', file: 'ma-shan-zheng.woff2' },
      zhimang: { label: '手写·志莽行书', file: 'zhi-mang-xing.woff2' },
      longcang: { label: '草书·龙藏', file: 'long-cang.woff2' },
      xiaowei: { label: '古风·小薇宋', file: 'zcool-xiaowei.woff2' },
    };
    const injectFontFace = (family, url) => {
      if (typeof document !== 'undefined' && !document.getElementById(family)) {
        const style = document.createElement('style');
        style.id = family;
        style.textContent = `@font-face{font-family:"${family}";src:url("${url}");font-display:swap;}`;
        document.head.appendChild(style);
      }
      return family;
    };
    const customFontFamily = (asset) =>
      injectFontFace(
        `HexCustom-${asset.replace(/[^a-zA-Z0-9]/g, '')}`,
        `/dsh-xiaofu/font/asset/${encodeURIComponent(asset)}`,
      );
    const builtinFontFamily = (id) => {
      const preset = BUILTIN_FONTS[id];
      if (!preset) return null;
      return injectFontFace(
        `HexBuiltin-${id}`,
        `/dsh-xiaofu/font/builtin/${encodeURIComponent(preset.file)}`,
      );
    };
    const appearanceFont = (appearance, petSize) => {
      const config = appearance ?? { fontFamily: 'system', fontSize: 13, scaleWithPet: false };
      const scale = config.scaleWithPet
        ? Math.max(0.85, Math.min(1.6, (petSize || 420) / 420))
        : 1;
      return {
        fontFamily: FONT_STACKS[config.fontFamily] ?? FONT_STACKS.system,
        fontSize: Math.round(config.fontSize * scale),
      };
    };

    const ACTION_EVENT_OPTIONS = [
      { id: 'idle', label: '空闲' },
      { id: 'task-start', label: '任务进行中' },
      { id: 'task-done', label: '任务完成' },
      { id: 'approval-needed', label: '等待确认' },
      { id: 'task-timeout', label: '耗时过长' },
      { id: 'balance-warning', label: '余额警告' },
    ];
    const ACTION_ENTRY_DEFAULTS = {
      idle: { animation: 'animations/idle.webm', bubble: '', durationSec: 0 },
      'task-start': { animation: 'animations/state-working.webm', bubble: '正在处理…', durationSec: 0 },
      'task-done': { animation: 'animations/state-done.webm', bubble: '搞定啦', durationSec: 5 },
      'approval-needed': { animation: 'animations/state-approval.webm', bubble: '这里需要你确认一下', durationSec: 0 },
      'task-timeout': { animation: 'animations/state-alert-time.webm', bubble: '这一步有点久了…', durationSec: 8 },
      'balance-warning': { animation: 'animations/state-alert-cost.webm', bubble: '余额/消耗提醒', durationSec: 8 },
    };
    const EVENT_HOLD_DEFAULTS = {
      idle: 0,
      'task-start': 0,
      'task-done': 1200,
      'approval-needed': 0,
      'task-timeout': 300,
      'balance-warning': 120,
    };
    const AI_STUDIO_COPY = {
      character:
        '我想做一个新角色。请先给我一张正面全身角色设定图的生图提示词；我生成后把图片发到对话里，你负责检查、处理、打包、安装和绑定。',
      action:
        '我想给当前角色加一个动作。请先给我图生视频提示词（绿幕、固定机位、16:9）；我生成 MP4 后发到对话里，你负责抠像、去水印、编码、加入动作库并命名。',
    };
    const actionEntryFor = (event, entries) => {
      const existing = (entries ?? []).find((entry) => entry.event === event);
      const defaults = ACTION_ENTRY_DEFAULTS[event] ?? {
        animation: 'animations/idle.webm',
        bubble: '',
        durationSec: 0,
      };
      const animation = existing?.animation ?? defaults.animation;
      const animations =
        existing?.animations?.length > 0 ? existing.animations : [animation];
      return {
        event,
        label: ACTION_EVENT_OPTIONS.find((item) => item.id === event)?.label ?? event,
        enabled: true,
        ...defaults,
        ...(existing ?? {}),
        animations,
        animation: animations[0],
      };
    };
    const ACTION_DEFAULT_LABELS = {
      'animations/idle.webm': '空闲',
      'animations/click.webm': '点击回应',
      'animations/state-working.webm': '任务进行中',
      'animations/state-approval.webm': '等待确认',
      'animations/state-done.webm': '任务完成',
      'animations/state-alert-time.webm': '耗时过长',
      'animations/state-alert-cost.webm': '余额警告',
    };
    const actionAliasKey = (packId, animation) => `${packId || ''}/${animation}`;
    const actionDisplayName = (packId, animation, actionNames) => {
      const alias = actionNames?.[actionAliasKey(packId, animation)];
      if (alias) return alias;
      if (ACTION_DEFAULT_LABELS[animation]) return ACTION_DEFAULT_LABELS[animation];
      return animation
        .replace(/^animations\//, '')
        .replace(/\.(webm|mov)$/i, '')
        .replace(/[-_]+/g, ' ');
    };

    const DIALOGUE_EVENT_OPTIONS = [
      { id: 'click', label: '点击时' },
      ...ACTION_EVENT_OPTIONS,
    ];

    const BUBBLE_STYLES = {
      classic: {
        label: '经典白',
        style: {
          background: '#ffffff',
          color: '#1f2937',
          border: '1px solid rgba(127,127,127,0.35)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          padding: '7px 11px',
        },
      },
      soft: {
        label: '奶油圆角',
        style: {
          background: '#fffaf2',
          color: '#4b3a2f',
          border: '1px solid rgba(180,140,100,0.25)',
          borderRadius: 20,
          boxShadow: '0 10px 28px rgba(120,80,40,0.16)',
          padding: '9px 14px',
        },
      },
      comic: {
        label: '漫画描边',
        style: {
          background: '#ffffff',
          color: '#111827',
          border: '3px solid #111827',
          borderRadius: 6,
          boxShadow: '3px 3px 0 #111827',
          padding: '6px 11px',
          fontWeight: 700,
        },
      },
      pixel: {
        label: '像素方块',
        style: {
          background: '#f8fafc',
          color: '#0f172a',
          border: '2px solid #0f172a',
          borderRadius: 0,
          boxShadow: '4px 4px 0 #0f172a',
          padding: '8px 12px',
          fontFamily: 'ui-monospace, Consolas, monospace',
        },
      },
      scroll: {
        label: '宣纸古卷',
        style: {
          background: '#f4ecd8',
          color: '#3f2f1f',
          border: '2px solid #8b6f47',
          borderRadius: 2,
          boxShadow: '0 6px 18px rgba(80,60,30,0.18)',
          padding: '8px 13px',
        },
      },
      dark: {
        label: '暗夜',
        style: {
          background: 'rgba(17,24,39,0.94)',
          color: '#f8fafc',
          border: '1px solid #475569',
          borderRadius: 14,
          boxShadow: '0 8px 26px rgba(0,0,0,0.35)',
          padding: '8px 12px',
        },
      },
      neon: {
        label: '霓虹',
        style: {
          background: 'rgba(8,15,30,0.94)',
          color: '#a5f3fc',
          border: '1px solid #22d3ee',
          borderRadius: 14,
          boxShadow: '0 0 18px rgba(34,211,238,0.45)',
          padding: '8px 12px',
        },
      },
      dashed: {
        label: '虚线手账',
        style: {
          background: 'rgba(255,255,255,0.94)',
          color: '#334155',
          border: '2px dashed #64748b',
          borderRadius: 14,
          boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
          padding: '8px 12px',
        },
      },
      note: {
        label: '便签',
        style: {
          background: '#fef3c7',
          color: '#78350f',
          border: '1px solid #d97706',
          borderRadius: 2,
          boxShadow: '2px 3px 0 rgba(120,53,15,0.25)',
          padding: '8px 12px',
        },
      },
      'cute-cloud': {
        label: '可爱·云朵',
        style: {
          background: '#fff0f6',
          color: '#9d174d',
          border: '2px solid #f9a8d4',
          borderRadius: 24,
          boxShadow: '0 8px 22px rgba(244,114,182,0.22)',
          padding: '9px 14px',
        },
      },
      'cute-heart': {
        label: '可爱·桃心',
        style: {
          background: 'linear-gradient(135deg,#ffe4ec,#fff7fb)',
          color: '#9f1239',
          border: '2px solid #fb7185',
          borderRadius: '22px 22px 22px 6px',
          boxShadow: '0 8px 20px rgba(251,113,133,0.22)',
          padding: '9px 14px',
        },
      },
      'anime-pop': {
        label: '动漫·爆炸',
        style: {
          background: '#fde047',
          color: '#111827',
          border: '3px solid #111827',
          borderRadius: 8,
          boxShadow: '4px 4px 0 #111827',
          padding: '7px 12px',
          fontWeight: 800,
        },
      },
      'anime-lines': {
        label: '动漫·网点',
        style: {
          background:
            'radial-gradient(circle at 4px 4px, rgba(15,23,42,0.12) 1.2px, transparent 1.5px) 0 0/8px 8px, #ffffff',
          color: '#0f172a',
          border: '2px solid #0f172a',
          borderRadius: 12,
          boxShadow: '0 5px 0 #0f172a',
          padding: '8px 12px',
          fontWeight: 700,
        },
      },
      ink: {
        label: '古风·水墨',
        style: {
          background: '#f8f5ee',
          color: '#1c1917',
          border: '2px solid #292524',
          borderRadius: '14px 4px 14px 4px',
          boxShadow: '3px 4px 0 rgba(41,37,36,0.2)',
          padding: '8px 13px',
        },
      },
      seal: {
        label: '古风·印章',
        style: {
          background: '#fff7ed',
          color: '#7c2d12',
          border: '3px double #b91c1c',
          borderRadius: 4,
          boxShadow: '0 4px 14px rgba(185,28,28,0.16)',
          padding: '8px 12px',
          letterSpacing: 1,
        },
      },
      bamboo: {
        label: '古风·竹简',
        style: {
          background: 'linear-gradient(180deg,#ecfdf5,#d1fae5)',
          color: '#064e3b',
          border: '2px solid #047857',
          borderRadius: '3px 10px 3px 10px',
          boxShadow: '2px 3px 0 rgba(4,120,87,0.22)',
          padding: '8px 12px',
        },
      },
      moonlight: {
        label: '古风·月白',
        style: {
          background: 'linear-gradient(135deg,#eef2ff,#f8fafc)',
          color: '#1e3a8a',
          border: '1px solid #93c5fd',
          borderRadius: 16,
          boxShadow: '0 0 18px rgba(147,197,253,0.45)',
          padding: '8px 13px',
        },
      },
    };
    const BUBBLE_FONT_OPTIONS = [
      { id: 'inherit', label: '跟随外观' },
      { id: 'round', label: '圆润' },
      { id: 'cute', label: '可爱' },
      { id: 'anime', label: '动漫' },
      { id: 'kai', label: '楷体古风' },
      { id: 'song', label: '宋体' },
      { id: 'brush', label: '行楷手写' },
      { id: 'seal', label: '隶书' },
      { id: 'sans', label: '黑体' },
      { id: 'serif', label: '衬线' },
      ...Object.entries(BUILTIN_FONTS).map(([id, font]) => ({
        id: `builtin:${id}`,
        label: font.label,
      })),
    ];
    const bubbleSurface = (bubble, fontStyle, petSize = 420) => {
      const styleId = bubble?.customAsset && bubble?.style === 'custom'
        ? 'custom'
        : bubble?.style ?? 'classic';
      const font =
        bubble?.fontFamily?.startsWith('builtin:')
          ? {
              ...fontStyle,
              fontFamily: `"${builtinFontFamily(bubble.fontFamily.slice('builtin:'.length))}", sans-serif`,
            }
          : bubble?.fontFamily?.startsWith('custom:')
            ? {
                ...fontStyle,
                fontFamily: `"${customFontFamily(bubble.fontFamily.slice('custom:'.length))}", sans-serif`,
              }
            : bubble?.fontFamily && bubble.fontFamily !== 'inherit'
              ? {
                  ...fontStyle,
                  fontFamily: FONT_STACKS[bubble.fontFamily] ?? fontStyle.fontFamily,
                }
              : fontStyle;
      const scale = bubble?.scaleWithPet
        ? Math.max(0.85, Math.min(1.6, (petSize || 420) / 420))
        : 1;
      const textStyle = {
        ...font,
        fontSize: Math.round((Number(bubble?.fontSize) || 13) * scale),
        ...(bubble?.fontWeight === 'bold' ? { fontWeight: 700 } : {}),
        ...(bubble?.fontStyle === 'italic' ? { fontStyle: 'italic' } : {}),
      };
      if (styleId === 'custom' && bubble?.customAsset) {
        return {
          color: '#1f2937',
          border: 'none',
          borderRadius: 12,
          boxShadow: 'none',
          padding: '16px 20px',
          backgroundImage: `url(/dsh-xiaofu/bubble/asset/${encodeURIComponent(bubble.customAsset)})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          ...textStyle,
        };
      }
      const preset = BUBBLE_STYLES[styleId] ?? BUBBLE_STYLES.classic;
      return { ...preset.style, ...textStyle };
    };

    function PetInstance({ pet, pack, onOpenSettings, soundEnabled, soundVolume, soundFile, clickEnabled, roamEnabled, fontStyle, bubble, activeState, idleAnimation, idleAnimations }) {
      const snoozeKey = `dsh-xiaofu:snooze:${pet.id}`;
      const [pos, setPos] = React.useState(null);
      const [bounce, setBounce] = React.useState(false);
      const [bubbleText, setBubbleText] = React.useState('');
      const bubbleTimer = React.useRef(null);
      const clickTimer = React.useRef(null);
      const [look, setLook] = React.useState({ x: 0, y: 0, active: false });
      const [sleeping, setSleeping] = React.useState(false);
      const [stretch, setStretch] = React.useState(false);
      const wrapperRef = React.useRef(null);
      const lastActive = React.useRef(Date.now());
      const inertiaRef = React.useRef(null);
      const [videoFailed, setVideoFailed] = React.useState(false);
      const [animIndex, setAnimIndex] = React.useState(0);
      const [transient, setTransient] = React.useState(false);
      const [stateAnimIndex, setStateAnimIndex] = React.useState(0);
      const [idleIndex, setIdleIndex] = React.useState(0);
      const [stateBubbleText, setStateBubbleText] = React.useState(null);
      const [menu, setMenu] = React.useState(null);
      const [expanded, setExpanded] = React.useState(null);
      const [about, setAbout] = React.useState(false);
      const [hiddenUntil, setHiddenUntil] = React.useState(() => {
        try {
          return Number(window.localStorage.getItem(snoozeKey) || 0);
        } catch {
          return 0;
        }
      });
      const drag = React.useRef(null);

      React.useEffect(() => {
        setAnimIndex(0);
        setTransient(false);
        setVideoFailed(false);
        setPos(null);
      }, [pack?.id]);

      React.useEffect(() => {
        const x = pet.position?.x;
        const y = pet.position?.y;
        setPos(typeof x === 'number' && typeof y === 'number' ? { x, y } : null);
      }, [pet.id, pet.position?.x, pet.position?.y]);

      React.useEffect(() => {
        const remaining = hiddenUntil - Date.now();
        if (remaining <= 0) return;
        const timer = window.setTimeout(() => {
          setHiddenUntil(0);
          try {
            window.localStorage.removeItem(snoozeKey);
          } catch {
            // ignore
          }
        }, remaining);
        return () => window.clearTimeout(timer);
      }, [hiddenUntil, snoozeKey]);

      React.useEffect(() => {
        if (!roamEnabled) return;
        if (
          window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          return;
        }
        let timer;
        const schedule = () => {
          timer = window.setTimeout(() => {
            const currentSize = pet.size || 420;
            const currentHeight = (currentSize * 9) / 16;
            if (!drag.current && !menu && !about && hiddenUntil <= Date.now()) {
              const margin = 8;
              const maxX = Math.max(margin, window.innerWidth - currentSize - margin);
              const maxY = Math.max(margin, window.innerHeight - currentHeight - margin);
              const x = Math.round(margin + Math.random() * (maxX - margin));
              const y = Math.round(margin + Math.random() * (maxY - margin));
              setPos({ x, y });
            }
            schedule();
          }, 18000 + Math.random() * 12000);
        };
        schedule();
        return () => window.clearTimeout(timer);
      }, [roamEnabled, menu, about, hiddenUntil, pet.size]);

      React.useEffect(() => {
        if (!menu) return;
        const close = () => {
          setMenu(null);
          setExpanded(null);
        };
        const timer = window.setTimeout(() => window.addEventListener('pointerdown', close), 0);
        return () => {
          window.clearTimeout(timer);
          window.removeEventListener('pointerdown', close);
        };
      }, [menu]);

      const restore = () => {
        setHiddenUntil(0);
        try {
          window.localStorage.removeItem(snoozeKey);
        } catch {
          // ignore
        }
      };

      if (hiddenUntil > Date.now()) {
        return h(
          'button',
          { type: 'button', style: { ...styles.snoozePill, ...fontStyle }, onClick: restore },
          `${pet.name || 'Hex'}（网页）已隐藏 · 点击恢复`,
        );
      }

      if (!pet || !['web', 'both'].includes(pet.display)) return null;

      const size = pet.size || 420;
      const height = (size * 9) / 16;
      const corner = pet.position?.corner ?? 'top-right';
      const marginX = pet.position?.marginX ?? 24;
      const marginY = pet.position?.marginY ?? 100;

      const cornerStyle = {};
      if (corner.includes('top')) cornerStyle.top = marginY;
      else cornerStyle.bottom = marginY;
      if (corner.includes('left')) cornerStyle.left = marginX;
      else cornerStyle.right = marginX;

      const lookTransform = look.active
        ? `translate(${look.x}px, ${look.y}px) rotate(${look.x * 0.35}deg)`
        : 'translate(0, 0)';
      const petScale = bounce ? 0.92 : stretch ? 1.04 : sleeping ? 0.97 : 1;
      const wrapperStyle = {
        position: 'fixed',
        width: size,
        height,
        zIndex: 2147483000,
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
        transition: 'transform 160ms ease-out, opacity 600ms ease-out',
        opacity: 1,
        transform: `${lookTransform} scale(${petScale})`,
        ...(pos ? { left: pos.x, top: pos.y } : cornerStyle),
      };

      const onPointerDown = (event) => {
        if (event.button !== 0) return;
        if (inertiaRef.current) {
          cancelAnimationFrame(inertiaRef.current);
          inertiaRef.current = null;
        }
        lastActive.current = Date.now();
        setSleeping(false);
        const rect = event.currentTarget.getBoundingClientRect();
        drag.current = {
          startX: event.clientX,
          startY: event.clientY,
          left: rect.left,
          top: rect.top,
          moved: false,
          lastX: event.clientX,
          lastY: event.clientY,
          lastT: performance.now(),
          vx: 0,
          vy: 0,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      };

      const showBubble = () => {
        if (bubble?.enabled === false) return;
        const quotes = (bubble?.stateQuotes?.click ?? bubble?.quotes ?? []).filter(Boolean);
        if (quotes.length === 0) return;
        const text = quotes[Math.floor(Math.random() * quotes.length)];
        setBubbleText(text);
        if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
        bubbleTimer.current = window.setTimeout(
          () => setBubbleText(''),
          bubble?.stateTiming?.click?.durationMs ?? bubble?.durationMs ?? 8000,
        );
      };

      React.useEffect(
        () => () => {
          if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
          if (clickTimer.current) window.clearTimeout(clickTimer.current);
          if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
        },
        [],
      );

      React.useEffect(() => {
        const onMove = (event) => {
          lastActive.current = Date.now();
          setSleeping(false);
          const element = wrapperRef.current;
          if (!element) return;
          const rect = element.getBoundingClientRect();
          const dx = event.clientX - (rect.left + rect.width / 2);
          const dy = event.clientY - (rect.top + rect.height / 2);
          const distance = Math.hypot(dx, dy);
          if (distance < 320) {
            setLook({
              x: Math.max(-5, Math.min(5, dx / 50)),
              y: Math.max(-3, Math.min(3, dy / 50)),
              active: true,
            });
          } else {
            setLook((prev) => (prev.active ? { x: 0, y: 0, active: false } : prev));
          }
        };
        window.addEventListener('pointermove', onMove);
        return () => window.removeEventListener('pointermove', onMove);
      }, []);

      React.useEffect(() => {
        const timer = window.setInterval(() => {
          if (drag.current || menu || about) return;
          const idleFor = Date.now() - lastActive.current;
          if (idleFor > 60000) setSleeping(true);
          if (Math.random() < 0.35) {
            setStretch(true);
            window.setTimeout(() => setStretch(false), 1400);
          }
        }, 15000);
        return () => window.clearInterval(timer);
      }, [menu, about]);

      const onPointerMove = (event) => {
        const current = drag.current;
        if (!current) return;
        const dx = event.clientX - current.startX;
        const dy = event.clientY - current.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) current.moved = true;
        const x = Math.min(Math.max(0, current.left + dx), window.innerWidth - size);
        const y = Math.min(Math.max(0, current.top + dy), window.innerHeight - height);
        current.x = x;
        current.y = y;
        const now = performance.now();
        const dt = Math.max(16, now - current.lastT);
        current.vx = (event.clientX - current.lastX) / (dt / 16);
        current.vy = (event.clientY - current.lastY) / (dt / 16);
        current.lastX = event.clientX;
        current.lastY = event.clientY;
        current.lastT = now;
        setPos({ x, y });
      };

      const startInertia = (current) => {
        let x = current.x;
        let y = current.y;
        let vx = Math.max(-40, Math.min(40, current.vx));
        let vy = Math.max(-40, Math.min(40, current.vy));
        if (Math.hypot(vx, vy) < 1.5) {
          savePosition(x, y);
          return;
        }
        const step = () => {
          vx *= 0.9;
          vy *= 0.9;
          x = Math.min(Math.max(0, x + vx), window.innerWidth - size);
          y = Math.min(Math.max(0, y + vy), window.innerHeight - height);
          setPos({ x, y });
          if (Math.hypot(vx, vy) > 0.4) {
            inertiaRef.current = requestAnimationFrame(step);
          } else {
            inertiaRef.current = null;
            savePosition(x, y);
          }
        };
        step();
      };

      const clickListIndex = React.useRef(0);
      const doubleClickListIndex = React.useRef(0);

      const performClick = (action, selectedAnimation, playlist, rotateRef) => {
        if (soundEnabled) playClickSound(soundVolume, soundFile);
        showBubble();
        if (action === 'animation') {
          setBounce(true);
          window.setTimeout(() => setBounce(false), 160);
          const animations = pack?.animations ?? [];
          const list =
            Array.isArray(playlist) && playlist.length > 0
              ? playlist
              : selectedAnimation
                ? [selectedAnimation]
                : [];
          let choice = selectedAnimation;
          if (list.length > 0) {
            const index = rotateRef.current % list.length;
            choice = list[index];
            rotateRef.current = (index + 1) % list.length;
          }
          let playIndex = choice ? animations.indexOf(choice) : -1;
          if (playIndex < 0) {
            const clickIndex = animations.findIndex((name) =>
              /(^|\/)(click|tap|点击)/i.test(name),
            );
            const onceIndex = animations.findIndex(
              (name) => pack?.animationMeta?.[name]?.mode === 'once',
            );
            playIndex = clickIndex > 0 ? clickIndex : onceIndex > 0 ? onceIndex : -1;
          }
          if (playIndex > 0) {
            setAnimIndex(playIndex);
            setTransient(true);
          }
        } else if (action === 'chat') {
          openDshChat();
        } else if (action === 'open-dsh') {
          window.focus();
        }
      };

      const onPointerUp = () => {
        const current = drag.current;
        if (current && !current.moved) {
          if (clickEnabled === false) {
            drag.current = null;
            return;
          }
          drag.current = null;
          if (clickTimer.current) {
            window.clearTimeout(clickTimer.current);
            clickTimer.current = null;
            const action = pet.doubleClickAction ?? 'none';
            if (action !== 'none') {
              performClick(
                action,
                pet.doubleClickAnimation,
                pet.doubleClickAnimations,
                doubleClickListIndex,
              );
            } else {
              performClick(
                pet.clickAction ?? 'animation',
                pet.clickAnimation,
                pet.clickAnimations,
                clickListIndex,
              );
            }
            return;
          }
          clickTimer.current = window.setTimeout(() => {
            clickTimer.current = null;
            performClick(
              pet.clickAction ?? 'animation',
              pet.clickAnimation,
              pet.clickAnimations,
              clickListIndex,
            );
          }, 240);
          return;
        }
        if (current && typeof current.x === 'number' && typeof current.y === 'number') {
          startInertia(current);
        }
        drag.current = null;
      };

      const savePosition = async (x, y) => {
        try {
          const config = await (await fetch('/dsh-xiaofu/config', { cache: 'no-store' })).json();
          config.pets = config.pets.map((item) =>
            item.id === pet.id
              ? {
                  ...item,
                  position: {
                    ...(item.position ?? {}),
                    x: Math.round(x),
                    y: Math.round(y),
                  },
                }
              : item,
          );
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(config),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
        } catch {
          // 保存失败不打断拖拽
        }
      };

      const openMenu = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          const response = await fetch(
            `/dsh-xiaofu/menu?platform=web&pet=${encodeURIComponent(pet.id)}&llm=0&balance=0`,
            { cache: 'no-store' },
          );
          const data = await response.json();
          const width = 220;
          const estimatedHeight = 360;
          const x = Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8));
          const y =
            event.clientY + estimatedHeight > window.innerHeight
              ? Math.max(8, window.innerHeight - estimatedHeight)
              : event.clientY;
          setMenu({ x, y, items: data.menu });
          setExpanded(null);
        } catch {
          // 菜单打不开时保持静默
        }
      };

      const resetPosition = async () => {
        setMenu(null);
        try {
          const config = await (await fetch('/dsh-xiaofu/config', { cache: 'no-store' })).json();
          config.pets = config.pets.map((item) => {
            if (item.id !== pet.id) return item;
            const position = { ...(item.position ?? {}) };
            delete position.x;
            delete position.y;
            return { ...item, position };
          });
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(config),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
        } catch {
          // 失败时保持原位
        }
      };

      const applyDisplay = async (display) => {
        setMenu(null);
        try {
          const config = await (await fetch('/dsh-xiaofu/config', { cache: 'no-store' })).json();
          config.pets = config.pets.map((item) =>
            item.id === pet.id ? { ...item, display } : item,
          );
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(config),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
        } catch {
          // 失败时保持原状态
        }
      };

      const openSettings = () => {
        setMenu(null);
        openHexSettings();
      };

      const snoozeFor = (ms) => {
        const until = Date.now() + ms;
        setHiddenUntil(until);
        try {
          window.localStorage.setItem('dsh-xiaofu:snooze', String(until));
        } catch {
          // ignore
        }
        setMenu(null);
      };

      const handleMenuItem = (item) => {
        if (item.disabled) return;
        if (['menu.actions', 'menu.display', 'menu.snooze'].includes(item.id)) {
          setExpanded(expanded === item.id ? null : item.id);
          return;
        }
        if (item.id === 'menu.settings') {
          setMenu(null);
          if (onOpenSettings) onOpenSettings();
          return;
        }
        if (item.id === 'menu.petpack') {
          openSettings();
          return;
        }
        if (item.id === 'menu.about') {
          setAbout(true);
          setMenu(null);
          return;
        }
        setMenu(null);
      };

      const idleList =
        idleAnimations?.length > 0
          ? idleAnimations
          : idleAnimation
            ? [idleAnimation]
            : [];
      const idlePath =
        idleList.length > 0 ? idleList[idleIndex % idleList.length] : null;

      React.useEffect(() => {
        setIdleIndex(0);
      }, [idleList.join('|')]);

      React.useEffect(() => {
        setStateAnimIndex(0);
      }, [activeState?.event, activeState?.since]);

      const stateAnimations = activeState?.animations?.length
        ? activeState.animations
        : activeState?.animation
          ? [activeState.animation]
          : [];
      const stateAnimation =
        stateAnimations.length > 0
          ? stateAnimations[stateAnimIndex % stateAnimations.length]
          : null;

      React.useEffect(() => {
        if (!activeState) {
          setStateBubbleText(null);
          return undefined;
        }
        const quotes =
          activeState.quotes?.length > 0
            ? activeState.quotes
            : activeState.bubble
              ? [activeState.bubble]
              : [];
        if (quotes.length === 0) {
          setStateBubbleText(null);
          return undefined;
        }
        if (activeState.followAction) {
          const followIndex = stateAnimIndex % quotes.length;
          setStateBubbleText(quotes[followIndex]);
          return () => setStateBubbleText(null);
        }
        let cancelled = false;
        let showTimer = null;
        let gapTimer = null;
        let index = Math.floor(Math.random() * quotes.length);
        const duration = Math.max(300, Number(activeState.durationMs) || 8000);
        const gap = Math.max(0, Number(activeState.gapMs) || 0);
        const cycle = () => {
          if (cancelled) return;
          setStateBubbleText(quotes[index % quotes.length]);
          showTimer = setTimeout(() => {
            if (cancelled) return;
            setStateBubbleText(null);
            gapTimer = setTimeout(() => {
              index += 1;
              cycle();
            }, gap);
          }, duration);
        };
        cycle();
        return () => {
          cancelled = true;
          if (showTimer) clearTimeout(showTimer);
          if (gapTimer) clearTimeout(gapTimer);
          setStateBubbleText(null);
        };
      }, [
        activeState?.event,
        activeState?.since,
        activeState?.quotes?.join('|'),
        activeState?.durationMs,
        activeState?.gapMs,
        activeState?.followAction,
        stateAnimIndex,
      ]);

      const animation =
        idlePath && animIndex === 0 && !transient
          ? idlePath
          : pack?.animations?.[animIndex] ?? pack?.animations?.[0];
      const baseSrc = animation
        ? `/dsh-xiaofu/packs/${idlePath && animIndex === 0 && !transient ? pet.pack : pack.id}/${animation
            .split('/')
            .map((segment) => encodeURIComponent(segment))
            .join('/')}`
        : null;
      const stateSrc = stateAnimation
        ? `/dsh-xiaofu/packs/${pet.pack}/${stateAnimation
            .split('/')
            .map((segment) => encodeURIComponent(segment))
            .join('/')}`
        : null;
      const src = transient ? baseSrc : stateSrc ?? baseSrc;
      const idleRotating =
        !activeState && !transient && animIndex === 0 && idleList.length > 1;
      const shownBubble = activeState
        ? stateBubbleText
          ? `${stateBubbleText}${activeState.detail ? ` · ${activeState.detail}` : ''}`
          : null
        : bubbleText;

      return h(
        React.Fragment,
        null,
        h(
          'div',
          {
            ref: wrapperRef,
            style: wrapperStyle,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
            onContextMenu: openMenu,
          },
          sleeping
            ? h(
                'div',
                {
                  key: 'zzz',
                  style: {
                    position: 'absolute',
                    right: 2,
                    top: -12,
                    fontSize: Math.max(12, size * 0.045),
                    opacity: 0.65,
                    pointerEvents: 'none',
                    letterSpacing: 2,
                  },
                },
                'z z',
              )
            : null,
          shownBubble
            ? h(
                'div',
                {
                  key: 'bubble',
                  style: {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: '100%',
                    width: 'max-content',
                    margin: '0 auto',
                    marginBottom: 6,
                    maxWidth: Math.max(180, Math.min(300, size * 0.72)),
                    boxSizing: 'border-box',
                    lineHeight: 1.35,
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    pointerEvents: 'none',
                    zIndex: 2147483003,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    ...bubbleSurface(bubble, fontStyle, size),
                  },
                },
                bubble.emojiId && !activeState
                  ? h('img', {
                      key: 'emoji',
                      src: `/dsh-xiaofu/emoji/${bubble.emojiId}/asset`,
                      alt: '',
                      style: { width: 34, height: 34, objectFit: 'contain', flex: '0 0 auto' },
                    })
                  : null,
                h('span', { key: 'text' }, shownBubble),
              )
            : null,
          src && !videoFailed
            ? h('video', {
                key: src,
                src,
                autoPlay: true,
                loop: transient
                  ? false
                  : activeState
                    ? stateAnimations.length <= 1
                    : idleRotating
                      ? false
                      : !transient,
                muted: true,
                playsInline: true,
                onError: () => setVideoFailed(true),
                onEnded: () => {
                  if (activeState && !transient) {
                    if (stateAnimations.length > 1) {
                      setStateAnimIndex((index) => (index + 1) % stateAnimations.length);
                    }
                    return;
                  }
                  if (idleRotating) {
                    setIdleIndex((index) => (index + 1) % idleList.length);
                    return;
                  }
                  setTransient(false);
                  setAnimIndex(0);
                },
                style: { width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' },
              })
            : h('div', { style: PLACEHOLDER_STYLE }, h(HexMascot, { sleeping })),
        ),

        menu
          ? h(
              'div',
              {
                style: {
                  ...styles.menu,
                  ...fontStyle,
                  left: menu.x,
                  top: menu.y,
                  maxHeight: Math.max(160, window.innerHeight - menu.y - 8),
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                },
                onPointerDown: (event) => event.stopPropagation(),
                onPointerUp: (event) => event.stopPropagation(),
                onContextMenu: (event) => event.stopPropagation(),
              },
              menu.items.map((item) =>
                h(
                  'div',
                  {
                    key: item.id,
                    style: {
                      ...styles.menuItem,
                      ...(item.disabled ? styles.menuItemDisabled : {}),
                    },
                    onClick: () => handleMenuItem(item),
                  },
                  h('span', {}, item.label),
                  item.disabled
                    ? h('span', { style: { opacity: 0.6, fontSize: 11 } }, item.reason ?? '不可用')
                    : ['menu.actions', 'menu.display', 'menu.snooze'].includes(item.id)
                      ? h('span', {}, '›')
                      : null,
                ),
              ),
              expanded === 'menu.actions'
                ? h(
                    'div',
                    { style: styles.menuSub },
                    (pack?.animations ?? []).map((name, index) =>
                      h(
                        'div',
                        {
                          key: name,
                          style: styles.menuItem,
                          onClick: () => {
                            const animationName = pack?.animations?.[index];
                            const mode = animationName
                              ? pack?.animationMeta?.[animationName]?.mode
                              : undefined;
                            setAnimIndex(index);
                            setTransient(mode ? mode === 'once' : index !== 0);
                            setMenu(null);
                            setExpanded(null);
                          },
                        },
                        name.split('/').pop().replace(/\.(webm|mov)$/i, ''),
                        index === animIndex ? ' ✓' : '',
                      ),
                    ),
                  )
                : null,
              expanded === 'menu.display'
                ? h(
                    'div',
                    { style: styles.menuSub },
                    [
                      ['web', '仅网页'],
                      ['desktop', '仅桌面'],
                      ['both', '网页 + 桌面'],
                      ['none', '都不显示'],
                      ['__reset', '回到角落'],
                    ].map(([value, label]) =>
                      h(
                        'div',
                        {
                          key: value,
                          style: styles.menuItem,
                          onClick: () => (value === '__reset' ? resetPosition() : applyDisplay(value)),
                        },
                        label,
                        pet.display === value ? ' ✓' : '',
                      ),
                    ),
                  )
                : null,
              expanded === 'menu.snooze'
                ? h(
                    'div',
                    { style: styles.menuSub },
                    [
                      ['30 分钟', 30 * 60 * 1000],
                      ['1 小时', 60 * 60 * 1000],
                      ['3 小时', 3 * 60 * 60 * 1000],
                    ].map(([label, ms]) =>
                      h(
                        'div',
                        { key: label, style: styles.menuItem, onClick: () => snoozeFor(ms) },
                        label,
                      ),
                    ),
                  )
                : null,
            )
          : null,

        about
          ? h(
              'div',
              {
                style: { ...styles.about, ...fontStyle },
                onPointerDown: (event) => event.stopPropagation(),
                onPointerUp: (event) => event.stopPropagation(),
                onContextMenu: (event) => event.stopPropagation(),
              },
              h('div', { style: { fontWeight: 600, marginBottom: 8 } }, '桌宠配置'),
              h('div', {}, 'v0.2.0'),
              h('div', { style: { opacity: 0.7, marginTop: 6 } }, `当前角色：${pack ? pack.name : '内置占位'}`),
              h(
                'div',
                { style: { marginTop: 14, textAlign: 'right' } },
                h(
                  'button',
                  { type: 'button', style: styles.button, onClick: () => setAbout(false) },
                  '关闭',
                ),
              ),
            )
          : null,
      );
    }

    function PetOverlay() {
      const [state, setState] = React.useState({
        pets: [],
        packs: [],
        hidden: [],
        features: null,
        sound: { volume: 0.6 },
        appearance: { fontFamily: 'system', fontSize: 13, scaleWithPet: false },
        bubble: null,
        dsh: { available: false, status: 'unavailable' },
        activeState: null,
        idleAnimation: null,
        idleAnimations: [],
      });
      const [settingsOpen, setSettingsOpen] = React.useState(false);

      const load = React.useCallback(async () => {
        try {
          const [configResponse, packsResponse, visibilityResponse, stateResponse] =
            await Promise.all([
              fetch('/dsh-xiaofu/config', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/packs', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/desktop/visibility', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/state', { cache: 'no-store' }),
            ]);
          const config = await configResponse.json();
          const packs = await packsResponse.json();
          const visibility = await visibilityResponse.json();
          const stateBody = await stateResponse.json();
          setState({
            pets: config.pets ?? [],
            packs: packs.packs ?? [],
            hidden: visibility.hidden ?? [],
            features: config.features ?? null,
            sound: config.sound ?? { volume: 0.6 },
            appearance: config.appearance ?? {
              fontFamily: 'system',
              fontSize: 13,
              scaleWithPet: false,
            },
            bubble: config.bubble ?? null,
            activeState: stateBody.state ?? null,
            idleAnimation:
              (config.stateMapping?.byCharacter?.[config.pets?.[0]?.pack]?.entries ??
                config.stateMapping?.entries)?.find((entry) => entry.event === 'idle')
                ?.animation ?? null,
            idleAnimations:
              (config.stateMapping?.byCharacter?.[config.pets?.[0]?.pack]?.entries ??
                config.stateMapping?.entries)?.find((entry) => entry.event === 'idle')
                ?.animations ?? [],
          });
        } catch {
          // 覆盖层保持静默
        }
      }, []);

      React.useEffect(() => {
        load();
        const refresh = () => load();
        window.addEventListener('dsh-xiaofu:refresh', refresh);
        const timer = window.setInterval(load, 3000);
        return () => {
          window.removeEventListener('dsh-xiaofu:refresh', refresh);
          window.clearInterval(timer);
        };
      }, [load]);

      React.useEffect(() => {
        if (typeof EventSource === 'undefined') return undefined;
        const events = new EventSource('/dsh-xiaofu/state/events');
        events.onmessage = (event) => {
          try {
            const body = JSON.parse(event.data);
            setState((previous) => ({ ...previous, activeState: body.state ?? null }));
          } catch {
            // ignore malformed frame
          }
        };
        return () => events.close();
      }, []);

      const restoreDesktop = async (petId) => {
        try {
          await fetch('/dsh-xiaofu/desktop/show', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ petId }),
          });
          await load();
        } catch {
          // ignore
        }
      };

      const now = Date.now();
      const hiddenDesktop = state.pets.filter((pet) => {
        if (!['desktop', 'both'].includes(pet.display)) return false;
        const entry = state.hidden.find((item) => item.petId === pet.id);
        return Boolean(entry && (entry.until === 0 || entry.until > now));
      });
      const visible = state.pets.filter((pet) => ['web', 'both'].includes(pet.display));
      const soundOn = (pet) =>
        state.features?.pets?.[pet.id]?.['sound.click'] ??
        state.features?.global?.['sound.click'] ??
        false;
      const clickOn = (pet) =>
        state.features?.pets?.[pet.id]?.['interaction.click'] ??
        state.features?.global?.['interaction.click'] ??
        true;
      const roamOn = (pet) =>
        state.features?.pets?.[pet.id]?.['motion.roam'] ??
        state.features?.global?.['motion.roam'] ??
        true;

      return h(
        React.Fragment,
        null,
        hiddenDesktop.map((pet, index) =>
          h(
            'button',
            {
              key: `desktop-hidden-${pet.id}`,
              type: 'button',
              style: {
                ...styles.snoozePill,
                ...appearanceFont(state.appearance, pet.size),
                top: 16 + index * 40,
              },
              onClick: () => restoreDesktop(pet.id),
            },
            `${pet.name || pet.id}（桌面）已隐藏 · 点击恢复`,
          ),
        ),
        visible.map((pet) =>
          h(PetInstance, {
            key: pet.id,
            pet,
            pack:
              state.packs.find((item) => item.id === pet.pack) ?? state.packs[0] ?? null,
            onOpenSettings: () => setSettingsOpen(true),
            soundEnabled: soundOn(pet),
            soundVolume: state.sound?.volume ?? 0.6,
            soundFile: state.sound?.file ?? '',
            clickEnabled: clickOn(pet),
            roamEnabled: roamOn(pet),
            fontStyle: appearanceFont(state.appearance, pet.size),
            bubble: state.bubble,
            activeState: state.activeState,
            idleAnimation: state.idleAnimation,
            idleAnimations: state.idleAnimations,
          }),
        ),
        settingsOpen
          ? h(
              'div',
              {
                style: {
                  position: 'fixed',
                  inset: 0,
                  zIndex: 2147483003,
                  background: 'rgba(0,0,0,0.38)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                },
                onClick: (event) => {
                  if (event.target === event.currentTarget) setSettingsOpen(false);
                },
              },
              h(
                'div',
                {
                  style: {
                    width: 'min(880px, 94vw)',
                    maxHeight: '88vh',
                    overflow: 'auto',
                    borderRadius: 14,
                    padding: '14px 18px',
                    background: 'Canvas',
                    color: 'CanvasText',
                    boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
                  },
                },
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    },
                  },
                  h('strong', null, '桌宠配置'),
                  h(
                    'button',
                    {
                      type: 'button',
                      style: styles.button,
                      onClick: () => setSettingsOpen(false),
                    },
                    '关闭',
                  ),
                ),
                h(Section, null),
              ),
            )
          : null,
      );
    }

    function Section() {
      const [data, setData] = React.useState(null);
      const [selected, setSelected] = React.useState('global');
      const [error, setError] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [notice, setNotice] = React.useState('');
      const [packs, setPacks] = React.useState([]);
      const [emoji, setEmoji] = React.useState([]);
      const [emojiName, setEmojiName] = React.useState('');
      const [emojiDesc, setEmojiDesc] = React.useState('');
      const [llmStatus, setLlmStatus] = React.useState({ paused: false, failures: 0 });
      const [activeState, setActiveState] = React.useState(null);
      const [selectedCharacter, setSelectedCharacter] = React.useState('');
      const [studioJobs, setStudioJobs] = React.useState([]);
      const [desktop, setDesktop] = React.useState({ status: 'stopped' });
      const [media, setMedia] = React.useState({ available: false });
      const [mediaDownload, setMediaDownload] = React.useState({ status: 'idle', received: 0, total: 0 });
      const [uploading, setUploading] = React.useState(false);
      const [uploadMessage, setUploadMessage] = React.useState('');
      const [genName, setGenName] = React.useState('');
      const [genFps, setGenFps] = React.useState(24);
      const [genFile, setGenFile] = React.useState(null);
      const [genPlan, setGenPlan] = React.useState(null);
      const [genMessage, setGenMessage] = React.useState('');
      const [genProgress, setGenProgress] = React.useState(0);
      const [genJobId, setGenJobId] = React.useState(null);
      const [generating, setGenerating] = React.useState(false);
      const [jobHistory, setJobHistory] = React.useState([]);
      const [jobStorage, setJobStorage] = React.useState(null);
      const [historyFilter, setHistoryFilter] = React.useState('');
      const [historyStatus, setHistoryStatus] = React.useState('all');
      const [quotaDraft, setQuotaDraft] = React.useState({ history: 50, zipMb: 500, ttlHours: 24, cleanupMinutes: 10, autoCleanup: true });
      const [showCleanupLog, setShowCleanupLog] = React.useState(false);
      const [cleanupLogData, setCleanupLogData] = React.useState([]);
      const [cleanupFilter, setCleanupFilter] = React.useState('');
      const [cleanupReason, setCleanupReason] = React.useState('all');
      const [pendingClearLog, setPendingClearLog] = React.useState(false);
      const clearLogTimer = React.useRef(null);
      const [showTimeline, setShowTimeline] = React.useState(false);
      const [timelineType, setTimelineType] = React.useState('all');
      const [pendingDelete, setPendingDelete] = React.useState(null);
      const deleteTimer = React.useRef(null);
      const [petName, setPetName] = React.useState('');
      const [pendingDeletePet, setPendingDeletePet] = React.useState(null);
      const petDeleteTimer = React.useRef(null);

      const load = React.useCallback(async (petId) => {
        try {
          const target = petId && petId !== 'global' ? petId : undefined;
          const menuUrl = target
            ? `/dsh-xiaofu/menu?platform=web&pet=${encodeURIComponent(target)}`
            : '/dsh-xiaofu/menu?platform=web';
          const [configResponse, featuresResponse, menuResponse, packsResponse, healthResponse, mediaResponse, emojiResponse, llmResponse, stateResponse] =
            await Promise.all([
              fetch('/dsh-xiaofu/config', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/features', { cache: 'no-store' }),
              fetch(menuUrl, { cache: 'no-store' }),
              fetch('/dsh-xiaofu/packs', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/health', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/media/status', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/emoji', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/llm/status', { cache: 'no-store' }),
              fetch('/dsh-xiaofu/state', { cache: 'no-store' }),
            ]);
          const [config, features, menu, packList, health, mediaStatus, emojiList, llm, stateBody] = await Promise.all([
            configResponse.json(),
            featuresResponse.json(),
            menuResponse.json(),
            packsResponse.json(),
            healthResponse.json(),
            mediaResponse.json(),
            emojiResponse.json(),
            llmResponse.json(),
            stateResponse.json(),
          ]);
          setData({ config, features: features.features, menu: menu.menu });
          setPacks(packList.packs ?? []);
          setEmoji(emojiList.items ?? []);
          setLlmStatus(llm.status ?? { paused: false, failures: 0 });
          setActiveState(stateBody.state ?? null);
          void fetch('/dsh-xiaofu/studio/jobs', { cache: 'no-store' })
            .then((response) => response.json())
            .then((body) => setStudioJobs(body.jobs ?? []))
            .catch(() => undefined);
          setDesktop(health.desktop ?? { status: 'stopped' });
          setMedia(mediaStatus.media ?? { available: false });
          setError(null);
        } catch (cause) {
          setError(String(cause));
        }
      }, []);

      React.useEffect(() => {
        const timer = window.setInterval(async () => {
          try {
            const response = await fetch('/dsh-xiaofu/desktop/status', { cache: 'no-store' });
            const body = await response.json();
            if (body.desktop) setDesktop(body.desktop);
          } catch {
            // 状态轮询失败保持上一次
          }
        }, 3000);
        return () => window.clearInterval(timer);
      }, []);

      const refreshJobs = React.useCallback(async () => {
        try {
          const [jobsResponse, storageResponse] = await Promise.all([
            fetch('/dsh-xiaofu/generate/jobs', { cache: 'no-store' }),
            fetch('/dsh-xiaofu/generate/storage', { cache: 'no-store' }),
          ]);
          const jobsBody = await jobsResponse.json();
          const storageBody = await storageResponse.json();
          setJobHistory(jobsBody.jobs ?? []);
          setJobStorage(storageBody.storage ?? null);
        } catch {
          // 历史列表失败不影响主流程
        }
      }, []);

      React.useEffect(() => {
        if (data?.config?.generate) setQuotaDraft(data.config.generate);
      }, [data?.config?.generate?.history, data?.config?.generate?.zipMb, data?.config?.generate?.ttlHours, data?.config?.generate?.cleanupMinutes, data?.config?.generate?.autoCleanup]);

      React.useEffect(() => {
        load(selected);
        refreshJobs();
      }, [load, selected, refreshJobs]);

      const pets = data ? data.config.pets : [];
      const selectedPet = selected === 'global' ? null : pets.find((pet) => pet.id === selected) ?? null;
      const activePet = selectedPet ?? pets[0] ?? null;
      React.useEffect(() => {
        setPetName(selectedPet?.name ?? '');
      }, [selectedPet?.id, selectedPet?.name]);
      const activePackId = activePet ? activePet.pack : '';
      const globalMap = data ? data.config.features.global : {};
      const petMap = data && selectedPet ? data.config.features.pets[selectedPet.id] ?? {} : {};

      const baseValue = (feature) => {
        if (!data) return feature.defaultEnabled;
        return typeof globalMap[feature.id] === 'boolean' ? globalMap[feature.id] : feature.defaultEnabled;
      };

      const effective = (feature) => {
        if (!selectedPet) return baseValue(feature);
        return typeof petMap[feature.id] === 'boolean' ? petMap[feature.id] : baseValue(feature);
      };

      const isOverridden = (feature) =>
        Boolean(selectedPet) && typeof petMap[feature.id] === 'boolean';

      const save = async (global, petEntries) => {
        const response = await fetch('/dsh-xiaofu/features', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ global, pets: petEntries }),
        });
        if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
      };

      const toggle = async (feature) => {
        if (!data || busy) return;
        const nextGlobal = { ...globalMap };
        const nextPets = { ...data.config.features.pets };
        const nextValue = !effective(feature);

        if (selectedPet) {
          nextPets[selectedPet.id] = { ...(nextPets[selectedPet.id] ?? {}), [feature.id]: nextValue };
        } else {
          nextGlobal[feature.id] = nextValue;
        }

        setData({
          ...data,
          config: {
            ...data.config,
            features: { ...data.config.features, global: nextGlobal, pets: nextPets },
          },
        });
        setBusy(true);
        setNotice('');
        try {
          await save(nextGlobal, nextPets);
          await load(selected);
          setError(null);
          setNotice('已保存');
        } catch (cause) {
          setError(String(cause));
          await load(selected);
        } finally {
          setBusy(false);
        }
      };

      const inherit = async (feature) => {
        if (!data || !selectedPet || busy) return;
        const nextPets = { ...data.config.features.pets };
        const map = { ...(nextPets[selectedPet.id] ?? {}) };
        delete map[feature.id];
        if (Object.keys(map).length === 0) delete nextPets[selectedPet.id];
        else nextPets[selectedPet.id] = map;

        setBusy(true);
        try {
          await save(globalMap, nextPets);
          await load(selected);
          setError(null);
          setNotice('已改为跟随全局');
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const reset = async () => {
        if (!data || busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/features', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ global: {}, pets: {} }),
          });
          if (!response.ok) throw new Error(`重置失败（HTTP ${response.status}）`);
          await load(selected);
          setNotice('已恢复默认');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const upload = async (file) => {
        if (!file || uploading) return;
        if (!file.name.toLowerCase().endsWith('.zip')) {
          setUploadMessage('请选择 .petpack.zip 压缩包');
          return;
        }
        setUploading(true);
        setUploadMessage('上传并校验中…');
        try {
          const response = await fetch('/dsh-xiaofu/packs', {
            method: 'POST',
            headers: { 'content-type': 'application/zip' },
            body: file,
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            if (response.status === 409 && body.id) {
              setUploadMessage(`形象已存在，已切换为：${body.id}`);
              await load(selected);
              await bindPack(body.id);
              return;
            }
            throw new Error(body.message || `导入失败（HTTP ${response.status}）`);
          }
          setUploadMessage(`已导入并切换：${body.pack.name}（${body.pack.id}）`);
          await load(selected);
          await bindPack(body.pack.id);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
        } catch (cause) {
          setUploadMessage(`导入失败：${cause instanceof Error ? cause.message : String(cause)}`);
        } finally {
          setUploading(false);
        }
      };

      const inspectZip = async (file) => {
        if (!file || generating) return;
        if (!file.name.toLowerCase().endsWith('.zip')) {
          setGenMessage('请选择包含 PNG 序列的 .zip');
          return;
        }
        if (!media.available) {
          setGenMessage('ffmpeg 还没就绪，请先下载或指定路径');
          return;
        }
        setGenFile(file);
        setGenPlan(null);
        setGenerating(true);
        setGenMessage('检查帧序列…');
        try {
          const response = await fetch('/dsh-xiaofu/generate/inspect', {
            method: 'POST',
            headers: { 'content-type': 'application/zip' },
            body: file,
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(body.message || `检查失败（HTTP ${response.status}）`);
          }
          const segments = (body.inspection?.segments ?? []).map((segment) => ({
            ...segment,
            fps: genFps,
            mode: segment.name === 'idle' ? 'loop' : 'once',
          }));
          if (segments.length === 0) throw new Error('没有找到 PNG 帧');
          setGenPlan({ segments, preview: body.inspection?.preview });
          setGenMessage(
            `发现 ${segments.length} 段：${segments.map((item) => `${item.name}(${item.frames})`).join('、')}`,
          );
        } catch (cause) {
          setGenMessage(`检查失败：${cause instanceof Error ? cause.message : String(cause)}`);
        } finally {
          setGenerating(false);
        }
      };

      const updateSegment = (index, patch) => {
        setGenPlan((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            segments: previous.segments.map((segment, current) =>
              current === index ? { ...segment, ...patch } : segment,
            ),
          };
        });
      };

      const watchJob = async (jobId, initialJob) => {
        setGenJobId(jobId);
        let job = initialJob;
        while (job.status === 'running' || job.status === 'queued') {
          await new Promise((resolve) => window.setTimeout(resolve, 700));
          const statusResponse = await fetch(`/dsh-xiaofu/generate/jobs/${jobId}`, {
            cache: 'no-store',
          });
          const statusBody = await statusResponse.json().catch(() => ({}));
          if (!statusResponse.ok || !statusBody.job) {
            throw new Error(`读取任务失败（HTTP ${statusResponse.status}）`);
          }
          job = statusBody.job;
          setGenProgress(job.progress ?? 0);
          setGenMessage(`${job.message ?? '生成中'}（${job.progress ?? 0}%）`);
        }
        if (job.status !== 'done') {
          throw new Error(job.error || (job.status === 'cancelled' ? '已取消' : '生成失败'));
        }
        const pack = job.pack;
        setGenProgress(100);
        setGenMessage(
          `已生成：${pack.name}（${pack.frames} 帧，${pack.segments?.join(' / ') ?? 'idle'}）`,
        );
        setGenFile(null);
        setGenPlan(null);
        setGenJobId(null);
        await load(selected);
        await bindPack(pack.id);
        window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
      };

      const saveQuota = async () => {
        if (!data) return;
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              ...data.config,
              generate: {
                history: Math.max(1, Math.min(500, Number(quotaDraft.history) || 50)),
                zipMb: Math.max(10, Math.min(5000, Number(quotaDraft.zipMb) || 500)),
                ttlHours: Math.max(1, Math.min(720, Number(quotaDraft.ttlHours) || 24)),
                cleanupMinutes: Math.max(
                  0,
                  Math.min(1440, Number(quotaDraft.cleanupMinutes) || 0),
                ),
                autoCleanup: Boolean(quotaDraft.autoCleanup),
              },
            }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          if (quotaDraft.autoCleanup) {
            await fetch('/dsh-xiaofu/generate/cleanup', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ all: false }),
            });
          }
          await load(selected);
          await refreshJobs();
          setGenMessage('配额已保存');
        } catch (cause) {
          setGenMessage(`保存配额失败：${cause instanceof Error ? cause.message : String(cause)}`);
        }
      };

      const openCleanupLog = async () => {
        if (showCleanupLog) {
          setShowCleanupLog(false);
          return;
        }
        try {
          const response = await fetch('/dsh-xiaofu/generate/cleanup/log', {
            cache: 'no-store',
          });
          const body = await response.json();
          setCleanupLogData(body.log ?? []);
          setShowCleanupLog(true);
        } catch (cause) {
          setGenMessage(`读取清理日志失败：${cause instanceof Error ? cause.message : String(cause)}`);
        }
      };

      const toggleTimeline = async () => {
        if (showTimeline) {
          setShowTimeline(false);
          return;
        }
        if (cleanupLogData.length === 0) {
          try {
            const response = await fetch('/dsh-xiaofu/generate/cleanup/log', {
              cache: 'no-store',
            });
            const body = await response.json();
            setCleanupLogData(body.log ?? []);
          } catch {
            // 没有清理日志也能展示任务时间线
          }
        }
        setShowTimeline(true);
      };

      const clearCleanupLog = async () => {
        if (!pendingClearLog) {
          setPendingClearLog(true);
          if (clearLogTimer.current) window.clearTimeout(clearLogTimer.current);
          clearLogTimer.current = window.setTimeout(() => setPendingClearLog(false), 5000);
          return;
        }
        setPendingClearLog(false);
        if (clearLogTimer.current) window.clearTimeout(clearLogTimer.current);
        try {
          const response = await fetch('/dsh-xiaofu/generate/cleanup/log', {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error(`清空失败（HTTP ${response.status}）`);
          setCleanupLogData([]);
          setGenMessage('清理日志已清空');
        } catch (cause) {
          setGenMessage(`清空日志失败：${cause instanceof Error ? cause.message : String(cause)}`);
        }
      };

      const exportCleanupLog = () => {
        const blob = new Blob([`${JSON.stringify(cleanupLogData, null, 2)}\n`], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'hex-pet-cleanup-log.json';
        link.click();
        URL.revokeObjectURL(url);
      };

      const cleanupHistory = async () => {
        try {
          const response = await fetch('/dsh-xiaofu/generate/cleanup', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ all: true }),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(`清理失败（HTTP ${response.status}）`);
          setJobHistory(body.jobs ?? []);
          setGenMessage(`已清理 ${body.removed ?? 0} 条历史`);
        } catch (cause) {
          setGenMessage(`清理失败：${cause instanceof Error ? cause.message : String(cause)}`);
        }
      };

      const importWebm = async (file) => {
        if (!file || generating) return;
        setBusy(true);
        setGenMessage('导入透明 webm…');
        try {
          const id = `gen-${Date.now().toString(36)}`;
          const name = file.name.replace(/\.webm$/i, '') || '透明形象';
          const query = new URLSearchParams({ name, id });
          const response = await fetch(`/dsh-xiaofu/generate/passthrough?${query}`, {
            method: 'POST',
            headers: { 'content-type': 'video/webm' },
            body: await file.arrayBuffer(),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `导入失败（HTTP ${response.status}）`);
          setGenMessage(`已导入 ${body.pack?.name ?? name}`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setError(null);
        } catch (cause) {
          setGenMessage('');
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const generateFromFrames = async () => {
        if (!genFile || !genPlan || generating) return;
        const name = genName.trim() || genFile.name.replace(/\.zip$/i, '');
        const meta = {};
        for (const segment of genPlan.segments) {
          meta[segment.name] = { fps: Number(segment.fps) || 24, mode: segment.mode };
        }
        setGenerating(true);
        setGenProgress(0);
        setGenMessage('提交生成任务…');
        try {
          const response = await fetch(
            `/dsh-xiaofu/generate/jobs?name=${encodeURIComponent(name)}&fps=${encodeURIComponent(genFps)}&meta=${encodeURIComponent(JSON.stringify(meta))}`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/zip' },
              body: genFile,
            },
          );
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(body.message || `生成失败（HTTP ${response.status}）`);
          }
          await watchJob(body.job.id, body.job);
        } catch (cause) {
          setGenMessage(`生成失败：${cause instanceof Error ? cause.message : String(cause)}`);
          setGenJobId(null);
        } finally {
          setGenerating(false);
          refreshJobs();
        }
      };

      const retryJob = async (jobId) => {
        if (generating) return;
        setGenerating(true);
        setGenProgress(0);
        setGenMessage('重新排队…');
        try {
          const response = await fetch(`/dsh-xiaofu/generate/jobs/${jobId}/retry`, {
            method: 'POST',
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(body.message || `重试失败（HTTP ${response.status}）`);
          }
          await watchJob(jobId, body.job);
        } catch (cause) {
          setGenMessage(`重试失败：${cause instanceof Error ? cause.message : String(cause)}`);
          setGenJobId(null);
        } finally {
          setGenerating(false);
          refreshJobs();
        }
      };

      const cancelGenerate = async () => {
        if (!genJobId) return;
        try {
          await fetch(`/dsh-xiaofu/generate/jobs/${genJobId}`, { method: 'DELETE' });
          setGenMessage('已请求取消…');
          await refreshJobs();
        } catch (cause) {
          setGenMessage(`取消失败：${cause instanceof Error ? cause.message : String(cause)}`);
        }
      };

      const bindPack = async (packId) => {
        if (!data || busy) return;
        const target = selectedPet ?? data.config.pets[0];
        if (!target) return;
        const nextConfig = {
          ...data.config,
          pets: data.config.pets.map((pet) =>
            pet.id === target.id ? { ...pet, pack: packId } : pet,
          ),
        };
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(nextConfig),
          });
          if (!response.ok) throw new Error(`切换失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice(`已切换形象：${packId}`);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const removePack = async (packId) => {
        if (busy) return;
        if (pendingDelete !== packId) {
          setPendingDelete(packId);
          if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
          deleteTimer.current = window.setTimeout(() => setPendingDelete(null), 5000);
          return;
        }

        setPendingDelete(null);
        if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
        setBusy(true);
        try {
          const response = await fetch(`/dsh-xiaofu/packs/${encodeURIComponent(packId)}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error(`删除失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice(`已删除形象包：${packId}`);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const addPet = async () => {
        if (!data || busy) return;
        const existing = data.config.pets;
        const base = existing[0];
        if (!base) return;
        let index = existing.length + 1;
        let id = `pet-${index}`;
        while (existing.some((pet) => pet.id === id)) {
          index += 1;
          id = `pet-${index}`;
        }
        const nextPet = {
          ...base,
          id,
          name: `Hex ${index}`,
          size: Math.max(220, Math.round(base.size * 0.8)),
          display: 'web',
          position: {
            ...base.position,
            marginX: (base.position?.marginX ?? 24) + 40 * existing.length,
          },
        };
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, pets: [...existing, nextPet] }),
          });
          if (!response.ok) throw new Error(`添加失败（HTTP ${response.status}）`);
          await load(id);
          setSelected(id);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice(`已添加：${nextPet.name}`);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const savePetName = async () => {
        if (!data || !selectedPet || busy) return;
        const name = petName.trim() || selectedPet.id;
        const nextConfig = {
          ...data.config,
          pets: data.config.pets.map((pet) =>
            pet.id === selectedPet.id ? { ...pet, name } : pet,
          ),
        };
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(nextConfig),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('名称已保存');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const removePet = async () => {
        if (!data || !selectedPet || busy) return;
        if (data.config.pets.length <= 1) {
          setError('至少保留一只宠物');
          return;
        }
        if (pendingDeletePet !== selectedPet.id) {
          setPendingDeletePet(selectedPet.id);
          if (petDeleteTimer.current) window.clearTimeout(petDeleteTimer.current);
          petDeleteTimer.current = window.setTimeout(() => setPendingDeletePet(null), 5000);
          return;
        }

        setPendingDeletePet(null);
        if (petDeleteTimer.current) window.clearTimeout(petDeleteTimer.current);
        const remaining = data.config.pets.filter((pet) => pet.id !== selectedPet.id);
        const petFeatures = { ...data.config.features.pets };
        delete petFeatures[selectedPet.id];
        const nextConfig = {
          ...data.config,
          pets: remaining,
          features: { ...data.config.features, pets: petFeatures },
        };
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(nextConfig),
          });
          if (!response.ok) throw new Error(`删除失败（HTTP ${response.status}）`);
          await load('global');
          setSelected('global');
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice(`已删除宠物：${selectedPet.name || selectedPet.id}`);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const tidyPets = async () => {
        if (!data || busy) return;
        const base = data.config.pets[0];
        if (!base) return;
        const width = base.size || 420;
        const height = (width * 9) / 16;
        const maxCols = Math.max(
          1,
          Math.floor((window.innerWidth - 48) / (width + 12)),
        );
        const maxRows = Math.max(
          1,
          Math.floor((window.innerHeight - 120) / (height + 12)),
        );
        const pets = data.config.pets.map((pet, index) => {
          const row = index % maxRows;
          const column = Math.floor(index / maxRows) % maxCols;
          return {
            ...pet,
            position: {
              corner: 'top-right',
              marginX: 24 + column * (width + 12),
              marginY: 100 + row * (height + 12),
            },
          };
        });
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, pets }),
          });
          if (!response.ok) throw new Error(`整理失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('已整理宠物位置');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const startDesktop = async () => {
        if (!data || busy || !activePet) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ petId: activePet.id }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `启动失败（HTTP ${response.status}）`);
          setDesktop(body.desktop);
          setNotice('桌面窗已启动');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const startAllDesktop = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ all: true }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `启动失败（HTTP ${response.status}）`);
          setDesktop(body.desktop);
          setNotice(`桌面窗已启动：${body.desktop.windows?.length ?? 0} 只`);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const reloadDesktop = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/reload', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ all: true }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(`重载失败（HTTP ${response.status}）`);
          setDesktop(body.desktop);
          setNotice('桌面窗已按最新配置重载');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const stopDesktop = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/stop', { method: 'POST' });
          const body = await response.json();
          if (!response.ok) throw new Error(`停止失败（HTTP ${response.status}）`);
          setDesktop(body.desktop);
          setNotice('桌面窗已停止');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const retryDesktop = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ all: true }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `重试失败（HTTP ${response.status}）`);
          setDesktop(body.desktop);
          setNotice('已重试桌面启动');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const webOnlyDesktop = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/web-only', { method: 'POST' });
          const body = await response.json();
          if (!response.ok) throw new Error(`切换失败（HTTP ${response.status}）`);
          setDesktop(body.desktop ?? { status: 'stopped', windows: [] });
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('已切换为仅网页，桌面宠物不再启动');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const copyDesktopDiagnostics = async () => {
        try {
          const [healthResponse, statusResponse] = await Promise.all([
            fetch('/dsh-xiaofu/health', { cache: 'no-store' }),
            fetch('/dsh-xiaofu/desktop/status', { cache: 'no-store' }),
          ]);
          const text = JSON.stringify(
            {
              at: new Date().toISOString(),
              health: await healthResponse.json(),
              desktop: await statusResponse.json(),
            },
            null,
            2,
          );
          await navigator.clipboard.writeText(text);
          setNotice('桌面诊断信息已复制到剪贴板');
          setError(null);
        } catch (cause) {
          setError(`复制诊断失败：${String(cause)}`);
        }
      };

      const startOneDesktop = async (petId) => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ petId }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `启动失败（HTTP ${response.status}）`);
          setDesktop(body.desktop);
          setNotice('桌面窗已启动');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const stopOneDesktop = async (petId) => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/stop', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ petId }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(`停止失败（HTTP ${response.status}）`);
          setDesktop(body.desktop);
          setNotice('已停止该宠物的桌面窗');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const resetOneDesktop = async (petId) => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/desktop/reset', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ petId }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `重置失败（HTTP ${response.status}）`);
          setDesktop(body.desktop);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('已回到主屏角落');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const uploadEmoji = async (file) => {
        if (!file || busy) return;
        setBusy(true);
        try {
          const query = new URLSearchParams({
            name: emojiName,
            description: emojiDesc,
          });
          const response = await fetch(`/dsh-xiaofu/emoji?${query.toString()}`, {
            method: 'POST',
            headers: { 'content-type': file.type || 'application/octet-stream' },
            body: await file.arrayBuffer(),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `上传失败（HTTP ${response.status}）`);
          setEmojiName('');
          setEmojiDesc('');
          await load(selected);
          setNotice('表情已上传');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const removeEmoji = async (id) => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch(`/dsh-xiaofu/emoji/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error(`删除失败（HTTP ${response.status}）`);
          await load(selected);
          setNotice('表情已删除');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const updateEmoji = async (id, patch) => {
        try {
          const response = await fetch(`/dsh-xiaofu/emoji/${id}`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(patch),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          setNotice('表情信息已更新');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        }
      };

      const savePackMeta = async (packId, patch) => {
        if (busy || !data) return;
        setBusy(true);
        try {
          const packs = {
            ...data.config.packs,
            [packId]: { ...(data.config.packs?.[packId] ?? {}), ...patch },
          };
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, packs }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('形象包信息已更新');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const activeCharacterId = data?.config?.pets?.[0]?.pack ?? packs[0]?.id ?? '';
      const characterId = packs.some((pack) => pack.id === selectedCharacter)
        ? selectedCharacter
        : activeCharacterId;
      const characterPack = packs.find((pack) => pack.id === characterId);
      const mappingEntriesFor = (packId = characterId) => {
        const saved = data?.config?.stateMapping?.byCharacter?.[packId]?.entries;
        if (saved?.length) return saved;
        if (packId === activeCharacterId) return data?.config?.stateMapping?.entries ?? [];
        return [];
      };
      const withCharacterMapping = (entries) => ({
        ...data.config.stateMapping,
        byCharacter: {
          ...(data.config.stateMapping?.byCharacter ?? {}),
          [characterId]: { entries },
        },
        ...(characterId === activeCharacterId ? { entries } : {}),
      });

      const saveStateMapping = async (entries) => {
        if (busy || !data) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, stateMapping: withCharacterMapping(entries) }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const updateStateEntry = (event, patch) => {
        const entries = ACTION_EVENT_OPTIONS.map((option) => {
          const entry = actionEntryFor(option.id, mappingEntriesFor());
          return option.id === event ? { ...entry, ...patch } : entry;
        });
        void saveStateMapping(entries);
      };

      const renameAction = async (event, animation, name) => {
        if (busy || !data) return;
        const packId = characterId;
        const trimmed = name.trim().slice(0, 64);
        const key = actionAliasKey(packId, animation);
        const actionNames = { ...(data.config.actionNames ?? {}) };
        if (trimmed) actionNames[key] = trimmed;
        else delete actionNames[key];
        const label = trimmed || actionDisplayName(packId, animation, actionNames);
        const entries = ACTION_EVENT_OPTIONS.map((option) => {
          const entry = actionEntryFor(option.id, mappingEntriesFor(packId));
          return entry.animations.includes(animation) || entry.animation === animation
            ? { ...entry, label }
            : entry;
        });
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              ...data.config,
              actionNames,
              stateMapping: withCharacterMapping(entries),
            }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const uploadAction = async (file) => {
        if (!file || busy || !data) return;
        if (!/\.(webm|mov)$/i.test(file.name)) {
          setError('动作只支持 .webm / .mov（需要透明通道）');
          return;
        }
        const packId = characterId;
        if (!packId) {
          setError('当前没有绑定形象包');
          return;
        }
        setBusy(true);
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsDataURL(file);
          });
          const base64 = dataUrl.split(',')[1] ?? '';
          const response = await fetch(
            `/dsh-xiaofu/packs/${encodeURIComponent(packId)}/actions`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ filename: file.name, data: base64 }),
            },
          );
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `上传失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice(`已上传动作：${file.name}`);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const startStudioJob = async (kind) => {
        if (busy) return;
        setBusy(true);
        try {
          try {
            await navigator.clipboard.writeText(AI_STUDIO_COPY[kind] ?? '');
          } catch {
            // 剪贴板不可用时仍创建任务
          }
          const response = await fetch('/dsh-xiaofu/studio/jobs', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ kind, note: AI_STUDIO_COPY[kind] ?? '' }),
          });
          if (!response.ok) throw new Error(`创建制作任务失败（HTTP ${response.status}）`);
          await load(selected);
          setNotice('制作说明已复制；把素材发到对话里即可');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const uploadBubble = async (file) => {
        if (!file || busy) return;
        if (!/\.(png|svg|webp)$/i.test(file.name)) {
          setError('气泡只支持 .png / .svg / .webp');
          return;
        }
        setBusy(true);
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsDataURL(file);
          });
          const base64 = dataUrl.split(',')[1] ?? '';
          const response = await fetch('/dsh-xiaofu/bubble/asset', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ filename: file.name, data: base64 }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `上传失败（HTTP ${response.status}）`);
          await saveBubble({
            style: 'custom',
            customAsset: body.asset,
            customAssets: [
              body.asset,
              ...(data.config.bubble?.customAssets ?? []).filter(
                (item) => item !== body.asset,
              ),
            ],
          });
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const deleteBubbleAsset = async (asset) => {
        if (!asset || busy || !data) return;
        setBusy(true);
        try {
          const response = await fetch(
            `/dsh-xiaofu/bubble/asset/${encodeURIComponent(asset)}`,
            { method: 'DELETE' },
          );
          if (!response.ok) throw new Error(`删除失败（HTTP ${response.status}）`);
          const customAssets = (data.config.bubble?.customAssets ?? []).filter(
            (item) => item !== asset,
          );
          await saveBubble({
            customAssets,
            ...(data.config.bubble?.customAsset === asset
              ? { customAsset: undefined, style: 'classic' }
              : {}),
          });
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const deleteFontAsset = async (asset) => {
        if (!asset || busy || !data) return;
        setBusy(true);
        try {
          const response = await fetch(
            `/dsh-xiaofu/font/asset/${encodeURIComponent(asset)}`,
            { method: 'DELETE' },
          );
          if (!response.ok) throw new Error(`删除失败（HTTP ${response.status}）`);
          const customFonts = (data.config.bubble?.customFonts ?? []).filter(
            (item) => item !== asset,
          );
          await saveBubble({
            customFonts,
            ...(data.config.bubble?.customFont === asset
              ? {
                  customFont: undefined,
                  fontFamily:
                    data.config.bubble?.fontFamily === `custom:${asset}`
                      ? 'inherit'
                      : data.config.bubble?.fontFamily,
                }
              : {}),
          });
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const uploadFont = async (file) => {
        if (!file || busy) return;
        if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) {
          setError('字体只支持 .ttf / .otf / .woff / .woff2');
          return;
        }
        setBusy(true);
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsDataURL(file);
          });
          const base64 = dataUrl.split(',')[1] ?? '';
          const response = await fetch('/dsh-xiaofu/font/asset', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ filename: file.name, data: base64 }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `上传失败（HTTP ${response.status}）`);
          await saveBubble({
            customFonts: [
              body.asset,
              ...(data.config.bubble?.customFonts ?? []).filter(
                (item) => item !== body.asset,
              ),
            ],
            customFont: body.asset,
            fontFamily: `custom:${body.asset}`,
          });
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const addStateEntry = () => {
        const entries = data?.config?.stateMapping?.entries ?? [];
        const pack = packs.find((item) => item.id === data.config.pets[0]?.pack);
        const animation =
          pack?.animations?.find((item) => item.includes('state-')) ??
          pack?.animations?.[0] ??
          'animations/state-working.webm';
        void saveStateMapping([
          ...entries,
          {
            event: `custom-${entries.length + 1}`,
            label: '自定义事件',
            animation,
            bubble: '',
            durationSec: 0,
            enabled: true,
          },
        ]);
      };

      const removeStateEntry = (index) => {
        const entries = (data?.config?.stateMapping?.entries ?? []).filter(
          (_, itemIndex) => itemIndex !== index,
        );
        void saveStateMapping(entries);
      };

      const saveBalanceWarning = async (patch) => {
        if (busy || !data) return;
        setBusy(true);
        try {
          const balanceWarning = { ...(data.config.balanceWarning ?? {}), ...patch };
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, balanceWarning }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const updateBalanceThreshold = (index, patch) => {
        const thresholds = (data?.config?.balanceWarning?.thresholds ?? []).map(
          (threshold, itemIndex) =>
            itemIndex === index ? { ...threshold, ...patch } : threshold,
        );
        void saveBalanceWarning({ thresholds });
      };

      const addBalanceThreshold = () => {
        const thresholds = data?.config?.balanceWarning?.thresholds ?? [];
        const currency = thresholds.some((item) => item.currency === 'USD') ? 'EUR' : 'USD';
        void saveBalanceWarning({
          thresholds: [...thresholds, { currency, amount: 0 }],
        });
      };

      const removeBalanceThreshold = (index) => {
        const thresholds = (data?.config?.balanceWarning?.thresholds ?? []).filter(
          (_, itemIndex) => itemIndex !== index,
        );
        void saveBalanceWarning({ thresholds });
      };

      const triggerState = async (event) => {
        if (busy || !event) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/state/trigger', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ event }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `触发失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice(`已触发：${event}`);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const clearState = async () => {
        if (busy) return;
        setBusy(true);
        try {
          await fetch('/dsh-xiaofu/state/clear', { method: 'POST' });
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('状态已清除');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const saveLlm = async (patch) => {
        if (busy || !data) return;
        setBusy(true);
        try {
          const llm = { ...(data.config.llm ?? {}), ...patch };
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, llm }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          setNotice('LLM 设置已更新');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const testLlm = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/llm/whisper', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          });
          const body = await response.json();
          const result = body.result ?? {};
          await load(selected);
          if (result.ok) {
            setNotice(`碎碎念：${result.text}`);
            setError(null);
          } else {
            setNotice('');
            setError(result.error ?? 'LLM 调用失败');
          }
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const resumeLlm = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/llm/resume', { method: 'POST' });
          const body = await response.json();
          setLlmStatus(body.status ?? { paused: false, failures: 0 });
          setNotice('LLM 已恢复');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const saveBubble = async (patch) => {
        if (busy || !data) return;
        setBusy(true);
        try {
          const bubble = { ...(data.config.bubble ?? {}), ...patch };
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, bubble }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('气泡设置已更新');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const saveAppearance = async (patch) => {
        if (busy || !data) return;
        setBusy(true);
        try {
          const appearance = { ...(data.config.appearance ?? {}), ...patch };
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, appearance }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('外观已更新');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const uploadSound = async (file) => {
        if (!file || busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/sound', {
            method: 'POST',
            headers: { 'content-type': file.type || 'application/octet-stream' },
            body: await file.arrayBuffer(),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || `上传失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('点击音效已更新');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const removeSound = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/sound', { method: 'DELETE' });
          if (!response.ok) throw new Error(`删除失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('已恢复默认合成音');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const saveSoundVolume = async (value) => {
        if (busy || !data) return;
        const volume = Math.min(1, Math.max(0, Number(value) || 0));
        setBusy(true);
        try {
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, sound: { ...(data.config.sound ?? {}), volume } }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice(`点击音效音量已设为 ${Math.round(volume * 100)}%`);
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const savePetField = async (petId, patch) => {        if (busy || !data) return;
        setBusy(true);
        try {
          const pets = data.config.pets.map((item) =>
            item.id === petId ? { ...item, ...patch } : item,
          );
          const response = await fetch('/dsh-xiaofu/config', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data.config, pets }),
          });
          if (!response.ok) throw new Error(`保存失败（HTTP ${response.status}）`);
          const updated = pets.find((item) => item.id === petId);
          const running = desktop.windows?.some((item) => item.petId === petId);
          if (updated && !['desktop', 'both'].includes(updated.display)) {
            if (running) {
              const stopped = await fetch('/dsh-xiaofu/desktop/stop', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ petId }),
              });
              const body = await stopped.json();
              setDesktop(body.desktop ?? body);
            }
          } else if (running && (patch.size !== undefined || patch.display !== undefined)) {
            const reloaded = await fetch('/dsh-xiaofu/desktop/reload', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ petId }),
            });
            const body = await reloaded.json();
            setDesktop(body.desktop ?? body);
          }
          await load(selected);
          window.dispatchEvent(new Event('dsh-xiaofu:refresh'));
          setNotice('已保存');
          setError(null);
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      const refreshMedia = async () => {
        try {
          const response = await fetch('/dsh-xiaofu/media/status', { cache: 'no-store' });
          const body = await response.json();
          setMedia(body.media ?? { available: false });
          setError(null);
        } catch (cause) {
          setError(String(cause));
        }
      };

      const downloadFfmpeg = async () => {
        if (busy) return;
        setBusy(true);
        setNotice('开始下载 ffmpeg…');
        try {
          const response = await fetch('/dsh-xiaofu/media/download', { method: 'POST' });
          const body = await response.json();
          if (!response.ok) throw new Error(`下载失败（HTTP ${response.status}）`);
          let state = body.download;
          setMediaDownload(state);
          while (state.status === 'downloading' || state.status === 'extracting') {
            await new Promise((resolve) => window.setTimeout(resolve, 800));
            const statusResponse = await fetch('/dsh-xiaofu/media/download/status', {
              cache: 'no-store',
            });
            const statusBody = await statusResponse.json();
            state = statusBody.download;
            setMediaDownload(state);
            const percent =
              state.total > 0 ? Math.round((state.received / state.total) * 100) : 0;
            setNotice(
              state.status === 'extracting'
                ? '下载完成，解压 ffmpeg…'
                : `下载 ffmpeg ${percent}%（${(state.received / 1048576).toFixed(1)} MB）`,
            );
          }
          if (state.status === 'done') {
            await refreshMedia();
            setNotice('ffmpeg 已就绪');
            setError(null);
          } else {
            throw new Error(state.error || 'ffmpeg 下载失败');
          }
        } catch (cause) {
          setError(String(cause));
        } finally {
          setBusy(false);
        }
      };

      if (!data) {
        return h(
          'div',
          { style: styles.page },
          h('h2', { style: styles.title }, '桌宠配置'),
          error ? h('p', { style: styles.error }, `读取失败：${error}`) : h('p', { style: styles.hint }, '读取中…'),
        );
      }

      const groups = [];
      const desktopFailed = desktop.status === 'failed' || Boolean(desktop.error);
      for (const feature of data.features) {
        let group = groups.find((item) => item.id === feature.group);
        if (!group) {
          group = { id: feature.group, features: [] };
          groups.push(group);
        }
        group.features.push(feature);
      }

      return h(
        'div',
        { style: styles.page },
        h('h2', { style: styles.title }, '桌宠配置'),
        h(
          'p',
          { style: styles.hint },
          '选择宠物能做哪些事、右键菜单里出现哪些项。选「全局默认」改所有宠物；选中具体宠物可做单宠覆盖。',
        ),
        h(
          'div',
          { style: styles.sectionNav },
          [
            ['角色', 'hex-pet-pets'],
            ['动作', 'hex-pet-state'],
            ['对话', 'hex-pet-bubble'],
            ['展示', 'hex-pet-desktop'],
            ['互动', 'hex-pet-click'],
            ['高级', 'hex-pet-features'],
          ].map(([label, id]) =>
            h(
              'button',
              {
                key: id,
                type: 'button',
                style: { ...styles.tab, padding: '4px 10px', fontSize: 12 },
                onClick: () =>
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
              },
              label,
            ),
          ),
        ),
        h(
          'div',
          { style: { ...styles.tabs, order: 5 }, id: 'hex-pet-pets' },
          h(
            'button',
            {
              type: 'button',
              style: selected === 'global' ? { ...styles.tab, ...styles.tabActive } : styles.tab,
              onClick: () => setSelected('global'),
            },
            '全局默认',
          ),
          pets.map((pet) =>
            h(
              'button',
              {
                key: pet.id,
                type: 'button',
                style: selected === pet.id ? { ...styles.tab, ...styles.tabActive } : styles.tab,
                onClick: () => setSelected(pet.id),
              },
              pet.name || pet.id,
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              style: { ...styles.tab, opacity: busy ? 0.5 : 0.8 },
              onClick: addPet,
              disabled: busy,
            },
            '＋ 添加宠物',
          ),
          h(
            'button',
            {
              type: 'button',
              style: { ...styles.tab, opacity: busy ? 0.5 : 0.8 },
              onClick: tidyPets,
              disabled: busy,
            },
            '整理位置',
          ),
        ),
        error ? h('p', { style: styles.error }, `出错：${error}`) : null,

        selectedPet
          ? h(
              'div',
              { style: { ...styles.card, order: 6 }, id: 'hex-pet-petinfo' },
              h(
                'div',
                { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
                h('strong', {}, '当前角色信息'),
                h('input', {
                  style: styles.input,
                  value: petName,
                  placeholder: selectedPet.id,
                  onChange: (event) => setPetName(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') savePetName();
                  },
                }),
                h(
                  'button',
                  { type: 'button', style: styles.button, disabled: busy, onClick: savePetName },
                  '保存名称',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    style: pendingDeletePet === selectedPet.id ? styles.dangerActive : styles.danger,
                    disabled: busy,
                    onClick: removePet,
                  },
                  pendingDeletePet === selectedPet.id ? '再点一次删除' : '删除宠物',
                ),
              ),
              h(
                'p',
                { style: styles.status },
                `id: ${selectedPet.id} · 大小 ${selectedPet.size}px · 形象 ${selectedPet.pack}`,
              ),
            )
          : null,

        h(
          'div',
          { style: { ...styles.card, order: 21 }, id: 'hex-pet-emoji' },
          h('h3', { style: styles.groupTitle }, '表情'),
          h(
            'p',
            { style: styles.hint },
            '上传 PNG / JPEG / WebP / GIF（≤ 5MB），用于后续对话表情。文件保存在插件数据目录，删除后立即失效。',
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h('input', {
              type: 'text',
              value: emojiName,
              maxLength: 40,
              placeholder: '表情名称',
              disabled: busy,
              onChange: (event) => setEmojiName(event.target.value),
              style: { ...styles.input, minWidth: 140, width: 160 },
            }),
            h('input', {
              type: 'text',
              value: emojiDesc,
              maxLength: 120,
              placeholder: '描述（可选）',
              disabled: busy,
              onChange: (event) => setEmojiDesc(event.target.value),
              style: { ...styles.input, minWidth: 180, width: 220 },
            }),
            h(
              'label',
              { style: { ...styles.button, display: 'inline-block', opacity: busy ? 0.6 : 1 } },
              '上传表情',
              h('input', {
                type: 'file',
                accept: 'image/png,image/jpeg,image/webp,image/gif',
                disabled: busy,
                style: { display: 'none' },
                onChange: (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void uploadEmoji(file);
                },
              }),
            ),
            h('span', { style: styles.status }, `${emoji.length} 个表情`),
          ),
          emoji.length === 0
            ? h('p', { style: { ...styles.status, marginTop: 8 } }, '还没有上传表情')
            : h(
                'div',
                {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 10,
                    marginTop: 12,
                  },
                },
                emoji.map((item) =>
                  h(
                    'div',
                    {
                      key: item.id,
                      style: {
                        border: '1px solid rgba(127,127,127,0.2)',
                        borderRadius: 10,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      },
                    },
                    h('img', {
                      src: `/dsh-xiaofu/emoji/${item.id}/asset`,
                      alt: item.name,
                      style: {
                        width: '100%',
                        height: 88,
                        objectFit: 'contain',
                        background: 'rgba(127,127,127,0.08)',
                        borderRadius: 6,
                      },
                    }),
                    h('input', {
                      type: 'text',
                      defaultValue: item.name,
                      maxLength: 40,
                      onBlur: (event) => {
                        if (event.target.value.trim() && event.target.value !== item.name) {
                          void updateEmoji(item.id, { name: event.target.value });
                        }
                      },
                      style: { ...styles.input, minWidth: 0, width: '100%', fontSize: 13 },
                      title: '表情名称',
                    }),
                    h('input', {
                      type: 'text',
                      defaultValue: item.description,
                      maxLength: 120,
                      placeholder: '描述',
                      onBlur: (event) => {
                        if (event.target.value !== item.description) {
                          void updateEmoji(item.id, { description: event.target.value });
                        }
                      },
                      style: { ...styles.input, minWidth: 0, width: '100%', fontSize: 12 },
                      title: '表情描述',
                    }),
                    h(
                      'button',
                      {
                        type: 'button',
                        style: styles.danger,
                        disabled: busy,
                        onClick: () => removeEmoji(item.id),
                      },
                      '删除',
                    ),
                  ),
                ),
              ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 34.5, display: 'none' }, id: 'hex-pet-appearance' },
          h('h3', { style: styles.groupTitle }, '字体 / 字号'),
          h(
            'p',
            { style: styles.hint },
            '作用于客户端 overlay 的右键菜单、提示与隐藏恢复条；桌面原生菜单仍使用系统字体。',
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h(
              'select',
              {
                value: data.config.appearance?.fontFamily ?? 'system',
                disabled: busy,
                onChange: (event) => saveAppearance({ fontFamily: event.target.value }),
                style: { ...styles.input, minWidth: 130, width: 140 },
              },
              [
                ['system', '系统默认'],
                ['sans', '无衬线'],
                ['serif', '衬线'],
                ['mono', '等宽'],
              ].map(([value, label]) => h('option', { key: value, value }, label)),
            ),
            h('input', {
              key: `font-size-${data.config.appearance?.fontSize ?? 13}`,
              type: 'number',
              min: 11,
              max: 20,
              step: 1,
              defaultValue: data.config.appearance?.fontSize ?? 13,
              disabled: busy,
              onBlur: (event) => saveAppearance({ fontSize: Number(event.target.value) || 13 }),
              style: { ...styles.input, minWidth: 70, width: 78 },
              title: '基础字号（px）',
            }),
            h(
              'label',
              { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 } },
              h('input', {
                type: 'checkbox',
                checked: Boolean(data.config.appearance?.scaleWithPet),
                disabled: busy,
                onChange: (event) => saveAppearance({ scaleWithPet: event.target.checked }),
              }),
              '随宠物大小缩放',
            ),
          ),
          h(
            'div',
            {
              style: {
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(127,127,127,0.2)',
                background: 'rgba(127,127,127,0.08)',
                ...appearanceFont(data.config.appearance, 420),
              },
            },
            '桌宠配置 · 右键菜单预览 · 点击回应',
          ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 20 }, id: 'hex-pet-bubble' },
          h('h3', { style: styles.groupTitle }, '对话'),
          h(
            'p',
            { style: styles.hint },
            '上面选气泡样式或上传自己的气泡图；下面按事件写台词。每行一句，状态台词按「显示 → 间隔」循环，点击时随机一句。',
          ),
          h('strong', { style: { fontSize: 12 } }, '气泡'),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 } },
            h(
              'label',
              { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 } },
              h('input', {
                type: 'checkbox',
                checked: data.config.bubble?.enabled !== false,
                disabled: busy,
                onChange: (event) => saveBubble({ enabled: event.target.checked }),
              }),
              '显示气泡',
            ),
            h(
              'select',
              {
                value: data.config.bubble?.emojiId ?? '',
                disabled: busy,
                onChange: (event) =>
                  saveBubble({ emojiId: event.target.value || undefined }),
                style: { ...styles.input, minWidth: 120, width: 140 },
                title: '气泡表情',
              },
              [
                h('option', { key: '', value: '' }, '纯文字'),
                ...emoji.map((item) =>
                  h('option', { key: item.id, value: item.id }, `表情：${item.name}`),
                ),
              ],
            ),
            h(
              'select',
              {
                value: data.config.bubble?.fontFamily ?? 'inherit',
                disabled: busy,
                onChange: (event) =>
                  saveBubble({ fontFamily: event.target.value || 'inherit' }),
                style: { ...styles.input, minWidth: 120, width: 140 },
                title: '气泡字体',
              },
              [
                ...BUBBLE_FONT_OPTIONS.map((option) =>
                  h('option', { key: option.id, value: option.id }, `字体：${option.label}`),
                ),
                ...(data.config.bubble?.customFonts ?? []).map((asset, index) =>
                  h(
                    'option',
                    { key: `custom-${asset}`, value: `custom:${asset}` },
                    `字体：自定义 ${index + 1}`,
                  ),
                ),
              ],
            ),
            h('input', {
              key: `bubble-font-size-${data.config.bubble?.fontSize ?? 13}`,
              type: 'number',
              min: 11,
              max: 32,
              step: 1,
              defaultValue: data.config.bubble?.fontSize ?? 13,
              disabled: busy,
              title: '气泡字号（px）',
              style: { ...styles.input, width: 72, minWidth: 64 },
              onBlur: (event) =>
                saveBubble({
                  fontSize: Math.max(11, Math.min(32, Number(event.target.value) || 13)),
                }),
            }),
            h('span', { style: { ...styles.status, fontSize: 11 } }, 'px'),
            h(
              'label',
              { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 } },
              h('input', {
                type: 'checkbox',
                checked: Boolean(data.config.bubble?.scaleWithPet),
                disabled: busy,
                onChange: (event) => saveBubble({ scaleWithPet: event.target.checked }),
              }),
              '随宠物大小缩放',
            ),
            h(
              'button',
              {
                type: 'button',
                disabled: busy,
                onClick: () =>
                  saveBubble({
                    fontWeight:
                      data.config.bubble?.fontWeight === 'bold' ? 'normal' : 'bold',
                  }),
                style: {
                  ...styles.inherit,
                  fontWeight: 700,
                  outline:
                    data.config.bubble?.fontWeight === 'bold'
                      ? '2px solid #35c46a'
                      : '1px solid rgba(127,127,127,0.2)',
                },
              },
              '加粗',
            ),
            h(
              'button',
              {
                type: 'button',
                disabled: busy,
                onClick: () =>
                  saveBubble({
                    fontStyle:
                      data.config.bubble?.fontStyle === 'italic' ? 'normal' : 'italic',
                  }),
                style: {
                  ...styles.inherit,
                  fontStyle: 'italic',
                  outline:
                    data.config.bubble?.fontStyle === 'italic'
                      ? '2px solid #35c46a'
                      : '1px solid rgba(127,127,127,0.2)',
                },
              },
              '斜体',
            ),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' } },
            h(
              'label',
              { style: { ...styles.inherit, cursor: 'pointer', display: 'inline-flex' } },
              busy ? '上传中…' : '上传字体',
              h('input', {
                type: 'file',
                accept: '.ttf,.otf,.woff,.woff2',
                disabled: busy,
                style: { display: 'none' },
                onChange: (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void uploadFont(file);
                },
              }),
            ),
            ...(data.config.bubble?.customFonts ?? []).map((asset, index) =>
              h(
                'span',
                {
                  key: asset,
                  style: {
                    display: 'inline-flex',
                    gap: 4,
                    alignItems: 'center',
                    fontSize: 11,
                    padding: '3px 6px',
                    borderRadius: 6,
                    background: 'rgba(127,127,127,0.08)',
                  },
                },
                `自定义 ${index + 1}`,
                h(
                  'button',
                  {
                    type: 'button',
                    style: styles.danger,
                    disabled: busy,
                    onClick: () => deleteFontAsset(asset),
                  },
                  '删除',
                ),
              ),
            ),
          ),
          h(
            'div',
            {
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
                gap: 6,
                marginTop: 8,
              },
            },
            Object.entries(BUBBLE_STYLES).map(([id, preset]) =>
              h(
                'button',
                {
                  key: id,
                  type: 'button',
                  disabled: busy,
                  onClick: () => saveBubble({ style: id }),
                  style: {
                    ...styles.inherit,
                    display: 'grid',
                    gap: 5,
                    padding: 6,
                    textAlign: 'left',
                    outline:
                      (data.config.bubble?.style ?? 'classic') === id
                        ? '2px solid #35c46a'
                        : '1px solid rgba(127,127,127,0.18)',
                  },
                },
                h('span', { style: { fontSize: 11, opacity: 0.75 } }, preset.label),
                h(
                  'div',
                  {
                    style: {
                      ...bubbleSurface(
                        {
                          ...(data.config.bubble ?? {}),
                          style: id,
                          fontSize: Math.min(data.config.bubble?.fontSize ?? 13, 12),
                        },
                        { fontSize: 11 },
                        420,
                      ),
                      maxWidth: '100%',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    },
                  },
                  '示例',
                ),
              ),
            ),
            ...(data.config.bubble?.customAssets ?? []).map((asset) =>
              h(
                'div',
                { key: asset, style: { display: 'grid', gap: 4 } },
                h(
                  'button',
                  {
                    type: 'button',
                    disabled: busy,
                    onClick: () => saveBubble({ style: 'custom', customAsset: asset }),
                    style: {
                      ...styles.inherit,
                      display: 'grid',
                      gap: 5,
                      padding: 6,
                      textAlign: 'left',
                      outline:
                        data.config.bubble?.style === 'custom' &&
                        data.config.bubble?.customAsset === asset
                          ? '2px solid #35c46a'
                          : '1px solid rgba(127,127,127,0.18)',
                    },
                  },
                  h('span', { style: { fontSize: 11, opacity: 0.75 } }, '自定义'),
                  h(
                    'div',
                    {
                      style: {
                        ...bubbleSurface(
                          {
                            ...(data.config.bubble ?? {}),
                            style: 'custom',
                            customAsset: asset,
                            fontSize: Math.min(data.config.bubble?.fontSize ?? 13, 12),
                          },
                          { fontSize: 11 },
                          420,
                        ),
                        maxWidth: '100%',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      },
                    },
                    '示例',
                  ),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    style: styles.danger,
                    disabled: busy,
                    onClick: () => deleteBubbleAsset(asset),
                  },
                  '删除',
                ),
              ),
            ),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' } },
            h(
              'label',
              { style: { ...styles.inherit, cursor: 'pointer', display: 'inline-flex' } },
              busy ? '上传中…' : '上传气泡图',
              h('input', {
                type: 'file',
                accept: '.png,.svg,.webp',
                disabled: busy,
                style: { display: 'none' },
                onChange: (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void uploadBubble(file);
                },
              }),
            ),
            h(
              'span',
              { style: { ...styles.hint, margin: 0 } },
              '支持 png / svg / webp，建议中间留透明区域放字',
            ),
          ),
          h(
            'div',
            { style: { marginTop: 16, display: 'grid', gap: 8 } },
            h('strong', { style: { fontSize: 12 } }, '台词'),
            h(
              'p',
              { style: { ...styles.hint, margin: 0 } },
              '点击时是单句随机；其他状态按「显示时长 → 间隔（无气泡）→ 下一句」循环。',
            ),
            DIALOGUE_EVENT_OPTIONS.map((option) => {
              const lines = data.config.bubble?.stateQuotes?.[option.id] ?? [];
              const timing = data.config.bubble?.stateTiming?.[option.id] ?? {
                durationMs: 8000,
                gapMs: 2000,
                followAction: false,
              };
              const saveTiming = (patch) =>
                saveBubble({
                  stateTiming: {
                    ...(data.config.bubble?.stateTiming ?? {}),
                    [option.id]: { ...timing, ...patch },
                  },
                });
              return h(
                'label',
                {
                  key: option.id,
                  style: { display: 'grid', gap: 4, fontSize: 12 },
                },
                h('span', { style: { opacity: 0.8 } }, option.label),
                h('textarea', {
                  key: `state-quotes-${option.id}-${lines.join('|')}`,
                  defaultValue: lines.join('\n'),
                  rows: 3,
                  disabled: busy,
                  placeholder: '每行一句，留空则不显示',
                  onBlur: (event) => {
                    const next = event.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .slice(0, 20);
                    if (next.join('|') === lines.join('|')) return;
                    void saveBubble({
                      stateQuotes: {
                        ...(data.config.bubble?.stateQuotes ?? {}),
                        [option.id]: next,
                      },
                    });
                  },
                  style: {
                    ...styles.input,
                    width: '100%',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    lineHeight: 1.5,
                  },
                }),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      fontSize: 11,
                    },
                  },
                  h('span', { style: { opacity: 0.65 } }, '对话时长'),
                  h('input', {
                    key: `state-duration-${option.id}-${timing.durationMs}`,
                    type: 'number',
                    min: 500,
                    max: 60000,
                    step: 100,
                    defaultValue: timing.durationMs,
                    disabled: busy || Boolean(timing.followAction),
                    style: { ...styles.input, width: 86, minWidth: 74 },
                    onBlur: (event) => {
                      const value = Math.max(
                        500,
                        Math.min(60000, Number(event.target.value) || 8000),
                      );
                      if (value !== timing.durationMs) void saveTiming({ durationMs: value });
                    },
                  }),
                  h('span', { style: { opacity: 0.65 } }, 'ms'),
                  h('span', { style: { opacity: 0.65, marginLeft: 8 } }, '对话间隔'),
                  h('input', {
                    key: `state-gap-${option.id}-${timing.gapMs}`,
                    type: 'number',
                    min: 0,
                    max: 60000,
                    step: 100,
                    defaultValue: timing.gapMs,
                    disabled: busy || Boolean(timing.followAction),
                    style: { ...styles.input, width: 86, minWidth: 74 },
                    onBlur: (event) => {
                      const value = Math.max(
                        0,
                        Math.min(60000, Number(event.target.value) || 0),
                      );
                      if (value !== timing.gapMs) void saveTiming({ gapMs: value });
                    },
                  }),
                  h('span', { style: { opacity: 0.65 } }, 'ms（间隔期间无气泡）'),
                  h(
                    'span',
                    {
                      style: {
                        display: 'inline-flex',
                        gap: 4,
                        alignItems: 'center',
                        marginLeft: 8,
                        opacity: 0.9,
                      },
                    },
                    h('input', {
                      type: 'checkbox',
                      checked: Boolean(timing.followAction),
                      disabled: busy,
                      title: '开启后台词跟随动作切换，忽略上面的时长和间隔',
                      onChange: (event) =>
                        void saveTiming({ followAction: event.target.checked }),
                    }),
                    '跟随动作',
                  ),
                ),
              );
            }),
          ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 40 }, id: 'hex-pet-click' },
          h('h3', { style: styles.groupTitle }, '点击行为'),
          h(
            'p',
            { style: styles.hint },
            '分别设置单击和双击。选择「播放动画」后，先选一个动作，点后面的「+」可继续添加；按顺序轮流播放，每次点击播放下一个。不选则自动寻找 click/tap。关闭「点击回应」后这里不生效。',
          ),
          h(
            'div',
            { style: { display: 'grid', gap: 8 } },
            data.config.pets.map((pet) => {
              const petPack = packs.find((item) => item.id === pet.pack);
              const petAnimations = petPack?.animations ?? [];
              const actionOptions = [
                ['none', '无'],
                ['animation', '播放动画'],
                ['open-dsh', '打开 DSH'],
                ['chat', '打开对话'],
              ];
              const renderAnimationPicker = (listField, singleField, listValue, singleValue) => {
                const selected =
                  Array.isArray(listValue) && listValue.length > 0
                    ? listValue
                    : singleValue
                      ? [singleValue]
                      : [''];
                const animationOptions = ['', ...petAnimations];
                const saveList = (values) => {
                  const cleaned = values.filter(Boolean);
                  savePetField(pet.id, {
                    [listField]: cleaned,
                    [singleField]: cleaned[0] || undefined,
                  });
                };
                return h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    },
                  },
                  selected.map((value, index) =>
                    h(
                      'div',
                      {
                        key: `${pet.id}-${listField}-${index}`,
                        style: { display: 'flex', gap: 2, alignItems: 'center' },
                      },
                      h(
                        'select',
                        {
                          value,
                          disabled: busy,
                          title: '选择点击时播放的动作',
                          style: { ...styles.input, minWidth: 180, maxWidth: 240 },
                          onChange: (event) => {
                            const values = [...selected];
                            values[index] = event.target.value;
                            saveList(values);
                          },
                        },
                        animationOptions.map((name) =>
                          h(
                            'option',
                            { key: name || 'auto', value: name },
                            name
                              ? actionDisplayName(pet.pack, name, data.config.actionNames)
                              : '自动（click / tap）',
                          ),
                        ),
                      ),
                      selected.length > 1
                        ? h(
                            'button',
                            {
                              type: 'button',
                              style: styles.danger,
                              disabled: busy,
                              title: '移除这个动作',
                              onClick: () =>
                                saveList(selected.filter((_, itemIndex) => itemIndex !== index)),
                            },
                            '×',
                          )
                        : null,
                    ),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      style: styles.inherit,
                      disabled: busy || petAnimations.length === 0,
                      title: '继续添加一个点击动作',
                      onClick: () => {
                        const next =
                          petAnimations.find((name) => !selected.includes(name)) ??
                          petAnimations[0];
                        if (next) saveList([...selected, next]);
                      },
                    },
                    '+',
                  ),
                );
              };
              return h(
                'div',
                {
                  key: pet.id,
                  style: {
                    padding: '10px 12px',
                    border: '1px solid rgba(127,127,127,0.18)',
                    borderRadius: 10,
                    background: 'rgba(127,127,127,0.04)',
                    display: 'grid',
                    gap: 6,
                  },
                },
                h('strong', { style: { fontSize: 13 } }, pet.name || pet.id),
                h(
                  'div',
                  { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
                  h('span', { style: { minWidth: 48, fontSize: 12, opacity: 0.7 } }, '单击'),
                  h(
                    'select',
                    {
                      value: pet.clickAction ?? 'animation',
                      disabled: busy,
                      onChange: (event) =>
                        savePetField(pet.id, { clickAction: event.target.value }),
                      style: { ...styles.input, minWidth: 140, width: 150 },
                    },
                    actionOptions.map(([value, label]) =>
                      h('option', { key: value, value }, label),
                    ),
                  ),
                  (pet.clickAction ?? 'animation') === 'animation'
                    ? renderAnimationPicker(
                        'clickAnimations',
                        'clickAnimation',
                        pet.clickAnimations,
                        pet.clickAnimation,
                      )
                    : null,
                ),
                h(
                  'div',
                  { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
                  h('span', { style: { minWidth: 48, fontSize: 12, opacity: 0.7 } }, '双击'),
                  h(
                    'select',
                    {
                      value: pet.doubleClickAction ?? 'none',
                      disabled: busy,
                      onChange: (event) =>
                        savePetField(pet.id, { doubleClickAction: event.target.value }),
                      style: { ...styles.input, minWidth: 140, width: 150 },
                    },
                    actionOptions.map(([value, label]) =>
                      h('option', { key: value, value }, label),
                    ),
                  ),
                  (pet.doubleClickAction ?? 'none') === 'animation'
                    ? renderAnimationPicker(
                        'doubleClickAnimations',
                        'doubleClickAnimation',
                        pet.doubleClickAnimations,
                        pet.doubleClickAnimation,
                      )
                    : null,
                ),
              );
            }),
          ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 30 }, id: 'hex-pet-desktop' },
          h('h3', { style: styles.groupTitle }, '展示'),
          h(
            'p',
            { style: styles.hint },
            '用当前宠物的形象包打开一个透明置顶小窗。当前仅 Windows 先行验证，启动后会在桌面右上角出现。',
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                margin: '8px 0',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${desktopFailed ? 'rgba(192,57,43,0.45)' : 'rgba(127,127,127,0.2)'}`,
                background: desktopFailed ? 'rgba(192,57,43,0.08)' : 'transparent',
              },
            },
            h(
              'span',
              {
                style: {
                  ...styles.status,
                  color: desktopFailed ? '#c0392b' : undefined,
                  fontWeight: 600,
                  opacity: 1,
                },
              },
              `桌面状态：${desktop.status}${desktop.windows?.length ? `（${desktop.windows.length} 窗）` : ''}`,
            ),
            desktop.error
              ? h('span', { style: { ...styles.status, color: '#c0392b', opacity: 1 } }, desktop.error)
              : null,
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: retryDesktop },
              '重试',
            ),
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: webOnlyDesktop },
              '仅用网页',
            ),
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: copyDesktopDiagnostics },
              '复制诊断',
            ),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: startDesktop },
              '启动当前宠物',
            ),
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: startAllDesktop },
              '启动全部桌面宠物',
            ),
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: reloadDesktop },
              '重载配置',
            ),
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: stopDesktop },
              '停止',
            ),
            h(
              'span',
              { style: styles.status },
              `状态：${desktop.status}${
                desktop.windows?.length ? `（${desktop.windows.length} 窗）` : ''
              }${desktop.error ? `（${desktop.error}）` : ''}`,
            ),
          ),
          h(
            'p',
            { style: { ...styles.hint, marginTop: 12 } },
            '逐只设置：显示位置、大小，单独启动/停止，或把跑丢的宠物送回左下角。改动即时保存。',
          ),
          h(
            'div',
            { style: { display: 'grid', gap: 2, marginTop: 4 } },
            data.config.pets.map((pet) => {
              const running = desktop.windows?.some((item) => item.petId === pet.id);
              return h(
                'div',
                {
                  key: pet.id,
                  style: {
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    padding: '8px 0',
                    borderTop: '1px solid rgba(127,127,127,0.15)',
                  },
                },
                h(
                  'span',
                  { style: { minWidth: 96, fontWeight: 600 } },
                  pet.name || pet.id,
                ),
                h(
                  'select',
                  {
                    value: pet.display,
                    disabled: busy,
                    onChange: (event) => savePetField(pet.id, { display: event.target.value }),
                    style: { ...styles.input, minWidth: 112, width: 112 },
                  },
                  [
                    ['web', '仅网页'],
                    ['desktop', '仅桌面'],
                    ['both', '网页 + 桌面'],
                    ['none', '不显示'],
                  ].map(([value, label]) => h('option', { key: value, value }, label)),
                ),
                h(
                  'label',
                  {
                    style: {
                      display: 'inline-flex',
                      gap: 4,
                      alignItems: 'center',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                    },
                    title: '开启 DSH 时自动启动这只桌面宠物',
                  },
                  h('input', {
                    type: 'checkbox',
                    checked: Boolean(pet.autoStart),
                    disabled: busy,
                    onChange: (event) =>
                      savePetField(pet.id, { autoStart: event.target.checked }),
                  }),
                  '自启动',
                ),
                h(
                  'span',
                  { style: { fontSize: 12, opacity: 0.7, whiteSpace: 'nowrap' } },
                  '尺寸',
                ),
                h('input', {
                  type: 'number',
                  min: 220,
                  max: 900,
                  step: 10,
                  value: pet.size,
                  disabled: busy,
                  onChange: (event) =>
                    savePetField(pet.id, { size: Number(event.target.value) || pet.size }),
                  style: { ...styles.input, minWidth: 78, width: 78 },
                  title: '宠物大小（像素）',
                }),
                h(
                  'select',
                  {
                    value: pet.trayIconPack ?? '',
                    disabled: busy,
                    onChange: (event) =>
                      savePetField(pet.id, {
                        trayIconPack: event.target.value || undefined,
                      }),
                    style: { ...styles.input, minWidth: 104, width: 112 },
                    title: '托盘图标',
                  },
                  [
                    h('option', { key: '', value: '' }, '默认图标'),
                    ...packs.map((pack) =>
                      h('option', { key: pack.id, value: pack.id }, pack.name),
                    ),
                  ],
                ),
                h(
                  'span',
                  { style: { ...styles.status, minWidth: 74 } },
                  running ? '桌面运行中' : '桌面未启动',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    style: styles.button,
                    disabled: busy,
                    onClick: () => startOneDesktop(pet.id),
                  },
                  '启动',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    style: styles.button,
                    disabled: busy || !running,
                    onClick: () => stopOneDesktop(pet.id),
                  },
                  '停止',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    style: styles.button,
                    disabled: busy,
                    onClick: () => resetOneDesktop(pet.id),
                  },
                  '回到角落',
                ),
              );
            }),
          ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 51 }, id: 'hex-pet-llm' },
          h('h3', { style: styles.groupTitle }, 'AI 闲聊'),
          h(
            'p',
            { style: styles.hint },
            '兼容 OpenAI Chat Completions 的 endpoint；密钥只从环境变量 DSH_XIAOFU_LLM_KEY 读取。连续失败 3 次会自动暂停，失败不会影响宿主。',
          ),
          h(
            'label',
            { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 } },
            h('input', {
              type: 'checkbox',
              checked: Boolean(data.config.llm?.enabled),
              disabled: busy,
              onChange: (event) => saveLlm({ enabled: event.target.checked }),
            }),
            '启用碎碎念',
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 } },
            h('input', {
              type: 'text',
              defaultValue: data.config.llm?.endpoint ?? '',
              placeholder: 'https://api.example.com/v1/chat/completions',
              disabled: busy,
              onBlur: (event) => saveLlm({ endpoint: event.target.value.trim() }),
              style: { ...styles.input, minWidth: 260, flex: '1 1 320px' },
            }),
            h('input', {
              type: 'text',
              defaultValue: data.config.llm?.model ?? '',
              placeholder: 'model',
              disabled: busy,
              onBlur: (event) => saveLlm({ model: event.target.value.trim() }),
              style: { ...styles.input, minWidth: 120, width: 160 },
            }),
            h('input', {
              key: `llm-interval-${data.config.llm?.intervalMinutes ?? 30}`,
              type: 'number',
              min: 5,
              max: 1440,
              defaultValue: data.config.llm?.intervalMinutes ?? 30,
              disabled: busy,
              onBlur: (event) =>
                saveLlm({ intervalMinutes: Number(event.target.value) || 30 }),
              style: { ...styles.input, minWidth: 78, width: 90 },
              title: '间隔（分钟）',
            }),
            h('span', { style: styles.status }, '分钟/次'),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 } },
            h(
              'button',
              { type: 'button', style: styles.inherit, disabled: busy, onClick: testLlm },
              '测试一次',
            ),
            llmStatus.paused
              ? h(
                  'button',
                  { type: 'button', style: styles.inherit, disabled: busy, onClick: resumeLlm },
                  '恢复 LLM',
                )
              : null,
            h(
              'span',
              { style: styles.status },
              llmStatus.paused
                ? `已暂停（连续失败 ${llmStatus.failures} 次）`
                : `失败计数 ${llmStatus.failures ?? 0}`,
            ),
          ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 41 }, id: 'hex-pet-sound' },
          h('h3', { style: styles.groupTitle }, '音效'),
          h(
            'p',
            { style: styles.hint },
            '先在「高级」里启用「点击音效」，这里调音量。默认是合成音；也可以上传 WAV / MP3 / OGG（≤2MB）替换。保存后 web 与桌面同时生效。',
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h('input', {
              key: `volume-${data.config.sound?.volume ?? 0.6}`,
              type: 'number',
              min: 0,
              max: 1,
              step: 0.05,
              defaultValue: data.config.sound?.volume ?? 0.6,
              disabled: busy,
              onBlur: (event) => saveSoundVolume(event.target.value),
              style: { ...styles.input, minWidth: 80, width: 90 },
              title: '点击音效音量',
            }),
            h(
              'span',
              { style: styles.status },
              `当前 ${Math.round((data.config.sound?.volume ?? 0.6) * 100)}%`,
            ),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 } },
            h(
              'label',
              { style: { ...styles.button, display: 'inline-block', opacity: busy ? 0.6 : 1 } },
              '上传自定义音效',
              h('input', {
                type: 'file',
                accept: 'audio/wav,audio/mpeg,audio/ogg,.wav,.mp3,.ogg',
                disabled: busy,
                style: { display: 'none' },
                onChange: (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void uploadSound(file);
                },
              }),
            ),
            data.config.sound?.file
              ? h('span', { style: styles.status }, `当前：${data.config.sound.file}`)
              : h('span', { style: styles.status }, '当前：默认合成音'),
            data.config.sound?.file
              ? h(
                  'button',
                  { type: 'button', style: styles.danger, disabled: busy, onClick: removeSound },
                  '恢复默认',
                )
              : null,
          ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 52 }, id: 'hex-pet-media' },
          h('h3', { style: styles.groupTitle }, '视频工具'),
          h(
            'p',
            { style: styles.hint },
            '用于把帧序列编码成带 alpha 的 VP9 webm。首次可自动下载 Windows LGPL 构建；也可以用 DSH_PET_FFMPEG_PATH 指定已有 ffmpeg。',
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: downloadFfmpeg },
              media.available ? '重新下载' : '下载 ffmpeg',
            ),
            h(
              'button',
              { type: 'button', style: styles.button, disabled: busy, onClick: refreshMedia },
              '刷新',
            ),
            h(
              'span',
              { style: styles.status },
              mediaDownload.status === 'downloading' || mediaDownload.status === 'extracting'
                ? mediaDownload.status === 'extracting'
                  ? '下载完成，解压中…'
                  : `下载中 ${
                      mediaDownload.total > 0
                        ? Math.round((mediaDownload.received / mediaDownload.total) * 100)
                        : 0
                    }%（${(mediaDownload.received / 1048576).toFixed(1)} MB）`
                : media.available
                  ? `就绪 · ${media.source ?? 'unknown'}`
                  : `未就绪${media.error ? `（${media.error}）` : ''}`,
            ),
          ),
          media.path ? h('p', { style: styles.status }, media.path) : null,
          media.version ? h('p', { style: styles.status }, media.version) : null,
        ),

        h(
          'div',
          { style: { ...styles.card, order: 10 }, id: 'hex-pet-state' },
          h('h3', { style: styles.groupTitle }, '动作映射'),
          h(
            'div',
            {
              style: {
                margin: '0 0 10px',
                padding: '10px 12px',
                border: '1px solid rgba(109,74,255,0.25)',
                borderRadius: 10,
                background: 'rgba(109,74,255,0.06)',
                display: 'grid',
                gap: 6,
              },
            },
            h('strong', { style: { fontSize: 13 } }, '让 AI 添加动作'),
            h(
              'p',
              { style: { ...styles.hint, margin: 0 } },
              '复制说明后，把绿幕 MP4 发到对话里。AI 负责抠像、去水印、编码、加入动作库并命名。',
            ),
            h(
              'button',
              {
                type: 'button',
                style: styles.inherit,
                disabled: busy,
                onClick: () => startStudioJob('action'),
              },
              '复制说明并创建制作任务',
            ),
          ),
          h(
            'p',
            { style: styles.hint },
            '每个事件一个独立定义块，块内不再选事件。每个事件先选一个动作，点后面的 + 可再加一个，多个动作按顺序轮流播放；只选一个则循环。动作在「动作库」里上传和改名；维持 0 = 保持到下一个事件，正数 = 到点后接空闲动作。',
          ),
          activeState
            ? h(
                'div',
                {
                  style: {
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    padding: '8px 10px',
                    marginBottom: 8,
                    borderRadius: 8,
                    background: 'rgba(53,196,106,0.12)',
                    fontSize: 12,
                  },
                },
                h('strong', {}, `当前动作：${activeState.label || activeState.event}`),
                h('span', { style: { opacity: 0.75 } }, activeState.bubble || ''),
                h(
                  'button',
                  { type: 'button', style: styles.inherit, disabled: busy, onClick: clearState },
                  '清除动作',
                ),
              )
            : null,
          h(
            'div',
            {
              style: {
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 8,
              },
            },
            h('strong', { style: { fontSize: 12 } }, '角色'),
            h(
              'select',
              {
                value: characterId,
                disabled: busy || packs.length === 0,
                style: { ...styles.input, minWidth: 180 },
                onChange: (event) => setSelectedCharacter(event.target.value),
              },
              packs.map((pack) =>
                h('option', { key: pack.id, value: pack.id }, `${pack.name}（${pack.id}）`),
              ),
            ),
            h(
              'span',
              { style: { ...styles.hint, margin: 0 } },
              characterId === activeCharacterId
                ? '当前正在使用的角色'
                : '只编辑这个角色；切到它之后测试和播放才生效',
            ),
          ),
          h(
            'div',
            {
              style: {
                marginBottom: 10,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(127,127,127,0.06)',
                display: 'grid',
                gap: 6,
              },
            },
              h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
              h(
                'strong',
                { style: { fontSize: 12 } },
                `动作库 · ${characterPack?.name ?? '未绑定角色'}`,
              ),
              h(
                'label',
                {
                  style: { ...styles.inherit, cursor: 'pointer', display: 'inline-flex' },
                  title: '上传透明 webm/mov 动作到当前角色',
                },
                busy ? '上传中…' : '高级 · 手动上传透明视频',
                h('input', {
                  type: 'file',
                  accept: '.webm,.mov',
                  disabled: busy,
                  style: { display: 'none' },
                  onChange: (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void uploadAction(file);
                  },
                }),
              ),
              h(
                'span',
                { style: { ...styles.hint, margin: 0 } },
                '动作归属当前角色；改名只影响这个角色',
              ),
            ),
            h(
              'div',
              { style: { display: 'grid', gap: 4, maxHeight: 190, overflow: 'auto' } },
              (characterPack?.animations ?? []).map(
                (animation) =>
                  h(
                    'div',
                    {
                      key: animation,
                      style: { display: 'flex', gap: 6, alignItems: 'center' },
                    },
                    h(
                      'span',
                      {
                        title: animation,
                        style: {
                          width: 170,
                          minWidth: 120,
                          fontSize: 11,
                          opacity: 0.6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        },
                      },
                      animation,
                    ),
                    h('input', {
                      type: 'text',
                      defaultValue: actionDisplayName(
                        characterId,
                        animation,
                        data.config.actionNames,
                      ),
                      maxLength: 64,
                      disabled: busy,
                      placeholder: '动作名',
                      style: { ...styles.input, flex: '1 1 160px', minWidth: 120 },
                      onBlur: (event) => {
                        const current = actionDisplayName(
                          characterId,
                          animation,
                          data.config.actionNames,
                        );
                        if (event.target.value.trim() !== current) {
                          void renameAction(null, animation, event.target.value);
                        }
                      },
                    }),
                  ),
              ),
            ),
          ),
          h(
            'div',
            { style: { display: 'grid', gap: 8 } },
            ACTION_EVENT_OPTIONS.map((option) => {
              const entry = actionEntryFor(
                option.id,
                mappingEntriesFor(),
              );
              const packId = characterId;
              const packAnimations = characterPack?.animations ?? [];
              const animationOptions = Array.from(
                new Set([...packAnimations, entry.animation, 'animations/idle.webm']),
              );
              return h(
                React.Fragment,
                { key: option.id },
                h(
                'div',
                {
                  style: {
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    padding: '10px 12px',
                    border: '1px solid rgba(127,127,127,0.18)',
                    borderRadius: 10,
                    background: 'rgba(127,127,127,0.04)',
                  },
                },
                h('input', {
                  type: 'checkbox',
                  checked: entry.enabled !== false,
                  disabled: busy,
                  title: '启用',
                  onChange: (event) =>
                    updateStateEntry(option.id, { enabled: event.target.checked }),
                }),
                h(
                  'strong',
                  { style: { width: 96, minWidth: 86, fontSize: 12 } },
                  option.label,
                ),
                h('span', { style: { ...styles.status, fontSize: 11 } }, '维持'),
                h('input', {
                  key: `state-hold-${option.id}-${entry.holdSec}`,
                  type: 'number',
                  min: 0,
                  max: 1440,
                  step: 1,
                  defaultValue: Math.round(
                    (entry.holdSec || EVENT_HOLD_DEFAULTS[option.id] || 0) / 60,
                  ),
                  disabled: busy || option.id === 'idle' || option.id === 'task-start' || option.id === 'approval-needed',
                  title:
                    option.id === 'task-done'
                      ? '任务完成后保持多少分钟'
                      : option.id === 'task-timeout'
                        ? '超时动作持续多少分钟'
                        : option.id === 'balance-warning'
                          ? '余额警告持续多少分钟'
                          : '由任务状态决定',
                  style: { ...styles.input, width: 68, minWidth: 60 },
                  onBlur: (event) => {
                    const minutes = Math.max(0, Math.min(1440, Number(event.target.value) || 0));
                    const value = minutes * 60;
                    if (value !== entry.holdSec) {
                      updateStateEntry(option.id, { holdSec: value });
                    }
                  },
                }),
                h('span', { style: { ...styles.status, fontSize: 11 } }, '分钟'),
                h(
                  'button',
                  {
                    type: 'button',
                    style: styles.inherit,
                    disabled:
                      busy ||
                      entry.enabled === false ||
                      characterId !== activeCharacterId,
                    title:
                      characterId === activeCharacterId
                        ? '测试这个动作'
                        : '切到该角色后才能测试',
                    onClick: () => triggerState(option.id),
                  },
                  '触发',
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      flexBasis: '100%',
                    },
                  },
                  entry.animations.map((animation, animationIndex) =>
                    h(
                      'div',
                      {
                        key: `${option.id}-action-${animationIndex}`,
                        style: { display: 'flex', gap: 2, alignItems: 'center' },
                      },
                      h(
                        'select',
                        {
                          value: animation,
                          disabled: busy,
                          title: '选择动作',
                          style: { ...styles.input, minWidth: 150, maxWidth: 210 },
                          onChange: (event) => {
                            const animations = entry.animations.map((item, index) =>
                              index === animationIndex ? event.target.value : item,
                            );
                            updateStateEntry(option.id, {
                              animations,
                              animation: animations[0],
                              label: actionDisplayName(
                                packId,
                                animations[0],
                                data.config.actionNames,
                              ),
                            });
                          },
                        },
                        animationOptions.map((item) =>
                          h(
                            'option',
                            { key: item, value: item },
                            actionDisplayName(packId, item, data.config.actionNames),
                          ),
                        ),
                      ),
                      entry.animations.length > 1
                        ? h(
                            'button',
                            {
                              type: 'button',
                              style: styles.danger,
                              disabled: busy,
                              title: '移除这个动作',
                              onClick: () => {
                                const animations = entry.animations.filter(
                                  (_, index) => index !== animationIndex,
                                );
                                updateStateEntry(option.id, {
                                  animations,
                                  animation: animations[0],
                                  label: actionDisplayName(
                                    packId,
                                    animations[0],
                                    data.config.actionNames,
                                  ),
                                });
                              },
                            },
                            '×',
                          )
                        : null,
                    ),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      style: styles.inherit,
                      disabled: busy,
                      title: '为这个状态再加一个动作',
                      onClick: () => {
                        const next =
                          animationOptions.find(
                            (item) => !entry.animations.includes(item),
                          ) ?? entry.animations[0] ?? 'animations/idle.webm';
                        updateStateEntry(option.id, {
                          animations: [...entry.animations, next],
                          animation: entry.animations[0] ?? next,
                        });
                      },
                    },
                    '+',
                  ),
                ),
                ),
                option.id === 'balance-warning'
                  ? h(
                      'div',
                      {
                        style: {
                          margin: '0 0 8px 28px',
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: 'rgba(127,127,127,0.06)',
                          display: 'grid',
                          gap: 6,
                          fontSize: 12,
                        },
                      },
                      h(
                        'div',
                        { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' } },
                        h('span', {}, '本次任务 token ≥'),
                        h('input', {
                          type: 'number',
                          min: 0,
                          max: 1000000000,
                          defaultValue: data.config.balanceWarning?.tokenThreshold ?? 20000,
                          disabled: busy,
                          style: { ...styles.input, width: 110, minWidth: 90 },
                          onBlur: (event) => {
                            const value = Math.max(0, Number(event.target.value) || 0);
                            if (value !== (data.config.balanceWarning?.tokenThreshold ?? 20000)) {
                              void saveBalanceWarning({ tokenThreshold: value });
                            }
                          },
                        }),
                        h('span', {}, 'token'),
                      ),
                      h('div', { style: { opacity: 0.75 } }, '余额低于（按币种单独判断，满足任一即触发）：'),
                      ...(data.config.balanceWarning?.thresholds ?? []).map((threshold, index) =>
                        h(
                          'div',
                          {
                            key: `${threshold.currency}-${index}`,
                            style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
                          },
                          h('input', {
                            type: 'text',
                            defaultValue: threshold.currency,
                            maxLength: 8,
                            disabled: busy,
                            placeholder: 'CNY',
                            style: { ...styles.input, width: 80, minWidth: 64 },
                            onBlur: (event) => {
                              const currency = event.target.value.trim().toUpperCase();
                              if (currency && currency !== threshold.currency) {
                                updateBalanceThreshold(index, { currency });
                              }
                            },
                          }),
                          h('span', {}, '≤'),
                          h('input', {
                            type: 'number',
                            min: 0,
                            max: 1000000000,
                            defaultValue: threshold.amount,
                            disabled: busy,
                            style: { ...styles.input, width: 110, minWidth: 90 },
                            onBlur: (event) => {
                              const amount = Math.max(0, Number(event.target.value) || 0);
                              if (amount !== threshold.amount) {
                                updateBalanceThreshold(index, { amount });
                              }
                            },
                          }),
                          h(
                            'button',
                            {
                              type: 'button',
                              style: styles.danger,
                              disabled: busy,
                              onClick: () => removeBalanceThreshold(index),
                            },
                            '删除',
                          ),
                        ),
                      ),
                      h(
                        'div',
                        {},
                        h(
                          'button',
                          {
                            type: 'button',
                            style: styles.inherit,
                            disabled: busy,
                            onClick: addBalanceThreshold,
                          },
                          '添加币种',
                        ),
                      ),
                    )
                  : null,
              );
            }),
          ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 11 }, id: 'hex-pet-generate' },
          h('h3', { style: styles.groupTitle }, '制作动作（高级）'),
          h(
            'p',
            { style: styles.hint },
            '把 PNG/WebP 序列打成 zip。平铺文件生成 idle；按 idle/、click/、drag/ 分目录可生成多段动画。按文件名里的数字排序，用已就绪的 ffmpeg 编码成 VP9 alpha webm，并自动创建、绑定形象包。',
          ),
          h(
            'div',
            {
              style: {
                margin: '0 0 10px',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px dashed rgba(127,127,127,0.35)',
                background: 'rgba(127,127,127,0.06)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                fontSize: 13,
              },
            },
            h('strong', {}, '要做一只全新形象？'),
            h(
              'span',
              { style: { opacity: 0.8 } },
              '① 生成两条绿幕视频 ② 抠成 idle/click.webm ③ 打包上传',
            ),
            h(
              'a',
              {
                href: '/dsh-xiaofu/docs/character-quickstart',
                target: '_blank',
                rel: 'noreferrer',
                style: { color: '#6d4aff', fontWeight: 600, textDecoration: 'none' },
              },
              '打开 3 步指南 →',
            ),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h('input', {
              style: styles.input,
              placeholder: '形象包名称',
              value: genName,
              onChange: (event) => setGenName(event.target.value),
            }),
            h('input', {
              style: { ...styles.input, minWidth: 70, width: 80 },
              type: 'number',
              min: 1,
              max: 60,
              value: genFps,
              title: 'fps',
              onChange: (event) => setGenFps(Number(event.target.value) || 24),
            }),
            h('span', { style: styles.status }, 'fps'),
            h(
              'label',
              {
                style: {
                  ...styles.button,
                  display: 'inline-block',
                  opacity: generating ? 0.6 : 1,
                },
              },
              generating ? '生成中…' : '选择帧 zip',
              h('input', {
                type: 'file',
                accept: '.zip,application/zip',
                style: { display: 'none' },
                onChange: (event) => {
                  const file = event.target.files && event.target.files[0];
                  event.target.value = '';
                  if (file) inspectZip(file);
                },
              }),
            ),
            h(
              'label',
              {
                style: {
                  ...styles.button,
                  display: 'inline-block',
                  opacity: generating ? 0.6 : 1,
                },
              },
              '导入透明 webm',
              h('input', {
                type: 'file',
                accept: '.webm,video/webm',
                disabled: generating,
                style: { display: 'none' },
                onChange: (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void importWebm(file);
                },
              }),
            ),
          ),
          genPlan?.preview
            ? h('img', {
                src: genPlan.preview,
                alt: '',
                style: { maxHeight: 80, borderRadius: 8, marginTop: 8, background: 'rgba(127,127,127,0.08)' },
              })
            : null,
          genPlan
            ? h(
                'div',
                { style: { display: 'grid', gap: 6, marginTop: 10 } },
                genPlan.segments.map((segment, index) =>
                  h(
                    'div',
                    {
                      key: segment.name,
                      style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
                    },
                    h('span', { style: { ...styles.status, minWidth: 120 } }, `${segment.name} · ${segment.frames} 帧`),
                    h('input', {
                      style: { ...styles.input, minWidth: 70, width: 80 },
                      type: 'number',
                      min: 1,
                      max: 60,
                      value: segment.fps,
                      title: 'fps',
                      onChange: (event) =>
                        updateSegment(index, { fps: Number(event.target.value) || 24 }),
                    }),
                    h(
                      'select',
                      {
                        style: { ...styles.input, minWidth: 90 },
                        value: segment.mode,
                        onChange: (event) => updateSegment(index, { mode: event.target.value }),
                      },
                      h('option', { value: 'loop' }, '循环'),
                      h('option', { value: 'once' }, '单次'),
                    ),
                  ),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    style: { ...styles.button, justifySelf: 'start', marginTop: 4 },
                    disabled: generating,
                    onClick: generateFromFrames,
                  },
                  generating ? '生成中…' : '开始生成',
                ),
              )
            : null,
          genJobId
            ? h(
                'div',
                { style: { display: 'grid', gap: 6, marginTop: 8 } },
                h(
                  'div',
                  {
                    style: {
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(127,127,127,0.2)',
                      overflow: 'hidden',
                    },
                  },
                  h('div', {
                    style: {
                      width: `${Math.max(2, genProgress)}%`,
                      height: '100%',
                      background: '#4f8cff',
                      transition: 'width 200ms ease-out',
                    },
                  }),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    style: { ...styles.danger, justifySelf: 'start' },
                    onClick: cancelGenerate,
                  },
                  '取消生成',
                ),
              )
            : null,
          genMessage ? h('p', { style: styles.status }, genMessage) : null,
          jobHistory.length
            ? h(
                'div',
                { style: { marginTop: 10 } },
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      opacity: 0.7,
                      marginBottom: 4,
                    },
                  },
                  h('span', { style: { fontWeight: 600 } }, '最近生成'),
                  jobStorage
                    ? h(
                        'span',
                        {
                          style: { opacity: 0.75 },
                          title: jobStorage.lastCleanup?.jobs?.join('、') ?? '',
                        },
                        `历史 ${jobStorage.jobs} 条 · zip ${(jobStorage.zipBytes / 1048576).toFixed(1)} / ${(jobStorage.limits.zipBytes / 1048576).toFixed(0)} MB${
                          jobStorage.lastCleanup
                            ? ` · 上次清理 ${new Date(jobStorage.lastCleanup.at).toLocaleTimeString()}（${jobStorage.lastCleanup.removed} 条）`
                            : ''
                        }`,
                      )
                    : null,
                  h(
                    'button',
                    {
                      type: 'button',
                      style: { ...styles.button, padding: '2px 8px', fontSize: 12 },
                      disabled: generating,
                      onClick: cleanupHistory,
                    },
                    '清理已完成',
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      style: { ...styles.button, padding: '2px 8px', fontSize: 12 },
                      onClick: openCleanupLog,
                    },
                    showCleanupLog ? '收起日志' : '清理日志',
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      style: { ...styles.button, padding: '2px 8px', fontSize: 12 },
                      onClick: toggleTimeline,
                    },
                    showTimeline ? '收起时间线' : '时间线',
                  ),
                ),
                showTimeline
                  ? h(
                      'div',
                      {
                        style: {
                          fontSize: 12,
                          opacity: 0.85,
                          margin: '4px 0 8px',
                          borderTop: '1px solid rgba(127,127,127,0.25)',
                          paddingTop: 6,
                        },
                      },
                      h('strong', {}, '任务 / 清理时间线'),
                      h(
                        'select',
                        {
                          style: { ...styles.input, minWidth: 90 },
                          value: timelineType,
                          onChange: (event) => setTimelineType(event.target.value),
                        },
                        h('option', { value: 'all' }, '全部事件'),
                        h('option', { value: 'task' }, '只看任务'),
                        h('option', { value: 'cleanup' }, '只看清理'),
                      ),
                      (() => {
                        const events = [
                          ...jobHistory.map((job) => ({
                            at: job.finishedAt ?? job.createdAt,
                            type: 'task',
                            text: `任务 ${job.name} · ${
                              ({ queued: '排队中', running: '生成中', done: '完成', failed: '失败', cancelled: '已取消' })[
                                job.status
                              ] ?? job.status
                            }${job.finishedAt ? '（已结束）' : '（创建）'}`,
                          })),
                          ...cleanupLogData.map((item) => ({
                            at: item.at,
                            type: 'cleanup',
                            text: `清理 ${item.reason} · ${item.removed} 条${
                              item.jobs?.length ? `（${item.jobs.join('、')}）` : ''
                            }`,
                          })),
                        ]
                          .filter((event) => timelineType === 'all' || event.type === timelineType)
                          .sort((a, b) => b.at - a.at)
                          .slice(0, 20);
                        if (events.length === 0) {
                          return h('div', { style: { opacity: 0.6 } }, '暂无事件');
                        }
                        return events.map((event) =>
                          h(
                            'div',
                            { key: `${event.at}-${event.text}`, style: { padding: '2px 0' } },
                            `${new Date(event.at).toLocaleString()} · ${event.text}`,
                          ),
                        );
                      })(),
                    )
                  : null,
                showCleanupLog
                  ? h(
                      'div',
                      {
                        style: {
                          fontSize: 12,
                          opacity: 0.85,
                          margin: '4px 0 8px',
                          borderTop: '1px solid rgba(127,127,127,0.25)',
                          paddingTop: 6,
                        },
                      },
                      h(
                        'div',
                        { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                        h('strong', {}, '清理日志'),
                        h('input', {
                          style: { ...styles.input, minWidth: 140, width: 160 },
                          placeholder: '搜索任务/时间',
                          value: cleanupFilter,
                          onChange: (event) => setCleanupFilter(event.target.value),
                        }),
                        h(
                          'select',
                          {
                            style: { ...styles.input, minWidth: 90 },
                            value: cleanupReason,
                            onChange: (event) => setCleanupReason(event.target.value),
                          },
                          h('option', { value: 'all' }, '全部原因'),
                          h('option', { value: 'manual' }, '手动'),
                          h('option', { value: 'startup' }, '启动'),
                          h('option', { value: 'periodic' }, '定时'),
                          h('option', { value: 'config' }, '配置'),
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            style: { ...styles.button, padding: '2px 8px', fontSize: 12 },
                            onClick: exportCleanupLog,
                          },
                          '导出 JSON',
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            style: {
                              ...(pendingClearLog ? styles.dangerActive : styles.danger),
                              padding: '2px 8px',
                              fontSize: 12,
                            },
                            onClick: clearCleanupLog,
                          },
                          pendingClearLog ? '再点一次清空' : '清空日志',
                        ),
                      ),
                      cleanupLogData.length
                        ? (() => {
                            const filtered = cleanupLogData.filter((item) => {
                              if (cleanupReason !== 'all' && item.reason !== cleanupReason) {
                                return false;
                              }
                              if (!cleanupFilter.trim()) return true;
                              return `${item.reason} ${item.removed} ${(item.jobs ?? []).join(' ')} ${new Date(item.at).toLocaleString()}`
                                .toLowerCase()
                                .includes(cleanupFilter.trim().toLowerCase());
                            });
                            if (filtered.length === 0) {
                              return h('div', { style: { opacity: 0.6 } }, '没有匹配记录');
                            }
                            return filtered.slice(0, 20).map((item) =>
                              h(
                                'div',
                                { key: item.at, style: { padding: '2px 0' } },
                                `${new Date(item.at).toLocaleString()} · ${item.reason} · ${item.removed} 条${
                                  item.jobs?.length ? `：${item.jobs.join('、')}` : ''
                                }`,
                              ),
                            );
                          })()
                        : h('div', { style: { opacity: 0.6 } }, '暂无清理记录'),
                    )
                  : null,
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      fontSize: 12,
                      margin: '4px 0',
                    },
                  },
                  h('span', {}, '配额'),
                  h('input', {
                    type: 'number',
                    style: { ...styles.input, minWidth: 60, width: 70 },
                    value: quotaDraft.history,
                    title: '历史条数',
                    onChange: (event) =>
                      setQuotaDraft({ ...quotaDraft, history: Number(event.target.value) || 50 }),
                  }),
                  h('span', {}, '条'),
                  h('input', {
                    type: 'number',
                    style: { ...styles.input, minWidth: 70, width: 80 },
                    value: quotaDraft.zipMb,
                    title: 'zip MB',
                    onChange: (event) =>
                      setQuotaDraft({ ...quotaDraft, zipMb: Number(event.target.value) || 500 }),
                  }),
                  h('span', {}, 'MB'),
                  h('input', {
                    type: 'number',
                    style: { ...styles.input, minWidth: 60, width: 70 },
                    value: quotaDraft.ttlHours,
                    title: 'TTL 小时',
                    onChange: (event) =>
                      setQuotaDraft({ ...quotaDraft, ttlHours: Number(event.target.value) || 24 }),
                  }),
                  h('span', {}, '小时'),
                  h('input', {
                    type: 'number',
                    style: { ...styles.input, minWidth: 60, width: 70 },
                    value: quotaDraft.cleanupMinutes,
                    title: '清理间隔（分钟，0=关闭定时清理）',
                    onChange: (event) =>
                      setQuotaDraft({
                        ...quotaDraft,
                        cleanupMinutes: Number(event.target.value) || 0,
                      }),
                  }),
                  h('span', {}, '分钟清理'),
                  h(
                    'label',
                    { style: { display: 'flex', gap: 4, alignItems: 'center' } },
                    h('input', {
                      type: 'checkbox',
                      checked: Boolean(quotaDraft.autoCleanup),
                      onChange: (event) =>
                        setQuotaDraft({ ...quotaDraft, autoCleanup: event.target.checked }),
                    }),
                    '自动清理',
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      style: { ...styles.button, padding: '2px 8px', fontSize: 12 },
                      onClick: saveQuota,
                    },
                    '保存配额',
                  ),
                ),
                jobStorage?.cleanupHistory?.length > 1
                  ? h(
                      'div',
                      { style: { fontSize: 11, opacity: 0.6, marginBottom: 4 } },
                      `最近清理：${jobStorage.cleanupHistory
                        .slice(0, 3)
                        .map((item) => `${new Date(item.at).toLocaleTimeString()} ${item.removed} 条`)
                        .join(' · ')}`,
                    )
                  : null,
                h(
                  'div',
                  { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, marginBottom: 4 } },
                  h('input', {
                    style: { ...styles.input, minWidth: 120, width: 140 },
                    placeholder: '搜索任务名',
                    value: historyFilter,
                    onChange: (event) => setHistoryFilter(event.target.value),
                  }),
                  h(
                    'select',
                    {
                      style: { ...styles.input, minWidth: 90 },
                      value: historyStatus,
                      onChange: (event) => setHistoryStatus(event.target.value),
                    },
                    h('option', { value: 'all' }, '全部状态'),
                    h('option', { value: 'done' }, '完成'),
                    h('option', { value: 'failed' }, '失败'),
                    h('option', { value: 'running' }, '生成中'),
                    h('option', { value: 'queued' }, '排队中'),
                    h('option', { value: 'cancelled' }, '已取消'),
                  ),
                ),
                (() => {
                  const filtered = jobHistory.filter((job) => {
                    if (historyStatus !== 'all' && job.status !== historyStatus) return false;
                    if (!historyFilter.trim()) return true;
                    return `${job.name} ${job.id}`.toLowerCase().includes(historyFilter.trim().toLowerCase());
                  });
                  if (filtered.length === 0) {
                    return h('div', { style: { fontSize: 12, opacity: 0.6 } }, '没有匹配任务');
                  }
                  return filtered.slice(0, 5).map((job) =>
                  h(
                    'div',
                    {
                      key: job.id,
                      style: { display: 'flex', gap: 8, fontSize: 12, padding: '2px 0', flexWrap: 'wrap' },
                    },
                    h('span', { style: { minWidth: 100 } }, job.name),
                    h(
                      'span',
                      {},
                      ({ queued: '排队中', running: '生成中', done: '完成', failed: '失败', cancelled: '已取消' })[
                        job.status
                      ] ?? job.status,
                    ),
                    h('span', { style: { opacity: 0.6 } }, `${job.progress ?? 0}%`),
                    h(
                      'span',
                      { style: { opacity: 0.55 } },
                      job.finishedAt
                        ? `耗时 ${Math.max(0, (job.finishedAt - job.createdAt) / 1000).toFixed(1)}s`
                        : new Date(job.createdAt).toLocaleTimeString(),
                    ),
                    job.error ? h('span', { style: { color: '#c0392b' } }, job.error) : null,
                    (job.status === 'failed' || job.status === 'cancelled') &&
                    job.retryable !== false
                      ? h(
                          'button',
                          {
                            type: 'button',
                            style: { ...styles.button, padding: '2px 8px', fontSize: 12 },
                            disabled: generating,
                            onClick: () => retryJob(job.id),
                          },
                          '重试',
                        )
                      : null,
                  ),
                );
              })(),
              )
            : null,
        ),

        h(
          'div',
          { style: { ...styles.card, order: 7 }, id: 'hex-pet-packs' },
          h('h3', { style: styles.groupTitle }, '角色库'),
          h(
            'div',
            {
              style: {
                margin: '0 0 10px',
                padding: '10px 12px',
                border: '1px solid rgba(109,74,255,0.25)',
                borderRadius: 10,
                background: 'rgba(109,74,255,0.06)',
                display: 'grid',
                gap: 6,
              },
            },
            h('strong', { style: { fontSize: 13 } }, '让 AI 制作新角色'),
            h(
              'p',
              { style: { ...styles.hint, margin: 0 } },
              '复制制作说明后，把角色图或绿幕视频发到对话里。AI 负责检查、抠像、编码、打包、安装和绑定，不需要手动做 zip。',
            ),
            h(
              'button',
              {
                type: 'button',
                style: styles.inherit,
                disabled: busy,
                onClick: () => startStudioJob('character'),
              },
              '复制说明并创建制作任务',
            ),
          ),
          h(
            'p',
            { style: styles.hint },
            '通常不需要手动打包。直接点上方「复制说明并创建制作任务」，把角色图和视频发到对话里即可。手动 zip 只作为高级兜底。',
          ),
          h(
            'p',
            { style: { ...styles.hint, marginTop: -4 } },
            h(
              'a',
              {
                href: '/dsh-xiaofu/docs/character-quickstart',
                target: '_blank',
                rel: 'noreferrer',
                style: { color: '#6d4aff', fontWeight: 600, textDecoration: 'none' },
              },
              '查看 3 步做新角色指南 →',
            ),
          ),
          uploadMessage
            ? h(
                'p',
                {
                  style: {
                    ...styles.status,
                    margin: '0 0 8px',
                    color: uploadMessage.includes('失败') ? '#c0392b' : 'inherit',
                  },
                },
                uploadMessage,
              )
            : null,
          h(
            'details',
            { style: { marginTop: 8 } },
            h(
              'summary',
              { style: { cursor: 'pointer', fontSize: 12, opacity: 0.65 } },
              '高级 · 手动导入角色包（zip）',
            ),
          h(
            'label',
            {
              style: { ...styles.drop, cursor: uploading ? 'progress' : 'pointer' },
              onDragOver: (event) => event.preventDefault(),
              onDrop: (event) => {
                event.preventDefault();
                upload(event.dataTransfer.files && event.dataTransfer.files[0]);
              },
            },
            h('input', {
              type: 'file',
              accept: '.zip,application/zip',
              style: { display: 'none' },
              onChange: (event) => {
                const file = event.target.files && event.target.files[0];
                event.target.value = '';
                if (file) setUploadMessage(`已选择：${file.name}`);
                upload(file);
              },
            }),
            h('span', {}, '把 zip 拖到这里，或'),
            h(
              'span',
              {
                style: {
                  ...styles.button,
                  display: 'inline-block',
                  opacity: uploading ? 0.6 : 1,
                },
              },
              uploading ? '上传中…' : '选择文件',
            ),
          ),
          ),
          packs.length === 0
            ? h('p', { style: styles.status }, '还没有导入形象包')
            : packs.map((pack) =>
                h(
                  'div',
                  {
                    key: pack.id,
                    style: {
                      ...styles.packRow,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      opacity: pack.enabled === false ? 0.55 : 1,
                    },
                  },
                  h(
                    'div',
                    { style: { display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 } },
                    pack.preview
                      ? h('img', {
                          src: `/dsh-xiaofu/packs/${pack.id}/${pack.preview
                            .split('/')
                            .map((segment) => encodeURIComponent(segment))
                            .join('/')}`,
                          style: styles.thumb,
                          alt: '',
                        })
                      : h('div', { style: styles.thumb }, 'HEX'),
                    h(
                      'div',
                      { style: { display: 'flex', flexDirection: 'column', gap: 3 } },
                      h('input', {
                        type: 'text',
                        defaultValue: pack.name,
                        maxLength: 64,
                        disabled: busy,
                        onBlur: (event) => {
                          if (event.target.value.trim() && event.target.value !== pack.name) {
                            void savePackMeta(pack.id, { displayName: event.target.value });
                          }
                        },
                        style: {
                          ...styles.input,
                          minWidth: 120,
                          width: 170,
                          fontWeight: 600,
                          padding: '4px 8px',
                        },
                        title: '显示名',
                      }),
                      h(
                        'div',
                        { style: { ...styles.packId, display: 'flex', gap: 4, alignItems: 'center' } },
                        h('span', {}, pack.id),
                        h('span', {}, '· v'),
                        h('input', {
                          type: 'text',
                          defaultValue: pack.version,
                          maxLength: 32,
                          disabled: busy,
                          onBlur: (event) => {
                            if (event.target.value.trim() && event.target.value !== pack.version) {
                              void savePackMeta(pack.id, {
                                displayVersion: event.target.value,
                              });
                            }
                          },
                          style: {
                            ...styles.input,
                            minWidth: 50,
                            width: 62,
                            padding: '2px 5px',
                            fontSize: 11,
                          },
                          title: '显示版本',
                        }),
                      ),
                    ),
                  ),
                  h(
                    'div',
                    { style: { display: 'flex', gap: 6, alignItems: 'center' } },
                    h(
                      'button',
                      {
                        type: 'button',
                        style: styles.inherit,
                        disabled: busy,
                        onClick: () =>
                          savePackMeta(pack.id, { enabled: pack.enabled === false }),
                      },
                      pack.enabled === false ? '启用' : '停用',
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        style: styles.inherit,
                        disabled: busy || pack.enabled === false,
                        onClick: () => bindPack(pack.id),
                      },
                      pack.id === activePackId ? '使用中' : '设为当前角色',
                    ),
                    h(
                      'a',
                      {
                        href: `/dsh-xiaofu/packs/${pack.id}/export`,
                        download: `${pack.id}.petpack.zip`,
                        style: { ...styles.inherit, textDecoration: 'none' },
                      },
                      '导出',
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        style: pendingDelete === pack.id ? styles.dangerActive : styles.danger,
                        disabled: busy,
                        onClick: () => removePack(pack.id),
                      },
                      pendingDelete === pack.id ? '再点一次确认' : '删除',
                    ),
                  ),
                ),
              ),
        ),

        h(
          'div',
          { style: { ...styles.card, order: 49.8 }, id: 'hex-pet-studio' },
          h('h3', { style: styles.groupTitle }, '素材工坊'),
          h(
            'p',
            { style: styles.hint },
            '对话里让 AI 处理角色图/绿幕视频时，会在这里留下任务记录。用户不需要手动做 zip 或透明 webm。',
          ),
          studioJobs.length === 0
            ? h('p', { style: styles.status }, '暂无制作任务')
            : h(
                'div',
                { style: { display: 'grid', gap: 4, fontSize: 12 } },
                studioJobs.slice(0, 8).map((job) =>
                  h(
                    'div',
                    {
                      key: job.id,
                      style: {
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom: '1px solid rgba(127,127,127,0.12)',
                      },
                    },
                    h('span', {}, job.kind === 'character' ? '角色' : job.kind === 'action' ? '动作' : '其他'),
                    h('span', { style: { opacity: 0.65 } }, job.status),
                    h(
                      'span',
                      { style: { opacity: 0.45, fontFamily: 'monospace', fontSize: 10 } },
                      job.id,
                    ),
                  ),
                ),
              ),
        ),
        h('div', { id: 'hex-pet-features', style: { order: 49.9 } }),
        groups.map((group) =>
          h(
            'div',
            { key: group.id, style: { ...styles.group, order: 50 } },
            h('h3', { style: styles.groupTitle }, GROUP_LABELS[group.id] ?? group.id),
            group.features.map((feature) =>
              h(
                'label',
                { key: feature.id, style: styles.row },
                h('input', {
                  type: 'checkbox',
                  checked: effective(feature),
                  disabled: busy,
                  onChange: () => toggle(feature),
                }),
                h('span', { style: styles.label }, feature.label),
                feature.platforms.includes('desktop') && !feature.platforms.includes('web')
                  ? h('span', { style: styles.badge }, '仅桌面')
                  : null,
                isOverridden(feature)
                  ? h(
                      'button',
                      {
                        type: 'button',
                        style: styles.inherit,
                        onClick: (event) => {
                          event.preventDefault();
                          inherit(feature);
                        },
                      },
                      '覆盖中 · 跟随全局',
                    )
                  : null,
                h('span', { style: styles.id }, feature.id),
              ),
            ),
          ),
        ),

        h('h3', { style: styles.groupTitle }, selectedPet ? `菜单预览（${selectedPet.name || selectedPet.id}）` : '菜单预览（网页 / 主宠）'),
        h(
          'div',
          { style: styles.preview },
          data.menu.length === 0
            ? h('div', { style: styles.previewItem }, '（空）')
            : data.menu.map((item) =>
                h(
                  'div',
                  { key: item.id, style: styles.previewItem },
                  item.label,
                  item.disabled
                    ? h('span', { style: styles.previewReason }, `（置灰：${item.reason ?? '依赖不满足'}）`)
                    : null,
                ),
              ),
        ),

        h(
          'div',
          { style: styles.footer },
          h('button', { type: 'button', style: styles.button, onClick: () => load(selected), disabled: busy }, '刷新'),
          h('button', { type: 'button', style: styles.button, onClick: reset, disabled: busy }, '恢复默认'),
          h('span', { style: styles.status }, busy ? '保存中…' : notice || `${pets.length} 只宠物`),
        ),
      );
    }

    const name = 'dsh-xiaofu';
    const inject = ['slots'];

    function apply(ctx) {
      ctx.slots.inject('settings.section', function* () {
        yield ctx.slots.register(
          {
            name: 'settings.section',
            id: 'hex-pet',
            order: 30,
            label: () => '桌宠配置',
          },
          Section,
        );
      });

      ctx.slots.inject('shell.overlay', function* () {
        yield ctx.slots.register(
          { name: 'shell.overlay', id: 'hex-pet', order: 1000 },
          () => h(PetOverlay, {}),
        );
      });
    }

    module.exports = { name, inject, apply };
    return module.exports;
  },
});
