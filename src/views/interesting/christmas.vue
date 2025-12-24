<script setup lang="ts">
import gsap from 'gsap'
import {
  Application,
  BlurFilter,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
} from 'pixi.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{ (e: 'giftClick', payload: { id: number }): void }>()

const GIFT_CLICK_DURATION_MS = 1200

const canvasContainer = ref<HTMLElement | null>(null)

let app: Application | null = null
let rafResize: number | null = null
let tickerFn: ((t: any) => void) | null = null
let activeTweens: gsap.core.Tween[] = []

type Star = { s: Sprite; tw: number; baseA: number }
type Snow = { s: Sprite; vy: number; vx: number; sway: number; phase: number }
type BigSnow = { s: Sprite; vy: number; vx: number; sway: number; phase: number; vr: number }
type LightDot = {
  core: Sprite
  glow: Sprite
  blink: number
  phase: number
  baseA: number
  baseS: number
  z: number
}
type LightBlob = { s: Sprite; vx: number; vy: number; t: number }
type TreeTwinkle = { s: Sprite; tw: number; baseA: number; baseS: number; phase: number }
type Bell = {
  c: Container
  bell: Sprite
  glow: Sprite
  x0: number
  y0: number
  phase: number
  sway: number
  amp: number
  blink: number
  baseA: number
  rot: number
  rv: number
}
type Gift = {
  c: Container
  inner: Container
  glow: Sprite
  box: Sprite
  ribbon: Sprite
  bow: Sprite
  x0: number
  y0: number
  r0: number
  baseS: number
  phase: number
  bob: number
  amp: number
  explodeBob: number
  explodeAmp: number
  explodeX: number
  holdTheta: number | null
  holdSin: number
  id: number
}

const stars: Star[] = []
const snows: Snow[] = []
const bigSnows: BigSnow[] = []
const treeLights: LightDot[] = []
const lightBlobs: LightBlob[] = []
const groundStars: Star[] = []
const treeTwinkles: TreeTwinkle[] = []
const bells: Bell[] = []
const gifts: Gift[] = []

let exploded = false

let hoveredGiftId = -1

let sceneTime = 0

let pointerX = 0
let pointerY = 0
let followX = 0
let followY = 0

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function dist2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

function hitGift(g: Gift, px: number, py: number, pad: number) {
  const b = g.c.getBounds()
  return (
    px >= b.x - pad && px <= b.x + b.width + pad && py >= b.y - pad && py <= b.y + b.height + pad
  )
}

function createCircleTexture(radius: number, color = 0xffffff) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  g.beginFill(color, 1)
  g.drawCircle(radius, radius, radius)
  g.endFill()
  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function createGiftBoxTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const r = size * 0.16
  g.beginFill(0xffffff, 1)
  g.drawRoundedRect(0, size * 0.1, size, size * 0.82, r)
  g.endFill()
  g.beginFill(0xffffff, 0.18)
  g.drawRoundedRect(size * 0.1, size * 0.18, size * 0.16, size * 0.68, r * 0.6)
  g.endFill()
  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function createGiftRibbonTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  g.beginFill(0xffffff, 1)
  g.drawRoundedRect(size * 0.46, size * 0.1, size * 0.08, size * 0.82, size * 0.04)
  g.drawRoundedRect(0, size * 0.48, size, size * 0.08, size * 0.04)
  g.endFill()
  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function createGiftBowTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const cx = size / 2
  const y = size * 0.1
  g.beginFill(0xffffff, 1)
  g.drawCircle(cx, y + size * 0.12, Math.max(1, size * 0.06))
  g.endFill()
  g.beginFill(0xffffff, 1)
  g.drawPolygon([
    cx,
    y + size * 0.12,
    cx - size * 0.22,
    y + size * 0.02,
    cx - size * 0.32,
    y + size * 0.18,
  ])
  g.drawPolygon([
    cx,
    y + size * 0.12,
    cx + size * 0.22,
    y + size * 0.02,
    cx + size * 0.32,
    y + size * 0.18,
  ])
  g.endFill()
  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function createBellTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const r = size / 2
  const cx = r
  const topY = r * 0.18
  const bodyTop = r * 0.32
  const bodyW = r * 0.92
  const bodyH = r * 0.9

  g.beginFill(0xffffff, 0.14)
  g.drawEllipse(cx, r * 0.82, bodyW * 0.62, bodyW * 0.22)
  g.endFill()

  g.beginFill(0xffffff, 1)
  g.drawCircle(cx, topY, Math.max(1, r * 0.13))
  g.endFill()

  g.beginFill(0xffffff, 1)
  g.drawRoundedRect(cx - bodyW / 2, bodyTop, bodyW, bodyH, r * 0.42)
  g.endFill()

  g.beginFill(0xffffff, 0.22)
  g.drawRoundedRect(cx - bodyW * 0.22, bodyTop + r * 0.18, bodyW * 0.16, bodyH * 0.74, r * 0.18)
  g.endFill()

  g.beginFill(0xffffff, 1)
  g.drawCircle(cx, bodyTop + bodyH * 0.84, Math.max(1, r * 0.16))
  g.endFill()

  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function createSnowflakeTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const r = size / 2
  const cx = r
  const cy = r
  g.lineStyle(Math.max(1, size * 0.06), 0xffffff, 0.95)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const x1 = cx + Math.cos(a) * (r * 0.88)
    const y1 = cy + Math.sin(a) * (r * 0.88)
    g.moveTo(cx, cy)
    g.lineTo(x1, y1)

    const bx = cx + Math.cos(a) * (r * 0.56)
    const by = cy + Math.sin(a) * (r * 0.56)
    const a1 = a + Math.PI * 0.28
    const a2 = a - Math.PI * 0.28
    g.moveTo(bx, by)
    g.lineTo(bx + Math.cos(a1) * (r * 0.24), by + Math.sin(a1) * (r * 0.24))
    g.moveTo(bx, by)
    g.lineTo(bx + Math.cos(a2) * (r * 0.24), by + Math.sin(a2) * (r * 0.24))
  }
  g.beginFill(0xffffff, 1)
  g.drawCircle(cx, cy, Math.max(1, r * 0.12))
  g.endFill()
  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function createCoreTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const r = size / 2

  // 外圈
  g.beginFill(0xffffff, 0.18)
  g.drawCircle(r, r, r)
  g.endFill()

  // 内圈
  g.beginFill(0xffffff, 0.55)
  g.drawCircle(r, r, r * 0.55)
  g.endFill()

  // 亮芯
  g.beginFill(0xffffff, 1)
  g.drawCircle(r, r, Math.max(1, r * 0.22))
  g.endFill()

  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function createRadialLightTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const r = size / 2
  // 多层叠加假渐变（更柔和）
  for (let i = 0; i < 10; i++) {
    const t = i / 10
    const rr = r * (1 - t)
    const a = 0.12 * (1 - t)
    g.beginFill(0xffffff, a)
    g.drawCircle(r, r, rr)
    g.endFill()
  }
  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function createBokehTexture(size: number) {
  if (!app) {
    return null
  }
  const g = new Graphics()
  const r = size / 2

  // 外圈柔光
  g.beginFill(0xffffff, 0.08)
  g.drawCircle(r, r, r)
  g.endFill()

  // 中圈
  g.beginFill(0xffffff, 0.18)
  g.drawCircle(r, r, r * 0.6)
  g.endFill()

  // 内圈
  g.beginFill(0xffffff, 0.35)
  g.drawCircle(r, r, r * 0.32)
  g.endFill()

  // 亮芯（让点“清晰”）
  g.beginFill(0xffffff, 0.95)
  g.drawCircle(r, r, Math.max(1, r * 0.12))
  g.endFill()

  const tex = app.renderer.generateTexture(g)
  g.destroy(true)
  return tex
}

