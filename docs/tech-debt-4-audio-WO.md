# 技术债偿还 #4: 音效集成

**优先级**: 🟡 中优先级
**状态**: ⏸️ 待启动
**创建日期**: 2026-03-25
**来源**: Week 9遗漏

---

## 📋 工作对象（Work Object）定义

### 背景说明

**问题描述**:
Week 9原计划实现音效系统，但完全未实现。音效是游戏体验的重要组成部分。

**业务价值**:
- ✅ 增强游戏氛围
- ✅ 提供操作反馈
- ✅ 提升沉浸感

### 工作目标

**主要目标**:
1. 落子音效
2. 胜利音效
3. 按钮点击音效

**次要目标**:
4. 背景音乐（可选）

### 成功标准

**门禁标准**:
- [ ] 音效正确播放
- [ ] 音效可开关
- [ ] 音量可调节
- [ ] 音效文件优化（<50KB/个）
- [ ] 无性能影响

**验收标准**:
- ✅ 落子时有清脆音效
- ✅ 胜利时有欢快音效
- ✅ 按钮点击有反馈音效
- ✅ 音效开关正常

---

## 🎵 音效设计

### 音效列表

| 音效名称 | 文件名 | 时长 | 格式 | 大小 | 触发时机 |
|---------|--------|------|------|------|----------|
| 落子音效 | drop.mp3 | 0.3s | MP3 | <30KB | 每次落子 |
| 胜利音效 | win.mp3 | 2s | MP3 | <50KB | 游戏胜利 |
| 失败音效 | lose.mp3 | 1s | MP3 | <30KB | 游戏失败 |
| 按钮音效 | click.mp3 | 0.1s | MP3 | <10KB | 按钮点击 |
| 悔棋音效 | undo.mp3 | 0.2s | MP3 | <15KB | 悔棋操作 |
| 提示音效 | hint.mp3 | 0.3s | MP3 | <20KB | 使用提示 |

### 音效技术实现

```typescript
// src/services/audio-service.ts
export class AudioService {
  private sounds: Map<string, HTMLAudioElement>;
  private enabled: boolean;
  private volume: number;

  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.volume = 0.5;

    // 预加载音效
    this.loadSound('drop', '/sounds/drop.mp3');
    this.loadSound('win', '/sounds/win.mp3');
    this.loadSound('lose', '/sounds/lose.mp3');
    this.loadSound('click', '/sounds/click.mp3');
    this.loadSound('undo', '/sounds/undo.mp3');
    this.loadSound('hint', '/sounds/hint.mp3');
  }

  private loadSound(name: string, path: string) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    this.sounds.set(name, audio);
  }

  play(name: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(name);
    if (sound) {
      sound.currentTime = 0;
      sound.volume = this.volume;
      sound.play().catch(console.error);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
```

### 音效集成

```typescript
// src/store/game-store.ts
import { AudioService } from '../services/audio-service';

const audioService = new AudioService();

export const useGameStore = create<GameState>((set, get) => ({
  // ... 其他状态

  makeMove: async (position) => {
    const engine = get().engine;
    if (!engine) {
      return { success: false, error: 'Game not initialized' };
    }

    const result = engine.makeMove(position);

    if (result.success) {
      // 播放落子音效
      audioService.play('drop');

      // ... 其他逻辑
    }

    return result;
  },

  undo: () => {
    // ... 悔棋逻辑

    // 播放悔棋音效
    audioService.play('undo');
  },

  getHint: async () => {
    // ... 提示逻辑

    // 播放提示音效
    audioService.play('hint');
  },
}));

// 胜利音效
function handleGameWin() {
  audioService.play('win');
}

// 失败音效
function handleGameLose() {
  audioService.play('lose');
}
```

### UI音效开关

```typescript
// src/components/Settings/AudioSettings.tsx
export const AudioSettings: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  return (
    <div className="audio-settings">
      <label>
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => {
            setSoundEnabled(e.target.checked);
            audioService.setEnabled(e.target.checked);
          }}
        />
        音效开关
      </label>

      <label>
        音量
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => {
            const vol = parseFloat(e.target.value);
            setVolume(vol);
            audioService.setVolume(vol);
          }}
        />
        {Math.round(volume * 100)}%
      </label>

      <button onClick={() => audioService.play('click')}>
        测试音效
      </button>
    </div>
  );
};
```

---

## 🧪 测试用例设计

### TC-AUDIO-01: 落子音效

**测试步骤**:
1. 启用音效
2. 落子
3. 听到落子音效

**预期结果**:
- 播放落子音效
- 音效清晰
- 音量适中

**优先级**: P0

---

### TC-AUDIO-02: 胜利音效

**测试步骤**:
1. 启用音效
2. 获得胜利
3. 听到胜利音效

**预期结果**:
- 播放胜利音效
- 音效欢快

**优先级**: P0

---

### TC-AUDIO-03: 音效开关

**测试步骤**:
1. 关闭音效
2. 落子
3. 验证无音效

**预期结果**:
- 无音效播放

**优先级**: P0

---

### TC-AUDIO-04: 音量调节

**测试步骤**:
1. 调节音量到50%
2. 落子
3. 验证音量正确

**预期结果**:
- 音量为50%

**优先级**: P1

---

### TC-AUDIO-05: 音效性能

**测试步骤**:
1. 快速落子100次
2. 监控性能

**预期结果**:
- 无卡顿
- CPU占用<5%

**优先级**: P0

---

## 📝 音效资源

### 音效文件获取

**方案1: 免费音效网站**
- [Freesound.org](https://freesound.org/)
- [Zapsplat.com](https://www.zapsplat.com/)
- [Mixkit.co](https://mixkit.co/free-sound-effects/)

**方案2: AI生成**
- [ElevenLabs](https://elevenlabs.io/)
- [Stable Audio](https://www.stableaudio.com/)

**方案3: 自制**
- 使用Audacity录制和编辑
- 使用合成器生成

### 音效优化

- **格式**: MP3（压缩率高）
- **采样率**: 44.1kHz
- **比特率**: 128kbps
- **声道**: 单声道（减少文件大小）
- **目标大小**: <50KB/个

---

## ✅ 验收清单

### 功能验收
- [ ] 落子音效正常播放
- [ ] 胜利音效正常播放
- [ ] 按钮音效正常播放
- [ ] 音效开关正常
- [ ] 音量调节正常

### 性能验收
- [ ] 音效文件<50KB/个
- [ ] 音效播放无延迟
- [ ] 音效不影响游戏性能
- [ ] 快速操作无卡顿

### 用户体验验收
- [ ] 音效清晰不刺耳
- [ ] 音量适中
- [ ] 音效风格统一

---

## 📊 工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 音效资源获取 | 2小时 | P0 |
| AudioService实现 | 2小时 | P0 |
| 音效集成 | 2小时 | P0 |
| UI音效开关 | 1小时 | P0 |
| 音效优化 | 1小时 | P1 |
| 测试编写 | 2小时 | P0 |
| **总计** | **10小时** (~1.5天) | - |

---

## 📅 执行计划

### Day 1: 音效获取和实现
- [ ] 获取/制作音效文件
- [ ] 实现AudioService
- [ ] 集成到游戏流程

### Day 2: UI和测试
- [ ] 实现音效开关UI
- [ ] 编写测试用例
- [ ] 性能优化

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: PM Agent
**状态**: ⏸️ 待启动
**下一步**: 完成动画特效后启动
