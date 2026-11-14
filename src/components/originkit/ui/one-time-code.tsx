/* eslint-disable */
// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

// Delivered by Originkit · stack: framer
// Paste into a Framer code component. Property controls included.
import * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
/**
 * One-Time Code: small cells and a caret. Digits rise into their cells; a
 * right code draws the cells together until they fuse into one capsule that
 * says so, and a wrong one sends a shiver down the row and drains the digits
 * out. Press the capsule to start over.
 *
 * Several cells, one field: separate inputs break paste, autofill from the
 * notification, backspace and screen readers, so there is one invisible input
 * over the row and the cells are drawn underneath it. The merge is the goo's:
 * the cells sit under a blur-and-threshold filter, far enough apart that it
 * never bridges them, and verifying slides them to the middle while a capsule
 * grows out of the same point; nobody draws the in-between. The filter never
 * touches text, which would lose its edges under the threshold.
 *
 * The answer is a knob: a code nobody watching can know is not a
 * demonstration, so Accept and Reject pick which outcome you see, and Match
 * compares against a code you set: its digits only, cut to the Digits count.
 *
 * Moving about the row follows input-otp (input-otp.rodz.dev): a caret that
 * lands on a filled cell selects that digit so the next one typed replaces it,
 * the arrows step cell by cell, a click goes to the next empty cell, and a
 * pasted code is cleaned of spaces and dashes before it is cut to length.
 *
 * Icon from Lucide (lucide.dev), ISC licensed.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 600
 */

type Theme = "dark" | "light"
type Answer = "accept" | "reject" | "match"
type Phase = "type" | "check" | "ok" | "no"

interface OneTimeCodeProps {
    /** "4" or "6" (a number from older instances is read the same way). */
    length: number | string
    answer: Answer
    code: string
    /** Colour behind the code row, filling the frame. */
    background?: string
    corner: number
    /** Space between two cells, px. */
    gap: number
    /** One cell's size, px. */
    cellWidth: number
    cellHeight: number
    /** Typeface of the digits; the Verified label keeps its 14:20 ratio to the size. */
    font?: React.CSSProperties
    /** Overall size, in % of the drawn size. */
    scale: number
    theme: Theme
    interaction?: Partial<Interaction>
    onComplete: (code: string, ok: boolean) => void
    style?: React.CSSProperties
}

interface Interaction {
    /** Focus the field as soon as it mounts. */
    autoFocus: boolean
    /** Pressing the Verified capsule splits it back into empty cells. */
    pressReset: boolean
    /** How far a wrong code shivers the row, px at 1:1. */
    shake: number
    /** The beat of checking between the last digit and the answer, s. */
    checkTime: number
}

const DEFAULT_INTERACTION: Interaction = { autoFocus: false, pressReset: true, shake: 5, checkTime: 0.42 }
const DEFAULT_FONT: React.CSSProperties = { fontFamily: "Inter", fontWeight: 600, fontSize: 20, lineHeight: "1em", letterSpacing: "0em" }
const SYSTEM_SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

/* how long a cell takes to swell and settle when a digit lands */
const POP_MS = 260
const SHAKE_MS = 620
/* the capsule a right code becomes, at the reference 44 px cell */
const CAP_PER_H = 128 / 44

/* The merge is a spring a little under critical, not a tween: the capsule runs
   past its size and comes back, long and thin on the way out and round as it
   settles, which is what makes the fuse read as liquid. Per frame at 60Hz. */
