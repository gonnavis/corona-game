/*
auto-generated by: https://github.com/react-spring/gltfjsx
*/

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useLoader, useFrame, useResource } from "react-three-fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { a, useSpring } from "react-spring/three";
import * as THREE from "three";

import { batRef, batGroupRef, useOutline, useLife, usePlayerAttack } from "./store"

const batMovements = {
  init: {
    t: 1,
    spring: {
      rotation: [Math.PI, -Math.PI / 12, -Math.PI],
      position: [0.3, 0.3, 0.1]
    }
  },
  half: {
    t: 15,
    spring: {
      rotation: [(-Math.PI * 2) / 6, Math.PI / 8, -Math.PI],
      position: [-0.5, -0.5, 0.2]
    }
  },
  end: {
    t: 25,
    spring: {
      rotation: [Math.PI / 2, -Math.PI / 24, -Math.PI],
      position: [0, 0, 0]
    }
  },
  idle: { t: 90 }
}

function BaseballBat(props) {
  const { callbacks, ...allTheRest } = props;

  const time = useRef(batMovements.idle.t);
  const [attacked, setAttacked] = useState(false)

  const addOutline = useOutline(s => s.addOutline)
  const { setAttacking, resetAttacking } = usePlayerAttack(s => s)
  const life = useLife(s => s.life)

  const { nodes } = useLoader(
    GLTFLoader,
    "/baseball_bat.glb",
    loader => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco-gltf/");
      loader.setDRACOLoader(dracoLoader);
    }
    );
    
  const [spring, set] = useSpring(() => ({
    ...batMovements.end.spring,
    config: { mass: 1, tension: 210, friction: 10 }
  }));

  const handleClick = useCallback(
    function handleClick() {
      if (time.current > 0 && time.current < batMovements.half.t) {
        time.current = batMovements.half.t - 1;
      } else {
        time.current = 0;
      }
    },
    [time]
  )

  const [metalResourceRef, metalMaterial] = useResource()
  const [handleResourceRef, handleMaterial] = useResource()

  useEffect(() => {
    setAttacked(true)
  }, [life])

  useEffect(() => {
    if (attacked) {
      setTimeout(() => setAttacked(false), 200)
    }
  }, [attacked])

  useEffect(() => {
    callbacks.current.push(handleClick);
  }, [callbacks]);

  useEffect(() => {
    addOutline(batGroupRef.current);
  }, [addOutline, batGroupRef]);

  useFrame(() => {
    const { init, half, end, idle } = batMovements
    time.current += 1;

    if (time.current === init.t) {

      setAttacking()
      batGroupRef.current.rotation.x = Math.PI/2;
      batGroupRef.current.rotation.y = 0;
      set({...init.spring});

    } else if (time.current === half.t) {
      
      set({...half.spring});

    } else if (time.current === end.t) {
      
      resetAttacking()
      set({...end.spring});

    } else if (time.current > idle.t) {
      
      batGroupRef.current.rotation.x = Math.PI/2 + Math.cos(time.current / 10) / 6
      batGroupRef.current.rotation.y = Math.sin(time.current / 10) / 6;

    }
  });

  return (
    <>
      <meshToonMaterial
        color={attacked ? 0xff4545 : 0x888888}
        shininess={0.3}
        specular={0xaaaaaa}
        ref={metalResourceRef}
       />
      <meshToonMaterial
        color={attacked ? 0x740000 : 0x222222}
        shininess={0.3}
        specular={0x888888}
        ref={handleResourceRef}
       />

      <group ref={batGroupRef} {...allTheRest} rotation={[Math.PI/2, 0, 0]} dispose={null}>
        <a.group scale={[0.02, 0.12, 0.02]} {...spring} >
          <mesh position={[0, 2.5, 0]} ref={batRef} />
          <mesh material={metalMaterial} geometry={nodes.Cylinder_1.geometry} />
          <mesh material={handleMaterial} geometry={nodes.Cylinder_0.geometry} />
          <mesh material={handleMaterial} geometry={nodes.Cylinder_2.geometry} />
        </a.group>
      </group>
    </>
  );
}

export default BaseballBat