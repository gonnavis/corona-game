/*
auto-generated by: https://github.com/react-spring/gltfjsx
*/

import React, { useRef, useEffect, useState, useCallback, forwardRef, Suspense, useMemo } from 'react'
import { useFrame, useResource } from 'react-three-fiber'
import { useSphere, useParticle, useLockConstraint } from 'use-cannon';
import { useSpring, a, config } from 'react-spring/three';
import * as THREE from "three";
import lerp from "lerp"
import useSound from 'use-sound'

import HitSfx from './sounds/Player_Hit.wav'
import HitSfx2 from './sounds/Player_Hit_2.wav'
import alertSfx from './sounds/Alert.wav'

import { COLLISION_GROUP, CORONA_STATUS, useOutline, useAssets, playerApi, useCorona } from "./store"
import Exclamation from './Exclamation';
import Pow from './Pow';

const ATTACK_DURATION = 10

function CoronaEntryPoint(props) {

  return (
    <>
      <PhyCorona {...props} />
      <CoronaRenderer {...props} />
    </>
  )
}

function PhyCorona(props) {
    const { id, initPosition, store } = props
    const [useCorona] = store
    
    const { status, orientation, actions } = useCorona(s => s)
    const { setStatus, handleAttack: _handleAttack, setRef, update, updateSeekingOrientation } = actions
    
    const time = useRef(0)
    const attackPosition = useRef()

    const { playerBody, playerApi: _playerApi } = playerApi.getState()
    
    const [coronaBody, coronaBodyApi] = useSphere(() => ({
      args: 0.2,
      mass: 0.2,
      initPosition,
      collisionFilter: COLLISION_GROUP.CORONA,
      collisionFilterMask: COLLISION_GROUP.CHEST | COLLISION_GROUP.BAT | COLLISION_GROUP.CORONA | COLLISION_GROUP.TILES,
      onCollide: e => handleCollide(e)
    }))

    const [lock, lockApi] = useParticle(() => ({
      args: [0.05, 0.2, 0.5, 16],
      initPosition,
      material: { friction: 0, restitution: 0.2 },
      linearDamping: 0.1,
      angularDamping: 0.1,
      type: "Kinetic"
    }))

    const [, , { disable }] = useLockConstraint(coronaBody, lock)

    const handleCollide = useCallback(
      function handleCollide(e) {

        const { contact, body } = e
        const { impactVelocity, ni } = contact

        coronaBodyApi.rotation.set(
          coronaBody.current.rotation.x + ni[0],
          coronaBody.current.rotation.y + ni[1],
          coronaBody.current.rotation.z + ni[2]
        )

        if (body?.userData?.type === COLLISION_GROUP.BAT) {
          const absVelocity = Math.abs(impactVelocity)
          _handleAttack(absVelocity)
        }

      },
      [coronaBody, coronaBodyApi, _handleAttack]
    )

    const handleAttack = useCallback(
      function handleAttack() {
        
        if (time.current === 0) {
        
          attackPosition.current = [
            new THREE.Vector3(playerBody.current.position.x, coronaBody.current.position.y, playerBody.current.position.z),
            coronaBody.current.position.clone()
          ]
        
        } else if (time.current < ATTACK_DURATION * 2) {

          const { x, y, z } = attackPosition.current[time.current < ATTACK_DURATION ? 0 : 1]

          lockApi.position.set(
            lerp(lock.current.position.x, x, 0.2),
            lerp(lock.current.position.y, y, 0.2),
            lerp(lock.current.position.z, z, 0.2)
          )

        }
        
        if (time.current === ATTACK_DURATION * 4) {
          
          setStatus(CORONA_STATUS.SEEKING)
          time.current = 0

        } else {
          
          time.current += 1

        }
        
      },
      [time, lock, lockApi, setStatus, playerBody]
    )

    const handleDeath = useCallback(
      function handleDeath() {

        disable()
  
        const dir = new THREE.Vector3()
        dir.subVectors(playerBody.current.position, coronaBody.current.position).normalize();
        
        coronaBodyApi.applyLocalImpulse([-1 * dir.x, -1, -1 * dir.z], [1, 1, 1])

      },
      [disable, coronaBody, coronaBodyApi, time, playerBody]
    )

    const onFrame = useCallback(
        function onFrame() {
          
          if (status === CORONA_STATUS.DEAD) return

          update()
            
          if (status === CORONA_STATUS.ATTACK) {

              handleAttack()

          } else {

              const velocityFactor = status === CORONA_STATUS.IDLE ? 1 / 50 : 1 / 30
              lockApi.position.set(
                  lock.current.position.x + orientation.x * velocityFactor,
                  initPosition[1],
                  lock.current.position.z + orientation.z * velocityFactor
              )

          }
        },
        [lock, lockApi, initPosition, handleAttack, handleDeath, orientation, time, update, status]
    )

    useEffect(() => {
      if (status === CORONA_STATUS.DEAD) {
        handleDeath()
      }
    }, [handleDeath, status])

    useEffect(() => void setRef(coronaBody), [coronaBody, setRef])
    
    useEffect(() => _playerApi.position.subscribe(updateSeekingOrientation), [updateSeekingOrientation, _playerApi])
    
    useFrame(() => void onFrame())

    return (
      <>
        <mesh ref={lock} />
        <mesh ref={coronaBody} userData={{ type: COLLISION_GROUP.CORONA, id }} >
          {/* <sphereBufferGeometry attach="geometry" args={[.2,32,32]}/>
          <meshBasicMaterial attach="material" color="red" /> */}
        </mesh>
      </>
    )
  }

