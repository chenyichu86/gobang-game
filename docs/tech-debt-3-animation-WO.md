# 技术债偿还 #3: 动画和特效实现

**优先级**: 🟡 中优先级
**状态**: ⏸️ 待启动
**创建日期**: 2026-03-25
**来源**: Week 9遗漏

---

## 📋 工作对象（Work Object）定义

### 背景说明

**问题描述**:
Week 9原计划实现完整的动画和特效系统，但实际只完成了数据持久化和UI组件，动画和特效完全未实现。

**业务价值**:
- ✅ 提升游戏体验流畅度
- ✅ 增强视觉反馈
- ✅ 提升游戏品质感
- ✅ 增加用户沉浸感

### 工作目标

**主要目标**:
1. 棋子落下动画（GSAP + Konva）
2. 胜利连线特效（棋子依次发光）
3. 烟花粒子效果（胜利庆祝）

**次要目标**:
4. 页面切换动画（淡入淡出）
5. 按钮Hover效果

### 成功标准

**门禁标准**:
- [ ] 棋子落下动画流畅（60fps）
- [ ] 胜利连线特效正确显示
- [ ] 烟花粒子效果正常触发
- [ ] 动画性能达标（<16ms/帧）
- [ ] 无内存泄漏
- [ ] Week 1-10测试继续通过

**验收标准**:
- ✅ 棋子从空中落下到棋盘
- ✅ 落下动画有弹跳效果
- ✅ 胜利时五子依次发光
- ✅ 胜利时烟花粒子绽放
- ✅ 页面切换有过渡动画
- ✅ 按钮Hover有视觉反馈

---

## 🎨 动画设计

### 1. 棋子落下动画

**效果描述**:
- 棋子从棋盘上方200px处落下
- 落下时有重力加速效果
- 落地时有轻微弹跳（弹跳高度20px）
- 弹跳后稳定在棋盘上
- 整个动画持续300ms

**技术实现**:
```typescript
import { gsap } from 'gsap';

// 棋子落下动画
function animatePieceDrop(piece: Konva.Circle) {
  // 初始状态：棋子在棋盘上方
  piece.y(piece.y() - 200);
  piece.opacity(0);

  // 落下动画
  gsap.to(piece, {
    y: piece.y() + 200,
    opacity: 1,
    duration: 0.3,
    ease: 'bounce.out', // 弹跳缓动
    onComplete: () => {
      // 动画完成，触发落子音效
      playSound('drop');
    },
  });
}
```

**性能要求**:
- 动画帧率: 60fps
- 动画延迟: <50ms
- CPU占用: <10%

---

### 2. 胜利连线特效

**效果描述**:
- 胜利时，五连的棋子依次发光
- 从第一颗棋子开始，依次高亮
- 每颗棋子高亮持续200ms
- 高亮效果：外发光 + 缩放
- 连线完成后，整体闪烁3次

**技术实现**:
```typescript
// 胜利连线动画
async function animateWinLine(winPositions: Position[]) {
  const pieces = getPiecesAtPositions(winPositions);

  // 依次高亮棋子
  for (const piece of pieces) {
    gsap.to(piece, {
      scaleX: 1.2,
      scaleY: 1.2,
      shadowBlur: 20,
      shadowColor: '#FFD700',
      duration: 0.2,
      yoyo: true,
      repeat: 1,
    });

    await delay(150); // 每颗棋子间隔150ms
  }

  // 整体闪烁3次
  gsap.to(pieces, {
    shadowBlur: 30,
    shadowColor: '#FFD700',
    duration: 0.3,
    yoyo: true,
    repeat: 5, // 闪烁3次（6个半周期）
    onComplete: () => {
      // 触发烟花粒子效果
      spawnFireworks();
    },
  });
}
```

**性能要求**:
- 动画流畅: 60fps
- 总持续时间: <3秒
- 视觉吸引力: 高

---

### 3. 烟花粒子效果

**效果描述**:
- 胜利时，棋盘中心绽放烟花
- 烟花由多个粒子组成
- 粒子有重力效果
- 粒子有颜色渐变
- 粒子落地后消失
- 整个效果持续2秒

**技术实现**:
```typescript
// 烟花粒子系统
class FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    // 随机速度（向上发散）
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 10 + 5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 10; // 向上初速度
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    this.life = 0;
    this.maxLife = 120; // 2秒（60fps）
  }

  update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // 重力
    this.life++;
    return this.life < this.maxLife;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = 1 - this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// 烟花发射器
function spawnFireworks() {
  const particles: FireworkParticle[] = [];
  const board = getBoardElement();

  // 发射3轮烟花
  for (let round = 0; round < 3; round++) {
    setTimeout(() => {
      // 每轮50个粒子
      for (let i = 0; i < 50; i++) {
        const centerX = board.width / 2;
        const centerY = board.height / 2;
        particles.push(new FireworkParticle(centerX, centerY));
      }
    }, round * 500);
  }

  // 动画循环
  function animate() {
    const ctx = board.getContext('2d');
    ctx.clearRect(0, 0, board.width, board.height);

    // 更新和绘制粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const alive = particles[i].update();
      if (alive) {
        particles[i].draw(ctx);
      } else {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}
```

**性能要求**:
- 粒子数量: <200个
- 动画帧率: 60fps
- 持续时间: 2秒

---

### 4. 页面切换动画

**效果描述**:
- 页面切换时淡入淡出
- 淡出当前页（200ms）
- 淡入新页（200ms）
- 总切换时间400ms

