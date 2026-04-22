# Astro + Barba.js + GSAP 页面转场设计参考

来源文章：[`Creating Custom Page Transitions in Astro with Barba.js and GSAP`](https://tympanus.net/codrops/2026/04/08/creating-custom-page-transitions-in-astro-with-barba-js-and-gsap/)

## 1. 这篇文章真正有价值的部分

这篇文章最值得复用的，不是某一个具体动画，而是一套“页面转场系统”的设计思路：

1. 用 Astro 保持页面结构和组件组织。
2. 用 Barba.js 接管页面切换，只替换内容容器而不是整页刷新。
3. 用 GSAP 统一管理转场时序、状态切换和清理逻辑。
4. 把具体视觉效果做成可插拔的 transition pattern，根据目标页面命名空间选择不同方案。

核心目标不是“做一个炫技动画”，而是建立一个可扩展、可维护、可针对不同页面定制的导航体验层。

## 2. 设计抽象

### 2.1 分层思路

可以把整套方案拆成四层：

- 结构层：Astro layout 提供稳定的 `wrapper` 和 `container`
- 路由拦截层：Barba.js 负责接管跳转与生命周期
- 动画编排层：GSAP timeline 负责进入、离开、同步、清理
- 效果层：clip-path、SVG、WebGL、伪元素遮罩、文字拆分等具体表现

这个分层很重要，因为它让“页面切换逻辑”和“页面内容本身”解耦。

### 2.2 最小骨架

最小结构是：

```html
<body data-barba="wrapper">
  <div data-barba="container" data-barba-namespace="home">
    <main class="content__wrapper">
      <!-- page content -->
    </main>
  </div>
</body>
```

这里的设计要点：

- `wrapper` 是全局转场宿主
- `container` 是每次跳转时被替换的内容区域
- `namespace` 是路由级别的转场分发键

这意味着页面转场不是“挂在页面组件里”，而是“挂在全局导航系统上”。

## 3. 可复用的系统原则

### 3.1 统一入口

文章把逻辑收敛到一个 `App` 类里，这种做法很对。原因是页面转场通常需要集中管理：

- Barba 初始化
- GSAP 插件注册
- 全局辅助模块初始化
- 统一的 resize / render / cleanup
- 各类 transition 的注册与选择

建议把页面转场看成一个独立子系统，例如：

```ts
class PageTransitionSystem {
  initBarba() {}
  initMotionText() {}
  initWebGL() {}
  registerTransitions() {}
  cleanup() {}
}
```

不要把转场细节散落到各页面组件里，否则后续扩展会很快失控。

### 3.2 先定义“状态协议”，再做动画

文章里的所有转场虽然视觉不同，但共用同一套状态协议：

- 开始前：加 `is__transitioning`
- 进入前：设置 `next.container` 初始状态
- 离开时：执行遮罩/缩放/形变/绘制等主动画
- 进入时：初始化新页面上的文字或局部动画
- 完成后：移除 class、隐藏覆盖层、`clearProps`

这说明真正稳定的部分不是动画，而是状态切换流程。

建议固定一套转场约定：

```text
before:
  锁交互
  设置初始样式
  准备 overlay / canvas / svg

leave / enter:
  执行主时间线
  必要时同步 current / next
  切换页面内微动画实例

after:
  清理 DOM 状态
  clearProps
  释放实例或重置 uniforms
  恢复交互
```

### 3.3 用“容器动画 + 覆盖层动画”组合，而不是只动画一个元素

文章反复使用一个关键思路：同时操作多个层级。

常见组合有：

- 当前页容器缩小、变淡、轻微位移
- 下一页容器从裁切区域中显现
- 额外 overlay 在最上层负责遮挡和情绪表达
- 页面内部文字在适当时机重新初始化

这比“单元素 fade in / fade out”更高级，因为它让用户感受到页面之间存在连续关系。

### 3.4 动画完成不等于系统完成，必须显式清理

文章每个示例都强调：

- `clearProps: "all"`
- 重置 SVG path
- 重置 shader uniform
- 隐藏 WebGL canvas / overlay
- `SplitText.revert()`
- 移除临时 class

这是工程上最关键的一点。页面转场如果不清理，会出现：

- 下一次转场初始状态错误
- layout 抖动
- pointer-events 被错误保留
- 文字拆分后的 DOM 污染
- WebGL 图层残留

因此转场系统一定要把“复位”视为一等公民。

## 4. 六类转场模式总结

下面不是对原文逐段复述，而是把它抽象成六种可复用模式。

### 4.1 模式 A：双容器同步 reveal

表现：

- 当前页缩小、变淡、轻微上移
- 下一页从底部裁切中显现并恢复到正常比例

实现抓手：

- Barba `sync: true`
- `data.current.container` 与 `data.next.container` 同时存在
- `clip-path + scale + opacity + yPercent`

适用场景：

- 品牌站首页
- 作品集页面之间切换
- 需要“镜头推进/抽离”感的过渡

复用价值：

- 成本低
- 性能相对稳
- 几乎可以作为默认转场

### 4.2 模式 B：WebGL 噪声遮罩

表现：

- 用 shader 生成随机噪声溶解/覆盖效果
- 视觉更有材质感和“有机感”

实现抓手：

- 独立 WebGL scene / camera / renderer / mesh
- `ShaderMaterial`
- 用 `uProgress` 驱动遮罩展开与收回

适用场景：

- 实验性作品站
- 品牌调性强、需要非线性转场的项目
- 想用统一 shader 颜色匹配页面主题色的页面

设计要点：

- WebGL 层应该长期存在，但默认隐藏
- 转场只改 uniform，不频繁重建 renderer
- resize 和 pixel ratio 必须独立管理

### 4.3 模式 C：SVG path morph 遮罩

表现：

- 遮罩边界不是直线，而是可弯曲的有机轮廓
- 先鼓起、再铺满、再反向收回

实现抓手：

- 单个全屏 SVG
- path 的 `d` 属性 morph
- GSAP MorphSVGPlugin

适用场景：

- 时尚、艺术、影像类站点
- 希望转场本身带有“呼吸感/波浪感”的页面

设计要点：

- 保留 `data-original-path` 方便复位
- 从不同触发方向进入时，可以切换不同初始 path

### 4.4 模式 D：文字主导的 overlay 转场

表现：

- 中央出现过渡文案，例如目标页名称
- overlay 先围绕文字展开，再覆盖全屏，再带着文字退场

实现抓手：

- 单独 fixed overlay
- 文本内容来自 `data.next.url.path`
- `SplitText` 做逐词动画
- `clip-path` 通过 CSS 变量驱动

适用场景：

- 栏目感很强的网站
- 页面切换时希望显式提示“即将进入哪里”
- 需要品牌语气和叙事感的项目

设计要点：

- 文案不要只是技术标签，最好是品牌化表达
- overlay 裁切范围最好围绕文字尺寸动态计算，而不是写死

### 4.5 模式 E：DrawSVG 路径绘制转场

表现：

- 一条复杂路径被逐步绘制
- 同时加粗 stroke，最终填满屏幕
- 结束时再反向擦除

实现抓手：

- 大尺寸 SVG path
- GSAP DrawSVGPlugin
- `drawSVG` 与 `stroke-width` 协同

适用场景：

- 需要“手绘感/轨迹感/卷动感”的项目
- 艺术装置、档案馆、实验叙事类视觉

设计要点：

- path 形状本身就是视觉资产，不是纯技术细节
- 要提前验证不同视口下是否能真正覆盖全屏

### 4.6 模式 F：容器伪元素 curtain

表现：

- 下一页容器本身以裁切方式展开
- 它的 `::before` 伪元素再做一层覆盖收起
- 像幕布掀开

实现抓手：

- `sync: true`
- 直接操作 `next.container`
- 利用 class + CSS variable 驱动伪元素 `clip-path`

适用场景：

- 不想额外创建 overlay DOM
- 想把转场与页面主题色紧密绑定
- 层级结构要尽量简单的项目

设计要点：

- 伪元素方案很轻，但可维护性依赖命名和 class 切换纪律
- 动画结束后一定要移除临时 class 和内联样式

## 5. 原文背后的方法论

### 5.1 转场不是单一动画，而是“进入新页面的仪式”

文章所有案例都在做一件事：把“页面跳转”从功能动作，提升为带有节奏和情绪的体验事件。

所以转场设计时应优先回答这几个问题：

1. 用户离开当前页时，旧内容是被压下去、擦除、遮住，还是主动退场？
2. 新页面是从哪里出现的？
3. 过渡层代表的是材质、空间、文字提示，还是品牌符号？
4. 页面内部内容动画应该在什么时候接管？

先回答这些，再选技术手段。

### 5.2 目标页命名空间是最重要的分发键

原文通过 `data-barba-namespace` 决定不同页面使用不同 transition。这是很合理的做法，因为页面转场常常与目标页的气质绑定，而不是与来源页绑定。

推荐的规则：

- `default-transition` 负责大多数普通页面
- 特殊页面通过 `to.namespace` 精准匹配
- 少数情况下再叠加 `from.namespace` 或 `custom(data)` 条件

不要一开始就做复杂的条件网络，否则可读性会迅速下降。

### 5.3 页面内动画实例需要和路由生命周期对齐

原文里的 `MotionText` 处理非常有代表性：

- 离开旧页前销毁
- 新页进入时重新初始化
- 新页显现后再执行 `animationIn`

这是因为页面内微动画和页面转场不属于同一层，但它们必须在时序上协作。

任何类似模块都应该套用同样原则：

- ScrollTrigger
- Lenis / locomotive scroll
- WebGL 场景内的页面对象
- 视频自动播放
- 文本 split 实例

即：旧页销毁，新页重建，避免实例污染。

## 6. 一个推荐的工程化模板

### 6.1 目录思路

```text
src/
  scripts/
    transitions/
      index.ts
      registry.ts
      patterns/
        defaultReveal.ts
        webglNoise.ts
        svgMorph.ts
        overlayTitle.ts
      systems/
        webglPageTransition.ts
        motionText.ts
      utils/
        select.ts
        hexToRgb.ts
```

### 6.2 transition 定义模板

```ts
export const defaultReveal = ({ motionText, wrapper }) => ({
  name: "default-transition",
  sync: true,
  before(data) {
    wrapper.classList.add("is__transitioning");
    // set initial state
  },
  enter(data) {
    // run timeline
    // hand off inner-page animations
  },
  after(data) {
    // cleanup
    wrapper.classList.remove("is__transitioning");
  },
});
```

关键点：

- 每个 transition 只关心自己的效果和清理
- 共享依赖通过依赖注入传入，不要在每个文件里重复查询全局对象

### 6.3 全局约束建议

- 所有转场统一返回 Promise 或 timeline 完成信号
- 所有可见遮罩层默认隐藏
- 所有临时 class 都有明确生命周期
- 所有 GSAP `set` 的内联样式都在结束时清除
- 所有插件型实例都可重入、可销毁

## 7. 实施检查清单

在自己的项目里落地时，建议逐项检查：

- 是否只有 `data-barba="container"` 区域被替换
- 是否给每个页面设置了稳定的 namespace
- 是否存在默认转场作为兜底
- 是否在转场期间禁用了重复点击
- 是否在旧页退出时销毁页面级实例
- 是否在新页进入后重建页面级实例
- 是否对 overlay / canvas / svg 做了完整复位
- 是否处理了 resize
- 是否验证了移动端视口单位表现
- 是否在低性能设备上评估了 WebGL / SVG 方案成本

## 8. 适用边界与风险

这套思路适合：

- 品牌官网
- 作品集
- 叙事型专题页
- 强视觉导向的前端项目

不一定适合：

- 信息密度极高的后台系统
- 以响应速度优先的业务应用
- 页面结构频繁局部刷新的复杂应用

主要风险：

- 动画过重导致导航延迟感
- cleanup 不完整导致状态串页
- WebGL / SVG 在移动端掉帧
- 第三方插件生命周期与 Barba 冲突

所以正确姿势不是“每页都做大转场”，而是建立默认轻转场，再只给关键页面配重型效果。

## 9. 最后提炼

如果只保留最核心的三条经验，就是：

1. 先搭一个稳定的转场系统，再往里填具体视觉效果。
2. 把转场拆成“容器层、覆盖层、页面内动画层”三个协同层级。
3. 把 cleanup、复位、实例销毁当成正式设计的一部分，而不是收尾补丁。

从复用角度看，这篇文章提供的最佳参考，不是某个 GSAP API 用法，而是如何把“页面跳转”工程化成一个可扩展的 motion architecture。
