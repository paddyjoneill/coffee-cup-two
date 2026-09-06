import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './Scene'
import { defaultShot } from './physics'
import type { Phase, Shot } from './physics'
import './App.css'
import { useGameTools } from './webmcp'

export type GameState = { phase: Phase; shot: Shot; meter: number; distance: number; height: number; won: boolean; hit: string; attempt: number; best: number; paused: boolean }
export type GameControl = React.RefObject<GameState>
const initial = (): GameState => ({ phase: 'direction', shot: { ...defaultShot }, meter: 0.5, distance: 0, height: 12.6, won: false, hit: '', attempt: 1, best: 0, paused: false })
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    cup: <><path d="M5 8h12v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M8 2v3m4-3v3M3 23h16"/></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
    direction: <><path d="M3 12h18m-4-4 4 4-4 4M7 8l-4 4 4 4M12 5v14"/></>,
    trajectory: <><path d="M4 20C4 4 17 1 20 12m-5-2 5 2 1-5"/><path d="M3 21h18"/></>,
    power: <path d="m14 2-10 12h7l-1 8 10-13h-7Z"/>,
    reset: <><path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/></>,
    sound: <><path d="m11 4-6 5H2v6h3l6 5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    mute: <><path d="m11 4-6 5H2v6h3l6 5Z"/><path d="m16 9 6 6m0-6-6 6"/></>,
    flag: <><path d="M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    trophy: <><path d="M7 3h10v6a5 5 0 0 1-10 0Zm5 11v6m-5 1h10M7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
