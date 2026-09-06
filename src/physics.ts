export type Phase = 'direction' | 'trajectory' | 'power' | 'flight' | 'result'
export type Shot = { direction: number; trajectory: number; power: number }
export type Point = { x: number; y: number; z: number }
export const START: Point = { x: 0.65, y: 12.6, z: -1.5 }
export const FAR_BOUNDARY = -45
export const defaultShot: Shot = { direction: 0, trajectory: 45, power: 0.7 }
export function positionAt(shot: Shot, time: number): Point {
  const yaw = shot.direction * Math.PI / 180
  const pitch = shot.trajectory * Math.PI / 180
  const speed = 10 + 17 * shot.power
  return {
    x: START.x + Math.sin(yaw) * Math.cos(pitch) * speed * time,
    y: START.y + Math.sin(pitch) * speed * time - 4.905 * time * time,
    z: START.z - Math.cos(yaw) * Math.cos(pitch) * speed * time,
  }
}
export function collisionAt(p: Point): 'school' | 'ground' | null {
  const roofHeight = 9.55 - Math.abs(p.z + 27) * 0.21
  if (Math.abs(p.x) < 12.7 && p.z < -19.2 && p.z > -34.8 && p.y < Math.max(7.8, roofHeight)) return 'school'
  const towerRoof = 13.1 - Math.max(Math.abs(p.x), Math.abs(p.z + 26.5)) * 0.6
  if (Math.abs(p.x) < 2.6 && p.z < -23.9 && p.z > -29.1 && p.y < Math.max(11.8, towerRoof)) return 'school'
  return p.y <= 0.3 ? 'ground' : null
}
export function isWinningLanding(p: Point, hit: 'school' | 'ground') {
  return hit === 'ground' && p.z < FAR_BOUNDARY && Math.abs(p.x) < 24
}
export function distanceAt(p: Point) { return Math.hypot(p.x - START.x, p.z - START.z) }
