"use client";
import { useEffect, useRef } from "react";
import VrGallary from "@/lib/three/vrGallary";
const Zoomtastic = require("zoomtastic");
import * as THREE from "three";

export default function WebglComponent() {
  useEffect(() => {
    Zoomtastic.mount();
    const container = document.getElementById("container");
    const vr = new VrGallary({
      debug: true,
      container: container as HTMLElement,
      cameraPosition: {
        x: 0,
        y: 1.5,
        z: 0,
      },
      cameraLookat: {
        x: 2,
        y: 1.5,
        z: 2,
      },
      imageClick: (imageData: any) => {
        Zoomtastic.show(imageData.url);
      },
    });
    vr.loadGallary({
      url: "/assets/room1/msg.gltf",
      position: {
        x: 0,
        y: -10,
        z: 0,
      },
      scale: 10,
      onProgress: (p: any) => {},
    });
    vr.loadRobot({
      url: "/assets/robot/robot.glb",
      position: {
        x: 0,
        y: -5,
        z: 0,
      },
      scale: 3,
      onProgress: (p: any) => {},
    }).then((gltf: any) => {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const ani = gltf.animations[0];
      mixer.clipAction(ani).setDuration(5).play();
      mixer.update(0);
      vr.addAnimate((d: number) => mixer.update(d));
    });
    vr.loadItems([
      {
        url: "/assets/pictures2/1.jpg",
        id: "1",
        position: {
          x: 50.78402241094812,
          y: 5.168797426127862,
          z: 48.83247657751556,
        },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    ]);
  }, []);
  return <div id="container" className="w-full h-full"></div>;
}
