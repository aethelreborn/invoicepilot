/* eslint-disable */
// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

// Delivered by Originkit · stack: framer
// Paste into a Framer code component. Property controls included.
import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
/**
 * Dock: a glass navigation dock with distance-based magnification. Scale falls
 * off with distance from the pointer along a raised cosine, rather than
 * applying only to the hovered item, so it reads as a sheet pushed up from
 * underneath instead of a row of buttons that happen to grow. The glyph
 * magnifies, not the button, so the active dot stays put. One label pill
 * travels to whatever is under the pointer and resizes to fit the word.
 *
 * The bar reads the pointer, not the items: a touch is captured to whatever
 * it started on, so sliding a finger along would otherwise only ever talk to
 * the first icon. The index comes from the nearest item centre, measured, since
 * a magnified dock does not lay out evenly. A finger chooses on lift.
 *
 * Icons from Lucide (lucide.dev), ISC licensed.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 600
 */

type Glyph = "home" | "search" | "folder" | "bookmark" | "user" | "mail" | "bell" | "heart"

interface DockItem {
    label: string
    icon: Glyph
}

interface DockProps {
    items: DockItem[]
    /** Colour behind the dock, filling the frame. */
    background?: string
    /** Typeface of the travelling label pill. */
    font: React.CSSProperties
    /** Size of the whole dock, in % of its design size. */
    scale: number
    magnify: number
    spread: number
    lift: number
    labels: boolean
    /** Every colour the dock draws. Partial objects are merged over DEFAULT_COLORS. */
    colors?: Partial<DockColors>
    onChange: (index: number) => void
    style?: React.CSSProperties
}

// The label's original look: 12px semibold, tight tracking. The system stack
// stays behind the picked family, so an unloaded web font falls back cleanly.
const DEFAULT_FONT: React.CSSProperties = { fontFamily: "Inter", fontWeight: 600, fontSize: 12, letterSpacing: "-0.005em", lineHeight: "1em" }
const SYSTEM_SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

interface DockColors {
    bar: string
    border: string
    icon: string
    iconActive: string
    dot: string
    label: string
    labelText: string
    shadow: string
}

// The former dark theme, so existing instances keep their look.
const DEFAULT_COLORS: DockColors = {
    bar: "rgba(255,255,255,0.07)",
    border: "rgba(255,255,255,0.1)",
    icon: "rgba(255,255,255,0.6)",
    iconActive: "#ffffff",
    dot: "#ffffff",
    label: "#f7f7f7",
    labelText: "#141413",
    shadow: "rgba(0,0,0,0.6)",
}

const SAMPLE: DockItem[] = [
    { label: "Home", icon: "home" },
    { label: "Search", icon: "search" },
    { label: "Files", icon: "folder" },
    { label: "Saved", icon: "bookmark" },
    { label: "You", icon: "user" },
]

const ITEM = 44
const GLYPH = 20
const PAD = 6
const GAP = 4
const TIP_H = 28
const TIP_GAP = 10
// Room above for the tip, mirrored below so the bar itself sits centred.
const ROOM = TIP_H + TIP_GAP + 6

const PATHS: Record<Glyph, React.ReactNode> = {
    home: (
        <>
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </>
    ),
    search: (
        <>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </>
    ),
    folder: <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
    bookmark: <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />,
    user: (
        <>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </>
    ),
    mail: (
        <>
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </>
    ),
    bell: (
        <>
            <path d="M10.268 21a2 2 0 0 0 3.464 0" />
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
        </>
    ),
    heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
}