export default function App() {
  const game = useRef<GameState>(initial())
  const [state, setState] = useState(initial)
  const [help, setHelp] = useState(false)
  const [sound, setSound] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const sync = useCallback(() => setState({ ...game.current, shot: { ...game.current.shot } }), [])
  const beep = useCallback((frequency = 480) => {
    if (!sound) return
    audio.current ??= new AudioContext()
    void audio.current.resume()
    const oscillator = audio.current.createOscillator(), gain = audio.current.createGain()
    oscillator.type = 'sine'; oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.09, audio.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.current.currentTime + 0.18)
    oscillator.connect(gain); gain.connect(audio.current.destination)
    oscillator.start(); oscillator.stop(audio.current.currentTime + 0.2)
  }, [sound])
  const reset = useCallback(() => {
    game.current = { ...initial(), attempt: game.current.attempt + 1, best: game.current.best }
    sync()
  }, [sync])
  const tap = useCallback(() => {
    const g = game.current
    if (g.paused) return
    if (g.phase === 'result') { reset(); return }
    if (g.phase === 'flight') return
    beep(g.phase === 'power' ? 800 : 440)
    g.phase = g.phase === 'direction' ? 'trajectory' : g.phase === 'trajectory' ? 'power' : 'flight'
    g.meter = 0.5
    sync()
  }, [beep, reset, sync])
  useGameTools(game, tap, reset)
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.code === 'Escape') { setHelp(false); game.current.paused = false; return }
      if (help && e.code === 'Tab') {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.help-modal button'))
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
        e.preventDefault(); buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus(); return
      }
      if ((e.target as HTMLElement)?.closest('button')) return
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); tap() }
      if (e.code === 'KeyR' && !help) reset()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [tap, reset, help])
  const toggleHelp = (open: boolean) => { setHelp(open); game.current.paused = open }
  const phaseIndex = ['direction', 'trajectory', 'power'].indexOf(state.phase)
  const inFlight = state.phase === 'flight', result = state.phase === 'result'
  const values = [`${Math.abs(state.shot.direction).toFixed(0)}° ${state.shot.direction < -1 ? 'L' : state.shot.direction > 1 ? 'R' : ''}`, `${state.shot.trajectory.toFixed(0)}°`, `${(state.shot.power * 100).toFixed(0)}%`]
  return <main className="app">
    <header className="header">
      <a className="brand" href="./" aria-label="Out of Office home"><span className="brand-icon"><Icon name="cup" size={23}/></span> out of office<span className="brand-dot">.</span></a>
      <div className="header-center"><span className="live-dot"/> A LITTLE BREAK FROM THE EVERYDAY</div>
      <button className="help-button" onClick={() => toggleHelp(true)}><span>?</span> How to play</button>
    </header>
    <section className="game-shell" aria-label="Coffee cup throwing game">
      <div className="scene" onPointerDown={e => { if (e.button === 0) tap() }}>
        <Canvas shadows dpr={[1, 1.7]} camera={{ position: [8, 17, 23], fov: 47, near: 0.1, far: 250 }} gl={{ antialias: true, powerPreference: 'high-performance' }} fallback={<div className="webgl-fallback">This game needs WebGL. Try a browser with hardware acceleration enabled.</div>}>
          <Scene game={game} sync={sync}/>
        </Canvas>
      </div>
      <div className="scene-vignette"/>
      <div className="scene-heading">
        <div className="eyebrow"><span className="level-tag">LEVEL 01</span> THE AFTERNOON ESCAPE</div>
        <h1>Big break.<br/>Bigger throw.</h1>
        <p>One coffee cup. Three taps. Make it over the school.</p>
      </div>
      <aside className="mission-card"><span className="mission-icon"><Icon name="flag" size={23}/></span><div><div className="small-label">YOUR MISSION</div><strong>Clear the school grounds</strong><p>Land beyond the green finish line.</p></div></aside>
      <div className="scene-label"><span className="live-dot"/> THIRD FLOOR <span className="divider">/</span> 12 METRES UP</div>
      <div className="scene-tools"><button title={sound ? 'Mute sound' : 'Enable sound'} aria-label={sound ? 'Mute sound' : 'Enable sound'} aria-pressed={sound} onClick={() => setSound(!sound)}><Icon name={sound ? 'sound' : 'mute'}/></button><button title="Restart throw (R)" aria-label="Restart throw" onClick={reset}><Icon name="reset"/></button></div>
      {(inFlight || result) && <div className="flight-stats"><span><small>DISTANCE</small>{state.distance.toFixed(1)}<em>m</em></span><span><small>HEIGHT</small>{Math.max(0, state.height).toFixed(1)}<em>m</em></span></div>}
      {inFlight && <div className="flight-label"><span className="live-dot"/> COFFEE HAS LEFT THE BUILDING</div>}
      {result && <div className={`result-card ${state.won ? 'won' : ''}`} role="status"><span className="result-symbol"><Icon name={state.won ? 'trophy' : 'cup'} size={32}/></span><div className="small-label">{state.won ? 'MISSION ACCOMPLISHED' : 'SO CLOSE. ANOTHER CUP?'}</div><h2>{state.won ? 'Out of office!' : state.hit === 'school' ? 'School’s in the way.' : 'A little more oomph.'}</h2><p>{state.won ? 'Over the school. Beyond the grounds. Nicely done.' : state.hit === 'school' ? 'Try a higher arc to get over the rooftop.' : Math.abs(state.shot.direction) > 18 ? 'Aim closer to the middle and add some power.' : 'Aim high and lock in more power to clear the grounds.'}</p><button className="primary-button" onClick={reset}>Throw again <Icon name="reset" size={18}/></button></div>}
      <div className="control-dock"><div className="steps">
        {['direction', 'trajectory', 'power'].map((phase, i) => <div key={phase} className={`step ${phaseIndex === i ? 'active' : phaseIndex > i || inFlight || result ? 'complete' : ''}`}><span className="step-number">{phaseIndex > i || inFlight || result ? '✓' : `0${i + 1}`}</span><div className="step-detail"><span className="step-title">{phase}</span><span className="step-caption">{phaseIndex === i ? ['Find your line', 'Give it some height', 'Make it count'][i] : phaseIndex > i || inFlight || result ? values[i] + ' · Locked in' : ['Left or right', 'Low or high', 'Easy or all in'][i]}</span></div><span className="step-icon"><Icon name={phase}/></span></div>)}
      </div><div className="action-row"><div className="meter-area"><div className="meter-label"><span>{inFlight ? 'ENJOY THE FLIGHT' : result ? 'THAT’S A WRAP' : `SET YOUR ${state.phase.toUpperCase()}`}</span><strong>{phaseIndex >= 0 ? values[phaseIndex] : `${state.distance.toFixed(1)} m`}</strong></div><div className={`meter ${state.phase}`}><div className="meter-ticks"/><div className="sweet-spot"/><div className="meter-needle" style={{ left: `${state.meter * 100}%` }}/></div><div className="meter-extremes"><span>{phaseIndex === 0 ? 'LEFT' : phaseIndex === 1 ? 'LOW ARC' : 'A LITTLE TOSS'}</span><span>{phaseIndex === 0 ? 'RIGHT' : phaseIndex === 1 ? 'HIGH ARC' : 'SEND IT'}</span></div></div><button className="primary-button throw-button" onClick={tap} disabled={inFlight}>{result ? 'One more coffee?' : inFlight ? 'Cup in flight…' : `Lock ${state.phase}`}<Icon name={result ? 'reset' : 'arrow'}/></button></div><div className="dock-foot"><span><kbd>SPACE</kbd> or tap to {result ? 'try again' : inFlight ? 'watch it fly' : 'lock it in'}</span><span>GOOD THINGS COME IN THREE TAPS <span className="tiny-star">✳</span></span></div></div>
    </section>
    <footer><span><span className="footer-dot"/> NO MEETINGS. JUST MOMENTUM.</span><span>THROW <b>{String(state.attempt).padStart(2, '0')}</b><span className="divider">/</span>BEST <b>{state.best.toFixed(1)} m</b></span><span>TAKE YOUR BREAK SERIOUSLY. <Icon name="cup" size={16}/></span></footer>
    {help && <div className="modal-backdrop" onClick={() => toggleHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e => e.stopPropagation()}><button className="modal-close" aria-label="Close instructions" onClick={() => toggleHelp(false)} autoFocus><Icon name="close"/></button><div className="eyebrow">YOUR THREE-TAP ESCAPE</div><h2 id="help-title">Let that coffee fly.</h2><p>You’re at an open window on the third floor. Clear the school and land beyond the green line to win.</p><ol><li><strong>Direction</strong><span>Tap to stop the swinging aim. The middle points straight across the school.</span></li><li><strong>Trajectory</strong><span>Tap to set the angle. Around 45–60° gives the cup room to clear the roof.</span></li><li><strong>Power</strong><span>Tap once more to throw. You’ll need a strong throw to reach the other side.</span></li></ol><p className="help-tip">Press <kbd>SPACE</kbd>, tap the scene, or use the orange button. Press <kbd>R</kbd> to restart. The game pauses while these instructions are open.</p><button className="primary-button" onClick={() => toggleHelp(false)}>Back to my break <Icon name="arrow"/></button></section></div>}
  </main>
}
