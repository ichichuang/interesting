# Interesting

一个用于收纳、重构、整合与展示精美前端互动体验的容器项目。

本项目不再定位为单一页面或单一节日特效，而是一个长期扩展的 **Experience Container / 互动体验容器**。它会把 3D 爱心、WebGL Shader、粒子动画、节日主题、翻书效果、花朵场景、光标互动、音乐交互、小游戏式页面等前端体验统一接入到一个稳定、丝滑、可扩展的前端平台中。

---

## 当前状态

当前仓库已进入重构初始化阶段。

旧代码已经清空，后续将重新搭建新的前端容器骨架，并逐步接入不同类型的互动体验模块。

```
状态：重构中
目标：前端互动体验容器
部署：Vercel
域名：https://www.interesting.wzdxcc.cloudns.org/
仓库：https://github.com/ichichuang/interesting
```

---

## 项目愿景

Interesting 的目标不是简单堆叠多个 demo，而是把不同来源、不同技术形态、不同视觉风格的前端特效，统一封装成可浏览、可收藏、可搜索、可联动、可持续扩展的互动体验集合。

最终希望实现：

- 一个沉浸式首页；
- 一个统一的体验入口；
- 多个可独立运行的互动场景；
- 点击进入、丝滑转场、返回列表；
- 分类、标签、搜索、收藏、最近访问；
- 统一音乐、主题、光标、粒子、背景；
- 移动端与桌面端都能流畅运行；
- 后续可以持续接入几十个甚至上百个体验模块。

---

## 核心设计原则

### 1. 容器优先

主应用只负责稳定的容器能力：

- 导航；
- 路由；
- 体验加载；
- 页面转场；
- 状态管理；
- 收藏记录；
- 搜索筛选；
- 音乐控制；
- 主题控制；
- 性能调度；
- 资源清理。

具体特效作为独立体验模块接入。

### 2. 体验模块化

每个互动体验都应该是一个可插拔模块。

模块需要声明自己的元数据、入口组件、技术栈、标签、作者、来源、适配等级和生命周期。

### 3. 接入协议统一

不同项目可以使用不同实现方式，但接入容器时必须遵守统一协议。

每个体验至少需要支持：

- `mount`
- `unmount`
- `pause`
- `resume`
- `dispose`

这样可以避免路由切换后动画、音频、WebGL、事件监听继续残留。

### 4. 渐进式融合

不是所有外部项目都要一次性重写。

接入方式分三层：

| 层级 | 用途 | 适合对象 |
|---|---|---|
| Legacy Sandbox | 快速收纳 | 原生 HTML/CSS/JS 项目 |
| Adapter Wrapper | 主力接入 | 可改造的 Three.js / Canvas / JS 项目 |
| Shared Stage | 深度融合 | 高质量长期维护体验 |

### 5. 性能边界清晰

同一时间只允许一个重型体验运行。

首页只展示轻量预览，点击进入后再动态加载完整体验。离开体验页时必须清理动画帧、事件监听、音频和 GPU 资源。

---

## 计划技术栈

```
Vue 3
TypeScript
Vite
Vue Router
Pinia
UnoCSS
Three.js
TresJS
Motion for Vue
VueUse
Fuse.js
Howler.js
Vercel
```

### 技术选择说明

- **Vue 3**：作为主容器框架，适合组织页面、状态和组件。
- **TypeScript**：约束体验模块协议，降低后续扩展风险。
- **Vite**：支持快速开发、静态部署、动态导入和模块拆分。
- **Vue Router**：管理首页、分类页、体验详情页和旧路由兼容。
- **Pinia**：管理收藏、搜索、主题、音乐、性能档位等状态。
- **UnoCSS**：统一样式 token，减少全局 CSS 污染。
- **Three.js**：作为 3D 和 WebGL 能力底座。
- **TresJS**：用于在 Vue 生态中组织 Three.js 场景。
- **Motion for Vue**：处理页面转场、卡片展开、进入离开动画。
- **VueUse**：提供事件、窗口、存储、设备能力等组合式工具。
- **Fuse.js**：支持前端本地搜索。
- **Howler.js**：统一背景音乐和交互音效。
- **Vercel**：继续作为静态部署平台。

---

## 目标功能

### 首页

- 沉浸式 Hero 区域；
- 精选体验展示；
- 动态粒子背景；
- 分类入口；
- 搜索入口；
- 收藏入口；
- 最近访问；
- 移动端适配。

### 体验列表

