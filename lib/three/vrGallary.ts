import CameraControls from "camera-controls";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

CameraControls.install({ THREE: THREE });

type Position = {
  x: number;
  y: number;
  z: number;
};

export type Options = {
  debug: Boolean;
  container: HTMLElement;
  cameraPosition?: Position;
  cameraLookat?: Position;
  imageClick: Function;
};
export default class VrGallary {
  private _options: Options;
  private _renderer;
  private _scene;
  private _camera;
  private _controls;
  private _gltfLoader;
  private _clock;
  private _eventMeshes;
  private _transformControls;
  private _animations: Array<Function>;

  constructor(options: Options) {
    this._options = Object.assign({}, options);
    const { clientWidth, clientHeight } = this._options.container;
    this._eventMeshes = new Array<any>();
    //加载器
    this._gltfLoader = new GLTFLoader();

    //渲染器
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(clientWidth, clientHeight);
    this._options.container.appendChild(this._renderer.domElement);

    //场景
    this._scene = new THREE.Scene();

    //相机
    this._camera = new THREE.PerspectiveCamera(
      70,
      clientWidth / clientHeight,
      0.1,
      10000
    );
    const cameraPosition = this._options.cameraPosition
      ? this._options.cameraPosition
      : { x: 0, y: 0, z: 1 };
    this._camera.position.set(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    );
    this._scene.add(this._camera);

    //光
    this._scene.add(new THREE.AmbientLight(0xffffff, 1));

    //元素
    if (this._options.debug) {
      this._scene.add(new THREE.AxesHelper(1000));
    }

    //渲染
    this._renderer.render(this._scene, this._camera);

    //控制器
    this._clock = new THREE.Clock();
    this._controls = new CameraControls(
      this._camera,
      this._renderer.domElement
    );
    const distance = 0.000001;
    this._controls.maxDistance = 0.000001;
    this._controls.dragToOffset = false;
    this._controls.distance = 1;
    this._controls.azimuthRotateSpeed = -0.5;
    this._controls.polarRotateSpeed = -0.5;
    this._controls.minZoom = 0.5;
    this._controls.maxZoom = 5;
    this._controls.mouseButtons.wheel = CameraControls.ACTION.ZOOM;
    this._controls.saveState();
    const cameraLookat = this._options.cameraLookat
      ? this._options.cameraLookat
      : { x: 0, y: 0, z: 0 };
    const lookat = new THREE.Vector3(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    ).lerp(
      new THREE.Vector3(cameraLookat.x, cameraLookat.y, cameraLookat.z),
      distance
    );
    this._controls.setLookAt(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z,
      lookat.x,
      lookat.y,
      lookat.z,
      false
    );
    //transfromControls
    this._transformControls = new TransformControls(
      this._camera,
      this._renderer.domElement
    );
    this._transformControls.setSpace("local");
    this._scene.add(this._transformControls);
    this._transformControls.addEventListener("mouseDown", () => {
      this._controls.enabled = false;
    });
    this._transformControls.addEventListener("mouseUp", () => {
      this._controls.enabled = true;
    });
    this._transformControls.addEventListener("objectChange", () => {
      const { position, scale, rotation } = this._transformControls
        ?.object as THREE.Object3D<THREE.Object3DEventMap>;
      console.log(
        JSON.stringify({
          position,
          scale,
          rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
        })
      );
    });
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "t":
          this._transformControls.setMode("translate");
          break;
        case "r":
          this._transformControls.setMode("rotate");
          break;
        case "s":
          this._transformControls.setMode("scale");
      }
    });

    //动画
    this._animations = [];
    this._animate();
    this._initEvent();
  }
  private _animate() {
    const delta = this._clock.getDelta();
    this._controls.update(delta);
    this._renderer.render(this._scene, this._camera);
    this._animations.forEach((func) => {
      func(delta);
    });
    requestAnimationFrame(this._animate.bind(this));
  }
  private _initEvent() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let startxy: [number, number];
    this._options.container.addEventListener("mousedown", (e) => {
      startxy = [e.clientX, e.clientY];
    });
    this._options.container.addEventListener("mouseup", (e) => {
      const [sx, sy] = startxy;
      if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) {
        return;
      }
      const { clientWidth, clientHeight } = this._options.container;
      pointer.x = (e.clientX / clientWidth) * 2 - 1;
      pointer.y = -(e.clientY / clientHeight) * 2 + 1;
      //计算射线坐标
      raycaster.setFromCamera(pointer, this._camera);
      //计算物体和射线的焦点
      const intersects = raycaster.intersectObjects(this._eventMeshes);
      const mesh = intersects[0];
      if (mesh) {
        const v3 = mesh.point;
        if (mesh.object.name === "meishu01") {
          this._controls.moveTo(v3.x, 1.5, v3.z), true;
        }
        const odataMesh = this._findOData(mesh.object);
        if (mesh.object && odataMesh?.oData) {
          if (this._options.debug) {
            this._transformControls.attach(odataMesh);
          } else {
            this._options.imageClick(odataMesh);
          }
        }
      }
    });
  }
  private _findOData(object: any): any {
    if (object) {
      if (object.oData) {
        return object;
      } else {
        return this._findOData(object.parent);
      }
    }
  }
  //加载展厅, gltf
  async loadGallary(params: any) {
    const { url, position, scale, onProgress } = params;
    const gltf = await this.loadGltf({ url, onProgress });
    if (position) {
      gltf.scene.position.set(position.x, position.y, position.z);
    }
    if (scale) {
      gltf.scene.scale.set(scale, scale, scale);
    }
    this._eventMeshes.push(gltf.scene);
    this._scene.add(gltf.scene);
  }

  //加载机器人，glb
  async loadRobot(params: any) {
    const { url, position, scale, rotation, onProgress } = params;
    const gltf = await this.loadGltf({ url, onProgress });
    if (position) {
      gltf.scene.position.set(position.x, position.y, position.z);
    }
    if (scale) {
      gltf.scene.scale.set(scale, scale, scale);
    }
    if (rotation) {
      gltf.scene.rotation.set(rotation.x, rotation.y, rotation.z);
    }
    // @ts-ignore
    gltf.scene.oData = { id: "robot" };
    this._eventMeshes.push(gltf.scene);
    this._scene.add(gltf.scene);
    return new Promise((resolve) => {
      resolve(gltf);
    });
  }

  //加载画框
  loadItems(items: any) {
    const textureLoader = new THREE.TextureLoader();
    items.forEach(async (item: any) => {
      const { url, id, position, scale, rotation } = item;
      const texture = await textureLoader.loadAsync(url);
      const originWidth = texture.image.width;
      const originHeight = texture.image.height;
      let width = originWidth;
      let height = originHeight;
      let maxSize = 10;
      if (width > maxSize) {
        width = maxSize;
        height = (maxSize / originWidth) * originHeight;
      } else {
        height = maxSize;
        width = (maxSize / originHeight) * originWidth;
      }
      const geometry = new THREE.BoxGeometry(width, height, 2);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const imgMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: texture,
      });
      const cube = new THREE.Mesh(geometry, [
        material,
        material,
        material,
        material,
        material,
        imgMaterial,
      ]);
      // @ts-ignore
      cube.oData = item;
      cube.position.set(position.x, position.y, position.z);
      cube.scale.set(scale.x, scale.y, scale.z);
      cube.rotation.set(rotation.x, rotation.y, rotation.z);
      this._eventMeshes.push(cube);
      this._scene.add(cube);
    });
  }

  loadGltf(params: any): Promise<GLTF> {
    const { url, onProgress } = params;
    return new Promise((resolve) => {
      this._gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf);
        },
        (progress) => {
          onProgress(progress);
        }
      );
    });
  }
  addAnimate(func: Function) {
    this._animations.push(func);
  }
}
