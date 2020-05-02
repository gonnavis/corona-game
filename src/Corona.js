/*
auto-generated by: https://github.com/react-spring/gltfjsx
*/

import React, { useRef, useEffect, useCallback, forwardRef, Suspense } from 'react'
import { useFrame, useResource } from 'react-three-fiber'
import { useSphere, useParticle, useLockConstraint } from 'use-cannon';
import { useSpring, a, config } from 'react-spring/three';
import * as THREE from "three";
import useSound from 'use-sound'

import HitSfx from './sounds/Player_Hit.wav'
import HitSfx2 from './sounds/Player_Hit_2.wav'
import alertSfx from './sounds/Alert.wav'
import { COLLISION_GROUP, CORONA_STATUS, useOutline, useAssets, playerApi, useCorona } from "./store"
import Exclamation from './Exclamation';
import Pow from './Pow';

const ATTACK_DURATION = 10

function PhyCorona(props) {
  const { id, initPosition, store } = props

  const [useMyCorona] = store
  const { ref, status, orientation, actions, isUnderAttack, seekAlert } = useMyCorona(s => s)
  const { setStatus, handleAttack: _handleAttack, update } = actions

  const removeCorona = useCorona(s => s.actions.removeCorona)

  const time = useRef(0)
  const attackPosition = useRef()

  const { playerBody, isAttacking: isPlayerAttacking } = playerApi.getState()

  const [coronaBody, coronaBodyApi] = useSphere(() => ({
    args: 0.2,
    mass: 1,
    position: initPosition,
    material: { friction: 0, restitution: 0.2 },
    linearDamping: 0.1,
    angularDamping: 0.1,
    collisionFilter: COLLISION_GROUP.CORONA,
    collisionFilterMask: COLLISION_GROUP.CHEST | COLLISION_GROUP.BAT | COLLISION_GROUP.CORONA | COLLISION_GROUP.TILES,
    onCollide: e => onCollide.current(e)
  }))

  const [lock, lockApi] = useParticle(() => ({
    args: [0.05, 0.2, 0.5, 16],
    position: initPosition,
    material: { friction: 0, restitution: 0.2 },
    linearDamping: 0.1,
    angularDamping: 0.1,
  }), ref)

  const [, , { disable }] = useLockConstraint(coronaBody, lock)

  const onCollide = useRef()
  const handleCollide = useCallback(
    function handleCollide(e) {

      const { contact, body } = e

      if (body?.userData?.type === COLLISION_GROUP.BAT && isPlayerAttacking) {
        const { rj } = contact
        _handleAttack()
      }

    },
    [time, isPlayerAttacking, lockApi, lock, _handleAttack]
  )
  useEffect(() => void (onCollide.current = handleCollide), [onCollide, handleCollide])

  const handleAttack = useCallback(
    function handleAttack() {

      if (time.current === 0) {

        const dir = new THREE.Vector3()
        dir.subVectors(playerBody.current.position, coronaBody.current.position).normalize();

        const { x, y, z } = dir.multiplyScalar(0.75).add(coronaBody.current.position)
        lockApi.position.set(x, y, z)

      }

      if (time.current === ATTACK_DURATION) {

        const { x, y, z } = attackPosition.current
        lockApi.position.set(x, y, z)
        setStatus(CORONA_STATUS.PRE_ATTACK)

      }

      if (time.current === ATTACK_DURATION * 8) {

        time.current = 0

      } else {

        time.current += 1

      }
    },
    [time, lock, lockApi, setStatus, playerBody, attackPosition]
  )

  const handleDeath = useCallback(
    function handleDeath() {

      disable()

      const dir = new THREE.Vector3()
      dir.subVectors(playerBody.current.position, coronaBody.current.position).normalize();

      coronaBodyApi.applyLocalImpulse([-1 * dir.x, -1, -1 * dir.z], [1, 1, 1])
    },
    [disable, coronaBody, coronaBodyApi, playerBody]
  )

  useEffect(() => void (status === CORONA_STATUS.DEAD && handleDeath()), [handleDeath, status])

  const renderingGroup = useRef()
  useFrame(function () {
    if (
      status === CORONA_STATUS.DEAD ||
      status === CORONA_STATUS.PRE_ATTACK
    ) return

    if (status === CORONA_STATUS.ATTACK) {
      handleAttack()
    } else {
      attackPosition.current = lock.current.position.clone()

      const velocityFactor = status === CORONA_STATUS.IDLE ? 1 / 50 : 1 / 30
      lockApi.position.set(
        lock.current.position.x + orientation.x * velocityFactor,
        initPosition[1],
        lock.current.position.z + orientation.z * velocityFactor
      )
    }

    renderingGroup.current.position.copy(coronaBody.current.position)
  })


  return (
    <>
      <mesh ref={lock} />
      <mesh ref={coronaBody} userData={{ type: COLLISION_GROUP.CORONA, id }} />
      <group ref={renderingGroup} scale={[0.2, 0.2, 0.2]}>
        <CoronaRenderer
          {...props}
          status={status}
          isUnderAttack={isUnderAttack}
          seekAlert={seekAlert}
          onDeathAnimEnd={removeCorona}
        />
        <CoronaUI
          position={coronaBody}
          seekAlert={seekAlert}
          isUnderAttack={isUnderAttack}
        />
      </group>
      <CoronaHowler
        isUnderAttack={isUnderAttack}
        seekAlert={seekAlert}
      />

    </>
  )
}