- 分类筛选；
- 标签筛选；
- 关键词搜索；
- 技术栈筛选；
- 推荐排序；
- 收藏状态；
- 轻量预览卡片；
- 点击进入体验。

### 体验详情页

- 全屏互动舞台；
- 返回按钮；
- 收藏按钮；
- 音乐开关；
- 玩法提示；
- 上一个 / 下一个；
- 来源与作者信息；
- 移动端手势支持；
- 离开时自动释放资源。

### 全局联动

- 统一主题；
- 统一音乐；
- 统一光标；
- 统一转场；
- 统一性能档位；
- 体验之间可通过事件通信；
- 点击热点可跳转到其他体验。

---

## 体验接入模型

### 1. Legacy Sandbox

用于快速接入旧项目。

适合：

- 纯 HTML/CSS/JS；
- CSS 全局污染严重；
- 不方便立即重写；
- 只需要全屏展示；
- 与主容器联动较少。

计划目录：

```
public/
└─ legacy/
   ├─ heart-cursor/
   │  └─ index.html
   ├─ beautiful-silence/
   │  └─ index.html
   └─ valentine/
      └─ index.html
```

容器通过 iframe 加载：

```
/experience/legacy-heart-cursor
```

### 2. Adapter Wrapper

主力接入方式。

适合：

- 可改造的 Three.js 项目；
- 可改造的 Canvas 项目；
- 可拆分的原生 JS 项目；
- 需要和主容器通信的体验。

每个体验需要暴露统一适配器：

```ts
export interface ExperienceAdapter {
  mount(el: HTMLElement, ctx: ExperienceContext): Promise<void>
  unmount(): Promise<void>
  pause?(): void
  resume?(): void
  onHostEvent?(event: HostEvent): void
}
```

### 3. Shared Stage

最终高质量融合方式。

适合：

- 长期维护的核心体验；
- 需要统一相机、光照、粒子、Bloom、后处理的 3D 场景；
- 需要从首页到体验页连续转场的模块。

Shared Stage 会尽量保证全站只有一个主 WebGL renderer，避免多个 3D 场景互相抢占 GPU 资源。

---

## 体验元数据协议

每个体验都需要有独立的 `meta.ts`。

```ts
export interface ExperienceMeta {
  id: string
  title: string
  subtitle?: string
  description?: string
  category:
    | 'heart'
    | 'flower'
    | 'book'
    | 'shader'
    | 'cursor'
    | 'holiday'
    | 'particle'
    | 'game'
    | 'lab'
  tags: string[]
  tech: Array<
    | 'vue'
    | 'three'
    | 'tres'
    | 'shader'
    | 'canvas'
    | 'html'
    | 'css'
    | 'iframe'
  >
  level: 'legacy' | 'adapter' | 'shared-stage'
  route: string
  thumbnail: string
  entry?: string
  source?: string
  author?: string
  license?: string
  recommended?: boolean
  mobileFriendly?: boolean
}
```

---

## 计划目录结构

```
interesting/
├─ public/
│  ├─ legacy/
│  ├─ thumbnails/
│  ├─ audio/
│  └─ assets/
├─ src/
│  ├─ app/
│  │  ├─ App.vue
│  │  ├─ main.ts
│  │  ├─ router/
│  │  ├─ stores/
│  │  ├─ layouts/
│  │  └─ providers/
│  ├─ components/
│  │  ├─ ExperienceCard.vue
│  │  ├─ ExperienceGrid.vue
│  │  ├─ ExperienceHost.vue
│  │  ├─ SearchCommand.vue
│  │  ├─ FavoriteButton.vue
│  │  ├─ AudioToggle.vue
│  │  └─ BackToGallery.vue
│  ├─ features/
│  │  ├─ gallery/
│  │  ├─ favorites/
│  │  ├─ search/
│  │  └─ settings/
│  ├─ runtime/
│  │  ├─ experience/
│  │  │  ├─ types.ts
│  │  │  ├─ registry.ts
│  │  │  ├─ loader.ts
│  │  │  └─ host.ts
│  │  ├─ stage3d/
│  │  │  ├─ Stage3D.vue
│  │  │  ├─ renderer.ts
│  │  │  ├─ dispose.ts
│  │  │  ├─ quality.ts
│  │  │  └─ assets.ts
│  │  ├─ transitions/
│  │  ├─ audio/
│  │  └─ events/
│  ├─ experiences/
│  │  ├─ christmas/
│  │  │  ├─ meta.ts
│  │  │  ├─ index.vue
│  │  │  └─ adapter.ts
│  │  ├─ floating-hearts/
│  │  │  ├─ meta.ts
│  │  │  ├─ index.vue
│  │  │  └─ scene.ts
│  │  ├─ glowing-heart/
│  │  │  ├─ meta.ts
│  │  │  ├─ index.vue
│  │  │  └─ shader.glsl
│  │  └─ flowers/
│  │     ├─ meta.ts
│  │     └─ index.vue
│  ├─ styles/
│  │  ├─ tokens.css
│  │  ├─ global.css
│  │  └─ transitions.css
│  └─ vite-env.d.ts
├─ docs/
│  ├─ architecture.md
│  ├─ experience-adapter.md
│  └─ credits.md
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ uno.config.ts
├─ vercel.json
└─ README.md
```