export default function Dock(props: DockProps) {
    const { items, background = "#151414", font, scale, magnify, spread, lift, labels, colors, onChange, style } = props
    const list = items && items.length ? items : SAMPLE
    const c = { ...DEFAULT_COLORS, ...colors }

    const [hover, setHover] = useState<number | null>(null)
    const [active, setActive] = useState(0)
    const [still, setStill] = useState(false)
    useEffect(() => setStill(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches), [])
    useEffect(() => setActive((a) => Math.min(a, list.length - 1)), [list.length])

    const bar = useRef<HTMLElement | null>(null)
    const down = useRef(false)
    const hoverRef = useRef<number | null>(null)
    /* Set when a finger has already chosen on lift, so the click the browser
       sends afterwards (aimed at whichever item the touch started on) does
       not undo it. Cleared at the start of the next gesture, not by that
       click: a touch that lands on one item and lifts over another may get
       no click at all. */
    const chose = useRef(false)

    const at = (clientX: number) => {
        const els = bar.current?.querySelectorAll(".gdock-item")
        if (!els?.length) return null
        let best = 0
        let gap = Infinity
        els.forEach((el, i) => {
            const b = el.getBoundingClientRect()
            const d = Math.abs(clientX - (b.left + b.width / 2))
            if (d < gap) {
                gap = d
                best = i
            }
        })
        return best
    }

    const to = (i: number | null) => {
        hoverRef.current = i
        setHover(i)
    }

    const choose = (i: number) => {
        if (i !== active) {
            setActive(i)
            onChange?.(i)
        }
    }

    const track = (e: React.PointerEvent) => {
        // A mouse magnifies on hover; a finger has to be down, or the bar would answer a scroll passing over it.
        if (e.pointerType !== "mouse" && !down.current) return
        to(at(e.clientX))
    }

    const near = (i: number) => {
        const d = hover === null ? 99 : Math.abs(i - hover)
        // A raised cosine over the reach: 1 under the pointer, easing to 0 at the edge, flat past it.
        return d > spread ? 0 : (1 + Math.cos((Math.PI * d) / (spread + 1))) / 2
    }

    return (
        // The frame: fills it edge to edge with the Background and centres the dock in it.
        <div style={{ width: "100%", height: "100%", ...style, display: "flex", alignItems: "center", justifyContent: "center", background }}>
        <div
            style={{
                display: "inline-flex",
                padding: `${ROOM}px 12px`,
                // `zoom`, not `transform`: it scales layout too, so an auto-sized
                // frame grows with it and text stays crisp at any size.
                zoom: (scale ?? 100) / 100,
                fontFamily: SYSTEM_SANS,
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <style>{`
.gdock-item:focus-visible { outline: none; box-shadow: 0 0 0 2px ${c.iconActive}; }
.gdock-tip[data-ready] { transition: transform .22s cubic-bezier(.3,.7,.3,1), width .22s cubic-bezier(.3,.7,.3,1), opacity .15s ease; }
@media (prefers-reduced-motion: reduce) { .gdock-tip[data-ready] { transition: opacity .15s ease; } }
`}</style>
            <nav
                aria-label="Dock"
                ref={bar}
                /* Capture phase, and no pointer capture. Capture so these run before
                   an item stops pointerdown propagating; no setPointerCapture, since a
                   touch is already captured to its item and still reports real
                   coordinates, and capturing the bar would steal the mouse's click. */
                onPointerDownCapture={(e) => {
                    down.current = true
                    chose.current = false
                    to(at(e.clientX))
                }}
                onPointerMoveCapture={track}
                // A finger chooses on lift, over whichever item it came to rest on.
                onPointerUpCapture={(e) => {
                    if (down.current && e.pointerType !== "mouse") {
                        const i = at(e.clientX)
                        if (i !== null) {
                            chose.current = true
                            choose(i)
                        }
                    }
                    down.current = false
                    if (e.pointerType !== "mouse") to(null)
                }}
                onPointerCancelCapture={() => {
                    down.current = false
                    to(null)
                }}
                onPointerLeave={() => {
                    if (!down.current) to(null)
                }}
                style={{
                    position: "relative",
                    display: "flex",
                    gap: GAP,
                    padding: PAD,
                    borderRadius: ITEM / 2 + PAD,
                    background: c.bar,
                    border: `1px solid ${c.border}`,
                    boxShadow: `0 10px 30px -12px ${c.shadow}`,
                    backdropFilter: "blur(18px) saturate(1.4)",
                    WebkitBackdropFilter: "blur(18px) saturate(1.4)",
                    touchAction: "pan-y",
                }}
            >
                {list.map((item, i) => {
                    const f = near(i)
                    const grow = 1 + (magnify - 1) * f
                    const on = active === i
                    return (
                        <button
                            key={i}
                            type="button"
                            className="gdock-item"
                            aria-label={item.label}
                            aria-current={on ? "page" : undefined}
                            onClick={() => {
                                // The lift already chose: see `chose`.
                                if (chose.current) return
                                choose(i)
                            }}
                            onFocus={() => to(i)}
                            onBlur={() => to(null)}
                            onPointerDown={(e) => e.stopPropagation()}
                            style={{
                                position: "relative",
                                width: ITEM,
                                height: ITEM,
                                padding: 0,
                                border: 0,
                                borderRadius: ITEM / 2,
                                background: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: on || f > 0.5 ? c.iconActive : c.icon,
                                transition: "color .15s",
                            }}
                        >
                            {/* The glyph magnifies, not the button, so the dot and the tip stay put. */}
                            <span
                                style={{
                                    display: "block",
                                    width: GLYPH,
                                    height: GLYPH,
                                    transform: `translateY(${(-lift * f).toFixed(2)}px) scale(${grow.toFixed(3)})`,
                                    transformOrigin: "50% 100%",
                                    transition: still ? "none" : "transform .14s cubic-bezier(.3,.7,.4,1)",
                                }}
                            >
                                <svg width={GLYPH} height={GLYPH} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    {PATHS[item.icon] || PATHS.home}
                                </svg>
                            </span>
                            <span
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    bottom: 4,
                                    width: 4,
                                    height: 4,
                                    marginLeft: -2,
                                    borderRadius: 2,
                                    background: c.dot,
                                    opacity: on ? 1 : 0,
                                    transform: `scale(${on ? 1 : 0.4})`,
                                    transition: "opacity .2s, transform .2s",
                                }}
                            />
                        </button>
                    )
                })}
                {labels && <DockTip bar={bar} at={hover} words={list.map((x) => x.label)} fill={c.label} ink={c.labelText} font={{ ...DEFAULT_FONT, ...font }} />}
            </nav>
        </div>
        </div>
    )
}