const CoronaUI = React.memo(function CoronaUI({
  seekAlert,
  isUnderAttack
}) {

  return (
    <Suspense fallback={null}>
      <Exclamation position={[0, 2.5, 0]} scale={[2, 2, 1]} visible={seekAlert} />
      <Pow position={[0, 1.5, 0]} scale={[2, 2, 1]} visible={isUnderAttack} />
    </Suspense>
  )
})

const CoronaHowler = React.memo(function CoronaHowler({ isUnderAttack, seekAlert }) {
  const rand = React.useRef(Math.floor(Math.random() * 10) + 1)

  const [playHitSfx] = useSound(rand.current > 5 ? HitSfx : HitSfx2)
  const [playAlertSfx] = useSound(alertSfx)

  useEffect(() => void (seekAlert && playAlertSfx()), [seekAlert, playAlertSfx])
  useEffect(() => void (isUnderAttack && playHitSfx()), [isUnderAttack, playHitSfx])

  return null
})

const CoronaRenderer = React.memo(forwardRef(
  function CoronaRenderer(props, ref) {
    const { id, status, onDeathAnimEnd } = props

    const rand = React.useRef(Math.floor(Math.random() * 10) + 1)

    const shadow = useRef()
    const group = useRef()
    const rotationGroup = useRef()

    const { coronaNodes: nodes, coronaShadow: shadowTexture } = useAssets(s => s)

    const { addOutline, removeOutline } = useOutline(s => s)

    const [resourceRef, material] = useResource()

    const [springProps, set] = useSpring(() => ({ opacity: 1, config: config.molasses }))


    const coronaMesh = useRef()
    const positionGroup = useRef()

    const handleDeath = useCallback(() => {
      removeOutline(coronaMesh.current)
      set({ opacity: 0, config: config.molasses, onRest: () => onDeathAnimEnd(id) })
    }, [id, group, removeOutline, set, onDeathAnimEnd])
    useEffect(() => void addOutline(coronaMesh.current), [addOutline, group]);

    useEffect(() => void (status === CORONA_STATUS.DEAD && handleDeath()), [status, handleDeath])

    useFrame(({ clock }) => {
      const multiplier = 10 * (status === CORONA_STATUS.SEEKING ? 2 : 1)
      // group.current.position.copy(ref.current.position)
      // rotationGroup.current.rotation.copy(ref.current.rotation)
      // group.current.position.y += 0.1 * (Math.sin((clock.getElapsedTime() % (2 * Math.PI)) * multiplier + rand.current * 5))

      positionGroup.current.position.y = Math.sin(rand.current + clock.elapsedTime * multiplier) * 0.5

      const h = 1 - Math.sin(rand.current + clock.elapsedTime * multiplier) / 8
      const v = 1 + Math.sin(rand.current + clock.elapsedTime * multiplier) / 10

      coronaMesh.current.scale.x = h
      coronaMesh.current.scale.z = h
      coronaMesh.current.scale.y = v

      const { x, z } = group.current.position
      shadow.current.material.opacity = THREE.MathUtils.lerp(.6, .1, positionGroup.current.position.y);

      shadow.current.scale.x = THREE.MathUtils.lerp(4, 2, positionGroup.current.position.y);
      shadow.current.scale.y = THREE.MathUtils.lerp(4, 2, positionGroup.current.position.y);

    })

    return (
      <>
        <a.meshToonMaterial
          transparent
          color={status === CORONA_STATUS.DEAD ? 0xff0000 : 0x1E9983}
          shininess={0.7}
          specular={0xffffff}
          ref={resourceRef}
          {...springProps}
        />

        <group ref={group} dispose={null} >
          <group ref={rotationGroup}>
            <group ref={positionGroup}>
              <mesh material={material} ref={coronaMesh} geometry={nodes?.Cube?.geometry} name="Corona" />
            </group>
          </group>

          <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[4, 4, 4]} visible={status !== CORONA_STATUS.DEAD} >
            <planeBufferGeometry attach="geometry" args={[0.5, 0.5]} />
            <meshBasicMaterial
              attach="material"
              map={shadowTexture}
              transparent={true}
              depthWrite={false}
            />
          </mesh>

        </group>

      </>
    )
  }
))

export default PhyCorona