const MERGE = (() => {
    const k = 0.075
    const zeta = 0.42
    return { k, d: 1 - 2 * zeta * Math.sqrt(k) }
})()

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, v: number) => {
    const u = clamp((v - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)
}

function palette(theme: Theme) {
    return theme === "light"
        ? { cell: "#ffffff", text: "#141413", caret: "#141413", ok: "#1f8a4c", no: "#d0342c", edge: "drop-shadow(0 0 0.6px rgba(20,20,19,0.3)) drop-shadow(0 2px 6px rgba(20,20,19,0.08))" }
        : { cell: "#262628", text: "#f7f7f7", caret: "#f7f7f7", ok: "#4ade80", no: "#f87171", edge: "" }
}

/* The goo, as a hook: every block here can render twice at once (the wall card
   and the detail view), and duplicate SVG ids collide rather than scope, so
   each mount gets its own filter id. Alpha is multiplied by `cut` less half of
   it, so the soft blur edge becomes a hard one that fuses nearby shapes. */
function useGoo(blur = 7, cut = 28) {
    const id = `goo-${useId().replace(/:/g, "")}`
    const goo = (
        <svg aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
            <defs>
                <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                    <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="smear" />
                    <feColorMatrix in="smear" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${cut} ${-(cut / 2)}`} />
                </filter>
            </defs>
        </svg>
    )
    return { url: `url(#${id})`, goo }
}

const Check = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
    </svg>
)

export default function OneTimeCode(props: OneTimeCodeProps) {
    const { length, answer, code: expected, background = "#0B0A0A", corner, gap = 6, cellWidth = 40, cellHeight = 44, font, scale = 274, theme, interaction, onComplete, style } = props
    const ix = { ...DEFAULT_INTERACTION, ...(interaction ?? {}) }
    // CSS zoom, not a transform: the row is laid out at the scaled size, so an auto-sized frame
    // grows with it and the digits are drawn at that size rather than enlarged afterwards.
    const zoom = clamp(Number(scale) || 100, 25, 400) / 100
    const c = palette(theme)
    // The options are strings: the builder drops numeric Enum options, which left Digits blank and
    // fell through to 6 cells. A number saved by an older instance still reads the same.
    const n = Number(length) === 6 ? 6 : 4
    /* a cell, and the air between two */
    const W = clamp(Number(cellWidth) || 36, 16, 200)
    const H = clamp(Number(cellHeight) || 44, 16, 200)
    const G = clamp(Number(gap) || 0, 0, 100)
    const f = { ...DEFAULT_FONT, ...(font ?? {}) }
    const fsRaw = typeof f.fontSize === "string" ? parseFloat(f.fontSize) : f.fontSize
    const fs = clamp(typeof fsRaw === "number" && Number.isFinite(fsRaw) ? fsRaw : 20, 8, 120)
    const family = f.fontFamily ? `${f.fontFamily}, ${SYSTEM_SANS}` : SYSTEM_SANS
    // Verified sits at 14 px beside 20 px digits; it keeps that ratio, and the capsule widens to hold it.
    const labelFs = fs * 0.7
    const CAP = Math.max(H * CAP_PER_H, labelFs * 7.5 + H * 0.6)
    const CARET_H = Math.min(fs, H - 6)
    const r = clamp(corner, 0, H / 2)
    const rowW = n * W + (n - 1) * G
    // What Match compares against: digits only, the first `n` of them. Shorter than `n`, nothing can match it.
    const target = (expected || "").replace(/\D/g, "").slice(0, n)

    const [still, setStill] = useState(false)
    useEffect(() => setStill(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches), [])

    const [code, setCode] = useState("")
    const [phase, setPhase] = useState<Phase>("type")
    const [focus, setFocus] = useState(false)
    // The field's selection, mirrored: where the caret is, or which digit is up for replacing.
    const [sel, setSel] = useState<[number, number]>([0, 0])
    const input = useRef<HTMLInputElement | null>(null)

    // A filled cell picked for typing over, or -1; otherwise the caret waits at the next empty cell.
    const pick = focus && sel[1] > sel[0] && sel[1] <= code.length ? sel[0] : -1
    const at = pick >= 0 ? pick : Math.min(code.length, n - 1)

    // Moving parts, read by the loop.
    const caret = useRef({ x: W / 2, v: 0 })
    // When each cell last took a digit, for the little swell.
    const popAt = useRef<number[]>([])
    const merge = useRef({ m: 0, v: 0, to: 0 })
    const shook = useRef(0)
    const timers = useRef<number[]>([])
    const raf = useRef(0)
    const [, setTick] = useState(0)
    const live = useRef({ at, still, W, G })
    live.current = { at, still, W, G }

    // Auto Focus: on mount (or when switched on), without scrolling the page to the row.
    useEffect(() => {
        if (ix.autoFocus) input.current?.focus({ preventScroll: true })
    }, [ix.autoFocus])

    const later = (fn: () => void, ms: number) => {
        timers.current.push(window.setTimeout(fn, ms))
    }

    /* The one loop: runs while something moves and stops itself after, so a
       row nobody is typing into costs nothing. */
    const wake = () => {
        if (raf.current) return
        let prev = 0
        const tick = (t: number) => {
            const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1
            prev = t
            let busy = false
            const { at: slot, still: calm, W: cw, G: cg } = live.current

            // The caret, on a spring with a little give.
            const goal = slot * (cw + cg) + cw / 2
            const k = caret.current
            if (calm) {
                k.x = goal
                k.v = 0
            } else {
                k.v += (goal - k.x) * 0.2 * dt
                k.v *= Math.pow(0.62, dt)
                k.x += k.v * dt
                if (Math.abs(goal - k.x) < 0.05 && Math.abs(k.v) < 0.05) {
                    k.x = goal
                    k.v = 0
                } else busy = true
            }

            // The merge, sprung.
            const mg = merge.current
            if (mg.m !== mg.to || mg.v !== 0) {
                if (calm) {
                    mg.m = mg.to
                    mg.v = 0
                } else {
                    mg.v += (mg.to - mg.m) * MERGE.k * dt
                    mg.v *= Math.pow(MERGE.d, dt)
                    mg.m += mg.v * dt
                    if (Math.abs(mg.to - mg.m) < 0.0008 && Math.abs(mg.v) < 0.0008) {
                        mg.m = mg.to
                        mg.v = 0
                    } else busy = true
                }
            }

            if (t - shook.current < SHAKE_MS + 200) busy = true
            setTick((x) => x + 1)
            // A cell still swelling from a digit keeps the loop alive.
            if (popAt.current.some((at) => t - at < POP_MS)) busy = true
            raf.current = busy ? requestAnimationFrame(tick) : 0
        }
        raf.current = requestAnimationFrame(tick)
    }

    useEffect(
        () => () => {
            cancelAnimationFrame(raf.current)
            raf.current = 0
            timers.current.forEach(window.clearTimeout)
        },
        []
    )
    useEffect(() => {
        wake()
    }, [code, n, phase, at, W, G])

    const fuse = (to: 0 | 1) => {
        merge.current = { ...merge.current, to }
        wake()
    }

    // A length or answer knob moving under an answered row starts it over.
    useEffect(() => {
        timers.current.forEach(window.clearTimeout)
        timers.current = []
        setCode("")
        setPhase("type")
        merge.current = { m: 0, v: 0, to: 0 }
    }, [n, answer, target])

    const onChange = (raw: string) => {
        if (phase !== "type") return
        const next = raw.replace(/\D/g, "").slice(0, n)
        // Each new or replaced digit swells its cell; a paste runs along the row.
        if (next.length >= code.length && next !== code) {
            if (!still) {
                const t0 = performance.now()
                let k = 0
                for (let i = 0; i < next.length; i++) if (next[i] !== code[i]) popAt.current[i] = t0 + k++ * 45
                wake()
            }
        }
        setCode(next)
        if (next.length < n) return
        // Full: a beat of checking, then the answer.
        setPhase("check")
        const ok = answer === "accept" || (answer === "match" && next === target)
        later(() => {
            onComplete?.(next, ok)
            if (ok) {
                setPhase("ok")
                fuse(1)
                input.current?.blur()
            } else {
                setPhase("no")
                shook.current = performance.now()
                wake()
                later(() => {
                    setCode("")
                    setPhase("type")
                }, SHAKE_MS + n * 45 + 160)
            }
        }, still ? 0 : clamp(ix.checkTime, 0, 3) * 1000)
    }

    // Pressing the capsule splits it back into empty cells.
    const reopen = () => {
        if (phase !== "ok" || !ix.pressReset) return
        setCode("")
        setPhase("type")
        fuse(0)
        input.current?.focus()
    }

    /* One field drawn as cells needs the caret kept on a cell. As in input-otp,
       a bare caret is only allowed at the end of the code; anywhere else it
       selects a digit, the one after it when moving right and the one before
       it when stepping left off a selection, so typing replaces that digit and
       Backspace walks back. */
    const prevSel = useRef<[number, number]>([0, 0])
    const syncSel = () => {
        const el = input.current
        if (!el || document.activeElement !== el) return
        const len = el.value.length
        let s = el.selectionStart ?? len
        let e = el.selectionEnd ?? s
        if (s === e && len > 0 && !(s === len && len < n)) {
            const [p0, p1] = prevSel.current
            s = s >= n ? n - 1 : s > 0 && s < p1 && p0 !== p1 ? s - 1 : s
            e = s + 1
            el.setSelectionRange(s, e)
        }
        prevSel.current = [s, e]
        setSel([s, e])
    }

    // Focus or a click anywhere on the row goes to the next empty cell.
    const toNextEmpty = () => {
        const el = input.current
        if (!el || phase !== "type") return
        const len = el.value.length
        el.setSelectionRange(Math.min(len, n - 1), len)
        syncSel()
    }

    /* A paste is cleaned before the field's length cap can cut it: "123-456"
       is six digits, not "123-4". A whole code replaces the row; a few digits
       go in at the caret. */
    const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const digits = e.clipboardData.getData("text").replace(/\D/g, "")
        if (!digits || phase !== "type") return
        const el = e.currentTarget
        const s = el.selectionStart ?? code.length
        const end = el.selectionEnd ?? s
        onChange(digits.length >= n ? digits : code.slice(0, s) + digits + code.slice(end))
    }

    /* Where everything is this frame. The raw spring runs past 0 and 1; the
       cells' travel is clamped to it, and only the capsule takes the
       overshoot, as a stretch. */
    const now = typeof performance !== "undefined" ? performance.now() : 0
    const raw = merge.current.m
    const m = clamp(raw, 0, 1)
    const home = (i: number) => i * (W + G)
    const mid = (rowW - W) / 2
    const since = now - shook.current
    const shaking = phase === "no" && since < SHAKE_MS && !still
    const shake = (i: number) => (shaking ? clamp(ix.shake, 0, 20) * Math.exp(-since / 190) * Math.sin((since / 1000) * Math.PI * 2 * 10 + i * 0.55) : 0)
    const cellX = (i: number) => mix(home(i), mid, m) + shake(i)
    // A digit arriving: its cell swells four per cent and settles, an acknowledgement rather than an event.
    const pop = (i: number) => {
        const at = popAt.current[i]
        if (at === undefined) return 1
        const u = (now - at) / POP_MS
        return u > 0 && u < 1 ? 1 + 0.04 * Math.sin(Math.PI * u) : 1
    }
    // Checking: a soft wave of breath through the cells.
    const breath = (i: number) => {
        if (phase !== "check" || still) return pop(i)
        const u = ((now % 900) / 900) * (n + 2) - i
        return 1 - 0.07 * (u > 0 && u < 2 ? Math.sin((u / 2) * Math.PI) : 0)
    }
    const over = raw - 1
    // Long and thin past its size, round again as it settles: width and height trade.
    const capW = CAP * smooth(0.3, 1, m) * (1 + Math.max(-0.12, over) * 0.9)
    const capSy = 1 - Math.max(-0.12, over) * 0.55
    // Cells gathering in the middle take the capsule's squash. Kept at full height they stood out
    // above and below it while it ran long and thin, a bump in the middle of the pill.
    const cellSy = mix(1, Math.min(1, capSy), smooth(0.3, 1, m))
    // Cells round off into the capsule's pill as they close in, so the shapes agree when the goo joins them.
    const cellR = mix(r, H / 2, smooth(0.15, 0.7, m))
    const typing = phase === "type" && focus

    const { url, goo } = useGoo(3, 24)
    // The goo only while the cells are actually merging or splitting. Left on at rest, its blur and
    // hard alpha cut redrew every cell: corners rounded by the blur instead of Corner, and stepped,
    // uneven edges. Settled (cells apart, or the capsule formed) the shapes are drawn as they are.
    const mg = merge.current
    const gooing = !still && (mg.v !== 0 || mg.m !== mg.to)

    const abs: React.CSSProperties = { position: "absolute", left: 0, top: 0, height: H }

    return (
        // The frame: fills it edge to edge with the Background and centres the code row in it.
        <div style={{ width: "100%", height: "100%", ...style, display: "flex", alignItems: "center", justifyContent: "center", background }}>
        <div
            className="otp"
            data-phase={phase}
            style={{
                display: "inline-block",
                zoom,
                fontFamily: family,
                fontWeight: f.fontWeight,
                fontStyle: f.fontStyle,
                letterSpacing: f.letterSpacing,
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <style>{`
.otp-digit { display: inline-block; animation: otp-rise .26s cubic-bezier(.3,.7,.3,1) both; }
@keyframes otp-rise { from { transform: translateY(9px); opacity: 0; } to { transform: none; opacity: 1; } }
.otp-caret { opacity: 0; transition: opacity .12s; }
.otp-caret[data-on="true"] { opacity: 1; animation: otp-blink 1.06s steps(1) .5s infinite; }
@keyframes otp-blink { 50% { opacity: 0; } }
.otp-slot[data-pick="true"] { animation: otp-dim 1.06s steps(1) .5s infinite; }
@keyframes otp-dim { 50% { opacity: .35; } }
.otp-field::selection { background: transparent; color: transparent; }
.otp-field:focus-visible ~ .otp-ring { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .otp-digit, .otp-caret[data-on="true"] { animation: none; } .otp-slot[data-pick="true"] { animation: none; opacity: .55 !important; } }
`}</style>
            <div style={{ position: "relative", width: rowW, height: H }}>
                {/* The cells and the capsule: one colour, under the filter. */}
                {/* On a light page a white cell needs an edge; it goes on after the goo so it outlines the merged shape. */}
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, filter: [gooing ? url : "", c.edge].join(" ").trim() || undefined }}>
                    {Array.from({ length: n }, (_, i) => (
                        <span
                            key={i}
                            style={{
                                ...abs,
                                width: W,
                                background: c.cell,
                                borderRadius: cellR,
                                transform: `translateX(${cellX(i).toFixed(2)}px) scale(${breath(i).toFixed(3)}, ${(breath(i) * cellSy).toFixed(3)})`,
                            }}
                        />
                    ))}
                    {capW > 0.5 && (
                        <span
                            // Always a full pill: the capsule is a result, not a cell, whatever Corner says.
                            style={{
                                ...abs,
                                width: capW,
                                background: c.cell,
                                borderRadius: H / 2,
                                transform: `translateX(${((rowW - capW) / 2).toFixed(2)}px) scaleY(${capSy.toFixed(3)})`,
                            }}
                        />
                    )}
                </div>

                {/* The digits, outside the filter: an empty cell is just the cell. */}
                {Array.from({ length: n }, (_, i) => {
                    const d = code[i]
                    // A wrong code drains right to left.
                    const drain = phase === "no" && !still ? smooth(0, 1, (since - 300 - (n - 1 - i) * 45) / 220) : 0
                    return (
                        <span
                            key={i}
                            aria-hidden="true"
                            // A filled cell picked for typing over blinks its digit where the caret would be.
                            className="otp-slot"
                            data-pick={phase === "type" && i === pick}
                            style={{
                                ...abs,
                                width: W,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: fs,
                                fontVariantNumeric: "tabular-nums",
                                color: phase === "no" ? c.no : c.text,
                                transition: "color .15s",
                                transform: `translateX(${cellX(i).toFixed(2)}px)`,
                                opacity: 1 - smooth(0, 0.45, m),
                                pointerEvents: "none",
                            }}
                        >
                            {d && (
                                <span key={`${i}-${d}`} className="otp-digit" style={{ translate: `0 ${(drain * 8).toFixed(2)}px`, opacity: 1 - drain }}>
                                    {d}
                                </span>
                            )}
                        </span>
                    )
                })}

                {/* The caret, stretched by its own speed; not until the cells have come apart again. */}
                <i
                    className="otp-caret"
                    aria-hidden="true"
                    data-on={typing && pick < 0 && code.length < n && m < 0.08}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: (H - CARET_H) / 2,
                        width: 2,
                        height: CARET_H,
                        borderRadius: 1,
                        background: c.caret,
                        transform: `translateX(${(caret.current.x - 1).toFixed(2)}px) scaleX(${(1 + Math.min(5, Math.abs(caret.current.v) * 0.9)).toFixed(3)})`,
                        pointerEvents: "none",
                    }}
                />

                {/* What the capsule says, centred on the capsule. */}
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: labelFs * 0.43,
                        fontSize: labelFs,
                        color: c.ok,
                        opacity: smooth(0.72, 1, m),
                        scale: `${mix(0.92, 1, smooth(0.72, 1, m))}`,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                    }}
                >
                    <Check size={labelFs} />
                    Verified
                </span>

                <input
                    ref={input}
                    className="otp-field"
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    // A key that is not a digit never lands, so it can't replace a picked digit with nothing.
                    onBeforeInput={(e) => {
                        const d = (e as unknown as { data?: string }).data
                        if (d && !/\d/.test(d)) e.preventDefault()
                    }}
                    onPaste={onPaste}
                    onSelect={syncSel}
                    onClick={toNextEmpty}
                    onFocus={() => {
                        setFocus(true)
                        toNextEmpty()
                        wake()
                    }}
                    onBlur={() => setFocus(false)}
                    onPointerDown={(e) => {
                        if (phase === "ok") {
                            e.preventDefault()
                            if (ix.pressReset) reopen()
                        }
                    }}
                    inputMode="numeric"
                    pattern="\d*"
                    autoComplete="one-time-code"
                    // A code box is not a login: keep the password managers' badges out of it.
                    data-1p-ignore
                    data-lpignore="true"
                    data-bwignore
                    data-form-type="other"
                    maxLength={n}
                    aria-label={phase === "ok" ? (ix.pressReset ? "Verified. Press to enter a new code" : "Verified") : `${n}-digit code`}
                    spellCheck={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        margin: 0,
                        padding: 0,
                        border: 0,
                        outline: "none",
                        background: "transparent",
                        color: "transparent",
                        caretColor: "transparent",
                        // 16px or more, so iOS doesn't zoom in on focus.
                        fontSize: 16,
                        cursor: phase === "ok" ? (ix.pressReset ? "pointer" : "default") : "text",
                    }}
                />
                {/* A keyboard focus ring around the whole row, since the field itself is invisible. */}
                <span
                    className="otp-ring"
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: -5,
                        borderRadius: r + 5,
                        boxShadow: `0 0 0 2px ${c.caret}`,
                        opacity: 0,
                        transition: "opacity .15s",
                        pointerEvents: "none",
                    }}
                />
            </div>
            {goo}
        </div>
        </div>
    )
}

OneTimeCode.defaultProps = {
    length: "4",
    answer: "accept",
    code: "1234",
    background: "transparent",
    corner: 12,
    gap: 7,
    cellWidth: 36,
    cellHeight: 44,
    font: DEFAULT_FONT,
    scale: 100,
    theme: "dark",
    interaction: DEFAULT_INTERACTION,
}

// Control order arranged in the builder.
