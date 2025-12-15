<script setup lang="ts">
import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// 引入装饰素材
const lingdang = new URL('@/assets/images/lingdang.png', import.meta.url).href
const gift = new URL('@/assets/images/gift.png', import.meta.url).href
const gingerbreadMan = new URL('@/assets/images/gingerbread-man.png', import.meta.url).href
const tg = new URL('@/assets/images/tg.png', import.meta.url).href
const tgb = new URL('@/assets/images/tgb.png', import.meta.url).href
const lh = new URL('@/assets/images/lh.png', import.meta.url).href
const ld = new URL('@/assets/images/ld.png', import.meta.url).href

const canvasContainer = ref<HTMLElement | null>(null)
let app: Application | null = null

// --- [新增] 移动端检测 ---
// 判断是否为移动端（屏幕宽度小于 768 或 userAgent 包含移动端标识）
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  window.innerWidth < 768

// --- [配置] 根据设备动态调整参数 ---
const CONFIG = {
  // 移动端减少粒子数以保证流畅度，PC端保持高画质
  leafCount: isMobile ? 2000 : 4000,
  trunkCount: isMobile ? 250 : 400,
  bellCount: isMobile ? 300 : 450, // 灯带密度
  snowCount: isMobile ? 100 : 200,
  // 装饰物数量倍率 (移动端 0.6 倍)
  decoMultiplier: isMobile ? 0.6 : 1.0,
  // 限制最大像素比，iPad通常是3，限制为2可以节省大量GPU资源
  maxResolution: 2,
}

// --- 类型定义 ---
type Point3D = { x: number; y: number; z: number }

type ParticleType =
  | 'LEAF'
  | 'TRUNK'
  | 'BELL'
  | 'REAL_BELL'
  | 'GIFT'
  | 'GINGERBREAD'
  | 'TG'
  | 'TGB'
  | 'LH'
  | 'LD'

type Particle = {
  s: Sprite
  type: ParticleType
  treePos: Point3D
  spherePos: Point3D
  baseScale: number
  baseAlpha: number
  phase: number
  blinkSpeed: number
}

type SnowParticle = {
  s: Sprite
  x: number
  y: number
  vx: number
  vy: number
  sway: number
  phase: number
}

let particles: Particle[] = []
let snows: SnowParticle[] = []
let tickerFn: ((t: any) => void) | null = null
let exploded = false

// 鼠标交互变量
let rotX = -0.1
let rotY = 0
let targetRotX = -0.1
let targetRotY = 0
let zoom = 1

const CX_OFFSET = 0
const CY_OFFSET = 50

// --- 纹理生成工具 ---
function createSharpTexture(size: number, _color: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const r = size / 2
  g.beginFill(0xffffff, 1)
  g.drawCircle(r, r, r * 0.6)
  g.endFill()
  g.beginFill(0xffffff, 0.3)
  g.drawCircle(r, r, r)
  g.endFill()
  return app.renderer.generateTexture(g)
}

function createGlowTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const r = size / 2
  for (let i = 0; i < 5; i++) {
    g.beginFill(0xffffff, 0.15)
    g.drawCircle(r, r, r * (1 - i * 0.15))
    g.endFill()
  }
  g.beginFill(0xffffff, 0.8)
  g.drawCircle(r, r, r * 0.2)
  g.endFill()
  return app.renderer.generateTexture(g)
}

function createSnowTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  g.beginFill(0xffffff, 0.8)
  g.drawCircle(size / 2, size / 2, size / 2)
  g.endFill()
  return app.renderer.generateTexture(g)
}

// --- 3D 几何算法 ---
function rotateY(p: Point3D, angle: number): Point3D {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c }
}

function rotateX(p: Point3D, angle: number): Point3D {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c }
}

function getSpherePoint(r: number): Point3D {
  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
  }
}

