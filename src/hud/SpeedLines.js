import React, { useState, useEffect } from "react";
import { usePlayer } from "../store"

import Sprite from '../utility/Sprite'
import { Vector3 } from "three";

function SpeedLines(props) {

    const scale = [window.innerWidth, window.innerHeight, 1]
    const playerApi = usePlayer(s => s.playerApi)
    const TH = 8

    const [visible, setVisible] = useState(false)
    const handleV = React.useCallback((varr) => {
        const v = new Vector3(...varr).length()

        if (v > TH) {
            setVisible((v - TH) / TH)
        } else {
            setVisible(false)
        }
    }, [setVisible])

    useEffect(() => {
        if (playerApi && handleV) {
            return playerApi.velocity.subscribe(handleV)
        }
    }, [playerApi, handleV])

    return (
        <>
            <Sprite
                visible={visible}
                opacity={visible}
                IconPosition={[0, 0, 1]}
                IconSize={scale}
                textureSrc="/speed-spritesheet.png"
                plainAnimatorArgs={[1, 28, 28, 24]}
            />
        </>
    )
}

export default SpeedLines;