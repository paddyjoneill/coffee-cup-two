import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { GameControl, GameState } from './App'
import { START, collisionAt, distanceAt, isWinningLanding, positionAt } from './physics'

type V3 = [number, number, number]
const colors = { cream: '#f0dfbe', roof: '#bd6650', trim: '#fff1d0', window: '#7eacae', lawn: '#a4ba7c', wood: '#bd8f62', orange: '#ec7247' }
function Box({ position = [0, 0, 0], size, color, rotation, round = 0 }: { position?: V3; size: V3; color: string; rotation?: V3; round?: number }) {
  return round ? <RoundedBox args={size} radius={round} smoothness={2} position={position} rotation={rotation} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.85}/></RoundedBox> : <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={0.85}/></mesh>
}
function Ball({ position, scale, color }: { position: V3; scale: V3; color: string }) { return <mesh position={position} scale={scale} castShadow><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={color} roughness={0.9}/></mesh> }
function Cylinder({ position, args, color, rotation }: { position: V3; args: [number, number, number, number?]; color: string; rotation?: V3 }) { return <mesh position={position} rotation={rotation} castShadow receiveShadow><cylinderGeometry args={args}/><meshStandardMaterial color={color} roughness={0.8}/></mesh> }
function Sign({ text, position, width = 6, height = 1, color = '#3c5146', background = '#f3e8cc', rotation = [0,0,0] }: { text: string; position: V3; width?: number; height?: number; color?: string; background?: string; rotation?: V3 }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 160
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = background; ctx.fillRect(0,0,1024,160)
    ctx.fillStyle = color; ctx.font = 'bold 66px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 512, 84)
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [text, color, background])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={position} rotation={rotation}><planeGeometry args={[width,height]}/><meshStandardMaterial map={texture} roughness={1}/></mesh>
}
function Tree({ position, scale = 1, shade = '#78965c' }: { position: V3; scale?: number; shade?: string }) {
  return <group position={position} scale={scale}><Cylinder position={[0,1.5,0]} args={[0.19,0.28,3,8]} color="#8c7654"/><Ball position={[0,3.3,0]} scale={[1.6,1.85,1.4]} color={shade}/><Ball position={[0.7,3.5,0.15]} scale={[1.15,1.4,1.2]} color={shade}/><Ball position={[-0.5,4.4,0]} scale={[1.1,1.2,1]} color={shade}/></group>
}
function Cup() { return <group><Cylinder position={[0,0,0]} args={[0.24,0.18,0.62,24]} color="#fcf2d8"/><Cylinder position={[0,-0.03,0]} args={[0.219,0.195,0.28,24]} color="#cf744c"/><Cylinder position={[0,0.34,0]} args={[0.255,0.265,0.1,24]} color="#39463e"/><Cylinder position={[0,0.4,0]} args={[0.19,0.24,0.055,24]} color="#46544a"/><Ball position={[0,0,0.212]} scale={[0.08,0.08,0.01]} color="#f5dec0"/></group> }
function Character({ game }: { game: GameControl }) {
  const body = useRef<THREE.Group>(null!), arm = useRef<THREE.Group>(null!)
  useFrame(({clock}) => { if(!game.current.paused){ body.current.rotation.z = Math.sin(clock.elapsedTime * 1.7) * 0.012; arm.current.rotation.x = THREE.MathUtils.lerp(arm.current.rotation.x, game.current.phase === 'flight' || game.current.phase === 'result' ? -1.3 : 0.15, 0.12) } })
  return <group position={[-0.2,10.25,0.35]} rotation={[0,-0.08,0]}><group ref={body}>
    <Box position={[-0.35,0.22,0.04]} size={[0.5,0.42,0.86]} color="#3b4742" round={0.13}/><Box position={[0.38,0.22,-0.12]} size={[0.5,0.42,0.86]} color="#3b4742" round={0.13}/>
    <Box position={[-0.34,0.9,0.15]} size={[0.48,1.3,0.52]} color="#334e51" round={0.17}/><Box position={[0.34,0.9,0]} size={[0.48,1.3,0.52]} color="#334e51" round={0.17}/>
    <Box position={[0,1.95,0]} size={[1.32,1.42,0.72]} color="#d88e59" round={0.25}/><Box position={[0,1.43,0]} size={[1.24,0.17,0.75]} color="#bd7648" round={0.05}/>
    <Cylinder position={[0,2.77,0]} args={[0.22,0.22,0.42,12]} color="#e3b086"/><Ball position={[0,3.24,-0.02]} scale={[0.51,0.61,0.5]} color="#ebba91"/>
    <Ball position={[0,3.49,0.09]} scale={[0.54,0.44,0.51]} color="#594536"/><Box position={[0,3.26,0.35]} size={[0.84,0.46,0.32]} color="#594536" round={0.12}/><Ball position={[0.49,3.2,0]} scale={[0.13,0.2,0.15]} color="#e7ae83"/><Ball position={[-0.49,3.2,0]} scale={[0.13,0.2,0.15]} color="#e7ae83"/>
    <group position={[-0.7,2.4,0]} rotation={[0.3,0,-0.18]}><Box position={[0,-0.42,0]} size={[0.46,0.95,0.5]} color="#d88e59" round={0.18}/><Ball position={[0,-0.98,-0.03]} scale={[0.22,0.3,0.22]} color="#ebba91"/></group>
    <group ref={arm} position={[0.7,2.4,0]}><Box position={[0,-0.28,-0.16]} size={[0.45,0.75,0.5]} color="#d88e59" rotation={[0.55,0,0]} round={0.16}/><Box position={[0,-0.49,-0.61]} size={[0.4,0.4,0.8]} color="#e5a16a" round={0.16}/><Ball position={[0,-0.4,-1.06]} scale={[0.21,0.23,0.26]} color="#ebba91"/>{game.current.phase !== 'flight' && game.current.phase !== 'result' && <group position={[0,-0.2,-1.24]}><Cup/></group>}</group>
  </group></group>
}
function Office() {
  return <group>
    <Box position={[0,9.93,3]} size={[13,0.5,10]} color="#ceb698"/>
    {Array.from({length:14},(_,i)=><Box key={i} position={[-6.3+i*0.95,10.195,3]} size={[0.025,0.012,9.8]} color="#bda485"/>)}
    <Box position={[-5.2,12.75,-1.8]} size={[2.7,5.2,0.45]} color="#e7dcc5"/><Box position={[5.2,12.75,-1.8]} size={[2.7,5.2,0.45]} color="#e7dcc5"/>
    <Box position={[0,10.8,-1.8]} size={[8,1.2,0.45]} color="#e7dcc5"/><Box position={[0,11.48,-1.86]} size={[8.2,0.22,0.94]} color="#fbf2d8" round={0.05}/>
    <Box position={[-3.85,13.35,-1.8]} size={[0.22,4,0.62]} color="#58776e"/><Box position={[3.85,13.35,-1.8]} size={[0.22,4,0.62]} color="#58776e"/><Box position={[0,15.38,-1.8]} size={[7.9,0.22,0.62]} color="#58776e"/>
    <group position={[-3.74,13.42,-1.76]} rotation={[0,-0.8,0]}><Box position={[0.8,0,0]} size={[1.6,3.7,0.1]} color="#a5beb1"/><Box position={[1.6,0,0.08]} size={[0.12,3.8,0.14]} color="#58776e"/><Box position={[0.8,1.88,0.08]} size={[1.7,0.12,0.14]} color="#58776e"/><Box position={[0.8,-1.88,0.08]} size={[1.7,0.12,0.14]} color="#58776e"/></group>
    <Sign text="03" position={[4.55,13.5,-1.54]} width={0.65} height={0.42}/>
    <group position={[-3.6,10.2,2.1]}><Box position={[0,1.4,0]} size={[3.4,0.18,1.65]} color="#b88c60" round={0.05}/>{[-1.3,1.3].map(x=><Box key={x} position={[x,0.7,0]} size={[0.13,1.4,1.2]} color="#586960"/>)}<Box position={[0,2.1,-0.3]} size={[1.5,1,0.12]} color="#485953" round={0.07}/><Box position={[0,2.11,-0.22]} size={[1.3,0.81,0.025]} color="#8baead"/><Box position={[0,1.65,-0.3]} size={[0.14,0.6,0.13]} color="#485953"/><Box position={[0,1.53,0.36]} size={[1,0.06,0.34]} color="#ede5cf"/><Box position={[1.08,1.55,0.25]} size={[0.46,0.11,0.65]} color="#ecb76e" rotation={[0,0.2,0]}/></group>
    <group position={[4.75,10.2,0.1]}><Cylinder position={[0,0.45,0]} args={[0.52,0.4,0.9,16]} color="#bd7454"/>{[0,1,2,3,4].map(i=><group key={i} rotation={[0,i*1.25,0]}><Cylinder position={[0.13,1.15,0]} args={[0.035,0.035,1.4,6]} color="#587c50" rotation={[0,0,-0.2]}/><Ball position={[0.38,1.72,0]} scale={[0.26,0.67,0.12]} color={i%2?'#739159':'#466f4e'}/></group>)}</group>
    <Box position={[0,5,-2.15]} size={[13,10,0.6]} color="#d9c4a2"/>{[2.5,6.6].flatMap(y=>[-4,0,4].map(x=><group key={`${x}-${y}`}><Box position={[x,y,-2.5]} size={[2.4,2.6,0.14]} color="#5c817f"/><Box position={[x,y,-2.6]} size={[0.12,2.6,0.12]} color="#f3e5c8"/></group>))}
  </group>
}
function School() {
  return <group position={[0,0,-27]}>
    <Box position={[0,0.15,0]} size={[41,0.28,31]} color="#a7b982" round={0.12}/><Box position={[0,0.33,10.7]} size={[7,0.08,7]} color="#d6c6a6"/>
    <Box position={[0,3.8,0]} size={[24,7.4,14]} color={colors.cream} round={0.12}/><Box position={[0,0.7,0]} size={[24.3,1,14.3]} color="#c8a87e"/>
    <Box position={[0,4.25,0]} size={[24.3,0.24,14.3]} color={colors.trim}/><Box position={[0,7.52,0]} size={[25,0.4,15]} color={colors.trim}/>
    <Box position={[0,8.4,-3.6]} size={[25,0.35,8.3]} color={colors.roof} rotation={[-0.21,0,0]}/><Box position={[0,8.4,3.6]} size={[25,0.35,8.3]} color={colors.roof} rotation={[0.21,0,0]}/><Box position={[0,9.24,0]} size={[25.1,0.3,0.35]} color="#a95544" round={0.12}/>
    {[-10,-7,-4,4,7,10].flatMap(x=>[2.55,5.8].map(y=><group key={`${x}-${y}`}><Box position={[x,y,7.05]} size={[1.85,2.15,0.18]} color={colors.trim}/><Box position={[x,y,7.17]} size={[1.52,1.82,0.08]} color={colors.window}/><Box position={[x,y,7.24]} size={[0.075,1.9,0.06]} color={colors.trim}/><Box position={[x,y,7.24]} size={[1.6,0.075,0.06]} color={colors.trim}/><Box position={[x,y-1.1,7.2]} size={[2.05,0.15,0.5]} color={colors.trim}/></group>))}
    {[-4.5,0,4.5].flatMap(z=>[2.55,5.8].map(y=><group key={`${z}-${y}`}><Box position={[12.1,y,z]} size={[0.15,2.15,2]} color={colors.trim}/><Box position={[12.21,y,z]} size={[0.08,1.8,1.65]} color={colors.window}/><Box position={[12.26,y,z]} size={[0.08,1.8,0.08]} color={colors.trim}/></group>))}
    <Box position={[0,2,7.22]} size={[2.8,3.6,0.5]} color="#587f77" round={0.09}/><Box position={[0,2.05,7.5]} size={[0.07,3.5,0.05]} color="#d3bd92"/>
    <Sign text="SUNNYSIDE SCHOOL" position={[0,5.7,7.3]} width={5.5} height={0.8}/><Box position={[0,0.36,8]} size={[4,0.35,1.7]} color="#e2d5b7"/>
    <Box position={[0,9.4,0.5]} size={[4.5,4.4,4.5]} color={colors.cream}/><Box position={[0,11.6,0.5]} size={[4.9,0.25,4.9]} color={colors.trim}/><mesh position={[0,12.15,0.5]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[3.5,1.5,4]}/><meshStandardMaterial color={colors.roof}/></mesh>
    <Cylinder position={[0,10.15,2.83]} args={[1.02,1.02,0.1,40]} color="#f9f0d6" rotation={[Math.PI/2,0,0]}/><Box position={[0,10.44,2.9]} size={[0.07,0.57,0.035]} color="#426157"/><Box position={[0.22,10.15,2.91]} size={[0.48,0.07,0.035]} color="#426157"/>
    <group position={[15,0,4]}><Cylinder position={[0,4.5,0]} args={[0.06,0.08,9,8]} color="#f5e8cb"/><Box position={[0.95,8.2,0]} size={[1.9,1.05,0.05]} color="#e6ad5e"/></group>
    {[-17,17].flatMap(x=>[-10,0,11].map((z,i)=><Tree key={`${x}-${z}`} position={[x,0.3,z]} scale={0.8+i*0.09} shade={i%2?'#86a569':'#718f60'}/>))}
    {[-1,1].map(side=><group key={side} position={[side*20,0.4,0]}><Box position={[0,0.6,0]} size={[0.12,0.12,30]} color="#f4e4bd"/><Box position={[0,1.3,0]} size={[0.12,0.12,30]} color="#f4e4bd"/>{Array.from({length:21},(_,i)=><Box key={i} position={[0,0.9,-15+i*1.5]} size={[0.16,1.7,0.17]} color="#eee2c2"/>)}</group>)}
    <Box position={[0,0.65,-15.3]} size={[40,0.13,0.13]} color="#ede6c8"/>{Array.from({length:28},(_,i)=><Box key={i} position={[-20+i*1.48,0.8,-15.3]} size={[0.13,1.55,0.13]} color="#ede6c8"/>)}
    <Box position={[-14,0.37,7]} size={[3,0.05,8]} color="#ce9571"/>{[0,1,2,3].map(i=><Box key={i} position={[-14,0.42,4+i*1.7]} size={[2,0.03,0.07]} color="#f6e8c8"/>)}
  </group>
}
function World() {
  return <group><Box position={[0,-0.5,-30]} size={[220,0.8,220]} color="#c6cbb0"/>
    <Box position={[0,0,-11]} size={[110,0.06,8]} color="#b7b9aa"/><Box position={[0,0.05,-6.3]} size={[110,0.17,1.5]} color="#ded9c5"/><Box position={[0,0.05,-15.7]} size={[110,0.17,1.5]} color="#ded9c5"/>{Array.from({length:18},(_,i)=><Box key={i} position={[-51+i*6,0.05,-11]} size={[2.4,0.03,0.13]} color="#f3ead3"/>)}
    <Box position={[0,0.06,-57]} size={[48,0.12,24]} color="#afc593"/>
    <Box position={[0,0.16,-45]} size={[48,0.09,0.35]} color="#4f9470"/>{[-24,24].map(x=><group key={x}><Cylinder position={[x,2.2,-45]} args={[0.07,0.08,4.4,8]} color="#598466"/><Box position={[x+0.7,3.9,-45]} size={[1.4,0.9,0.06]} color="#73a47b"/></group>)}
    <Sign text="THE OTHER SIDE" position={[0,0.16,-48]} rotation={[-Math.PI/2,0,0]} width={12} height={1.7} background="#afc593" color="#4e795b"/>
    {[-1,1].flatMap(side=>Array.from({length:6},(_,i)=><group key={`${side}-${i}`}><Tree position={[side*(26+(i%2)*5),0,-7-i*10]} scale={1.1+(i%3)*0.2}/><Box position={[side*(44+(i%2)*7),3+i%3,-12-i*13]} size={[10,6+(i%3)*2,8]} color={['#c6c4ad','#d9c7b0','#b5beb0'][i%3]} round={0.18}/><Box position={[side*(44+(i%2)*7),6.3+(i%3)*2,-12-i*13]} size={[10.6,0.4,8.6]} color="#b3b9a5"/></group>))}
    <group position={[-19,0.4,-11]}><Box position={[0,0.6,0]} size={[3.4,1.05,1.65]} color="#e0b45f" round={0.28}/><Box position={[0.1,1.25,0]} size={[1.8,0.9,1.48]} color="#e8c677" round={0.22}/><Box position={[0.1,1.34,0.755]} size={[1.44,0.49,0.02]} color="#71918c"/>{[-1,1].flatMap(x=>[-0.81,0.81].map(z=><Cylinder key={`${x}-${z}`} position={[x,0.28,z]} args={[0.35,0.35,0.17,16]} rotation={[Math.PI/2,0,0]} color="#4b554b"/>))}</group>
  </group>
}
function Action({ game, sync, updateGame }: { game: GameControl; sync: () => void; updateGame: (next: GameState) => void }) {
  const cup = useRef<THREE.Group>(null!), guide = useRef<THREE.Group>(null!), target = useRef<THREE.Group>(null!)
  const timer = useRef(0), flightTime = useRef(0), lastPhase = useRef(''), lastAttempt = useRef(0), lastSync = useRef(0)
  const look = useRef(new THREE.Vector3(0,10,-17)), camTarget = useMemo(()=>new THREE.Vector3(),[])
  useFrame(({camera}, rawDelta) => {
    const g = { ...game.current, shot: { ...game.current.shot } }, delta = Math.min(rawDelta, 0.05)
    if(g.paused) return
    if(g.attempt !== lastAttempt.current) { flightTime.current = 0; timer.current = 0; lastAttempt.current = g.attempt; cup.current.rotation.set(0,0,0) }
    if(g.phase !== lastPhase.current) { timer.current = 0; lastPhase.current = g.phase }
    timer.current += delta
    const aiming = !['flight','result'].includes(g.phase)
    if(aiming) {
      g.meter = (Math.sin(timer.current * (g.phase === 'power' ? 3.1 : 1.9)) + 1) / 2
      if(g.phase === 'direction') g.shot.direction = (g.meter-0.5)*48
      if(g.phase === 'trajectory') g.shot.trajectory = 12+g.meter*64
      if(g.phase === 'power') g.shot.power = 0.08+g.meter*0.64
      camTarget.set(8,17,23); camera.position.lerp(camTarget,1-Math.exp(-delta*3)); look.current.lerp(new THREE.Vector3(0,10,-17),1-Math.exp(-delta*3))
      for(let i=0;i<guide.current.children.length;i++) { const p=positionAt(g.shot,(i+1)*0.075); guide.current.children[i].position.set(p.x,p.y,p.z); guide.current.children[i].visible=p.y>0 }
      const t=positionAt(g.shot,0.7); target.current.position.set(t.x,11.7,t.z); target.current.rotation.y = -g.shot.direction*Math.PI/180
    } else if(g.phase === 'flight') {
      const end = flightTime.current+delta
      while(flightTime.current < end) {
        flightTime.current = Math.min(end,flightTime.current+1/120)
        const p = positionAt(g.shot,flightTime.current), hit=collisionAt(p)
        cup.current.position.set(p.x,Math.max(0.3,p.y),p.z); g.distance=distanceAt(p); g.height=p.y
        if(hit) { g.phase='result'; g.hit=hit; g.won=isWinningLanding(p,hit); g.best=Math.max(g.best,g.distance); break }
      }
      cup.current.rotation.x += delta*5; cup.current.rotation.z += delta*2
    }
    if(!aiming) {
      const p = cup.current.position
      // Follow from above with a slight forward angle to show the landing area.
      camTarget.set(p.x + 3, p.y + 22, p.z + 8)
      camera.position.lerp(camTarget, 1 - Math.exp(-delta * 3))
      look.current.lerp(new THREE.Vector3(p.x, Math.max(1, p.y), p.z - 2), 1 - Math.exp(-delta * 5))
    }
    cup.current.visible=!aiming; guide.current.visible=aiming; target.current.visible=aiming
    camera.lookAt(look.current)
    updateGame(g)
    lastSync.current += delta; if(lastSync.current>0.04){ lastSync.current=0; sync() }
  })
  return <><group ref={cup} position={[START.x,START.y,START.z]} visible={false}><Cup/></group><group ref={guide}>{Array.from({length:24},(_,i)=><mesh key={i}><sphereGeometry args={[0.085+i*0.004,8,6]}/><meshBasicMaterial color="#fff1c9" transparent opacity={1-i/35}/></mesh>)}</group><group ref={target}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[0.55,0.59,40]}/><meshBasicMaterial color="#fff1c9" transparent opacity={0.7} side={THREE.DoubleSide}/></mesh></group></>
}
const StaticWorld = memo(World)
const StaticSchool = memo(School)
const StaticOffice = memo(Office)
export function Scene({ game, sync, updateGame }: { game: GameControl; sync: () => void; updateGame: (next: GameState) => void }) {
  return <><color attach="background" args={['#dde2cf']}/><fog attach="fog" args={['#dde2cf',65,160]}/><ambientLight intensity={0.9}/><hemisphereLight args={['#fff9df','#a5af91',1.5]}/><directionalLight position={[-25,40,20]} intensity={2.5} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-camera-far={150} shadow-normalBias={0.045}/><StaticWorld/><StaticSchool/><StaticOffice/><Character game={game}/><Action game={game} sync={sync} updateGame={updateGame}/></>
}
