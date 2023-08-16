import { getWebGLContext, initShaders } from "@/lib/webgl/cuon-utils.js";

const VSHADER_SOURCE =
  "attribute vec4 a_Position; \n" +
  "attribute float a_PointSize; \n" +
  "attribute vec4 a_Color; \n" +
  "varying vec4 v_Color; \n" +
  "void main() {\n" +
  "gl_Position = a_Position; \n" +
  "gl_PointSize = 10.0; \n" +
  "v_Color = a_Color; \n" +
  "}\n";
const FSHADER_SOURCE =
  "precision mediump float;\n" +
  //   "uniform float u_Width;\n" +
  //   "uniform float u_Height;\n" +
  "varying vec4 v_Color;\n" +
  "void main() {\n" +
  "gl_FragColor = v_Color;\n" +
  "}\n";
export default function main(canvas) {
  const gl = getWebGLContext(canvas, null);
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  let n = initVertexBuffers(gl);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}
function initVertexBuffers(gl) {
  let vertices = new Float32Array([
    0, 0.5, 1, 0, 0, -0.5, -0.5, 0, 1, 0, 0.5, -0.5, 0, 0, 1,
  ]);
  let n = 3;
  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let FSIZE = vertices.BYTES_PER_ELEMENT;

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);

  let a_Color = gl.getAttribLocation(gl.program, "a_Color");
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
  gl.enableVertexAttribArray(a_Color);

  //   let u_Width = gl.getUniformLocation(gl.program, "u_Width");
  //   gl.uniform1f(u_Width, gl.drawingBufferWidth);
  //   let u_Height = gl.getUniformLocation(gl.program, "u_Height");
  //   gl.uniform1f(u_Height, gl.drawingBufferHeight);
  return n;
}
