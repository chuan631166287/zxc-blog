import { getWebGLContext, initShaders } from "@/lib/webgl/cuon-utils.js";

const VSHADER_SOURCE =
  "attribute vec4 a_Position; \n" +
  "attribute vec2 a_TexCoord;\n" +
  "varying vec2 v_TexCoord;\n" +
  "void main() {\n" +
  "  gl_Position = a_Position;\n" +
  "  v_TexCoord = a_TexCoord;\n" +
  "}\n";
const FSHADER_SOURCE =
  "precision mediump float;\n" +
  "uniform sampler2D u_Sampler;\n" +
  "uniform sampler2D u_Sampler1;\n" +
  "varying vec2 v_TexCoord;\n" +
  "void main() {\n" +
  "  vec4 color0 = texture2D(u_Sampler, v_TexCoord);\n" +
  "  vec4 color1 = texture2D(u_Sampler1, v_TexCoord);\n" +
  "  gl_FragColor = color0 * color1;\n" +
  "}\n";
export default function main(canvas) {
  const gl = getWebGLContext(canvas, null);
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  let n = initVertexBuffers(gl);
  initTextures(gl, n);
}
function initVertexBuffers(gl) {
  let vertices = new Float32Array([
    -0.5, 0.5, 0.0, 1.0, -0.5, -0.5, 0.0, 0.0, 0.5, 0.5, 1.0, 1.0, 0.5, -0.5,
    1.0, 1.0,
  ]);
  let n = 4;
  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let FSIZE = vertices.BYTES_PER_ELEMENT;

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
  gl.enableVertexAttribArray(a_Position);

  let a_TexCoord = gl.getAttribLocation(gl.program, "a_TexCoord");
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_TexCoord);
  return n;
}
function initTextures(gl, n) {
  let texture = gl.createTexture();
  let texture1 = gl.createTexture();
  let u_Sampler = gl.getUniformLocation(gl.program, "u_Sampler");
  let u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  let image = new Image();
  let image1 = new Image();

  image.onload = () => {
    loadTexture(gl, n, texture, u_Sampler, image, 0);
  };
  image1.onload = () => {
    loadTexture(gl, n, texture1, u_Sampler1, image1, 1);
  };
  image.src = "/body-bac.jpg";
  image1.src = "/pig.jpg";
  return true;
}
let g_texUnit0 = false,
  g_texUnit1 = false;
function loadTexture(gl, n, texture, u_Sampler, image, texUnit) {
  //对纹理图像进行y轴反转
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  //开启0号纹理单元
  if (texUnit === 0) {
    gl.activeTexture(gl.TEXTURE0);
    g_texUnit0 = true;
  } else {
    gl.activeTexture(gl.TEXTURE1);
    g_texUnit1 = true;
  }
  //向target绑定纹理对象
  gl.bindTexture(gl.TEXTURE_2D, texture);
  //配置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //配置纹理图像
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  //将0号纹理传递给着色器
  gl.uniform1i(u_Sampler, texUnit);
  if (g_texUnit0 && g_texUnit1) {
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
  }
}
