/* eslint-disable */
// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

const RenderTarget = {
  current: () => "preview",
  hasRestrictions: () => false,
  canvas: "canvas",
  export: "export",
  preview: "preview",
  thumbnail: "thumbnail",
};

// Delivered by Originkit · stack: framer
// Paste into a Framer code component. Property controls included.
import * as React from "react"
import { useEffect, useRef } from "react"
/**
 * Pixel Swarm Dropdown
 * A select whose menu assembles out of a swarm of square pixel cells in the
 * selected option's colour, and bursts back up into the pill in the newly
 * picked option's colour while the value label scrambles into the new name.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

/** Tuning values. Stripped at publish; the tuned values are baked in here. */
const ADVANCED_DEFAULTS = {
    pillHeight: 83,
    labelInset: 35,
    menuGap: 16,
    rowPitch: 71,
    // 42 at the 83 px pill = fully round; rrPath clamps to half the height, so the reference look is unchanged.
    pillRadius: 42,
    menuRadius: 24,
    openMs: 535,
    closeMs: 435,
    closedRestMs: 600,
    closedRest2Ms: 930,
    openRestMs: 400,
    openRest2Ms: 930,
    stagger: 35,
    jitter: 10,
    spread: 54,
    arc: 150,
    shade: 30,
    density: 51,
    cellGap: 0,
    scramble: 39,
    pillColor: "#141414",
    pillBorder: "#2E2E2E",
    menuColor: "#121212",
    menuBorder: "#262626",
    hoverColor: "#222222",
    labelColor: "#8A8B88",
    valueColor: "#F2F0EE",
    rowColor: "#BDBBB8",
    hover: 50,
    grain: 0,
    vignette: 0,
}

// ── moved controls (builder) ──
/**
 * Controls moved in the builder: into Advanced, out of it, or into groups of
 * their own. The code reads each one where it was first written, so the props
 * are put back in that shape before anything reads them.
 */
const MOVED_CONTROLS: { into: Record<string, string>; out: Record<string, string> } = {"into":{"autoplay":"autoplayLoop","speed":"autoplayLoop"},"out":{"hover":"advanced"}}
/** The "Autoplay" group's defaults, for when Framer passes it unopened. */
const AUTOPLAY_LOOP_DEFAULTS = { autoplay: true, speed: 20 }
const GROUP_FALLBACKS: Record<string, any> = { advanced: ADVANCED_DEFAULTS, autoplayLoop: AUTOPLAY_LOOP_DEFAULTS }
function withMovedControls(props: any): any {
    const out = { ...props }
    for (const [k, g] of Object.entries(MOVED_CONTROLS.into)) out[k] = props?.[g]?.[k] ?? GROUP_FALLBACKS[g]?.[k]
    for (const [k, g] of Object.entries(MOVED_CONTROLS.out)) {
        if (out[k] !== undefined) out[g] = { ...(out[g] ?? {}), [k]: out[k] }
    }
    return out
}
// ── /moved controls ──

const DEFAULT_FAMILY =
    'Inter, "Inter Placeholder", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif'

type RGBA = [number, number, number, number]

function parseColor(input: any, fallback: RGBA): RGBA {
    if (typeof input !== "string") return fallback
    let s = input.trim()
    if (s === "transparent") return [0, 0, 0, 0]
    const v = s.match(/^var\([^,]+,\s*(.+)\)\s*$/)
    if (v) s = v[1].trim()
    if (s[0] === "#") {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        if (h.length === 6 || h.length === 8) {
            const n = parseInt(h.slice(0, 6), 16)
            const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
            if (isNaN(n)) return fallback
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
        }
        return fallback
    }
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1]
            .split(/[\s,\/]+/)
            .filter(Boolean)
            .map(parseFloat)
        return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 && !isNaN(p[3]) ? p[3] : 1]
    }
    return fallback
}

