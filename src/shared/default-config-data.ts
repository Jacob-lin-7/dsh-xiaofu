export const DEFAULT_CONFIG_DATA = {
  "schemaVersion": 1,
  "pets": [
    {
      "id": "main",
      "name": "小符",
      "pack": "xiaofu",
      "size": 410,
      "display": "both",
      "clickAction": "animation",
      "clickAnimation": "animations/click.webm",
      "clickAnimations": [
        "animations/click.webm",
        "animations/state-done-3.webm"
      ],
      "doubleClickAction": "open-dsh",
      "doubleClickAnimations": [],
      "trayIconPack": "xiaofu",
      "position": {
        "corner": "top-right",
        "marginX": 24,
        "marginY": 100
      }
    }
  ],
  "features": {
    "registryVersion": 1,
    "global": {
      "menu.display": true,
      "motion.roam": false,
      "core.pet": true,
      "menu.snooze": true
    },
    "pets": {},
    "menu": {
      "mode": "hide",
      "order": []
    }
  },
  "packs": {
    "xiaofu": {
      "version": "1.5.5",
      "enabled": true,
      "displayName": "小符"
    }
  },
  "sound": {
    "volume": 0.2
  },
  "appearance": {
    "fontFamily": "system",
    "fontSize": 12,
    "scaleWithPet": true
  },
  "bubble": {
    "enabled": true,
    "durationMs": 8000,
    "quotes": [
      "戳我干嘛～",
      "今天也要加油！",
      "要不要休息一下？"
    ],
    "stateQuotes": {
      "click": [
        "唔，戳我做什么？",
        "在的，说吧。",
        "符纸差点掉了……"
      ],
      "idle": [
        "今天也没什么事",
        "打个盹，不算偷懒",
        "香火气有点淡"
      ],
      "task-start": [
        "收到，开始",
        "先理一下符纸",
        "这事交给我"
      ],
      "task-done": [
        "成了",
        "收工，别催",
        "比预计快一点"
      ],
      "approval-needed": [
        "这一步要你点头",
        "确认一下，我再往下走",
        "批个准，很快的"
      ],
      "task-timeout": [
        "这一步拖得有点久",
        "不是我慢，是它卡住了",
        "再等等，我去看看"
      ],
      "balance-warning": [
        "余额见底了",
        "这次的消耗有点扎眼",
        "省着点，我还要买符纸"
      ]
    },
    "stateTiming": {
      "click": {
        "durationMs": 8000,
        "gapMs": 2000
      },
      "idle": {
        "durationMs": 8000,
        "gapMs": 2000
      },
      "task-start": {
        "durationMs": 8000,
        "gapMs": 2000
      },
      "task-done": {
        "durationMs": 8000,
        "gapMs": 2000
      },
      "approval-needed": {
        "durationMs": 8000,
        "gapMs": 2000
      },
      "task-timeout": {
        "durationMs": 8000,
        "gapMs": 2000
      },
      "balance-warning": {
        "durationMs": 8000,
        "gapMs": 2000
      }
    },
    "style": "classic",
    "fontFamily": "anime",
    "fontSize": 13,
    "scaleWithPet": false,
    "fontWeight": "normal",
    "fontStyle": "normal",
    "customFonts": [],
    "customAssets": []
  },
  "llm": {
    "enabled": false,
    "endpoint": "",
    "model": "",
    "intervalMinutes": 30,
    "timeoutMs": 8000
  },
  "stateMapping": {
    "entries": [
      {
        "event": "idle",
        "label": "摇头WINK",
        "animation": "animations/idle-2.webm",
        "animations": [
          "animations/idle-2.webm",
          "animations/idle-3.webm",
          "animations/idle.webm"
        ],
        "bubble": "",
        "durationSec": 0,
        "holdSec": 0,
        "enabled": true
      },
      {
        "event": "task-start",
        "label": "摊开符阵",
        "animation": "animations/state-working-2.webm",
        "animations": [
          "animations/state-working-2.webm",
          "animations/state-working.webm",
          "animations/state-working-3.webm"
        ],
        "bubble": "正在处理…",
        "durationSec": 0,
        "holdSec": 0,
        "enabled": true
      },
      {
        "event": "task-done",
        "label": "收符纸拍整齐",
        "animation": "animations/state-done-2.webm",
        "animations": [
          "animations/state-done-2.webm",
          "animations/state-done-3.webm",
          "animations/state-done.webm"
        ],
        "bubble": "搞定啦",
        "durationSec": 0,
        "holdSec": 0,
        "enabled": true
      },
      {
        "event": "approval-needed",
        "label": "等待确认",
        "animation": "animations/state-approval.webm",
        "animations": [
          "animations/state-approval.webm",
          "animations/idle.webm"
        ],
        "bubble": "这里需要你确认一下",
        "durationSec": 0,
        "holdSec": 0,
        "enabled": true
      },
      {
        "event": "task-timeout",
        "label": "看沙漏",
        "animation": "animations/state-alert-time-2.webm",
        "animations": [
          "animations/state-alert-time-2.webm",
          "animations/state-alert-time.webm"
        ],
        "bubble": "这一步有点久了…",
        "durationSec": 0,
        "holdSec": 0,
        "enabled": true
      },
      {
        "event": "balance-warning",
        "label": "真的没了",
        "animation": "animations/state-alert-cost-2.webm",
        "animations": [
          "animations/state-alert-cost-2.webm",
          "animations/state-alert-cost.webm"
        ],
        "bubble": "余额/消耗提醒",
        "durationSec": 8,
        "holdSec": 0,
        "enabled": true
      }
    ],
    "byCharacter": {
      "xiaofu": {
        "entries": [
          {
            "event": "idle",
            "label": "摇头WINK",
            "animation": "animations/idle-2.webm",
            "animations": [
              "animations/idle-2.webm",
              "animations/idle-3.webm",
              "animations/idle.webm"
            ],
            "bubble": "",
            "durationSec": 0,
            "holdSec": 0,
            "enabled": true
          },
          {
            "event": "task-start",
            "label": "摊开符阵",
            "animation": "animations/state-working-2.webm",
            "animations": [
              "animations/state-working-2.webm",
              "animations/state-working.webm",
              "animations/state-working-3.webm"
            ],
            "bubble": "正在处理…",
            "durationSec": 0,
            "holdSec": 0,
            "enabled": true
          },
          {
            "event": "task-done",
            "label": "收符纸拍整齐",
            "animation": "animations/state-done-2.webm",
            "animations": [
              "animations/state-done-2.webm",
              "animations/state-done-3.webm",
              "animations/state-done.webm"
            ],
            "bubble": "搞定啦",
            "durationSec": 0,
            "holdSec": 0,
            "enabled": true
          },
          {
            "event": "approval-needed",
            "label": "等待确认",
            "animation": "animations/state-approval.webm",
            "animations": [
              "animations/state-approval.webm",
              "animations/idle.webm"
            ],
            "bubble": "这里需要你确认一下",
            "durationSec": 0,
            "holdSec": 0,
            "enabled": true
          },
          {
            "event": "task-timeout",
            "label": "看沙漏",
            "animation": "animations/state-alert-time-2.webm",
            "animations": [
              "animations/state-alert-time-2.webm",
              "animations/state-alert-time.webm"
            ],
            "bubble": "这一步有点久了…",
            "durationSec": 0,
            "holdSec": 0,
            "enabled": true
          },
          {
            "event": "balance-warning",
            "label": "真的没了",
            "animation": "animations/state-alert-cost-2.webm",
            "animations": [
              "animations/state-alert-cost-2.webm",
              "animations/state-alert-cost.webm"
            ],
            "bubble": "余额/消耗提醒",
            "durationSec": 8,
            "holdSec": 0,
            "enabled": true
          }
        ]
      }
    }
  },
  "balanceWarning": {
    "tokenThreshold": 20000,
    "thresholds": [
      {
        "currency": "CNY",
        "amount": 10
      },
      {
        "currency": "USD",
        "amount": 1
      }
    ]
  },
  "actionNames": {
    "xiaofu/animations/idle-2.webm": "摇头WINK",
    "xiaofu/animations/state-working-2.webm": "摊开符阵",
    "xiaofu/animations/state-working-3.webm": "卷袖翻册",
    "xiaofu/animations/state-done-2.webm": "收符纸拍整齐",
    "xiaofu/animations/state-done-3.webm": "完工喝茶",
    "xiaofu/animations/state-alert-time-2.webm": "看沙漏",
    "xiaofu/animations/state-alert-cost-2.webm": "真的没了",
    "xiaofu/animations/idle-3.webm": "打盹"
  },
  "generate": {
    "history": 30,
    "zipMb": 300,
    "ttlHours": 12,
    "cleanupMinutes": 0,
    "autoCleanup": false
  }
} as const;
