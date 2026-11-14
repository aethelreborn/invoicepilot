// Replacement for the Originkit formula-stream component.
// The original file was truncated during an edit and the Originkit daily
// fetch limit was reached before it could be restored, so this is a
// from-scratch alternative: a dark strip of drifting ledger math, built
// for invoice AR semantics instead of physics.
"use client"

import * as React from "react"
import { useEffect, useMemo, useRef } from "react"

const FORMULAS = [
    "outstanding = Σ total − Σ paid",
    "days late = today − due date",
    "total = Σ quantity × unit price",
    "DSO = AR ÷ revenue × 365",
    "fee = 0, always",
    "settle lag = settled − sent",
    "ageing bucket = today − due",
    "remind ahead = T − 3 · friendly",
    "remind on due = T · friendly",
    "remind 1 = T + 3 · firm",
    "remind 2 = T + 7 · firm",
    "remind last = T + 14 · final",
    "stop when paid",
    "avg days to pay = Σ lag ÷ n",
]

interface FontLike {
    fontFamily?: string
    fontStyle?: string
    fontWeight?: number | string
    fontSize?: number
}

interface FormulaStreamProps {
    background?: string
    textColor?: string
    accent?: string
    font?: FontLike
    density?: number
    speed?: number
    curve?: number
    gap?: number
    hover?: number
    reach?: number
    style?: React.CSSProperties
}

const DEFAULTS = {
    background: "#0A0A0C",
    textColor: "rgba(232, 228, 220, 0.55)",
    accent: "#FF4900",
    font: { fontFamily: "Georgia", fontStyle: "italic", fontWeight: 400, fontSize: 22 } as FontLike,
    density: 8,
    speed: 69,
    curve: 50,
    gap: 40,
}

const TIERS = [
    { alpha: 0.45, scale: 0.72, rate: 0.62 },
    { alpha: 0.72, scale: 0.94, rate: 0.88 },
    { alpha: 1, scale: 1.14, rate: 1.22 },
]

export default function FormulaStream(props: FormulaStreamProps) {
    const {
        background = DEFAULTS.background,
        textColor = DEFAULTS.textColor,
        accent = DEFAULTS.accent,
        font = DEFAULTS.font,
        density = DEFAULTS.density,
        speed = DEFAULTS.speed,
        curve = DEFAULTS.curve,
        gap = DEFAULTS.gap,
        style,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const reduce = useMemo(
        () =>
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null,
        []
    )

    const lanes = useMemo(
        () =>
            Array.from({ length: Math.max(1, Math.floor(density)) }, (_, i) => ({
                text: FORMULAS[i % FORMULAS.length],
                tier: TIERS[i % TIERS.length],
                drift: (i * 761) % 997,
            })),
        [density]
    )

    useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = Math.min(2, window.devicePixelRatio || 1)

        const resize = () => {
            const w = root.clientWidth
            const h = root.clientHeight
            canvas.width = Math.max(1, Math.round(w * dpr))
            canvas.height = Math.max(1, Math.round(h * dpr))
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(root)

        const family = font.fontFamily || "Georgia"
        const style = font.fontStyle || "italic"
        const weight = font.fontWeight || 400
        const baseSize = font.fontSize ?? DEFAULTS.font.fontSize ?? 22

        const draw = (now: number) => {
            const W = root.clientWidth
            const H = root.clientHeight
            ctx.fillStyle = background
            ctx.fillRect(0, 0, W, H)

            const speedPx = (Math.max(0, speed) / 50) * 46
            const laneGap = Math.max(baseSize * 1.15, gap)
            const firstY = H / 2 - ((lanes.length - 1) * laneGap) / 2 + baseSize / 2
            const bow = (curve / 100) * H * 0.12

            lanes.forEach((lane, i) => {
                const fs = baseSize * lane.tier.scale
                const y = firstY + i * laneGap + Math.sin((now / 2100 + i * 0.7) * Math.PI * 2) * bow
                ctx.font = `${style} ${weight} ${fs}px ${family}, Georgia, serif`
                const width = ctx.measureText(lane.text).width
                const loop = Math.max(W, width) + 320
                const x = W - ((now / 1000) * speedPx * lane.tier.rate + (lane.drift % loop)) % loop

                ctx.globalAlpha = lane.tier.alpha
                ctx.fillStyle = i % 4 === 3 ? accent : textColor
                ctx.fillText(lane.text, x, y)
            })
            ctx.globalAlpha = 1
        }

        if (reduce?.matches) {
            draw(0)
            return () => ro.disconnect()
        }

        let raf = 0
        const tick = (now: number) => {
            draw(now)
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
        }
    }, [background, textColor, accent, font, lanes, speed, curve, gap, reduce])

    return (
        <div
            ref={rootRef}
            aria-hidden="true"
            style={{
                position: "relative",
                width: "100%",
                height: 132,
                overflow: "hidden",
                borderTop: "1px solid #d3cdbe",
                borderBottom: "1px solid #d3cdbe",
                ...style,
                background,
            }}
        >
            <canvas ref={canvasRef} style={{ display: "block" }} />
        </div>
    )
}