function killSceneTweens() {
  for (const tw of activeTweens) {
    tw.kill()
  }
  activeTweens = []
}

function pushTween(tw: gsap.core.Tween) {
  activeTweens.push(tw)
  return tw
}

function buildScene() {
  if (!app) {
    return
  }

  if (tickerFn) {
    app.ticker.remove(tickerFn)
    tickerFn = null
  }
  killSceneTweens()

  const W = app.screen.width
  const H = app.screen.height
  const lowPerf =
    Math.min(W, H) < 720 ||
    (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent))
  const perfScale = lowPerf ? 0.58 : 1

  const stage = app.stage
  stage.removeChildren()

  hoveredGiftId = -1
  stage.removeAllListeners('pointermove')
  stage.removeAllListeners('pointertap')
  stage.removeAllListeners('pointerdown')
  stars.length = 0
  snows.length = 0
  bigSnows.length = 0
  treeLights.length = 0
  lightBlobs.length = 0
  groundStars.length = 0
  treeTwinkles.length = 0
  bells.length = 0
  gifts.length = 0
  exploded = false

  // 背景层（纯色用 renderer backgroundColor 就行，这里只做 vignette）
  const vignette = new Graphics()
  vignette.beginFill(0x000000, 0.35)
  vignette.drawRect(0, 0, W, H)
  vignette.endFill()
  vignette.filters = [new BlurFilter(lowPerf ? 10 : 16)]
  vignette.alpha = 0.35

  // 星星
  const starTex = createCircleTexture(2, 0xffffff)!
  const starLayer = new Container()
  stage.addChild(starLayer)

  const starCount = clamp(
    Math.floor(((W * H) / 18000) * perfScale),
    lowPerf ? 80 : 120,
    lowPerf ? 170 : 260
  )
  for (let i = 0; i < starCount; i++) {
    const s = new Sprite(starTex)
    s.x = Math.random() * W
    s.y = Math.random() * H
    const scale = rand(0.3, 1.2)
    s.scale.set(scale)
    s.alpha = rand(0.15, 0.8)
    stars.push({ s, tw: rand(0.6, 2.5), baseA: s.alpha })
    starLayer.addChild(s)
  }

  // 雪花（多层：近大慢、远小快）
  const snowTex = createCircleTexture(3, 0xffffff)!
  const snowLayer = new Container()
  stage.addChild(snowLayer)

  const snowCount = clamp(
    Math.floor(((W * H) / 12000) * perfScale),
    lowPerf ? 90 : 140,
    lowPerf ? 260 : 420
  )
  for (let i = 0; i < snowCount; i++) {
    const s = new Sprite(snowTex)
    const z = Math.random() // 0远 1近
    const size = rand(0.12, 0.9) * (0.4 + z)
    s.scale.set(size)
    s.x = Math.random() * W
    s.y = Math.random() * H
    s.alpha = 0.18 + z * 0.65
    // 远处更冷一点
    s.tint = z < 0.35 ? 0xcfe9ff : 0xffffff

    snows.push({
      s,
      vy: (0.7 + z * 1.9) * rand(0.6, 1.3),
      vx: rand(-0.25, 0.25),
      sway: rand(0.6, 2.2) * (0.6 + z),
      phase: rand(0, Math.PI * 2),
    })
    snowLayer.addChild(s)
  }

  const bigSnowLayer = new Container()
  stage.addChild(bigSnowLayer)
  const flakeTex = createSnowflakeTexture(lowPerf ? 52 : 64)!
  const bigCount = clamp(
    Math.floor(((W * H) / 90000) * (lowPerf ? 0.7 : 1)),
    lowPerf ? 10 : 18,
    lowPerf ? 28 : 46
  )
  for (let i = 0; i < bigCount; i++) {
    const s = new Sprite(flakeTex)
    s.anchor.set(0.5)
    const z = Math.random()
    const scale = rand(0.16, 0.62) * (0.65 + z * 0.8)
    s.scale.set(scale)
    s.x = Math.random() * W
    s.y = Math.random() * H
    s.alpha = 0.16 + z * 0.58
    s.rotation = rand(0, Math.PI * 2)
    s.tint = z < 0.4 ? 0xeaf6ff : 0xffffff
    if (!lowPerf && z > 0.7) {
      s.filters = [new BlurFilter(1.2)]
    }
    bigSnows.push({
      s,
      vy: (0.55 + z * 1.25) * rand(0.55, 1.25),
      vx: rand(-0.12, 0.12),
      sway: rand(0.8, 2.8) * (0.6 + z),
      phase: rand(0, Math.PI * 2),
      vr: rand(-0.03, 0.03) * (0.6 + z),
    })
    bigSnowLayer.addChild(s)
  }

  // 背景漂浮光斑（更有氛围，类似 bokeh）
  const blobLayer = new Container()
  stage.addChild(blobLayer)

  const blobTex = createRadialLightTexture(260)!
  const blobCount = clamp(
    Math.floor(((W * H) / 180000) * (lowPerf ? 0.65 : 1)),
    lowPerf ? 4 : 6,
    lowPerf ? 7 : 10
  )
  for (let i = 0; i < blobCount; i++) {
    const s = new Sprite(blobTex)
    s.anchor.set(0.5)
    s.x = Math.random() * W
    s.y = Math.random() * H
    s.alpha = rand(0.012, 0.04)
    s.scale.set(rand(0.35, 1.05))
    s.tint = [0x7aa2ff, 0xff74d4, 0x6fffe9, 0xffffff][Math.floor(Math.random() * 4)]
    s.blendMode = 'add'
    s.filters = [new BlurFilter(14)]
    lightBlobs.push({ s, vx: rand(-0.06, 0.06), vy: rand(-0.04, 0.04), t: rand(0, Math.PI * 2) })
    blobLayer.addChild(s)
  }

  // 圣诞树（用“发光粒子”组成三角树形 + 花环灯带 + 装饰球）
  const treeLayer = new Container()
  stage.addChild(treeLayer)

  const cx = W * 0.5
  const baseY = H * 0.78
  const treeH = Math.min(H * 0.62, W * 0.7)
  const treeW = treeH * 0.62

  // 树的暗色轮廓（让灯点更“挂在树上”，不会悬浮）
  const topY = baseY - treeH
  const profile = (t: number) => {
    const tt = clamp(t, 0, 1)
    const base = (0.1 + tt * 0.92) * (treeW * 0.55)
    const scallop = 1 + Math.sin(tt * Math.PI * 8) * (0.06 + tt * 0.02)
    return base * scallop
  }

  const foliageShadow = new Graphics()
  foliageShadow.beginFill(0x000000, 0.18)
  const shLeft: Array<{ x: number; y: number }> = []
  const shRight: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    const y = topY + t * treeH + 10
    const r = profile(t) * 1.02
    shLeft.push({ x: cx - r, y })
    shRight.push({ x: cx + r, y })
  }
  foliageShadow.moveTo(shLeft[0].x, shLeft[0].y)
  for (let i = 1; i < shLeft.length; i++) {
    foliageShadow.lineTo(shLeft[i].x, shLeft[i].y)
  }
  for (let i = shRight.length - 1; i >= 0; i--) {
    foliageShadow.lineTo(shRight[i].x, shRight[i].y)
  }
  foliageShadow.closePath()
  foliageShadow.endFill()
  foliageShadow.filters = [new BlurFilter(14)]
  treeLayer.addChild(foliageShadow)

  const foliage = new Graphics()
  foliage.beginFill(0x0a3f28, 0.28)
  foliage.lineStyle(2, 0x0f6a3a, 0.12)
  const foLeft: Array<{ x: number; y: number }> = []
  const foRight: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    const y = topY + t * treeH
    const r = profile(t)
    foLeft.push({ x: cx - r, y })
    foRight.push({ x: cx + r, y })
  }
  foliage.moveTo(cx, topY)
  for (let i = 0; i < foLeft.length; i++) {
    foliage.lineTo(foLeft[i].x, foLeft[i].y)
  }
  for (let i = foRight.length - 1; i >= 0; i--) {
    foliage.lineTo(foRight[i].x, foRight[i].y)
  }
  foliage.closePath()
  foliage.endFill()
  foliage.filters = [new BlurFilter(0.9)]
  treeLayer.addChild(foliage)

  const inner = new Graphics()
  inner.beginFill(0x052915, 0.22)
  const inLeft: Array<{ x: number; y: number }> = []
  const inRight: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= 70; i++) {
    const t = i / 70
    const y = topY + t * treeH + 10
    const r = profile(t) * 0.55
    inLeft.push({ x: cx - r, y })
    inRight.push({ x: cx + r, y })
  }
  inner.moveTo(inLeft[0].x, inLeft[0].y)
  for (let i = 1; i < inLeft.length; i++) {
    inner.lineTo(inLeft[i].x, inLeft[i].y)
  }
  for (let i = inRight.length - 1; i >= 0; i--) {
    inner.lineTo(inRight[i].x, inRight[i].y)
  }
  inner.closePath()
  inner.endFill()
  inner.filters = [new BlurFilter(4)]
  treeLayer.addChild(inner)

  // 树的“柔光底”
  const treeGlowTex = createRadialLightTexture(420)!
  const treeGlow = new Sprite(treeGlowTex)
  treeGlow.anchor.set(0.5)
  treeGlow.x = cx
  treeGlow.y = baseY - treeH * 0.28
  treeGlow.blendMode = 'add'
  treeGlow.alpha = 0.05
  treeGlow.scale.set(Math.min(1.25, W / 1000))
  treeGlow.filters = [new BlurFilter(10)]
  treeLayer.addChild(treeGlow)

  pushTween(
    gsap.to(treeGlow, {
      alpha: 0.09,
      duration: 2.2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
  )

  // 树灯点纹理：双层（清晰 core + 柔光 glow），同时兼顾锐度和氛围
  const coreTex = createCoreTexture(18)!
  const glowTex = createRadialLightTexture(lowPerf ? 72 : 90)!
  const sparkleTex = createBokehTexture(80)!
  const colors = [0xe53935, 0x2ecc71, 0xffd166, 0xffffff]

  const turns = 4.2
  const lightCount = clamp(
    Math.floor((treeH / 4.2) * (lowPerf ? 0.72 : 1)),
    lowPerf ? 150 : 200,
    lowPerf ? 280 : 360
  )
  for (let i = 0; i < lightCount; i++) {
    const t = i / (lightCount - 1)
    const y = topY + t * treeH + rand(-6, 6)
    const theta = t * Math.PI * 2 * turns + rand(-0.25, 0.25)
    const r = profile(t) * (0.85 + rand(-0.05, 0.05))
    const x = cx + Math.cos(theta) * r
    const z = (Math.sin(theta) + 1) * 0.5

    const core = new Sprite(coreTex)
    core.anchor.set(0.5)
    core.x = x
    core.y = y + (1 - z) * 8

    const glow = new Sprite(glowTex)
    glow.anchor.set(0.5)
    glow.x = core.x
    glow.y = core.y
    glow.blendMode = 'add'

    const size = rand(0.22, 0.46) * (0.72 + z)
    core.scale.set(size)
    glow.scale.set(size * rand(1.05, 1.45))

    const tint = colors[Math.floor(Math.random() * colors.length)]
    core.tint = tint
    glow.tint = tint
    core.blendMode = 'add'

    core.alpha = 0.22 + z * 0.7
    glow.alpha = core.alpha * 0.16
    if (!lowPerf) {
      if (z < 0.35) {
        glow.filters = [new BlurFilter(1.6)]
      } else if (z < 0.6) {
        glow.filters = [new BlurFilter(1.0)]
      }
    }

    treeLights.push({
      core,
      glow,
      blink: rand(0.8, 3.2),
      phase: rand(0, Math.PI * 2),
      baseA: core.alpha,
      baseS: size,
      z,
    })
    treeLayer.addChild(glow, core)
  }

  const twinkleLayer = new Container()
  treeLayer.addChild(twinkleLayer)
  const twinkleTex = createRadialLightTexture(56)!
  const twinkleCount = clamp(
    Math.floor((treeH / 2.6) * (lowPerf ? 0.68 : 1)),
    lowPerf ? 80 : 120,
    lowPerf ? 160 : 220
  )
  for (let i = 0; i < twinkleCount; i++) {
    const t = clamp((i + Math.random()) / twinkleCount, 0.02, 0.985)
    const y = topY + t * treeH + rand(-6, 6)
    const w = profile(t) * 1.75
    const x = cx + (Math.random() - 0.5) * w * 0.9
    const s = new Sprite(twinkleTex)
    s.anchor.set(0.5)
    s.x = x
    s.y = y
    const scale = rand(0.022, 0.062) * (0.62 + (1 - t) * 0.38)
    s.scale.set(scale)
    s.alpha = rand(0.16, 0.38)
    s.tint = Math.random() < 0.75 ? 0xffffff : 0xffd166
    s.blendMode = 'add'
    if (!lowPerf) {
      s.filters = [new BlurFilter(0.8)]
    }
    treeTwinkles.push({
      s,
      tw: rand(2.2, 5.2),
      baseA: s.alpha,
      baseS: scale,
      phase: rand(0, Math.PI * 2),
    })
    twinkleLayer.addChild(s)
  }

  // 花环灯带：几条弧线增加结构感
  const ribbonGlow = new Graphics()
  ribbonGlow.lineStyle(10, 0xffd166, 0.16)
  const ribbon = new Graphics()
  ribbon.lineStyle(3, 0xffd166, 0.55)
  const ribbonSteps = 220
  const ribbonTurns = 3.6
  for (let i = 0; i <= ribbonSteps; i++) {
    const t = i / ribbonSteps
    const y = topY + t * treeH
    const theta = t * Math.PI * 2 * ribbonTurns + 0.9
    const r = profile(t) * 0.9
    const x = cx + Math.cos(theta) * r
    if (i === 0) {
      ribbonGlow.moveTo(x, y)
      ribbon.moveTo(x, y)
    } else {
      ribbonGlow.lineTo(x, y)
      ribbon.lineTo(x, y)
    }
  }
  ribbonGlow.filters = [new BlurFilter(10)]
  ribbon.filters = [new BlurFilter(0.6)]
  ribbonGlow.blendMode = 'add'
  ribbon.blendMode = 'add'
  treeLayer.addChild(ribbonGlow, ribbon)

  const ribbonBulbColors = [0xffffff, 0xfff1c1, 0xffd166]
  const ribbonBulbStep = 7
  for (let i = 0; i <= ribbonSteps; i += ribbonBulbStep) {
    const t = i / ribbonSteps
    const y = topY + t * treeH
    const theta = t * Math.PI * 2 * ribbonTurns + 0.9
    const r = profile(t) * 0.9
    const x = cx + Math.cos(theta) * r
    const z = (Math.sin(theta) + 1) * 0.5

    const core = new Sprite(coreTex)
    core.anchor.set(0.5)
    core.x = x
    core.y = y + (1 - z) * 6

    const glow = new Sprite(glowTex)
    glow.anchor.set(0.5)
    glow.x = core.x
    glow.y = core.y
    glow.blendMode = 'add'

    const size = rand(0.3, 0.38) * (0.86 + z * 0.24)
    core.scale.set(size)
    glow.scale.set(size * rand(1.25, 1.55))

    const tint = ribbonBulbColors[Math.floor(Math.random() * ribbonBulbColors.length)]
    core.tint = tint
    glow.tint = tint
    core.blendMode = 'add'
    core.alpha = 0.58 + z * 0.42
    glow.alpha = core.alpha * 0.24

    treeLights.push({
      core,
      glow,
      blink: rand(1.2, 3.0),
      phase: rand(0, Math.PI * 2),
      baseA: core.alpha,
      baseS: size,
      z,
    })
    treeLayer.addChild(glow, core)
  }

  const bellLayer = new Container()
  treeLayer.addChild(bellLayer)
  const bellTex = createBellTexture(lowPerf ? 44 : 56)!
  const bellGlowTex = createRadialLightTexture(lowPerf ? 110 : 140)!
  const bellCount = clamp(
    Math.floor((treeH / 22) * (lowPerf ? 0.65 : 1)),
    lowPerf ? 14 : 22,
    lowPerf ? 22 : 34
  )
  for (let i = 0; i < bellCount; i++) {
    const t = clamp(0.16 + ((i + Math.random()) / bellCount) * 0.78, 0.14, 0.95)
    const y = topY + t * treeH
    const w = profile(t) * 1.55
    const x = cx + (Math.random() - 0.5) * w

    const c = new Container()
    c.x = x
    c.y = y

    const glow = new Sprite(bellGlowTex)
    glow.anchor.set(0.5)
    glow.blendMode = 'add'
    glow.alpha = 0.22
    glow.scale.set(rand(0.09, 0.16))
    glow.tint = 0xffd166
    if (!lowPerf) {
      glow.filters = [new BlurFilter(6)]
    }

    const bell = new Sprite(bellTex)
    bell.anchor.set(0.5, 0.2)
    bell.tint = 0xffd166
    bell.alpha = 0.95
    bell.scale.set(rand(0.22, 0.38) * (0.75 + (1 - t) * 0.22))
    bell.blendMode = 'add'

    c.addChild(glow, bell)
    bellLayer.addChild(c)

    bells.push({
      c,
      bell,
      glow,
      x0: c.x,
      y0: c.y,
      phase: rand(0, Math.PI * 2),
      sway: rand(0.9, 2.3),
      amp: rand(0.05, 0.16) * (lowPerf ? 0.85 : 1),
      blink: rand(1.4, 3.6),
      baseA: glow.alpha,
      rot: 0,
      rv: 0,
    })
  }

  const giftLayer = new Container()
  treeLayer.addChild(giftLayer)
  const giftBoxTex = createGiftBoxTexture(lowPerf ? 44 : 56)!
  const giftRibbonTex = createGiftRibbonTexture(lowPerf ? 44 : 56)!
  const giftBowTex = createGiftBowTexture(lowPerf ? 44 : 56)!
  const giftGlowTex = createRadialLightTexture(lowPerf ? 100 : 130)!
  const giftHitSize = lowPerf ? 52 : 66
  const giftHitPad = lowPerf ? 10 : 14
  const giftCount = clamp(
    Math.floor((treeH / 36) * (lowPerf ? 0.7 : 1)),
    lowPerf ? 6 : 10,
    lowPerf ? 10 : 16
  )
  const giftBoxColors = [0xff4d4d, 0x4dd2ff, 0x9b5cff, 0x2ecc71, 0xffd166]
  const giftRibbonColors = [0xffffff, 0xfff1c1, 0xffd166]
  for (let i = 0; i < giftCount; i++) {
    const t = clamp(0.22 + ((i + Math.random()) / giftCount) * 0.68, 0.18, 0.92)
    const y = topY + t * treeH
    const w = profile(t) * 1.5
    const x = cx + (Math.random() - 0.5) * w

    const c = new Container()
    const baseS = rand(0.22, 0.36) * (0.78 + (1 - t) * 0.24)
    c.scale.set(baseS)
    c.x = x
    c.y = y
    c.rotation = rand(-0.12, 0.12)
    c.eventMode = 'none'
    c.interactiveChildren = false
    ;(c as any).cursor = 'pointer'
    c.hitArea = new Rectangle(
      -giftHitSize * 0.6,
      -giftHitSize * 0.62,
      giftHitSize * 1.2,
      giftHitSize * 1.24
    )

    const glow = new Sprite(giftGlowTex)
    glow.anchor.set(0.5)
    glow.blendMode = 'add'
    glow.alpha = 0.16
    glow.scale.set(rand(0.08, 0.14))
    glow.tint = 0xffd166
    if (!lowPerf) {
      glow.filters = [new BlurFilter(5)]
    }

    const box = new Sprite(giftBoxTex)
    box.anchor.set(0.5)
    box.tint = giftBoxColors[Math.floor(Math.random() * giftBoxColors.length)]
    box.blendMode = 'add'
    box.alpha = 0.9

    const ribbon = new Sprite(giftRibbonTex)
    ribbon.anchor.set(0.5)
    ribbon.tint = giftRibbonColors[Math.floor(Math.random() * giftRibbonColors.length)]
    ribbon.blendMode = 'add'
    ribbon.alpha = 0.95

    const bow = new Sprite(giftBowTex)
    bow.anchor.set(0.5)
    bow.tint = ribbon.tint
    bow.blendMode = 'add'
    bow.alpha = 0.95

    const inner = new Container()
    inner.addChild(glow, box, ribbon, bow)
    c.addChild(inner)
    giftLayer.addChild(c)

    const id = i
    ;(c as any).giftId = id

    const triggerGiftClick = () => {
      pushTween(
        gsap.to(c.scale, {
          x: baseS * 1.25,
          y: baseS * 1.25,
          duration: 0.12,
          repeat: 1,
          yoyo: true,
          ease: 'sine.out',
        })
      )
      pushTween(
        gsap.to(glow, {
          alpha: Math.min(0.85, glow.alpha + 0.35),
          duration: 0.16,
          repeat: 1,
          yoyo: true,
          ease: 'sine.out',
        })
      )
      console.log('[Christmas] gift click duration(ms):', GIFT_CLICK_DURATION_MS, 'id:', id)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('christmas:gift-click', { detail: { id } }))
      }
      emit('giftClick', { id })
      console.log('[Christmas] gift clicked:', id)
    }

    c.on('pointertap', (e: any) => {
      if (!exploded) {
        return
      }
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation()
      }
      if (e && typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation()
      }
      triggerGiftClick()
    })

    gifts.push({
      c,
      inner,
      glow,
      box,
      ribbon,
      bow,
      x0: c.x,
      y0: c.y,
      r0: c.rotation,
      baseS,
      phase: rand(0, Math.PI * 2),
      bob: rand(0.7, 1.7),
      amp: rand(0.02, 0.06),
      explodeBob: rand(0.9, 1.9),
      explodeAmp: rand(0.42, 0.78) * (lowPerf ? 0.85 : 1),
      // screen-pixel wobble amplitude (will be compensated by container scale)
      explodeX: rand(38, 78) * (lowPerf ? 0.85 : 1),
      holdTheta: null,
      holdSin: 0,
      id,
    })
  }

  // 大号装饰球（bokeh）
  const ornamentCount = clamp(Math.floor(treeH / 150), 3, 5)
  for (let i = 0; i < ornamentCount; i++) {
    const tt = clamp(
      0.18 + (i / Math.max(1, ornamentCount - 1)) * 0.72 + rand(-0.03, 0.03),
      0.14,
      0.93
    )
    const y = topY + tt * treeH
    const widthAtY = profile(tt) * 1.7
    const dir = Math.random() < 0.5 ? 1 : -1
    const x = cx + dir * rand(0.05, 0.42) * widthAtY
    const s = new Sprite(sparkleTex)
    s.anchor.set(0.5)
    s.x = x
    s.y = y
    s.alpha = rand(0.06, 0.12)
    s.scale.set(rand(0.1, 0.18))
    s.tint = colors[Math.floor(Math.random() * colors.length)]
    s.blendMode = 'add'
    s.filters = [new BlurFilter(3.2)]
    treeLayer.addChild(s)
    pushTween(
      gsap.to(s, {
        alpha: s.alpha + rand(0.06, 0.12),
        duration: rand(1.4, 2.4),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    )
    pushTween(
      gsap.to(s, {
        y: s.y + rand(-10, 10),
        duration: rand(2.8, 4.2),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    )
  }

  // 树干/底部（统一为“氛围雪地 + 暗影 + 木质树干”，避免卡通元素割裂）
  const tw = treeW * 0.12
  const th = treeH * 0.14

  const baseLayer = new Container()
  treeLayer.addChild(baseLayer)

  const groundShadow = new Sprite(createRadialLightTexture(520)!)
  groundShadow.anchor.set(0.5)
  groundShadow.x = cx
  groundShadow.y = baseY + th + 26
  groundShadow.blendMode = 'multiply'
  groundShadow.tint = 0x000000
  groundShadow.alpha = 0.22
  groundShadow.scale.set(0.5)
  groundShadow.filters = [new BlurFilter(18)]
  baseLayer.addChild(groundShadow)

  const snowBack = new Graphics()
  snowBack.beginFill(0xffffff, 0.12)
  snowBack.drawEllipse(cx, baseY + th + 22, treeW * 0.56, treeW * 0.14)
  snowBack.endFill()
  snowBack.filters = [new BlurFilter(12)]
  baseLayer.addChild(snowBack)

  const trunk = new Graphics()
  const trunkDark = 0x3f2718
  const trunkLight = 0x6b4127
  trunk.beginFill(trunkDark, 1)
  const tTop = tw * 0.72
  trunk.moveTo(cx - tTop / 2, baseY)
  trunk.lineTo(cx + tTop / 2, baseY)
  trunk.lineTo(cx + tw / 2, baseY + th)
  trunk.lineTo(cx - tw / 2, baseY + th)
  trunk.closePath()
  trunk.endFill()
  trunk.beginFill(trunkLight, 0.55)
  trunk.moveTo(cx - tw * 0.22, baseY + 4)
  trunk.lineTo(cx - tw * 0.05, baseY + 4)
  trunk.lineTo(cx - tw * 0.02, baseY + th - 6)
  trunk.lineTo(cx - tw * 0.2, baseY + th - 6)
  trunk.closePath()
  trunk.endFill()
  trunk.alpha = 0.92
  baseLayer.addChild(trunk)

  const rootShadow = new Graphics()
  rootShadow.beginFill(0x000000, 0.22)
  rootShadow.drawEllipse(cx, baseY + th + 6, tw * 0.62, tw * 0.22)
  rootShadow.endFill()
  rootShadow.filters = [new BlurFilter(10)]
  baseLayer.addChild(rootShadow)

  const snowFront = new Graphics()
  snowFront.beginFill(0xffffff, 0.16)
  snowFront.drawEllipse(cx, baseY + th + 28, treeW * 0.5, treeW * 0.12)
  snowFront.endFill()
  snowFront.filters = [new BlurFilter(10)]
  baseLayer.addChild(snowFront)

  const snowBank = new Graphics()
  snowBank.beginFill(0xffffff, 0.22)
  snowBank.drawEllipse(cx, baseY + th + 10, tw * 1.35, tw * 0.52)
  snowBank.endFill()
  snowBank.filters = [new BlurFilter(8)]
  baseLayer.addChild(snowBank)

  // 树顶星星（星 + 光晕）
  const starGlowTex = createRadialLightTexture(260)!
  const topGlow = new Sprite(starGlowTex)
  topGlow.anchor.set(0.5)
  topGlow.x = cx
  topGlow.y = baseY - treeH - 18
  topGlow.blendMode = 'add'
  topGlow.alpha = 0.75
  topGlow.scale.set(0.72)
  topGlow.filters = [new BlurFilter(10)]
  treeLayer.addChild(topGlow)

  const topGlowTex2 = createRadialLightTexture(520)!
  const topGlow2 = new Sprite(topGlowTex2)
  topGlow2.anchor.set(0.5)
  topGlow2.x = cx
  topGlow2.y = baseY - treeH - 18
  topGlow2.blendMode = 'add'
  topGlow2.alpha = 0.18
  topGlow2.scale.set(0.42)
  topGlow2.filters = [new BlurFilter(18)]
  treeLayer.addChild(topGlow2)

  const star = new Graphics()
  const sx = cx
  const sy = baseY - treeH - 18
  const R = 24
  const r = 10
  star.beginFill(0xffd60a, 1)
  star.moveTo(sx, sy - R)
  for (let i = 1; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? R : r
    star.lineTo(sx + Math.cos(ang) * rr, sy + Math.sin(ang) * rr)
  }
  star.closePath()
  star.endFill()
  star.blendMode = 'add'
  star.filters = [new BlurFilter(0.2)]
  treeLayer.addChild(star)

  const topSparkTex = createRadialLightTexture(80)!
  const topSparkCount = 16
  for (let i = 0; i < topSparkCount; i++) {
    const s = new Sprite(topSparkTex)
    s.anchor.set(0.5)
    const a = rand(0, Math.PI * 2)
    const rr = rand(22, 54)
    s.x = cx + Math.cos(a) * rr
    s.y = sy + Math.sin(a) * rr * 0.7
    s.scale.set(rand(0.06, 0.14))
    s.alpha = rand(0.25, 0.75)
    s.tint = Math.random() < 0.75 ? 0xffffff : 0xffd166
    s.blendMode = 'add'
    stars.push({ s, tw: rand(1.4, 3.2), baseA: s.alpha })
    treeLayer.addChild(s)
  }

  pushTween(
    gsap.to(topGlow, { alpha: 1.05, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' })
  )
  pushTween(
    gsap.to(topGlow.scale, {
      x: 0.92,
      y: 0.92,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  )

  pushTween(
    gsap.to(topGlow2, { alpha: 0.28, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
  )

  // 文字（复制一层 + BlurFilter + ADD 做辉光）
  const titleStyle = new TextStyle({
    fontFamily: '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive',
    fontSize: Math.round(clamp(W / 13, 46, 92)),
    fontWeight: '700',
    fill: 0xffffff,
    letterSpacing: 1,
  })

  const title = new Text('Merry Christmas', titleStyle)
  title.anchor.set(0.5)
  title.x = cx
  title.y = H * 0.18

  const titleGlow = new Text('Merry Christmas', titleStyle)
  titleGlow.anchor.set(0.5)
  titleGlow.x = cx
  titleGlow.y = H * 0.18
  titleGlow.tint = 0xff4dff
  titleGlow.alpha = 0.85
  titleGlow.blendMode = 'add'
  titleGlow.filters = [new BlurFilter(10)]

  const subStyle = new TextStyle({
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans SC", sans-serif',
    fontSize: Math.round(clamp(W / 42, 16, 28)),
    fill: 0xffffff,
    letterSpacing: 1,
  })
  const sub = new Text('Happy to see you', subStyle)
  sub.anchor.set(0.5)
  sub.x = cx
  sub.y = H * 0.24
  sub.alpha = 0.9

  stage.addChild(titleGlow, title, sub)

  pushTween(
    gsap.to(titleGlow.filters![0] as BlurFilter, {
      strength: 16,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  )
  pushTween(
    gsap.to(title.scale, {
      x: 1.02,
      y: 1.02,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  )

  // 地面星尘（树底部“铺满闪点”，更像你截图那种高级感）
  const groundLayer = new Container()
  stage.addChildAt(groundLayer, stage.getChildIndex(treeLayer))
  const groundTex = createRadialLightTexture(64)!
  const gCount = clamp(
    Math.floor(((W * H) / 14000) * (lowPerf ? 0.5 : 1)),
    lowPerf ? 140 : 220,
    lowPerf ? 420 : 720
  )
  const gy = baseY + treeH * 0.18
  for (let i = 0; i < gCount; i++) {
    const s = new Sprite(groundTex)
    s.anchor.set(0.5)
    const ang = rand(0, Math.PI * 2)
    const rr = Math.pow(Math.random(), 0.55)
    const rx = treeW * 1.05
    const ry = treeW * 0.42
    s.x = cx + Math.cos(ang) * rr * rx
    s.y = gy + Math.sin(ang) * rr * ry
    const scale = rand(0.02, 0.08) * (0.7 + rr)
    s.scale.set(scale)
    s.alpha = rand(0.12, 0.55) * (0.6 + rr)
    s.tint = Math.random() < 0.85 ? 0xffffff : colors[Math.floor(Math.random() * colors.length)]
    s.blendMode = 'add'
    if (!lowPerf && Math.random() < 0.25) {
      s.filters = [new BlurFilter(1.8)]
    }
    groundStars.push({ s, tw: rand(0.8, 2.8), baseA: s.alpha })
    groundLayer.addChild(s)
  }

  // 动态扫光（环境光照）
  const lightTex = createRadialLightTexture(520)!
  const ambientLight = new Sprite(lightTex)
  ambientLight.anchor.set(0.5)
  ambientLight.x = cx
  ambientLight.y = H * 0.35
  ambientLight.alpha = 0.12
  ambientLight.blendMode = 'add'
  ambientLight.filters = [new BlurFilter(lowPerf ? 10 : 16)]
  stage.addChild(ambientLight)

  pushTween(
    gsap.to(ambientLight, {
      x: cx + W * 0.12,
      y: H * 0.32,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  )
  pushTween(
    gsap.to(ambientLight, {
      alpha: 0.16,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  )

  // 指针跟随光（鼠标/手指）
  const pointerLight = new Sprite(lightTex)
  pointerLight.anchor.set(0.5)
  pointerLight.alpha = lowPerf ? 0.08 : 0.14
  pointerLight.scale.set(lowPerf ? 0.5 : 0.6)
  pointerLight.blendMode = 'add'
  pointerLight.filters = [new BlurFilter(lowPerf ? 10 : 14)]
  stage.addChild(pointerLight)

  // vignette 放最上层
  vignette.blendMode = 'multiply'
  stage.addChild(vignette)

  // 初始化指针位置
  pointerX = cx
  pointerY = H * 0.5
  followX = pointerX
  followY = pointerY

  // 让 stage 能接 pointermove（v8 推荐 eventMode + hitArea）
  stage.eventMode = 'static'
  stage.hitArea = new Rectangle(0, 0, W, H)

  stage.on('pointermove', (e: any) => {
    const g = e.global
    pointerX = g.x
    pointerY = g.y

    if (!exploded) {
      if (hoveredGiftId !== -1) {
        const prev = gifts.find(x => x.id === hoveredGiftId)
        if (prev) {
          pushTween(
            gsap.to(prev.c.scale, {
              x: prev.baseS,
              y: prev.baseS,
              duration: 0.18,
              ease: 'sine.out',
            })
          )
        }
      }
      hoveredGiftId = -1
      if (app?.canvas) {
        app.canvas.style.cursor = 'default'
      }
      return
    }

    let bestId = -1
    let bestD = Infinity
    for (const gg of gifts) {
      if (!hitGift(gg, pointerX, pointerY, giftHitPad)) {
        continue
      }
      const d = dist2(pointerX, pointerY, gg.c.x, gg.c.y)
      if (d < bestD) {
        bestD = d
        bestId = gg.id
      }
    }

    if (bestId !== hoveredGiftId) {
      const prev = gifts.find(x => x.id === hoveredGiftId)
      if (prev) {
        if (exploded && prev.holdTheta !== null) {
          prev.phase = prev.holdTheta - sceneTime * prev.explodeBob
          prev.holdTheta = null
        }
        pushTween(
          gsap.to(prev.c.scale, {
            x: prev.baseS * 1.12,
            y: prev.baseS * 1.12,
            duration: 0.18,
            ease: 'sine.out',
          })
        )
      }
      const next = gifts.find(x => x.id === bestId)
      if (next) {
        if (exploded && bestId !== -1) {
          const theta = sceneTime * next.explodeBob + next.phase
          next.holdTheta = theta
          next.holdSin = Math.sin(theta)
        }
        pushTween(
          gsap.to(next.c.scale, {
            x: next.baseS * 1.45,
            y: next.baseS * 1.45,
            duration: 0.18,
            ease: 'sine.out',
          })
        )
      }
      hoveredGiftId = bestId
    }

    if (app?.canvas) {
      app.canvas.style.cursor = hoveredGiftId !== -1 ? 'pointer' : 'default'
    }
  })

  stage.on('pointerdown', (e: any) => {
    if (e && ((e as any).stopped || (e as any).propagationStopped)) {
      return
    }

    if (exploded) {
      const g = e?.global
      const px = g ? g.x : pointerX
      const py = g ? g.y : pointerY
      let best: Gift | null = null
      let bestD = Infinity
      for (const gg of gifts) {
        if (!hitGift(gg, px, py, giftHitPad)) {
          continue
        }
        const d = dist2(px, py, gg.c.x, gg.c.y)
        if (d < bestD) {
          bestD = d
          best = gg
        }
      }
      if (best) {
        pushTween(
          gsap.to(best.c.scale, {
            x: best.baseS * 1.25,
            y: best.baseS * 1.25,
            duration: 0.12,
            repeat: 1,
            yoyo: true,
            ease: 'sine.out',
          })
        )
        pushTween(
          gsap.to(best.glow, {
            alpha: Math.min(0.85, best.glow.alpha + 0.35),
            duration: 0.16,
            repeat: 1,
            yoyo: true,
            ease: 'sine.out',
          })
        )
        console.log('[Christmas] gift click duration(ms):', GIFT_CLICK_DURATION_MS, 'id:', best.id)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('christmas:gift-click', { detail: { id: best.id } }))
        }
        emit('giftClick', { id: best.id })
        console.log('[Christmas] gift clicked:', best.id)
        return
      }
    }

    if (exploded && e && e.target) {
      let p = e.target
      while (p) {
        if ((p as any).giftId !== undefined) {
          return
        }
        p = p.parent
      }
    }
    exploded = !exploded
    const cy = topY + treeH * 0.56
    for (const b of bells) {
      if (exploded) {
        const dx = b.x0 - cx
        const dy = b.y0 - cy
        const len = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const nx = dx / len
        const ny = dy / len
        const spread = treeW * rand(0.5, 0.95)
        const tx = b.x0 + nx * spread + rand(-W * 0.04, W * 0.04)
        const ty = b.y0 + ny * spread + rand(-H * 0.03, H * 0.03)
        pushTween(gsap.to(b.c, { x: tx, y: ty, duration: 0.85, ease: 'expo.out' }))
        pushTween(gsap.to(b.c.scale, { x: 1.18, y: 1.18, duration: 0.85, ease: 'expo.out' }))
        pushTween(
          gsap.to(b.glow, {
            alpha: Math.min(0.8, b.baseA + 0.42),
            duration: 0.45,
            ease: 'sine.out',
          })
        )
      } else {
        pushTween(gsap.to(b.c, { x: b.x0, y: b.y0, duration: 0.75, ease: 'expo.inOut' }))
        pushTween(gsap.to(b.c.scale, { x: 1, y: 1, duration: 0.75, ease: 'expo.inOut' }))
        pushTween(gsap.to(b.glow, { alpha: b.baseA, duration: 0.55, ease: 'sine.inOut' }))
      }
    }

    for (const g of gifts) {
      g.c.eventMode = exploded ? 'static' : 'none'
      if (exploded) {
        const dx = g.x0 - cx
        const dy = g.y0 - cy
        const len = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const nx = dx / len
        const ny = dy / len
        const spread = treeW * rand(0.6, 1.05)
        const tx = g.x0 + nx * spread + rand(-W * 0.05, W * 0.05)
        const ty = g.y0 + ny * spread + rand(-H * 0.04, H * 0.04)
        pushTween(
          gsap.to(g.c, {
            x: tx,
            y: ty,
            rotation: g.r0 + rand(-0.6, 0.6),
            duration: 0.9,
            ease: 'expo.out',
          })
        )
        pushTween(
          gsap.to(g.c.scale, {
            x: g.baseS * 1.12,
            y: g.baseS * 1.12,
            duration: 0.9,
            ease: 'expo.out',
          })
        )
        pushTween(
          gsap.to(g.glow, {
            alpha: Math.min(0.7, g.glow.alpha + 0.28),
            duration: 0.45,
            ease: 'sine.out',
          })
        )
      } else {
        if (hoveredGiftId === g.id) {
          hoveredGiftId = -1
        }
        g.holdTheta = null
        pushTween(
          gsap.to(g.c, { x: g.x0, y: g.y0, rotation: g.r0, duration: 0.78, ease: 'expo.inOut' })
        )
        pushTween(
          gsap.to(g.c.scale, { x: g.baseS, y: g.baseS, duration: 0.78, ease: 'expo.inOut' })
        )
        pushTween(gsap.to(g.glow, { alpha: 0.16, duration: 0.55, ease: 'sine.inOut' }))
      }
    }
  })

  // ticker：统一更新动画（比大量 gsap tween 更稳）
  let time = 0
  let frame = 0
  let windT = 0
  let wind = 0
  let gustT = 0
  tickerFn = (t: any) => {
    time += t.deltaTime / 60
    sceneTime = time
    frame++

    const dt = t.deltaTime / 60

    const halfRate = lowPerf && frame % 2 === 0

    // 星星闪烁
    if (!halfRate) {
      for (const st of stars) {
        st.s.alpha = clamp(st.baseA + Math.sin(time * st.tw + st.baseA * 10) * 0.25, 0.05, 0.95)
      }
    }

    // 地面星尘闪烁
    if (!halfRate) {
      for (const st of groundStars) {
        st.s.alpha = clamp(st.baseA + Math.sin(time * st.tw + st.baseA * 10) * 0.35, 0.04, 0.95)
      }
    }

    // 雪花飘落
    const W2 = app!.screen.width
    const H2 = app!.screen.height
    for (const sn of snows) {
      sn.s.y += sn.vy * t.deltaTime
      sn.s.x += (sn.vx + Math.sin(time * sn.sway + sn.phase) * 0.18) * t.deltaTime

      if (sn.s.y > H2 + 20) {
        sn.s.y = -20
        sn.s.x = Math.random() * W2
      }
      if (sn.s.x < -30) {
        sn.s.x = W2 + 30
      }
      if (sn.s.x > W2 + 30) {
        sn.s.x = -30
      }
    }

    for (const sn of bigSnows) {
      const sdt = lowPerf ? t.deltaTime * 0.9 : t.deltaTime
      sn.s.y += sn.vy * sdt
      sn.s.x += (sn.vx + Math.sin(time * sn.sway + sn.phase) * 0.55) * sdt
      sn.s.rotation += sn.vr * sdt
      if (sn.s.y > H2 + 80) {
        sn.s.y = -80
        sn.s.x = Math.random() * W2
      }
      if (sn.s.x < -120) {
        sn.s.x = W2 + 120
      }
      if (sn.s.x > W2 + 120) {
        sn.s.x = -120
      }
    }

    // 树灯闪烁
    for (const ld of treeLights) {
      const tw = Math.sin(time * ld.blink + ld.phase)
      const p = (tw + 1) * 0.5
      const pulse = 0.28 + Math.pow(p, 3) * 1.05
      const a = clamp(ld.baseA * pulse, 0.04, 1)
      const s = ld.baseS * (0.92 + Math.pow(p, 2) * 0.22 * (0.35 + ld.z))
      ld.core.alpha = a
      ld.core.scale.set(s)
      ld.glow.alpha = a * (0.18 + ld.z * 0.18)
      ld.glow.scale.set(s * 1.55)
    }

    if (time > windT) {
      windT = time + rand(2.4, 5.6)
      gustT = rand(-1, 1)
    }
    wind = lerp(wind, gustT, 1 - Math.pow(0.001, dt))
    const baseWind = Math.sin(time * 0.35) * 0.55 + Math.sin(time * 0.11 + 1.6) * 0.75
    const windField = clamp((baseWind + wind) * 0.55, -1, 1)

    for (const b of bells) {
      const local = Math.sin(time * (b.sway * 1.1) + b.phase) * (b.amp * 0.28)
      const heightK = clamp(0.45 + (1 - b.y0 / H) * 0.7, 0.35, 1.05)
      const target = windField * (b.amp * 2.0) * heightK + local
      const stiffness = lowPerf ? 22 : 28
      const damping = lowPerf ? 8.5 : 9.5
      b.rv += (target - b.rot) * stiffness * dt
      b.rv *= Math.pow(0.001, damping * dt)
      b.rot += b.rv
      b.c.rotation = b.rot

      const p = (Math.sin(time * b.blink + b.phase) + 1) * 0.5
      const pulse = Math.pow(p, 4)
      b.glow.alpha = clamp(b.baseA * (0.65 + pulse * 1.35), 0.06, 0.95)
      b.bell.alpha = clamp(0.78 + pulse * 0.32, 0.5, 1)
    }

    if (!halfRate) {
      for (const g of gifts) {
        if (exploded) {
          if (hoveredGiftId === g.id) {
            const s = g.holdTheta !== null ? g.holdSin : Math.sin(time * g.explodeBob + g.phase)
            g.inner.rotation = s * g.explodeAmp
            const k = 1 / Math.max(0.01, g.c.scale.x || 1)
            g.inner.x = s * g.explodeX * k
            continue
          }
          const s = Math.sin(time * g.explodeBob + g.phase)
          g.inner.rotation = s * g.explodeAmp
          const k = 1 / Math.max(0.01, g.c.scale.x || 1)
          g.inner.x = s * g.explodeX * k
        } else {
          g.inner.rotation = 0
          g.inner.x = 0
          g.c.rotation = g.r0 + Math.sin(time * g.bob + g.phase) * g.amp
        }
      }
    }

    if (!halfRate) {
      for (const twk of treeTwinkles) {
        const p = (Math.sin(time * twk.tw + twk.phase) + 1) * 0.5
        const pulse = Math.pow(p, 6)
        twk.s.alpha = clamp(twk.baseA * 0.16 + pulse * twk.baseA * 3.6, 0.02, 1)
        twk.s.scale.set(twk.baseS * (0.92 + pulse * 2.4))
      }
    }

    // 背景漂浮光斑
    for (const b of lightBlobs) {
      b.t += 0.0025 * t.deltaTime
      b.s.x += b.vx * t.deltaTime + Math.sin(b.t) * 0.08
      b.s.y += b.vy * t.deltaTime + Math.cos(b.t * 0.9) * 0.06
      if (b.s.x < -200) {
        b.s.x = W2 + 200
      }
      if (b.s.x > W2 + 200) {
        b.s.x = -200
      }
      if (b.s.y < -200) {
        b.s.y = H2 + 200
      }
      if (b.s.y > H2 + 200) {
        b.s.y = -200
      }
    }

    // 指针跟随光：平滑跟随
    followX += (pointerX - followX) * 0.12
    followY += (pointerY - followY) * 0.12
    if (!lowPerf) {
      pointerLight.x = followX
      pointerLight.y = followY
    }
  }
  app.ticker.add(tickerFn)
}

function initPixi() {
  if (!canvasContainer.value) {
    return Promise.resolve()
  }

  const lowPerfDevice =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  // 清理旧实例
  if (app) {
    app.destroy(true, { children: true, texture: true, textureSource: true })
    app = null
  }

  app = new Application()
  const initTarget = app

  return initTarget
    .init({
      resizeTo: canvasContainer.value,
      backgroundColor: 0x07081a,
      antialias: !lowPerfDevice,
      resolution: lowPerfDevice ? 1 : Math.min(2, dpr),
      autoDensity: true,
    })
    .then(() => {
      // init 期间组件可能卸载/重建，这里保护一下
      if (!app || app !== initTarget || !canvasContainer.value) {
        return
      }

      canvasContainer.value.innerHTML = ''
      canvasContainer.value.appendChild(app.canvas)

      buildScene()

      // resize：节流一下避免频繁 build
      const onResize = () => {
        if (rafResize) {
          cancelAnimationFrame(rafResize)
        }
        rafResize = requestAnimationFrame(() => {
          if (!app) {
            return
          }
          buildScene()
        })
      }
      window.addEventListener('resize', onResize)

      onBeforeUnmount(() => {
        window.removeEventListener('resize', onResize)
      })
    })
}

onMounted(() => {
  initPixi().catch(e => {
    // 如果仍报错，把这里的 e 截图/复制给我，我会继续对症修
    console.error('[Christmas] init failed:', e)
  })
})

onBeforeUnmount(() => {
  if (rafResize) {
    cancelAnimationFrame(rafResize)
  }
  killSceneTweens()
  if (app) {
    if (tickerFn) {
      app.ticker.remove(tickerFn)
      tickerFn = null
    }
    app.destroy(true, { children: true, texture: true, textureSource: true })
    app = null
  }
})
</script>

<template>
  <div class="christmas-page">
    <div
      ref="canvasContainer"
      class="canvas-host"
    ></div>
  </div>
</template>

<style lang="scss" scoped>
.christmas-page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(1200px 800px at 50% 20%, rgba(90, 80, 200, 0.18), transparent 60%),
    linear-gradient(#050615, #07081a 40%, #06061a);
}

.canvas-host {
  width: 100%;
  height: 100%;
  min-height: 100vh;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
