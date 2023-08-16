import { getWebGLContext, initShaders } from "@/lib/webgl/cuon-utils.js";
import { Matrix4 } from "@/lib/webgl/cuon-matrix.js";
let VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "attribute  vec4 a_Color;\n" +
  "uniform mat4 u_ModelMatrix;\n" +
  "uniform mat4 u_ViewMatrix;\n" +
  "varying vec4 v_Color;\n" +
  "void main() {\n" +
  "  gl_Position = u_ViewMatrix * u_ModelMatrix * a_Position;\n" +
  "  v_Color = a_Color;\n" +
  "}\n";
let FSHADER_SOURCE =
  "precision mediump float;\n" +
  "varying vec4 v_Color;\n" +
  "void main() {\n" +
  "  gl_FragColor = v_Color;\n" +
  "}\n";
export default function main(canvas) {
  const gl = getWebGLContext(canvas, null);
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  let n = initVertexBuffers(gl);
  let u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  let viewMatrix = new Matrix4();
  viewMatrix.setLookAt(0.2, 0.25, 0.25, 0, 0, 0, 0, 1, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  let u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  let currAngle = 0.0;
  const rotate = () => {
    currAngle = animate(currAngle);
    let modelMatrix = new Matrix4();
    modelMatrix.setRotate(currAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);
    requestAnimationFrame(rotate);
  };
  rotate();
}

let last = Date.now();
function animate(angle) {
  let now = Date.now();
  let elapsed = now - last;
  last = now;
  let newAngle = angle + (45 * elapsed) / 1000;
  return (newAngle %= 360);
}
function initVertexBuffers(gl) {
  let vertices = new Float32Array([
    0.0, 0.5, -0.4, 0.4, 1.0, 0.4, -0.5, -0.5, -0.4, 0.4, 1.0, 0.4, 0.5, -0.5,
    -0.4, 1.0, 0.4, 0.4, 0.5, 0.4, -0.2, 1.0, 0.4, 0.4, -0.5, 0.4, -0.2, 1.0,
    1.0, 0.4, 0.0, -0.6, -0.2, 1.0, 1.0, 0.4, 0.0, 0.5, 0.0, 0.4, 0.4, 1.0,
    -0.5, -0.5, 0.0, 0.4, 0.4, 1.0, 0.5, -0.5, 0.0, 1.0, 0.4, 0.4,
  ]);
  let n = 9;
  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let FSIZE = vertices.BYTES_PER_ELEMENT;

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);

  let a_Color = gl.getAttribLocation(gl.program, "a_Color");
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);
  return n;
}