---

## 路由规划

初期继续使用 hash 路由，以保持 Vercel 静态部署和刷新兼容性。

```
/#/
/#/interesting
/#/experience/:id
/#/category/:category
/#/favorites
/#/settings
```

后续如果切换为 history 路由，需要配合 Vercel rewrite。

---

## 性能策略

项目会优先保证移动端可用性。

基础规则：

- 首页不直接加载完整 WebGL 体验；
- 卡片只使用缩略图、短动效或轻量预览；
- 体验页按需动态加载；
- 离开页面时销毁动画帧和事件监听；
- Three.js 资源必须显式释放；
- 低端设备自动降低粒子数量；
- 高耗资源体验只允许单实例运行；
- 音频由主容器统一管理；
- 图片、音频、模型资源懒加载。

---

## 开发阶段计划

### Phase 0：仓库重置

- 清空旧代码；
- 重写 README；
- 明确项目定位；
- 保留 Git 历史作为回退基础。

### Phase 1：容器骨架

- 初始化 Vue 3 + TypeScript + Vite；
- 配置 Vue Router；
- 配置 Pinia；
- 配置 UnoCSS；
- 建立基础页面结构；
- 建立 `ExperienceHost`；
- 建立体验元数据注册机制。

### Phase 2：基础体验接入

优先接入三类代表体验：

- 一个 iframe legacy 项目；
- 一个原生 Three.js adapter 项目；
- 一个 Vue / TresJS 原生体验。

目标是验证：

- 点击进入；
- 返回列表；
- 动态加载；
- 收藏状态；
- 移动端适配；
- 资源清理；
- Vercel 部署。

### Phase 3：视觉系统

统一：

- 背景；
- 卡片；
- 标签；
- 按钮；
- 字体；
- 主题色；
- Loading；
- 页面转场；
- 体验页控制栏；
- 移动端交互。

### Phase 4：联动能力

建立全局事件协议：

- 主题切换；
- 音乐控制；
- 光标位置；
- 体验加载进度；
- 体验内热点点击；
- 体验之间跳转；
- 上一个 / 下一个体验。

### Phase 5：Shared 3D Stage

建设统一 3D 舞台：

- 全局 renderer；
- 全局 camera；
- 全局 controls；
- 全局 postprocessing；
- 全局 asset cache；
- 全局 quality governor；
- 统一 scene transition。

### Phase 6：规模化扩展

当体验数量变多后，引入：

- 元数据校验；
- 缩略图规范；
- 来源和 License 管理；
- 自动生成体验索引；
- CI 检查；
- 性能预算；
- 体验接入文档。

---

## 本地开发

当前仓库处于重构初始化阶段，应用骨架尚未创建。

项目骨架创建后，预计使用以下命令：

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

---

## 部署

计划继续使用 Vercel 部署。

构建目标：

```
Framework: Vite
Build Command: pnpm build
Output Directory: dist
```

如果使用 hash 路由，通常不需要额外 rewrite。

如果后续切换为 history 路由，需要在 `vercel.json` 中配置 SPA fallback。

---

## 来源与版权

本项目会整合、重构或参考多个开源前端特效项目。

所有外部项目必须保留：

- 原作者；
- 原仓库地址；
- License；
- 修改说明；
- 接入方式；
- 使用范围。

后续会在 `docs/credits.md` 中集中维护来源信息。

---

## 项目定位总结

```
Interesting = 前端互动体验容器
不是单个 demo
不是普通导航站
不是后端平台
不是简单复制外部项目

它应该是一个可以长期扩展、持续接入、统一管理、丝滑运行的纯前端体验集合。
```