**技术实现**:
```typescript
// React过渡动画
import { transitions, positions } from 'react-alert';
import 'react-alert-template-basic/src/styles.css';

const customAlertTemplate = ({ options, message, close }) => (
  <div
    style={{
      transition: 'all 300ms ease-in-out',
      opacity: 1,
      transform: 'translateY(0)',
    }}
  >
    {message}
  </div>
);

// 页面切换动画
const pageTransition = {
  enter: (node: HTMLElement) => {
    const style = {
      transition: 'opacity 200ms ease-in-out',
      opacity: 0,
    };
    node.style.opacity = '0';
    setTimeout(() => {
      node.style.opacity = '1';
    }, 0);
    return style;
  },
  exit: (node: HTMLElement) => {
    const style = {
      transition: 'opacity 200ms ease-in-out',
      opacity: 1,
    };
    node.style.opacity = '1';
    setTimeout(() => {
      node.style.opacity = '0';
    }, 0);
    return style;
  },
};
```

---

### 5. 按钮Hover效果

**效果描述**:
- 鼠标悬停时按钮放大
- 缩放比例: 1.05
- 过渡时间: 200ms
- 阴影增强

**技术实现**:
```css
/* Tailwind CSS */
.button-hover {
  transition: all 0.2s ease-in-out;
}

.button-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.button-hover:active {
  transform: scale(0.98);
}
```

---

## 🧪 测试用例设计

### TC-ANIM-01: 棋子落下动画

**测试步骤**:
1. 启动PvP游戏
2. 黑棋落子(7,7)
3. 观察棋子落下动画

**预期结果**:
- 棋子从上方落下
- 落地时有弹跳
- 动画流畅（60fps）
- 动画完成后可继续落子

**优先级**: P0

---

### TC-ANIM-02: 胜利连线特效

**测试步骤**:
1. 启动PvP游戏
2. 黑棋形成五连
3. 观察胜利连线动画

**预期结果**:
- 五颗棋子依次高亮
- 高亮有外发光效果
- 连线完成后闪烁3次

**优先级**: P0

---

### TC-ANIM-03: 烟花粒子效果

**测试步骤**:
1. 启动PvP游戏
2. 黑棋获胜
3. 观察烟花效果

**预期结果**:
- 棋盘中心绽放烟花
- 粒子有重力效果
- 粒子有颜色渐变
- 2秒后粒子消失

**优先级**: P1

---

### TC-ANIM-04: 页面切换动画

**测试步骤**:
1. 在主菜单点击"开始游戏"
2. 观察页面切换动画

**预期结果**:
- 主菜单淡出
- 游戏页淡入
- 切换流畅

**优先级**: P2

---

### TC-ANIM-05: 按钮Hover效果

**测试步骤**:
1. 鼠标悬停在按钮上
2. 观察按钮变化

**预期结果**:
- 按钮放大1.05倍
- 阴影增强
- 过渡流畅

**优先级**: P2

---

### TC-ANIM-06: 动画性能

**测试步骤**:
1. 快速连续落子（50次）
2. 监控动画性能

**预期结果**:
- 每次动画流畅
- 无掉帧
- CPU占用<30%

**优先级**: P0

---

### TC-ANIM-07: 动画中断

**测试步骤**:
1. 黑棋落子（动画进行中）
2. 立即点击"悔棋"
3. 观察动画处理

**预期结果**:
- 动画被中断
- 棋盘状态正确恢复
- 无错误

**优先级**: P1

---

## 📝 技术栈

- **动画库**: GSAP (GreenSock Animation Platform)
- **粒子系统**: 自定义Canvas实现
- **CSS动画**: Tailwind CSS + 自定义CSS
- **Konva动画**: Konva.js内置动画

## ✅ 验收清单

### 功能验收
- [ ] 棋子落下动画流畅
- [ ] 胜利连线特效正确
- [ ] 烟花粒子效果正常
- [ ] 页面切换动画流畅
- [ ] 按钮Hover效果正常

### 性能验收
- [ ] 动画帧率60fps
- [ ] CPU占用<30%
- [ ] 无内存泄漏
- [ ] 快速连续操作无卡顿

### 集成验收
- [ ] Week 1-10测试继续通过
- [ ] 无回归问题
- [ ] 与音效系统配合良好

---

## 📊 工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| GSAP集成 | 1小时 | P0 |
| 棋子落下动画 | 4小时 | P0 |
| 胜利连线特效 | 4小时 | P0 |
| 烟花粒子系统 | 6小时 | P1 |
| 页面切换动画 | 2小时 | P2 |
| 按钮Hover效果 | 1小时 | P2 |
| 性能优化 | 2小时 | P0 |
| 测试编写 | 3小时 | P0 |
| 集成测试 | 2小时 | P0 |
| **总计** | **25小时** (~3-4天) | - |

---

## 📅 执行计划

### Day 1: 核心动画
- [ ] GSAP集成
- [ ] 棋子落下动画
- [ ] 胜利连线特效

### Day 2: 粒子效果
- [ ] 烟花粒子系统
- [ ] 粒子性能优化
- [ ] 与胜利连线集成

### Day 3: UI动画
- [ ] 页面切换动画
- [ ] 按钮Hover效果
- [ ] 动画性能测试

### Day 4: 测试和优化
- [ ] 编写测试用例
- [ ] 性能优化
- [ ] 集成测试

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: PM Agent
**状态**: ⏸️ 待启动
**下一步**: 完成高优先级任务后启动
