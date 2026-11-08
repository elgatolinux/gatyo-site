import { useEffect, useRef, useState } from 'react'
import { Glass, Scene, Slate } from '../components/Scene'
import { useI18n } from '../i18n/I18n'
import { MUSIC_CREDIT } from '../i18n/dict'
import { asset } from '../lib/motion'

function canAutoplay() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !matchMedia('(prefers-reduced-motion: reduce)').matches && !conn?.saveData
}

export function Promo() {
  const { t } = useI18n()
  const video = useRef<HTMLVideoElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const wantPlay = useRef(canAutoplay())
  const visible = useRef(false)

  // The file is not requested until the frame is about to enter the screen.
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '15% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Plays only on screen, so sound can never continue somewhere else on the page.
  useEffect(() => {
    const el = frame.current
    if (!el || !near) return
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.intersectionRatio >= 0.35
        const v = video.current
        if (!v) return
        if (visible.current && wantPlay.current) v.play().catch(() => setPlaying(false))
        else v.pause()
      },
      { threshold: [0, 0.35, 0.6] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  const togglePlay = () => {
    const v = video.current
    if (!v) return
    if (v.paused) {
      wantPlay.current = true
      v.play().catch(() => setPlaying(false))
    } else {
      wantPlay.current = false
      v.pause()
    }
  }

  const toggleSound = () => {
    const v = video.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    if (!v.muted && v.paused) {
      wantPlay.current = true
      v.play().catch(() => setPlaying(false))
    }
  }

  return (
    <Scene n="02" art="film">
      <div className="promo">
        <Slate n="02" />
        <h2 className="h2" data-rv>
          {t.promo.title}
        </h2>
        <p className="lead" data-rv>
          {t.promo.body}
        </p>
        <div ref={frame} data-rv>
          <Glass ratio="16 / 9" reveal>
            <video
              ref={video}
              aria-label={t.promo.videoLabel}
              poster={near ? asset('media/video/poster.webp') : undefined}
              src={near ? asset('media/video/promo-720.mp4') : undefined}
              muted
              loop
              playsInline
              preload={near ? 'metadata' : 'none'}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onClick={togglePlay}
            />
          </Glass>
          <div className="promo-bar">
            <button type="button" className="ctl" onClick={togglePlay} disabled={!near}>
              {playing ? t.promo.pause : t.promo.play}
            </button>
            <button type="button" className="ctl ctl--hi" aria-pressed={!muted} onClick={toggleSound} disabled={!near}>
              {muted ? t.promo.soundOn : t.promo.soundOff}
            </button>
            <p className="promo-credit">
              {t.promo.music}: {MUSIC_CREDIT}
            </p>
          </div>
        </div>
      </div>
    </Scene>
  )
}
