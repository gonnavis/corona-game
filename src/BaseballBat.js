/*
auto-generated by: https://github.com/react-spring/gltfjsx
*/

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useLoader, useFrame, useResource } from "react-three-fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { a, useSpring } from "react-spring/three";
import { useBox } from "use-cannon";
import * as THREE from "three";
import useSound from "use-sound";
import { draco } from 'drei'

import { useOutline, usePlayer, COLLISION_GROUP, useInteraction, useAssets } from "./store"
import playerHitSfx from './sounds/Player_Hit.wav'

const batMovements = {
  init: {
    t: 1,
    spring: {
      rotation: [Math.PI, -Math.PI / 12, -Math.PI],
      position: [0.1, 0.1, 0.1]
    }
  },
  half: {
    t: 5,
    spring: {
      rotation: [(-Math.PI * 2) / 6, Math.PI / 8, -Math.PI],
      position: [-0.5, -0.5, 0.2]
    }
  },
  end: {
    t: 15,
    spring: {
      rotation: [Math.PI / 2, -Math.PI / 24, -Math.PI],
      position: [0.3, 0, 0]
    }
  },
  idle: { t: 90 }
}

function PhyBaseballBat(props) {
  const [] = useSound(playerHitSfx)

  const [mybody, api] = useBox(() => ({
    args: [0.05, 1, 0.05],
    mass: 1,
    collisionFilterGroup: COLLISION_GROUP.BAT,
    collisionFilterMask: COLLISION_GROUP.CORONA,
  }));

  return (
    <>
      <mesh ref={mybody} userData={{ type: COLLISION_GROUP.BAT }} />
      <BaseballBat api={api} body={mybody} {...props} />
    </>
  )
}

function BaseballBat(props) {
  const { api, body, ...allTheRest } = props;
  
  const batRef = useRef()
  const batGroupRef = useRef()
  const time = useRef(batMovements.idle.t);

  const [attacked, setAttacked] = useState(false)

  const addOutline = useOutline(s => s.addOutline)
  const life = usePlayer(s => s.life)
  const { addCallback } = useInteraction(s => s.actions)
  const fiveTone = useAssets(s => s.fiveTone)
  const { nodes } = useLoader(GLTFLoader, "/baseball_bat.glb", draco());

  const [spring, set] = useSpring(() => ({
    ...batMovements.end.spring,
    config: { mass: 1, tension: 210, friction: 10 }
  }));

  const handleClick = useCallback(
    function handleClick() {
      if (time.current > batMovements.end.t) {
        time.current = 0
      }
    },
    [time]
  )

  const [metalResourceRef, metalMaterial] = useResource()
  const [handleResourceRef, handleMaterial] = useResource()

  useEffect(() => void setAttacked(true), [life])

  useEffect(() => void (attacked && setTimeout(() => setAttacked(false), 200)), [attacked])

  useEffect(() => void addCallback(handleClick), [handleClick, addCallback]);

  useEffect(() => void addOutline(batGroupRef.current), [addOutline, batGroupRef]);

  useFrame(() => {
    const { init, half, end, idle } = batMovements
    time.current += 1;

    if (time.current === init.t) {

      body.current.userData.isAttacking = true
      batGroupRef.current.rotation.x = Math.PI / 2;
      batGroupRef.current.rotation.y = 0;
      set({ ...init.spring });

    } else if (time.current === half.t) {

      set({ ...half.spring });

    } else if (time.current === end.t) {

      set({ ...end.spring, onRest: () => (body.current.userData.isAttacking = false) });
      
    } else if (time.current > idle.t) {

      batGroupRef.current.rotation.x = Math.PI / 2 + Math.cos(time.current / 10) / 6
      batGroupRef.current.rotation.y = Math.sin(time.current / 10) / 6;

    }
    
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
  
    batRef.current.matrixWorld.decompose(position, quaternion, {});
    euler.setFromQuaternion(quaternion)
  
    api.position.set(position.x, position.y, position.z);
    api.rotation.set(euler.x, euler.y, euler.z);
  });

  return (
    <>
      <meshToonMaterial
        color={attacked ? 0x76747E : 0xB8B5C3}
        shininess={0}
        specular={0xaaaaaa}
        ref={metalResourceRef}
        gradientMap={fiveTone}
      />
      <meshToonMaterial
        color={attacked ? 0x740000 : 0x454194}
        shininess={0}
        specular={0x888888}
        ref={handleResourceRef}
        gradientMap={fiveTone}
      />

      <group ref={batGroupRef} {...allTheRest} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <a.group scale={[0.02, 0.12, 0.02]} {...spring} >
          <mesh position={[0, 0, 0]} ref={batRef} />
          <mesh material={metalMaterial} geometry={nodes.Cylinder_1.geometry} />
          <mesh material={handleMaterial} geometry={nodes.Cylinder_0.geometry} />
          <mesh material={handleMaterial} geometry={nodes.Cylinder_2.geometry} />
        </a.group>
      </group>
    </>
  );
}

export default PhyBaseballBat