function getTreePoint(h: number, baseR: number, _layerIndent = false): Point3D {
  const yNorm = Math.pow(Math.random(), 0.8)
  const y = yNorm * h - h / 2
  const rMax = ((y + h / 2) / h) * baseR
  const r = rMax * (0.4 + 0.6 * Math.sqrt(Math.random()))
  const angle = Math.random() * Math.PI * 2
  return {
    x: Math.cos(angle) * r,
    y: y - h * 0.1,
    z: Math.sin(angle) * r,
  }
}

function getTrunkPoint(h: number, r: number, yOffset: number): Point3D {
  const y = (Math.random() - 0.5) * h + yOffset
  const angle = Math.random() * Math.PI * 2
  const curR = r * Math.sqrt(Math.random())
  return {
    x: Math.cos(angle) * curR,
    y: y,
    z: Math.sin(angle) * curR,
  }
}

function getSpiralPos(
  progress: number,
  treeH: number,
  treeW: number,
  spiralTurns: number
): Point3D {
  const yRaw = -treeH / 2 + progress * treeH
  const rBase = ((yRaw + treeH / 2) / treeH) * treeW
  const r = rBase + 5
  const angle = progress * spiralTurns * Math.PI * 2
  return {
    x: Math.cos(angle) * r,
    y: yRaw - treeH * 0.1,
    z: Math.sin(angle) * r,
  }
}

// --- 交互控制 ---

// PC端滚轮
function handleWheel(e: WheelEvent) {
  if (!exploded) {
    return
  }
  e.preventDefault()
  // 阻止浏览器的默认缩放行为（ctrl+滚轮）
  if (e.ctrlKey) {
    return
  }

  const delta = e.deltaY * -0.001
  zoom += delta
  zoom = Math.min(Math.max(0.5, zoom), 3.0)
}

// [新增] 移动端双指缩放变量
let initialPinchDist = 0
let initialZoom = 1

function getDistance(touches: TouchList) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// [新增] 触摸开始
function handleTouchStart(e: TouchEvent) {
  if (!exploded) {
    return
  }
  if (e.touches.length === 2) {
    initialPinchDist = getDistance(e.touches)
    initialZoom = zoom
  }
}

// [新增] 触摸移动 (缩放)
function handleTouchMove(e: TouchEvent) {
  if (!exploded) {
    return
  }
  if (e.touches.length === 2 && initialPinchDist > 0) {
    e.preventDefault() // 阻止页面滚动
    const currentDist = getDistance(e.touches)
    const scale = currentDist / initialPinchDist

    // 基于初始zoom进行缩放
    zoom = initialZoom * scale
    // 限制范围
    zoom = Math.min(Math.max(0.5, zoom), 3.0)
  }
}

