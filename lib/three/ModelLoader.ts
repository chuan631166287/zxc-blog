import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { Loader } from "three";
let gltfLoader: Loader, objLoader: Loader, fbxLoader: Loader;
export default function modelLoader(params) {
  const { url } = params;
  if (url.endsWith("gltf") || url.endsWith("glb")) {
    return loadFile(params, "gltf");
  } else if (url.endsWith("obj")) {
    return loadFile(params, "obj");
  } else if (url.endsWith("fbx")) {
    return loadFile(params, "fbx");
  }
}
function loadFile(params, type: String) {
  const { url, onProgress } = params;
  const loader = initLoader(type);
  return new Promise((resolve) => {
    loader.load(
      url,
      (o) => {
        console.log(o);
        resolve(o);
      },
      (progress) => {
        onProgress(progress);
      }
    );
  });
}
function initLoader(type: String): Loader {
  let loader: Loader;
  switch (type) {
    case "gltf":
    case "glb":
      loader = gltfLoader ? gltfLoader : new GLTFLoader();
      break;
    case "obj":
      loader = objLoader ? objLoader : new OBJLoader();
      break;
    case "fbx":
      loader = fbxLoader ? fbxLoader : new FBXLoader();
      break;
    default:
      loader = gltfLoader ? gltfLoader : new GLTFLoader();
      break;
  }
  return loader;
}
