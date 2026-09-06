import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { collisionAt, isWinningLanding, positionAt } from '../src/physics.ts'
import type { Shot } from '../src/physics.ts'
function simulate(shot: Shot) {
  for (let t = 0; t < 20; t += 1 / 120) {
    const p = positionAt(shot, t), hit = collisionAt(p)
    if (hit) return { p, hit, won: isWinningLanding(p, hit) }
  }
  throw new Error('Throw never landed')
}
test('a well-aimed full-power throw clears the school and wins', () => {
  const result = simulate({ direction: 0, trajectory: 48, power: 1 })
  assert.equal(result.won, true)
  assert.ok(result.p.z < -43)
  assert.ok(result.p.z > -50)
})
test('a medium-power throw reaches the school but does not clear it', () => {
  assert.equal(simulate({ direction: 0, trajectory: 48, power: 0.8 }).hit, 'school')
})
test('a weak throw falls short', () => {
  assert.equal(simulate({ direction: 0, trajectory: 45, power: 0.15 }).won, false)
})
test('a low throw can collide with the school', () => {
  assert.equal(simulate({ direction: 0, trajectory: 12, power: 0.35 }).hit, 'school')
})
test('flying beyond the line is not enough until the cup lands', () => {
  assert.equal(collisionAt({ x: 0, y: 15, z: -46 }), null)
})
test('landing outside the target width does not win', () => {
  assert.equal(isWinningLanding({ x: 25, y: 0, z: -50 }, 'ground'), false)
  assert.equal(isWinningLanding({ x: 0, y: 0, z: -42.5 }, 'ground'), false)
  assert.equal(isWinningLanding({ x: 0, y: 0, z: -50 }, 'school'), false)
})
test('direction changes lateral movement and trajectory changes height', () => {
  const left = positionAt({ direction: -20, trajectory: 45, power: 0.8 }, 1)
  const right = positionAt({ direction: 20, trajectory: 45, power: 0.8 }, 1)
  assert.ok(left.x < 0 && right.x > 0)
  assert.equal(left.z, right.z)
  assert.ok(positionAt({ direction: 0, trajectory: 60, power: 0.8 }, 1).y > positionAt({ direction: 0, trajectory: 20, power: 0.8 }, 1).y)
})