function rgbaCss(c: RGBA, alpha = 1) {
    return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(c[3] * alpha).toFixed(3)})`
}

function mixRGBA(a: RGBA, b: RGBA, t: number): RGBA {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

/* A cell's colour as #rrggbbaa from a lookup table: thousands of cells set it every frame, and this is
   far cheaper to build and parse than rgba(). Alpha in 8 bits is all the canvas keeps anyway. */
const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"))
const byte = (v: number) => HEX[v <= 0 ? 0 : v >= 255 ? 255 : v | 0]
const hexRGBA = (r: number, g: number, b: number, a: number) => "#" + byte(r) + byte(g) + byte(b) + byte(Math.round(clamp01(a) * 255))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, x: number) => {
    const t = clamp01((x - a) / (b - a))
    return t * t * (3 - 2 * t)
}

function bezierEase(x1: number, y1: number, x2: number, y2: number) {
    const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
    const by = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
    const N = 256
    const lut = new Float32Array(N + 1)
    for (let i = 0; i <= N; i++) {
        const x = i / N
        let lo = 0
        let hi = 1
        for (let k = 0; k < 22; k++) {
            const m = (lo + hi) / 2
            if (bx(m) < x) lo = m
            else hi = m
        }
        lut[i] = by((lo + hi) / 2)
    }
    return (x: number) => {
        if (x <= 0) return 0
        if (x >= 1) return 1
        const k = x * N
        const i = k | 0
        return lut[i] + (lut[i + 1] - lut[i]) * (k - i)
    }
}

// Measured on the reference: opens ease-in-out, closes ease-out.
const OPEN_EASE = bezierEase(0.03, 0.15, 0.7, 1)
/** Slowest pace a demo move plays at, so Loop Speed 0 cannot freeze one mid-flight. */
const MIN_LOOP_TEMPO = 0.1
const CLOSE_EASE = bezierEase(0.5, 0, 0.45, 0.86)

function mulberry32(a: number) {
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function hash2(a: number, b: number) {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
    return s - Math.floor(s)
}

function rrPath(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2))
    c.beginPath()
    c.moveTo(x + rr, y)
    c.lineTo(x + w - rr, y)
    c.arcTo(x + w, y, x + w, y + rr, rr)
    c.lineTo(x + w, y + h - rr)
    c.arcTo(x + w, y + h, x + w - rr, y + h, rr)
    c.lineTo(x + rr, y + h)
    c.arcTo(x, y + h, x, y + h - rr, rr)
    c.lineTo(x, y + rr)
    c.arcTo(x, y, x + rr, y, rr)
    c.closePath()
}

// Demo pick order: Verdant → Obsidian → Tidecaller → Aurora → Ember → …
function demoOrder(n: number) {
    if (n <= 1) return [0]
    const s = [n - 1]
    for (let i = 2; i <= n - 2; i++) s.push(i)
    s.push(0)
    s.push(1)
    return s.filter((v, i, a) => v < n && a.indexOf(v) === i)
}

function normOptions(raw: any) {
    const list = Array.isArray(raw) ? raw : []
    const out = list.map((o: any, i: number) => ({
        label: typeof o?.label === "string" && o.label.length ? o.label : `Option ${i + 1}`,
        rgb: parseColor(o?.color, [255, 255, 255, 1]),
    }))
    return out.length ? out : [{ label: "Option", rgb: [255, 255, 255, 1] as RGBA }]
}

function layout(W: number, H: number, size: number, n: number, adv: any, ox = 0, oy = 0) {
    const ph0 = Math.max(40, adv.pillHeight)
    const gap0 = Math.max(0, adv.menuGap)
    const pitch0 = Math.max(30, adv.rowPitch)
    const refH = ph0 + gap0 + 18 + n * pitch0
    const u = Math.max(0.15, Math.min(Math.max(1, size) / 477, (W * 0.94) / 477, (H * 0.92) / refH))
    const pw = 477 * u
    const ph = ph0 * u
    // Offsets are frame px, not scaled with Size, so 100 always moves it 100 px.
    const px = (W - pw) / 2 + (Number(ox) || 0)
    const py = (H - refH * u) / 2 + (Number(oy) || 0)
    const mx = Math.round(px + 2 * u)
    const my = Math.round(py + ph + gap0 * u)
    const mw = Math.max(1, Math.round(pw - 4 * u))
    const mh = Math.max(1, Math.round((18 + n * pitch0) * u))
    return { u, pw, ph, px, py, mx, my, mw, mh, pitch: pitch0 * u, pad: 9 * u, n }
}

/** Canvas font family: a bare name is quoted, and the default stack always backs it. */
function fontStack(family: any) {
    if (typeof family !== "string" || !family.trim()) return DEFAULT_FAMILY
    const f = family.trim()
    return /[,"']/.test(f) ? `${f}, ${DEFAULT_FAMILY}` : `"${f}", ${DEFAULT_FAMILY}`
}

type Cell = {
    hx: number
    hy: number
    cw: number
    ch: number
    cf: number
    rf: number
    r1: number
    r2: number
    r3: number
    r4: number
    dn: number
    aa: number
    ar: number
    ag: number
    ab: number
    sr: number
    sg: number
    sb: number
}

export default function PixelSwarmDropdown(props: any) {
    props = withMovedControls(props)
    const {
        options = [
            { label: "Aurora Veil", color: "#8B6FE0" },
            { label: "Ember Rite", color: "#E8622C" },
            { label: "Obsidian Omen", color: "#CFCAC4" },
            { label: "Tidecaller", color: "#2F7AD3" },
            { label: "Verdant Sigil", color: "#65C542" },
        ],
        label = "Vibe",
        font = {"variant":"Regular","fontSize":25,"textAlign":"left","fontFamily":"Inter","fontWeight":400,"lineHeight":"1.5em","letterSpacing":"0em"},
        size = 421,
        offsetX = 0,
        offsetY = 0,
        cellSize = 3,
        speed = 20,
        autoplay = true,
        openSpeed = 50,
        closeSpeed = 50,
        style,
    } = props
    const background = props.background || "#000000"

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cfgRef = useRef<any>(null)
    cfgRef.current = {
        background,
        options,
        label,
        font,
        size,
        offsetX,
        offsetY,
        cellSize,
        speed,
        autoplay,
        openSpeed,
        closeSpeed,
        adv: { ...ADVANCED_DEFAULTS, ...(props.advanced ?? {}) },
    }

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rt = RenderTarget.current()
        const isStatic = rt === RenderTarget.thumbnail || rt === (RenderTarget as any).export
        const mq =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        let reduced = !!mq?.matches
        const onMq = () => {
            reduced = !!mq?.matches
        }
        mq?.addEventListener?.("change", onMq)

        let W = 0
        let H = 0
        let dpr = 1
        // Drawn at the size it is shown. The builder fit, a scaled preview or the canvas zoom shrink
        // the root with a CSS transform, and the layout-size bitmap was resampled by it, so the type
        // read hazy. The canvas is laid out at zoom x size and scaled back by 1/zoom, so its layout and
        // visual widths match and every buffer pixel is a screen pixel.
        let zoom = 1
        const readZoom = () => {
            const w = root.getBoundingClientRect().width
            return root.offsetWidth > 0 && w > 0 ? Math.min(2, Math.max(0.1, w / root.offsetWidth)) : 1
        }
        const resize = () => {
            W = root.offsetWidth
            H = root.offsetHeight
            zoom = readZoom()
            // Capped at 3 buffer px per CSS px, so a zoomed-in canvas stays within budget.
            dpr = Math.min(Math.min(2, window.devicePixelRatio || 1) * zoom, 3)
            canvas.style.width = `${W * zoom}px`
            canvas.style.height = `${H * zoom}px`
            canvas.style.transform = zoom === 1 ? "" : `scale(${1 / zoom})`
            canvas.width = Math.max(1, Math.round(W * dpr))
            canvas.height = Math.max(1, Math.round(H * dpr))
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(root)

        const menuCv = document.createElement("canvas")
        const mctx = menuCv.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D

        const noise = document.createElement("canvas")
        noise.width = noise.height = 128
        const nctx = noise.getContext("2d")
        if (nctx) {
            const id = nctx.createImageData(128, 128)
            const rnd = mulberry32(77)
            for (let i = 0; i < id.data.length; i += 4) {
                const v = rnd() * 255
                id.data[i] = id.data[i + 1] = id.data[i + 2] = v
                id.data[i + 3] = 255
            }
            nctx.putImageData(id, 0, 0)
        }
        const grainPat = ctx.createPattern(noise, "repeat")

        const S = {
            phase: "closed" as "closed" | "opening" | "open" | "closing",
            t: 0,
            sel: -1,
            prevSel: -1,
            cycle: 0,
            demoHover: -1,
            closeHover: -1,
            vibe: [255, 255, 255, 1] as RGBA,
            cells: [] as Cell[],
            csx: 8,
            csy: 8,
            buildKey: "",
            chev: 0,
            pill: 0,
            manualUntil: 0,
            wasManual: false,
            seed: 1,
            valueX: 0,
            valueW: 0,
            request: null as null | { kind: "open" | "close"; target?: number },
        }
        const ptr = { x: 0, y: 0, inside: false, over: 0 }
        let L: ReturnType<typeof layout> | null = null

        const inPill = (x: number, y: number) =>
            !!L && x >= L.px && x <= L.px + L.pw && y >= L.py && y <= L.py + L.ph
        const rowAt = (x: number, y: number) => {
            if (!L) return -1
            if (x < L.mx || x > L.mx + L.mw || y < L.my || y > L.my + L.mh) return -1
            const r = Math.floor((y - L.my - L.pad) / L.pitch)
            return r >= 0 && r < L.n ? r : -1
        }

        const onMove = (e: PointerEvent) => {
            // The canvas is laid out at zoom x the root, so its offsets are too.
            const k = e.target === canvas ? zoom : 1
            ptr.x = e.offsetX / k
            ptr.y = e.offsetY / k
            ptr.inside = true
            const hot = inPill(ptr.x, ptr.y) || ((S.phase === "open" || S.phase === "opening") && rowAt(ptr.x, ptr.y) >= 0)
            canvas.style.cursor = hot ? "pointer" : "default"
        }
        const onLeave = () => {
            ptr.inside = false
        }
        const onDown = (e: PointerEvent) => {
            onMove(e)
            if (!L) return
            // A press while the swarm is in flight counts too: it waits for the menu to land, then plays.
            if (S.phase === "closed" || S.phase === "closing") {
                if (!inPill(ptr.x, ptr.y)) return
                S.request = { kind: "open" }
            } else {
                const r = rowAt(ptr.x, ptr.y)
                S.request = { kind: "close", target: r >= 0 ? r : S.sel }
            }
            S.manualUntil = performance.now() + 5000
            S.wasManual = true
        }
        const onUp = () => {}
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointerleave", onLeave)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onUp)

        // Canvas letter spacing, where the browser has it (Chrome, Safari 18, Firefox 115).
        const setSpacing = (c: CanvasRenderingContext2D, ls: string) => {
            if ("letterSpacing" in c) (c as any).letterSpacing = ls
        }

        // The menu image is repainted only when something on it changes; a webfont landing counts.
        let menuKey = ""
        let fontGen = 0
        const onFonts = () => {
            fontGen++
        }
        document.fonts?.addEventListener?.("loadingdone", onFonts)

        const drawMenu = (Lm: NonNullable<typeof L>, opts: any[], sel: number, hov: number, C: any, F: any) => {
            const w = Math.max(1, Math.round(Lm.mw * dpr))
            const h = Math.max(1, Math.round(Lm.mh * dpr))
            const key = [w, h, dpr, Lm.u, Lm.pitch, Lm.pad, sel, hov, F.value, F.ls, C.menu, C.menuBorder, C.hover, C.row, C.value, C.menuRadius, fontGen, opts.map((o) => o.label).join("\n")].join("|")
            if (key === menuKey) return
            menuKey = key
            if (menuCv.width !== w || menuCv.height !== h) {
                menuCv.width = w
                menuCv.height = h
            }
            const u = Lm.u
            mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            mctx.clearRect(0, 0, Lm.mw, Lm.mh)
            rrPath(mctx, 0.5, 0.5, Lm.mw - 1, Lm.mh - 1, C.menuRadius * u)
            mctx.fillStyle = C.menu
            mctx.fill()
            mctx.lineWidth = 1
            mctx.strokeStyle = C.menuBorder
            mctx.stroke()
            if (hov >= 0 && hov < Lm.n) {
                rrPath(mctx, 9 * u, Lm.pad + hov * Lm.pitch + Lm.pitch * 0.03, Lm.mw - 18 * u, Lm.pitch * 0.94, 12 * u)
                mctx.fillStyle = C.hover
                mctx.fill()
            }
            mctx.textBaseline = "middle"
            // Every row keeps one weight, so picking one doesn't reflow its letters; colour and the check mark it.
            mctx.font = F.value
            setSpacing(mctx, F.ls)
            for (let i = 0; i < Lm.n; i++) {
                const y = Lm.pad + (i + 0.5) * Lm.pitch
                const on = i === sel
                mctx.fillStyle = on ? C.value : C.row
                mctx.fillText(opts[i].label, 27 * u, y)
                if (on) {
                    const cx = Lm.mw - 33 * u
                    mctx.beginPath()
                    mctx.moveTo(cx - 6 * u, y)
                    mctx.lineTo(cx - 2 * u, y + 4 * u)
                    mctx.lineTo(cx + 6 * u, y - 5 * u)
                    mctx.lineWidth = 2 * u
                    mctx.lineCap = "round"
                    mctx.lineJoin = "round"
                    mctx.strokeStyle = C.value
                    mctx.stroke()
                }
            }
        }

        // The menu image goes down 1:1 on whole device pixels. Stretched into its CSS box instead, a
        // buffer of round(mw x dpr) px landed a fraction of a pixel off the screen grid and every row of
        // text was resampled soft.
        const blitMenu = (Lm: NonNullable<typeof L>) => {
            ctx.save()
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.drawImage(menuCv, Math.round(Lm.mx * dpr), Math.round(Lm.my * dpr))
            ctx.restore()
        }

        const cellKey = (Lm: NonNullable<typeof L>, cs: number) => `${Lm.mx},${Lm.my},${Lm.mw},${Lm.mh},${cs},${dpr}`

        // The grid divides the card evenly (cells stretch a touch off square), so no column or
        // row hangs over its edge however big the pixels get. The seed is the transition's, so a
        // rebuild mid-flight (a resize) keeps every cell on its path.
        const buildCells = (Lm: NonNullable<typeof L>, cs: number, adv: any) => {
            const cols = Math.max(1, Math.round(Lm.mw / cs))
            const rows = Math.max(1, Math.round(Lm.mh / cs))
            const csx = Lm.mw / cols
            const csy = Lm.mh / rows
            const MW = menuCv.width
            const MH = menuCv.height
            let data: Uint8ClampedArray
            try {
                data = mctx.getImageData(0, 0, MW, MH).data
            } catch {
                data = new Uint8ClampedArray(MW * MH * 4)
            }
            const rand = mulberry32(S.seed * 7919)
            const sh = Math.max(0, adv.shade) / 100
            const dens = clamp01(adv.density / 100)
            const [vr, vg, vb] = S.vibe
            const cells: Cell[] = []
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const hx = c * csx
                    const hy = r * csy
                    const cw = csx
                    const ch = csy
                    let sr = 0
                    let sg = 0
                    let sb = 0
                    let sa = 0
                    for (let j = 0; j < 4; j++) {
                        for (let i = 0; i < 4; i++) {
                            const px = Math.min(MW - 1, Math.floor((hx + ((i + 0.5) * cw) / 4) * dpr))
                            const py = Math.min(MH - 1, Math.floor((hy + ((j + 0.5) * ch) / 4) * dpr))
                            const o = (py * MW + px) * 4
                            const al = data[o + 3]
                            sr += data[o] * al
                            sg += data[o + 1] * al
                            sb += data[o + 2] * al
                            sa += al
                        }
                    }
                    const cf = (c + 0.5) / cols
                    const rf = (r + 0.5) / rows
                    const s = Math.max(-1, Math.min(1, (rand() - 0.5) * 2 * sh + (0.5 - cf) * sh * 0.6))
                    const to = s > 0 ? 255 : 0
                    const k = Math.abs(s)
                    cells.push({
                        hx,
                        hy,
                        cw,
                        ch,
                        cf,
                        rf,
                        r1: rand(),
                        r2: rand(),
                        r3: rand(),
                        r4: rand(),
                        dn: rand() < dens ? 1 : 0.35,
                        aa: sa / (16 * 255),
                        ar: sa > 0 ? sr / sa : 0,
                        ag: sa > 0 ? sg / sa : 0,
                        ab: sa > 0 ? sb / sa : 0,
                        sr: vr + (to - vr) * k,
                        sg: vg + (to - vg) * k,
                        sb: vb + (to - vb) * k,
                    })
                }
            }
            S.cells = cells
            S.csx = csx
            S.csy = csy
            S.buildKey = cellKey(Lm, cs)
        }

        let raf = 0
        let last = -1
        let zoomTick = 0
        // Off screen the loop stops; the observer below restarts it on return.
        let visible = true
        const frame = (now: number) => {
            if (!visible) {
                raf = 0
                return
            }
            raf = requestAnimationFrame(frame)
            // Canvas zoom fires no ResizeObserver, so the shown scale is re-read every 30 frames.
            if (++zoomTick % 30 === 0 && Math.abs(readZoom() - zoom) > zoom * 0.01) resize()
            // Capped at 0.1 s (was 0.05): a 50-100 ms hitch while the swarm flies used to stretch the move
            // past its Open or Close Speed; now it catches up instead.
            let dt = last < 0 ? 0 : Math.min(0.1, (now - last) / 1000)
            last = now
            if (isStatic) dt = 0
            if (W < 2 || H < 2) return

            const cfg = cfgRef.current
            const adv = cfg.adv
            const opts = normOptions(cfg.options)
            const n = opts.length
            if (S.sel < 0 || S.sel >= n) S.sel = n - 1
            L = layout(W, H, cfg.size, n, adv, cfg.offsetX, cfg.offsetY)
            const Lc = L
            const u = Lc.u
            const hoverK = Math.max(0, adv.hover) / 50
            // Loop Speed paces the autoplay demo, its pauses and its moves alike. Open Speed and Close
            // Speed pace the two moves themselves, for a click and for the demo (which also takes its
            // Loop Speed). 50 is the reference tempo on all three. A click no longer borrows Loop Speed,
            // so Open and Close are the only say over how a clicked menu moves.
            const tempo = Math.max(0, cfg.speed) / 50
            // Loop Speed 0 holds the demo between moves; a move already under way still finishes at
            // this floor instead of freezing half-built.
            const loopK = S.wasManual ? 1 : Math.max(MIN_LOOP_TEMPO, tempo)
            const step =
                dt *
                (S.phase === "opening"
                    ? loopK * Math.max(10, Number(cfg.openSpeed) || 50) / 50
                    : S.phase === "closing"
                      ? loopK * Math.max(10, Number(cfg.closeSpeed) || 50) / 50
                      : tempo)
            const fnt = cfg.font ?? {}
            const fam = fontStack(fnt.fontFamily)
            const fs = (parseFloat(fnt.fontSize) || 25) * u
            // The label takes the font's weight and the value sits one step heavier, as at the default 400 / 500.
            const fw = Math.max(100, Math.min(900, parseInt(fnt.fontWeight, 10) || 400))
            const it = fnt.fontStyle === "italic" ? "italic " : ""
            const lsv = String(fnt.letterSpacing ?? "0em").trim()
            const lsn = parseFloat(lsv) || 0
            const F = {
                label: `${it}${fw} ${fs}px ${fam}`,
                value: `${it}${Math.min(900, fw + 100)} ${fs}px ${fam}`,
                ls: `${(/em$/.test(lsv) ? lsn * fs : lsn * u).toFixed(2)}px`,
            }
            const openD = reduced ? 0 : Math.max(0, adv.openMs) / 1000
            const closeD = reduced ? 0 : Math.max(0, adv.closeMs) / 1000
            const cs = Math.max(2, Math.round(cfg.cellSize))

            const C = {
                bg: rgbaCss(parseColor(cfg.background, [0, 0, 0, 1])),
                pill: rgbaCss(parseColor(adv.pillColor, [20, 20, 20, 1])),
                pillBorder: parseColor(adv.pillBorder, [46, 46, 46, 1]),
                menu: rgbaCss(parseColor(adv.menuColor, [18, 18, 18, 1])),
                menuBorder: rgbaCss(parseColor(adv.menuBorder, [38, 38, 38, 1])),
                hover: rgbaCss(parseColor(adv.hoverColor, [34, 34, 34, 1])),
                labelRGB: parseColor(adv.labelColor, [138, 139, 136, 1]),
                valueRGB: parseColor(adv.valueColor, [242, 240, 238, 1]),
                label: "",
                value: "",
                row: rgbaCss(parseColor(adv.rowColor, [189, 187, 184, 1])),
                menuRadius: Math.max(0, adv.menuRadius),
                pillRadius: Math.max(0, adv.pillRadius),
                shadow: 1,
            }
            C.label = rgbaCss(C.labelRGB)
            C.value = rgbaCss(C.valueRGB)

            // pointer easing
            ptr.over += ((ptr.inside ? 1 : 0) - ptr.over) * (1 - Math.exp(-dt * 8))
            const pillTarget = ptr.inside && inPill(ptr.x, ptr.y) ? Math.min(2, hoverK) : 0
            S.pill += (pillTarget - S.pill) * (1 - Math.exp(-dt * 10))

            // demo / manual hand-off
            const demo = !!cfg.autoplay && !reduced && !isStatic && now >= S.manualUntil
            if (demo && S.wasManual) {
                S.wasManual = false
                if (S.phase === "closed" || S.phase === "open") S.t = 0
            }

            S.t += step
            if (S.phase === "opening" && S.t >= openD) {
                S.phase = "open"
                S.t = 0
                S.demoHover = -1
            }
            if (S.phase === "closing" && S.t >= closeD) {
                S.phase = "closed"
                S.t = 0
                S.cycle++
            }

            const even = S.cycle % 2 === 0
            if (demo && !S.request) {
                if (S.phase === "closed") {
                    if (S.t >= Math.max(0, even ? adv.closedRestMs : adv.closedRest2Ms) / 1000) S.request = { kind: "open" }
                } else if (S.phase === "open") {
                    const rest = Math.max(0, even ? adv.openRestMs : adv.openRest2Ms) / 1000
                    const seq = demoOrder(n)
                    const idx = seq.indexOf(S.sel)
                    const target = seq[(idx + 1) % seq.length]
                    let before = target - 1
                    if (before === S.sel) before--
                    const f = S.t / Math.max(0.001, rest)
                    if (rest >= 0.7 && before >= 0) S.demoHover = f < 0.3 ? -1 : f < 0.7 ? before : target
                    else S.demoHover = f < 0.4 ? -1 : target
                    if (S.t >= rest) S.request = { kind: "close", target }
                }
            }

            // A request waits until the menu is in the state it acts on.
            if (S.request && (S.request.kind === "open" ? S.phase === "closed" : S.phase === "open")) {
                const r = S.request
                S.request = null
                if (r.kind === "open" && S.phase === "closed") {
                    S.vibe = opts[S.sel].rgb
                    S.demoHover = -1
                    S.t = 0
                    if (openD > 0) {
                        S.seed++
                        drawMenu(Lc, opts, S.sel, -1, C, F)
                        buildCells(Lc, cs, adv)
                        S.phase = "opening"
                    } else S.phase = "open"
                } else if (r.kind === "close" && S.phase === "open") {
                    const target = Math.max(0, Math.min(n - 1, r.target ?? S.sel))
                    S.prevSel = S.sel
                    S.sel = target
                    S.closeHover = target
                    S.vibe = opts[target].rgb
                    S.t = 0
                    if (closeD > 0) {
                        S.seed++
                        drawMenu(Lc, opts, S.sel, target, C, F)
                        buildCells(Lc, cs, adv)
                        S.phase = "closing"
                    } else {
                        S.phase = "closed"
                        S.cycle++
                    }
                }
            }

            // current hover row and menu image
            let hov = -1
            if (S.phase === "open") {
                const pr = ptr.inside ? rowAt(ptr.x, ptr.y) : -1
                hov = pr >= 0 ? pr : demo ? S.demoHover : -1
            } else if (S.phase === "closing") hov = S.closeHover
            if (S.phase !== "closed") drawMenu(Lc, opts, S.sel, hov, C, F)
            // Resized or re-pixelled mid-flight: re-cut the grid from the new menu, same paths.
            if ((S.phase === "opening" || S.phase === "closing") && S.buildKey !== cellKey(Lc, cs)) buildCells(Lc, cs, adv)

            // value metrics
            const cy = Lc.py + Lc.ph / 2
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            setSpacing(ctx, F.ls)
            ctx.font = F.label
            const labelText = typeof cfg.label === "string" ? cfg.label : ""
            const labelW = labelText ? ctx.measureText(labelText).width : 0
            const labelX = Lc.px + Math.max(0, adv.labelInset) * u
            S.valueX = labelText ? labelX + labelW + fs * 0.7 : labelX
            ctx.font = F.value
            const valueText = opts[S.sel].label
            S.valueW = Math.max(60 * u, ctx.measureText(valueText).width)

            // ── draw ──
            ctx.clearRect(0, 0, W, H)
            ctx.fillStyle = C.bg
            ctx.fillRect(0, 0, W, H)

            // The card's solid backing and shadow only come in as the swarm lands, and go first as
            // it lifts off; until then the cells themselves are the card.
            const openness =
                S.phase === "open"
                    ? 1
                    : S.phase === "opening"
                      ? smooth(0.7, 1, S.t / Math.max(0.001, openD))
                      : S.phase === "closing"
                        ? 1 - smooth(0, 0.3, S.t / Math.max(0.001, closeD))
                        : 0
            if (openness > 0.001) {
                ctx.save()
                ctx.globalAlpha = openness
                ctx.shadowColor = `rgba(0,0,0,${(0.45 * C.shadow * openness).toFixed(3)})`
                ctx.shadowBlur = 32 * u
                ctx.shadowOffsetY = 12 * u
                rrPath(ctx, Lc.mx, Lc.my, Lc.mw, Lc.mh, C.menuRadius * u)
                ctx.fillStyle = C.menu
                ctx.fill()
                ctx.restore()
            }

            if (S.phase === "open") {
                blitMenu(Lc)
            } else if (S.phase === "opening" || S.phase === "closing") {
                const opening = S.phase === "opening"
                const D = opening ? openD : closeD
                const gx = S.csx
                const gy = S.csy
                const stag = clamp01(adv.stagger / 100)
                const jit = clamp01(adv.jitter / 100)
                const fl = Math.max(D * 0.15, D * (1 - stag - jit))
                const gap = Math.max(0, adv.cellGap)
                const cxm = Lc.mx + Lc.mw / 2
                const appear = opening ? Math.min(1, S.t / 0.06) : 1
                const push = hoverK * 0.03 * W * ptr.over
                const sig2 = 2 * (70 * u) * (70 * u)
                const spread = Math.max(0, adv.spread) / 100
                const arc = Math.max(0, adv.arc) / 100
                const progress = (c: Cell) => {
                    const delay = (opening ? c.rf : 1 - c.rf) * stag * D + c.r1 * jit * D
                    return D > 0 ? clamp01((S.t - delay) / fl) : 1
                }

                // Cells at home show the menu itself. They're merged into runs along each row, with
                // whole-pixel edges so neighbours butt up without a seam, and the menu is drawn once
                // through them: one draw rather than a slice per cell.
                ctx.save()
                ctx.beginPath()
                let runY = 0
                let runH = 0
                let runX0 = 0
                let runX1 = 0
                let runs = 0
                const flush = () => {
                    if (runX1 <= runX0 || runH <= 0) return
                    ctx.rect(Lc.mx + runX0, Lc.my + runY, runX1 - runX0, runH)
                    runs++
                }
                for (let i = 0; i < S.cells.length; i++) {
                    const c = S.cells[i]
                    const p = progress(c)
                    if (opening ? p < 1 : p > 0) continue
                    const x0 = Math.round(c.hx)
                    const y0 = Math.round(c.hy)
                    const x1 = Math.round(c.hx + c.cw)
                    if (runX1 > runX0 && y0 === runY && x0 === runX1) {
                        runX1 = x1
                        continue
                    }
                    flush()
                    runY = y0
                    runH = Math.round(c.hy + c.ch) - y0
                    runX0 = x0
                    runX1 = x1
                }
                flush()
                if (runs > 0) {
                    ctx.clip()
                    blitMenu(Lc)
                }
                ctx.restore()

                for (let i = 0; i < S.cells.length; i++) {
                    const c = S.cells[i]
                    const p = progress(c)
                    if (opening ? p >= 1 : p <= 0) continue
                    const hxA = Lc.mx + c.hx
                    const hyA = Lc.my + c.hy
                    if (!opening && p >= 1) continue
                    if (c.aa < 0.2) continue
                    let x: number
                    let y: number
                    let r: number
                    let g: number
                    let b: number
                    let a: number
                    let s = 1
                    if (opening) {
                        const e = OPEN_EASE(p)
                        const sx = cxm + (hxA + gx / 2 - cxm) * spread + (c.r3 - 0.5) * 16 * u - gx / 2
                        const sy = cy + c.r2 * Lc.ph * 0.95
                        // The outward bow grows from nothing at the centre line, so the two halves don't
                        // part down the middle (a hard left/right flip there split the swarm in two).
                        const side = Math.max(-1, Math.min(1, (hxA + gx / 2 - cxm) / (Lc.mw / 2))) * c.r4 * 12 * u
                        x = sx + (hxA - sx) * e + side * Math.sin(Math.PI * e)
                        y = sy + (hyA - sy) * e
                        const k = smooth(0.55, 1, p)
                        r = lerp(c.sr, c.ar, k)
                        g = lerp(c.sg, c.ag, k)
                        b = lerp(c.sb, c.ab, k)
                        a = lerp(c.dn, c.aa, k) * appear
                    } else {
                        const e = CLOSE_EASE(p)
                        const tx = S.valueX + ((c.hx + gx / 2) / Lc.mw) * S.valueW - gx / 2 + (c.r3 - 0.5) * 8 * u
                        const ty = cy + (c.r2 - 0.5) * Lc.ph * 0.4 - gy / 2
                        const qx = lerp(hxA, tx, 0.55) + (c.r3 - 0.5) * 40 * u
                        const qy = Math.max(Lc.py, Lc.py - Lc.ph * arc * (0.2 + 0.8 * c.r4))
                        const m = 1 - e
                        x = m * m * hxA + 2 * e * m * qx + e * e * tx
                        y = m * m * hyA + 2 * e * m * qy + e * e * ty
                        const k = smooth(0, 0.2, p)
                        r = lerp(c.ar, c.sr, k)
                        g = lerp(c.ag, c.sg, k)
                        b = lerp(c.ab, c.sb, k)
                        a = lerp(c.aa, c.dn, k)
                        const fade = 1 - smooth(0.72, 1, p)
                        s = 0.3 + 0.7 * fade
                        a *= fade
                    }
                    if (push > 0.01) {
                        const dx = x - ptr.x
                        const dy = y - ptr.y
                        const d2 = dx * dx + dy * dy + 1
                        const f = (push * Math.exp(-d2 / sig2)) / Math.sqrt(d2)
                        x += dx * f
                        y += dy * f
                    }
                    if (!opening) y = Math.max(y, Lc.py) // stay inside the pill, never above it
                    // Snap to the card's own grid, so a cell in flight sits exactly where a landed one would.
                    x = Lc.mx + Math.round((x - Lc.mx) / gx) * gx
                    y = Lc.my + Math.round((y - Lc.my) / gy) * gy
                    const w = Math.max(1, gx * s - gap)
                    const h = Math.max(1, gy * s - gap)
                    const x0 = Math.round(x + (gx - w) / 2)
                    const y0 = Math.round(y + (gy - h) / 2)
                    ctx.fillStyle = hexRGBA(r, g, b, a)
                    ctx.fillRect(x0, y0, Math.round(x + (gx + w) / 2) - x0, Math.round(y + (gy + h) / 2) - y0)
                }
            }

            // ── pill (on top of the swarm) ──
            ctx.save()
            ctx.shadowColor = `rgba(0,0,0,${((0.35 + 0.15 * S.pill) * C.shadow).toFixed(3)})`
            ctx.shadowBlur = (8 + 10 * S.pill) * u
            ctx.shadowOffsetY = (2 + 3 * S.pill) * u
            rrPath(ctx, Lc.px, Lc.py, Lc.pw, Lc.ph, C.pillRadius * u)
            ctx.fillStyle = C.pill
            ctx.fill()
            ctx.restore()
            rrPath(ctx, Lc.px + 0.5, Lc.py + 0.5, Lc.pw - 1, Lc.ph - 1, Math.max(0, C.pillRadius * u - 0.5))
            ctx.lineWidth = 1
            ctx.strokeStyle = rgbaCss(mixRGBA(C.pillBorder, C.valueRGB, Math.min(0.7, 0.35 * S.pill)))
            ctx.stroke()

            ctx.textBaseline = "middle"
            if (labelText) {
                ctx.font = F.label
                ctx.fillStyle = C.label
                ctx.fillText(labelText, labelX, cy)
            }

            const chevX = Lc.px + Lc.pw - 41 * u
            ctx.save()
            ctx.beginPath()
            ctx.rect(S.valueX - 2, Lc.py, Math.max(0, chevX - 14 * u - S.valueX), Lc.ph)
            ctx.clip()
            ctx.font = F.value
            ctx.fillStyle = C.value
            const sp = S.phase === "closing" && closeD > 0 ? S.t / closeD : -1
            const speck = Math.max(1.5, 2.6 * u)
            const tick = Math.floor(S.t / 0.05)
            const drawSpecks = (x0: number, w: number, seed: number, count: number) => {
                for (let k = 0; k < count; k++) {
                    const hx = hash2(seed * 13 + k, tick)
                    const hy = hash2(seed * 7 + k * 3, tick + 17)
                    const hs = hash2(seed + k * 5, tick + 31)
                    const z = speck * (0.7 + hs * 0.6)
                    const sx = Math.round((x0 + hx * w) / speck) * speck
                    const sy = Math.round((cy + (hy - 0.5) * fs * 0.7) / speck) * speck
                    ctx.fillStyle = k % 2 === 0 ? rgbaCss(S.vibe) : C.label
                    ctx.fillRect(sx, sy, z, z)
                }
            }
            if (sp < 0) {
                ctx.fillText(valueText, S.valueX, cy)
            } else if (sp < 0.12) {
                const old = opts[S.prevSel]?.label ?? valueText
                ctx.fillText(old, S.valueX, cy)
                drawSpecks(S.valueX, ctx.measureText(old).width, 99, Math.ceil(old.length * sp * 20))
            } else {
                const len = Math.max(1, valueText.length)
                const amt = clamp01(adv.scramble / 100)
                // Each letter goes where it sits in the whole word, so the settled word doesn't shuffle
                // when it's redrawn in one piece. The word up to and including a letter, less the
                // letter's own advance, is its start: that keeps the kern before it (the V–e in "Veil").
                let x0 = 0
                for (let i = 0; i < valueText.length; i++) {
                    const ch = valueText[i]
                    const x1 = ctx.measureText(valueText.slice(0, i + 1)).width
                    const at = x1 - ctx.measureText(ch).width
                    const settle = 0.25 + amt * 0.75 * ((i + 1) / len)
                    if (sp >= settle) {
                        ctx.fillStyle = C.value
                        ctx.fillText(ch, S.valueX + at, cy)
                    } else if (ch !== " ") {
                        drawSpecks(S.valueX + x0, x1 - x0, i + 1, 5)
                    }
                    x0 = x1
                }
            }
            ctx.restore()

            const chevTarget = S.phase === "opening" || S.phase === "open" ? Math.PI : 0
            S.chev += (chevTarget - S.chev) * (dt > 0 ? 1 - Math.exp(-dt * 18) : S.chev === 0 && chevTarget === 0 ? 0 : 1)
            ctx.save()
            ctx.translate(chevX, cy)
            ctx.rotate(S.chev)
            ctx.beginPath()
            ctx.moveTo(-6 * u, -2.5 * u)
            ctx.lineTo(0, 3.5 * u)
            ctx.lineTo(6 * u, -2.5 * u)
            ctx.lineWidth = 2.2 * u
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.strokeStyle = C.value
            ctx.stroke()
            ctx.restore()

            // ── overlays ──
            const grain = clamp01(adv.grain / 100)
            if (grain > 0 && grainPat) {
                ctx.save()
                ctx.globalAlpha = grain * 0.22
                const ox = Math.floor(hash2(now * 0.01, 1) * 128)
                const oy = Math.floor(hash2(now * 0.01, 2) * 128)
                ctx.translate(-ox, -oy)
                ctx.fillStyle = grainPat
                ctx.fillRect(0, 0, W + 128, H + 128)
                ctx.restore()
            }
            const vig = clamp01(adv.vignette / 100)
            if (vig > 0) {
                const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75)
                gr.addColorStop(0, "rgba(0,0,0,0)")
                gr.addColorStop(1, `rgba(0,0,0,${(vig * 0.85).toFixed(3)})`)
                ctx.fillStyle = gr
                ctx.fillRect(0, 0, W, H)
            }
        }
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting
            if (visible && !raf) {
                last = -1
                raf = requestAnimationFrame(frame)
            }
        })
        io.observe(root)
        raf = requestAnimationFrame(frame)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            mq?.removeEventListener?.("change", onMq)
            document.fonts?.removeEventListener?.("loadingdone", onFonts)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointerleave", onLeave)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
        }
    }, [])

    // The Background sits on the canvas, not the root: a painted root under a CSS-scaled canvas
    // makes Chrome resample the canvas into that layer, which softens the type even at 1:1.
    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                minWidth: 1200,
                minHeight: 800,
                width: "100%",
                height: "100%",
                ...style,
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", transformOrigin: "0 0", background }}
            />
        </div>
    )
}