async function buildScene() {
  if (!app) {
    return
  }
  if (tickerFn) {
    app.ticker.remove(tickerFn)
    tickerFn = null
  }
  app.stage.removeChildren()
  particles = []
  snows = []

  const W = app.screen.width
  const H = app.screen.height
  const CX = W / 2
  const CY = H / 2

  const leafTex = createSharpTexture(16, 0xffffff)!
  const trunkTex = createSharpTexture(16, 0xffffff)!
  const glowTex = createGlowTexture(32)!
  const snowTex = createSnowTexture(8)!

  const [realBellTex, giftTex, gingerbreadTex, tgTex, tgbTex, lhTex, ldTex] = await Promise.all([
    Assets.load(lingdang),
    Assets.load(gift),
    Assets.load(gingerbreadMan),
    Assets.load(tg),
    Assets.load(tgb),
    Assets.load(lh),
    Assets.load(ld),
  ])

  const SPHERE_R = Math.min(W, H) * 0.75
  const TREE_H = 500
  const TREE_W = 220
  const TRUNK_H = 100
  const TRUNK_W = 40
  const SPIRAL_TURNS = 6

  const snowLayer = new Container()
  app.stage.addChild(snowLayer)
  const treeLayer = new Container()
  treeLayer.sortableChildren = true
  app.stage.addChild(treeLayer)

  // 1. 雪花
  for (let i = 0; i < CONFIG.snowCount; i++) {
    const s = new Sprite(snowTex)
    s.anchor.set(0.5)
    s.alpha = Math.random() * 0.5 + 0.3
    const scale = Math.random() * 0.5 + 0.2
    s.scale.set(scale)
    snowLayer.addChild(s)
    snows.push({
      s,
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() * 2 + 1) * scale,
      sway: Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
    })
  }

  // 2. 树叶 (应用配置数量)
  const greenColors = [0x0f5132, 0x198754, 0x20c997, 0x0d6efd]
  for (let i = 0; i < CONFIG.leafCount; i++) {
    const s = new Sprite(leafTex)
    s.anchor.set(0.5)
    s.tint = greenColors[Math.floor(Math.random() * greenColors.length)]
    const treeP = getTreePoint(TREE_H, TREE_W)
    const sphereP = getSpherePoint(SPHERE_R)
    treeLayer.addChild(s)
    particles.push({
      s,
      type: 'LEAF',
      treePos: treeP,
      spherePos: sphereP,
      baseScale: Math.random() * 0.4 + 0.2,
      baseAlpha: 0.9,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: 0,
    })
  }

  // 3. 树干
  const trunkYCenter = TREE_H / 2 - TRUNK_H / 2
  for (let i = 0; i < CONFIG.trunkCount; i++) {
    const s = new Sprite(trunkTex)
    s.anchor.set(0.5)
    s.tint = 0x8b4513
    const treeP = getTrunkPoint(TRUNK_H, TRUNK_W, trunkYCenter)
    const sphereP = getSpherePoint(SPHERE_R * 0.1)
    treeLayer.addChild(s)
    particles.push({
      s,
      type: 'TRUNK',
      treePos: treeP,
      spherePos: sphereP,
      baseScale: Math.random() * 0.4 + 0.3,
      baseAlpha: 0.95,
      phase: 0,
      blinkSpeed: 0,
    })
  }

  // 4. 灯带
  for (let i = 0; i < CONFIG.bellCount; i++) {
    const s = new Sprite(glowTex)
    s.anchor.set(0.5)
    s.tint = 0xffd700
    s.blendMode = 'add'
    const linearProgress = i / CONFIG.bellCount
    const progress = Math.pow(linearProgress, 0.5)
    const treeP = getSpiralPos(progress, TREE_H, TREE_W, SPIRAL_TURNS)
    const sphereP = getSpherePoint(SPHERE_R * 1.1)
    const fadeAlpha = 1.0 - progress * 0.4
    const fadeScale = 1.0 - progress * 0.3
    treeLayer.addChild(s)
    particles.push({
      s,
      type: 'BELL',
      treePos: treeP,
      spherePos: sphereP,
      baseScale: (Math.random() * 0.3 + 0.2) * fadeScale,
      baseAlpha: fadeAlpha,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: 3 + Math.random() * 5,
    })
  }

  // 5. 装饰物
  // 根据 CONFIG.decoMultiplier 调整数量
  const getCount = (base: number) => Math.max(1, Math.floor(base * CONFIG.decoMultiplier))

  const decorationsConfig = [
    { type: 'REAL_BELL', tex: realBellTex, count: getCount(42), scale: 0.4 },
    { type: 'GIFT', tex: giftTex, count: getCount(5), scale: 0.6 },
    { type: 'GINGERBREAD', tex: gingerbreadTex, count: getCount(8), scale: 0.4 },
    { type: 'TG', tex: tgTex, count: getCount(6), scale: 0.2 },
    { type: 'TGB', tex: tgbTex, count: getCount(6), scale: 0.2 },
    { type: 'LH', tex: lhTex, count: getCount(6), scale: 0.1 },
    { type: 'LD', tex: ldTex, count: getCount(6), scale: 0.1 },
  ] as const

  const decoItems: { type: ParticleType; tex: Texture; scale: number }[] = []
  decorationsConfig.forEach(conf => {
    for (let i = 0; i < conf.count; i++) {
      decoItems.push({ type: conf.type as ParticleType, tex: conf.tex, scale: conf.scale })
    }
  })
  decoItems.sort(() => Math.random() - 0.5)

  const totalDecos = decoItems.length
  const startProg = 0.1
  const endProg = 0.95

  decoItems.forEach((item, index) => {
    const s = new Sprite(item.tex)
    s.anchor.set(0.5, 0.1)
    const section = (endProg - startProg) / totalDecos
    const prog = startProg + index * section + Math.random() * 0.01
    const treeP = getSpiralPos(prog, TREE_H, TREE_W, SPIRAL_TURNS)
    const sphereP = getSpherePoint(SPHERE_R * 1.05)
    treeLayer.addChild(s)
    particles.push({
      s,
      type: item.type,
      treePos: treeP,
      spherePos: sphereP,
      baseScale: (Math.random() * 0.2 + 0.8) * item.scale,
      baseAlpha: 1.0,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: 2 + Math.random() * 2,
    })
  })

  // --- 交互层 ---
  const hitArea = new Graphics()
  hitArea.beginFill(0x000000, 0)
  hitArea.drawRect(0, 0, W, H)
  hitArea.endFill()
  hitArea.eventMode = 'static'
  app.stage.addChild(hitArea)

  // 统一的移动逻辑：Touch拖动也会触发 pointermove
  hitArea.on('pointermove', e => {
    if (!exploded) {
      return
    }
    const x = e.global.x
    const y = e.global.y
    targetRotY = (x - CX) * 0.005
    targetRotX = (y - CY) * 0.005
  })

  hitArea.on('pointertap', () => {
    exploded = !exploded
    if (!exploded) {
      targetRotX = -0.1
      zoom = 1
    }
  })

  // --- 动画循环 ---
  let morphProgress = 0
  const FOCAL = 800
  let time = 0

  tickerFn = (t: any) => {
    // 限制每帧的最大时间步长，防止切换后台回来后动画瞬移
    const dt = Math.min(t.deltaTime, 2.0) / 60
    time += dt

    const targetProg = exploded ? 1 : 0
    morphProgress += (targetProg - morphProgress) * 0.05

    if (!exploded) {
      targetRotY += 0.005
      targetRotX = -0.1
    }
    rotY += (targetRotY - rotY) * 0.05
    rotX += (targetRotX - rotX) * 0.05

    snows.forEach(sn => {
      sn.y += sn.vy
      sn.x += sn.vx + Math.sin(time * 2 + sn.phase) * sn.sway
      if (sn.y > H + 10) {
        sn.y = -10
        sn.x = Math.random() * W
      }
      if (sn.x > W + 10) {
        sn.x = -10
      }
      if (sn.x < -10) {
        sn.x = W + 10
      }
      sn.s.x = sn.x
      sn.s.y = sn.y
    })

    particles.sort((a, b) => b.s.zIndex - a.s.zIndex)

    particles.forEach(p => {
      const tVal = morphProgress
      const mx = p.treePos.x + (p.spherePos.x - p.treePos.x) * tVal
      const my = p.treePos.y + (p.spherePos.y - p.treePos.y) * tVal
      const mz = p.treePos.z + (p.spherePos.z - p.treePos.z) * tVal

      let pos = { x: mx, y: my, z: mz }
      pos = rotateY(pos, rotY)
      pos = rotateX(pos, rotX)

      const depth = pos.z + FOCAL
      const scale = (FOCAL / Math.max(50, depth)) * zoom

      p.s.x = CX + pos.x * scale + CX_OFFSET
      p.s.y = CY + pos.y * scale + CY_OFFSET

      let finalScale = p.baseScale * scale
      let finalAlpha = 1.0
      const distAlpha = Math.min(1, scale)

      if (p.type === 'BELL') {
        const blink = Math.sin(time * p.blinkSpeed + p.phase)
        const brightBlink = (blink + 1) / 2
        finalAlpha = (0.4 + 1.1 * brightBlink) * p.baseAlpha
        finalScale *= 1 + 0.6 * brightBlink
        p.s.zIndex = Math.floor(depth) + 100
      } else if (
        p.type === 'REAL_BELL' ||
        p.type === 'GIFT' ||
        p.type === 'GINGERBREAD' ||
        p.type === 'TG' ||
        p.type === 'TGB' ||
        p.type === 'LH' ||
        p.type === 'LD'
      ) {
        const sway = Math.sin(time * p.blinkSpeed + p.phase) * 0.15
        const rotate = Math.sin(time * p.blinkSpeed * 0.5 + p.phase) * 0.05
        p.s.rotation = sway + rotate
        finalAlpha = p.baseAlpha * distAlpha
        p.s.zIndex = Math.floor(depth) + 50
      } else {
        finalAlpha = p.baseAlpha * distAlpha
        p.s.zIndex = Math.floor(depth)
      }

      p.s.scale.set(finalScale)
      p.s.alpha = finalAlpha
    })
  }
  app.ticker.add(tickerFn)
}

