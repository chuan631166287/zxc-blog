"use client";
import { useEffect, useRef } from "react";
import main from "@/lib/webgl/sample-lookAtTriangle";

export default function WebglComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    let DPR = window.devicePixelRatio;
    if (canvas) {
      let w = canvas.clientWidth;
      let h = canvas.clientHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      main(canvas);
    }
  }, []);
  return <canvas ref={canvasRef} className="w-[100%] h-[100%]" />;
}
