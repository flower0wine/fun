# SVG Morph Transition React Demo

一个独立的 React + TypeScript + Vite 示例项目，用来复现 `learn/astro-barba-gsap-page-transition-patterns.md` 里总结的 `SVG morph overlay` 页面转场思路。

## 运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 实现范围

这个 demo 复刻的是参考文档中的第三类 SVG 转场模式：

- 全屏 fixed SVG 覆盖层
- 单个 path 在几段状态之间形变
- 先覆盖旧页面，再切换页面状态，再反向揭开新页面

这里没有使用 GSAP 的 MorphSVGPlugin，而是用同一组 path 命令参数做插值，因此项目可以直接运行，不依赖付费插件。

## 目录

```text
src/
  App.tsx                     页面壳、导航、转场状态机
  components/
    MorphTransition.tsx       SVG overlay 组件
  lib/
    morphPath.ts              path 生成与插值逻辑
```

## 转场协议

切换流程分成三段：

1. `leaving`
   旧页面保持可见，SVG 从底部平线开始抬起并最终覆盖全屏。
2. `switch`
   覆盖层完全遮住视图后，切换当前页面状态。
3. `entering`
   SVG 从顶部开始反向收回，露出新页面。

这部分比具体动画更重要，因为后续接 React Router 时，仍然可以沿用同一套状态机。

## 后续可扩展

- 把本地 `activeIndex` / `pendingIndex` 替换成 React Router 路由切换
- 增加从点击方向决定 path 起始形态
- 在覆盖层上加标题、栏目名或目的地文案
- 把当前的 path 插值改成更复杂的多控制点曲线