function initPixi() {
  if (!canvasContainer.value) {
    return Promise.resolve()
  }
  if (app) {
    app.destroy(true, { children: true, texture: true })
  }
  app = new Application()

  // [关键优化] 计算分辨率
  // iPad Pro 的 devicePixelRatio 可达 3，限制为 2 可显著提升性能
  const resolution = Math.min(window.devicePixelRatio || 1, CONFIG.maxResolution)

  return app
    .init({
      resizeTo: canvasContainer.value,
      backgroundColor: 0x02030a,
      antialias: true, // 开启抗锯齿，如果依然卡顿可设为 false
      resolution: resolution,
      autoDensity: true,
    })
    .then(async () => {
      if (!canvasContainer.value) {
        return
      }
      canvasContainer.value.appendChild(app!.canvas)
      await buildScene()
    })
}

onMounted(() => {
  initPixi()
  const el = canvasContainer.value
  if (el) {
    // 滚轮事件 (PC)
    el.addEventListener('wheel', handleWheel, { passive: false })
    // 触摸事件 (Mobile Pinch)
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
  }
})

onBeforeUnmount(() => {
  const el = canvasContainer.value
  if (el) {
    el.removeEventListener('wheel', handleWheel)
    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchmove', handleTouchMove)
  }
  if (app) {
    if (tickerFn) {
      app.ticker.remove(tickerFn)
    }
    app.destroy(true, { children: true, texture: true })
  }
})
</script>

<template>
  <div class="christmas-page">
    <div
      ref="canvasContainer"
      class="canvas-host"
    ></div>
    <div class="ui-layer">
      <h1>Merry Christmas</h1>
      <p>Nice to meet you.</p>
    </div>
  </div>
</template>

<style scoped>
.christmas-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at center, #0f1225 0%, #000000 100%);
  /* 防止移动端长按选中文本 */
  user-select: none;
  -webkit-user-select: none;
}
.canvas-host {
  width: 100%;
  height: 100%;
  /* 确保触摸事件不被阻挡 */
  touch-action: none;
}
.ui-layer {
  position: absolute;
  top: 10%;
  left: 0;
  width: 100%;
  text-align: center;
  pointer-events: none;
  color: #fff;
  font-family: 'Georgia', serif;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}
h1 {
  font-size: 3rem;
  margin: 0;
  letter-spacing: 2px;
  color: #ffd700;
}
p {
  font-size: 1rem;
  opacity: 0.6;
  margin-top: 10px;
}
/* 移动端字体适配 */
@media (max-width: 768px) {
  h1 {
    font-size: 2rem;
  }
  p {
    font-size: 0.8rem;
  }
}
</style>
