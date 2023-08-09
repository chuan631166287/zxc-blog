"use client";
import { useEffect, useRef } from "react";
import { getWebGLContext } from "@/lib/webgl/cuon-utils.js";
export default function WebglComponent() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = getWebGLContext(canvas, null);
  }, []);
  return <canvas ref={canvasRef} className="w-[100%] h-[100%]" />;
}