/* One tip that travels: not a label per icon blinking on and off, but one
   pill that slides to whichever icon is under the pointer and changes width
   to fit the new word, both on one short curve. It keeps the last word while
   it fades, so leaving the dock does not empty it mid-fade. */
function DockTip(props: { bar: React.RefObject<HTMLElement | null>; at: number | null; words: string[]; fill: string; ink: string; font: React.CSSProperties }) {
    const { bar, at, words, fill, ink, font } = props
    const fontKey = JSON.stringify(font)
    const [last, setLast] = useState(0)
    const [place, setPlace] = useState<{ x: number; w: number } | null>(null)
    const word = useRef<HTMLSpanElement>(null)
    // The first placing must not slide in from the bar's left edge.
    const [ready, setReady] = useState(false)
    if (at !== null && at !== last) setLast(at)
    const label = words[last] ?? ""

    useLayoutEffect(() => {
        const nav = bar.current
        const item = nav?.querySelectorAll<HTMLElement>(".gdock-item")[last]
        const text = word.current
        if (!nav || !item || !text) return
        // offsetLeft is layout, so the glyph's own scale does not skew it.
        const measure = () => {
            const w = Math.ceil(text.scrollWidth) + 24
            setPlace({ x: item.offsetLeft + item.offsetWidth / 2 - w / 2, w })
        }
        measure()
        // A picked web font can arrive after this measure; refit the pill when it does.
        const fonts = text.ownerDocument.fonts
        fonts?.addEventListener?.("loadingdone", measure)
        return () => fonts?.removeEventListener?.("loadingdone", measure)
    }, [last, bar, label, fontKey])

    useLayoutEffect(() => {
        if (!place || ready) return
        const id = requestAnimationFrame(() => setReady(true))
        return () => cancelAnimationFrame(id)
    }, [place, ready])

    const on = at !== null && !!place
    return (
        <span
            className="gdock-tip"
            aria-hidden="true"
            data-ready={ready || undefined}
            style={{
                position: "absolute",
                left: 0,
                // Positioned from inside the bar's 1px border, so add it back to keep the visible gap exact.
                bottom: `calc(100% + ${TIP_GAP + 1}px)`,
                height: TIP_H,
                width: place?.w,
                transform: place ? `translateX(${place.x}px)` : undefined,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: TIP_H / 2,
                background: fill,
                color: ink,
                fontFamily: font.fontFamily ? `${font.fontFamily}, ${SYSTEM_SANS}` : SYSTEM_SANS,
                fontWeight: font.fontWeight,
                fontStyle: font.fontStyle,
                fontSize: font.fontSize,
                letterSpacing: font.letterSpacing,
                lineHeight: font.lineHeight,
                whiteSpace: "nowrap",
                opacity: on ? 1 : 0,
                pointerEvents: "none",
            }}
        >
            <span ref={word}>{label}</span>
        </span>
    )
}

Dock.defaultProps = {
    items: SAMPLE,
    background: "transparent",
    font: DEFAULT_FONT,
    scale: 100,
    magnify: 1.32,
    spread: 2,
    lift: 8,
    labels: true,
    colors: DEFAULT_COLORS,
}

// Control order arranged in the builder.