function CoronaRenderer(props) {
    const { id, store } = props
    const [useMyCorona] = store

    const [isUnderAttack, setIsUnderAttack] = useState(false)
    const [isSeeking, setIsSeeking] = useState(false)
    const [prevStatus, setPrevStatus] = useState(CORONA_STATUS.IDLE)

    const { life, status, ref } = useMyCorona(s => s)

    const removeCorona = useCorona(s => s.actions.removeCorona)

    const group = useRef()
    const rotationGroup = useRef()
    
    const [resourceRef, material] = useResource()

    const nodes = useAssets(s => s.coronaNodes)
    const { addOutline, removeOutline } = useOutline(s => s)
    
    const rand = React.useRef(Math.floor(Math.random() * 10) + 1)
    const [playHitSfx, hitSfxMeta] = useSound(rand.current > 5 ? HitSfx : HitSfx2)
    const [playAlertSfx] = useSound(alertSfx)

    const [springProps, set] = useSpring(() => ({ opacity: 1, config: config.molasses }))

    useEffect(() => void addOutline(group.current), [addOutline, group]);
    
    const handleDeath = useCallback(() => {

      removeOutline(group.current)
      resourceRef.current.color = 0xff0000
      set({ opacity: 0, config: config.molasses, onRest: () => removeCorona(id) })

    }, [id, group, removeOutline, set, removeCorona])
    
    useEffect(() => {
      if (status !== prevStatus) {
        if (prevStatus === CORONA_STATUS.IDLE && status === CORONA_STATUS.SEEKING) {
            playAlertSfx()
            setIsSeeking(true)
            setTimeout(() => setIsSeeking(false), 1000)
        }
        setPrevStatus(status)
      }
    }, [prevStatus, status, isSeeking, playAlertSfx])

    useEffect(() => {
      setIsUnderAttack(true)
      playHitSfx()
      setTimeout(() => setIsUnderAttack(false), 300)
    }, [life, playHitSfx, setIsUnderAttack])
    
    useEffect(() => {
      if (status === CORONA_STATUS.DEAD) {
        handleDeath()
      }
    }, [status, handleDeath])

    useFrame(({ clock }) => {

      const multiplier = 10 * (isSeeking ? 2 : 1)
      group.current.position.copy(ref.current.position)
      rotationGroup.current.rotation.copy(ref.current.rotation)
      group.current.position.y += 0.1 * (Math.sin((clock.getElapsedTime() % (2 * Math.PI)) * multiplier + rand.current * 5))

    })
    
    return (
        <>
            <a.meshToonMaterial
                transparent
                color={0x1E9983}
                shininess={0.3}
                specular={0xaaaaaa}
                ref={resourceRef}
                {...springProps}
            />
        
            <group ref={group} dispose={null} scale={[0.1, 0.1, 0.1]} >
                
                <Suspense fallback={null}>
                    <Exclamation position={[0, 2.5, 0]} scale={[2, 2, 1]} visible={(isSeeking)} />
                    <Pow position={[0, 1.5, 0]} scale={[2, 2, 1]} visible={isUnderAttack} />
                </Suspense>

                <group ref={rotationGroup} >
                    <mesh castShadow material={material} geometry={nodes?.Cube_0?.geometry} name="Cube_0" />
                    <mesh castShadow material={material} geometry={nodes?.Cube_1?.geometry} name="Cube_1" />
                    <mesh castShadow material={material} geometry={nodes?.Cube_2?.geometry} name="Cube_2" />
                    <mesh castShadow material={material} geometry={nodes?.Cube_3?.geometry} name="Cube_3" />
                </group>
                
            </group>
        </>
    )
}

export default CoronaEntryPoint