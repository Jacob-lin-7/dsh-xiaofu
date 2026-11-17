export declare const DEFAULT_CONFIG_DATA: {
    readonly schemaVersion: 1;
    readonly pets: readonly [{
        readonly id: "main";
        readonly name: "小符";
        readonly pack: "xiaofu";
        readonly size: 410;
        readonly display: "both";
        readonly clickAction: "animation";
        readonly clickAnimation: "animations/click.webm";
        readonly clickAnimations: readonly ["animations/click.webm", "animations/state-done-3.webm"];
        readonly doubleClickAction: "open-dsh";
        readonly doubleClickAnimations: readonly [];
        readonly trayIconPack: "xiaofu";
        readonly position: {
            readonly corner: "top-right";
            readonly marginX: 24;
            readonly marginY: 100;
        };
    }];
    readonly features: {
        readonly registryVersion: 1;
        readonly global: {
            readonly "menu.display": true;
            readonly "motion.roam": false;
            readonly "core.pet": true;
            readonly "menu.snooze": true;
        };
        readonly pets: {};
        readonly menu: {
            readonly mode: "hide";
            readonly order: readonly [];
        };
    };
    readonly packs: {
        readonly xiaofu: {
            readonly version: "1.5.5";
            readonly enabled: true;
            readonly displayName: "小符";
        };
    };
    readonly sound: {
        readonly volume: 0.2;
    };
    readonly appearance: {
        readonly fontFamily: "system";
        readonly fontSize: 12;
        readonly scaleWithPet: true;
    };
    readonly bubble: {
        readonly enabled: true;
        readonly durationMs: 8000;
        readonly quotes: readonly ["戳我干嘛～", "今天也要加油！", "要不要休息一下？"];
        readonly stateQuotes: {
            readonly click: readonly ["唔，戳我做什么？", "在的，说吧。", "符纸差点掉了……"];
            readonly idle: readonly ["今天也没什么事", "打个盹，不算偷懒", "香火气有点淡"];
            readonly "task-start": readonly ["收到，开始", "先理一下符纸", "这事交给我"];
            readonly "task-done": readonly ["成了", "收工，别催", "比预计快一点"];
            readonly "approval-needed": readonly ["这一步要你点头", "确认一下，我再往下走", "批个准，很快的"];
            readonly "task-timeout": readonly ["这一步拖得有点久", "不是我慢，是它卡住了", "再等等，我去看看"];
            readonly "balance-warning": readonly ["余额见底了", "这次的消耗有点扎眼", "省着点，我还要买符纸"];
        };
        readonly stateTiming: {
            readonly click: {
                readonly durationMs: 8000;
                readonly gapMs: 2000;
            };
            readonly idle: {
                readonly durationMs: 8000;
                readonly gapMs: 2000;
            };
            readonly "task-start": {
                readonly durationMs: 8000;
                readonly gapMs: 2000;
            };
            readonly "task-done": {
                readonly durationMs: 8000;
                readonly gapMs: 2000;
            };
            readonly "approval-needed": {
                readonly durationMs: 8000;
                readonly gapMs: 2000;
            };
            readonly "task-timeout": {
                readonly durationMs: 8000;
                readonly gapMs: 2000;
            };
            readonly "balance-warning": {
                readonly durationMs: 8000;
                readonly gapMs: 2000;
            };
        };
        readonly style: "classic";
        readonly fontFamily: "anime";
        readonly fontSize: 13;
        readonly scaleWithPet: false;
        readonly fontWeight: "normal";
        readonly fontStyle: "normal";
        readonly customFonts: readonly [];
        readonly customAssets: readonly [];
    };
    readonly llm: {
        readonly enabled: false;
        readonly endpoint: "";
        readonly model: "";
        readonly intervalMinutes: 30;
        readonly timeoutMs: 8000;
    };
    readonly stateMapping: {
        readonly entries: readonly [{
            readonly event: "idle";
            readonly label: "摇头WINK";
            readonly animation: "animations/idle-2.webm";
            readonly animations: readonly ["animations/idle-2.webm", "animations/idle-3.webm", "animations/idle.webm"];
            readonly bubble: "";
            readonly durationSec: 0;
            readonly holdSec: 0;
            readonly enabled: true;
        }, {
            readonly event: "task-start";
            readonly label: "摊开符阵";
            readonly animation: "animations/state-working-2.webm";
            readonly animations: readonly ["animations/state-working-2.webm", "animations/state-working.webm", "animations/state-working-3.webm"];
            readonly bubble: "正在处理…";
            readonly durationSec: 0;
            readonly holdSec: 0;
            readonly enabled: true;
        }, {
            readonly event: "task-done";
            readonly label: "收符纸拍整齐";
            readonly animation: "animations/state-done-2.webm";
            readonly animations: readonly ["animations/state-done-2.webm", "animations/state-done-3.webm", "animations/state-done.webm"];
            readonly bubble: "搞定啦";
            readonly durationSec: 0;
            readonly holdSec: 0;
            readonly enabled: true;
        }, {
            readonly event: "approval-needed";
            readonly label: "等待确认";
            readonly animation: "animations/state-approval.webm";
            readonly animations: readonly ["animations/state-approval.webm", "animations/idle.webm"];
            readonly bubble: "这里需要你确认一下";
            readonly durationSec: 0;
            readonly holdSec: 0;
            readonly enabled: true;
        }, {
            readonly event: "task-timeout";
            readonly label: "看沙漏";
            readonly animation: "animations/state-alert-time-2.webm";
            readonly animations: readonly ["animations/state-alert-time-2.webm", "animations/state-alert-time.webm"];
            readonly bubble: "这一步有点久了…";
            readonly durationSec: 0;
            readonly holdSec: 0;
            readonly enabled: true;
        }, {
            readonly event: "balance-warning";
            readonly label: "真的没了";
            readonly animation: "animations/state-alert-cost-2.webm";
            readonly animations: readonly ["animations/state-alert-cost-2.webm", "animations/state-alert-cost.webm"];
            readonly bubble: "余额/消耗提醒";
            readonly durationSec: 8;
            readonly holdSec: 0;
            readonly enabled: true;
        }];
        readonly byCharacter: {
            readonly xiaofu: {
                readonly entries: readonly [{
                    readonly event: "idle";
                    readonly label: "摇头WINK";
                    readonly animation: "animations/idle-2.webm";
                    readonly animations: readonly ["animations/idle-2.webm", "animations/idle-3.webm", "animations/idle.webm"];
                    readonly bubble: "";
                    readonly durationSec: 0;
                    readonly holdSec: 0;
                    readonly enabled: true;
                }, {
                    readonly event: "task-start";
                    readonly label: "摊开符阵";
                    readonly animation: "animations/state-working-2.webm";
                    readonly animations: readonly ["animations/state-working-2.webm", "animations/state-working.webm", "animations/state-working-3.webm"];
                    readonly bubble: "正在处理…";
                    readonly durationSec: 0;
                    readonly holdSec: 0;
                    readonly enabled: true;
                }, {
                    readonly event: "task-done";
                    readonly label: "收符纸拍整齐";
                    readonly animation: "animations/state-done-2.webm";
                    readonly animations: readonly ["animations/state-done-2.webm", "animations/state-done-3.webm", "animations/state-done.webm"];
                    readonly bubble: "搞定啦";
                    readonly durationSec: 0;
                    readonly holdSec: 0;
                    readonly enabled: true;
                }, {
                    readonly event: "approval-needed";
                    readonly label: "等待确认";
                    readonly animation: "animations/state-approval.webm";
                    readonly animations: readonly ["animations/state-approval.webm", "animations/idle.webm"];
                    readonly bubble: "这里需要你确认一下";
                    readonly durationSec: 0;
                    readonly holdSec: 0;
                    readonly enabled: true;
                }, {
                    readonly event: "task-timeout";
                    readonly label: "看沙漏";
                    readonly animation: "animations/state-alert-time-2.webm";
                    readonly animations: readonly ["animations/state-alert-time-2.webm", "animations/state-alert-time.webm"];
                    readonly bubble: "这一步有点久了…";
                    readonly durationSec: 0;
                    readonly holdSec: 0;
                    readonly enabled: true;
                }, {
                    readonly event: "balance-warning";
                    readonly label: "真的没了";
                    readonly animation: "animations/state-alert-cost-2.webm";
                    readonly animations: readonly ["animations/state-alert-cost-2.webm", "animations/state-alert-cost.webm"];
                    readonly bubble: "余额/消耗提醒";
                    readonly durationSec: 8;
                    readonly holdSec: 0;
                    readonly enabled: true;
                }];
            };
        };
    };
    readonly balanceWarning: {
        readonly tokenThreshold: 20000;
        readonly thresholds: readonly [{
            readonly currency: "CNY";
            readonly amount: 10;
        }, {
            readonly currency: "USD";
            readonly amount: 1;
        }];
    };
    readonly actionNames: {
        readonly "xiaofu/animations/idle-2.webm": "摇头WINK";
        readonly "xiaofu/animations/state-working-2.webm": "摊开符阵";
        readonly "xiaofu/animations/state-working-3.webm": "卷袖翻册";
        readonly "xiaofu/animations/state-done-2.webm": "收符纸拍整齐";
        readonly "xiaofu/animations/state-done-3.webm": "完工喝茶";
        readonly "xiaofu/animations/state-alert-time-2.webm": "看沙漏";
        readonly "xiaofu/animations/state-alert-cost-2.webm": "真的没了";
        readonly "xiaofu/animations/idle-3.webm": "打盹";
    };
    readonly generate: {
        readonly history: 30;
        readonly zipMb: 300;
        readonly ttlHours: 12;
        readonly cleanupMinutes: 0;
        readonly autoCleanup: false;
    };
};
