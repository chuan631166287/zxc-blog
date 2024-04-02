import CameraControls from "camera-controls";
import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import modelLoader from "./ModelLoader";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import CANNON from "cannon";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { Octree } from "three/examples/jsm/math/Octree.js";

const GRAVITY = 30;

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
  private _player;
  private _controls;
  private _clock;
  private _eventMeshes;
  private _transformControls;
  private _stats;
  private _gui;
  private _playerCollider;
  private _playerVelocity;
  private _playerDirection;
  private _keystates = {};
  private _world;
  private _worldOctree;
  private _sphereBody;
  private _sphereShape;
  private _animations: Array<Function> = [];
  private _keyMoveFlag = false;

  constructor(options: Options) {
    this._options = Object.assign({}, options);
    const { clientWidth, clientHeight } = this._options.container;
    this._eventMeshes = new Array<any>();

    //cannon世界
    this._world = new CANNON.World();
    this._sphereBody = new CANNON.Body({ mass: 5 });
    this._sphereShape = new CANNON.Sphere(1.3);
    this._sphereBody.linearDamping = 0.9;
    this._sphereBody.addShape(this._sphereShape);
    this._world.add(this._sphereBody);

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

    //玩家
    this._playerCollider = new Capsule(
      new THREE.Vector3(cameraPosition.x, 0.35, 0),
      new THREE.Vector3(cameraPosition.x, 1, 0),
      0.35
    );
    this._playerVelocity = new THREE.Vector3();
    this._playerDirection = new THREE.Vector3();
    //octree
    this._worldOctree = new Octree();

    //光
    const ambient = new THREE.AmbientLight(0xffffff, 1);
    this._scene.add(ambient);

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

    if (this._options.debug) {
      //gui
      this._gui = new GUI();

      //帧率监视器
      this._stats = new Stats();
      document.body.appendChild(this._stats.domElement);

      //坐标轴
      this._scene.add(new THREE.AxesHelper(1000));
    }

    //初始化事件
    this._initEvent();

    //动画
    this._animate();
  }
  private _playerControls(deltaTime) {
    const speedDelta = deltaTime;
    for (const key in this._keystates) {
      if (this._keystates[key]) {
        switch (key) {
          case "ArrowUp":
          case "KeyW":
            this._keyMoveFlag = true;
            this._playerVelocity.add(
              this._getForwardVector().multiplyScalar(speedDelta)
            );
            break;
          case "ArrowDown":
          case "KeyS":
            this._keyMoveFlag = true;
            this._playerVelocity.add(
              this._getForwardVector().multiplyScalar(-speedDelta)
            );
            break;
          case "ArrowLeft":
          case "KeyA":
            this._keyMoveFlag = true;
            this._playerVelocity.add(
              this._getSideVector().multiplyScalar(-speedDelta)
            );
            break;
          case "ArrowRight":
          case "KeyD":
            this._keyMoveFlag = true;
            this._playerVelocity.add(
              this._getSideVector().multiplyScalar(speedDelta)
            );
            break;
          default:
            this._keyMoveFlag = false;
            break;
        }
      }
    }
  }
  private _getForwardVector() {
    this._camera.getWorldDirection(this._playerDirection);
    this._playerDirection.y = 0;
    this._playerDirection.normalize();
    return this._playerDirection;
  }
  private _getSideVector() {
    this._camera.getWorldDirection(this._playerDirection);
    this._playerDirection.y = 0;
    this._playerDirection.normalize();
    this._playerDirection.cross(this._camera.up);
    return this._playerDirection;
  }
  private _updatePlayer(deltaTime) {
    let damping = Math.exp(-4 * deltaTime) - 1;
    this._playerVelocity.addScaledVector(this._playerVelocity, damping);
    const deltaPosition = this._playerVelocity.clone();
    this._playerCollider.translate(deltaPosition);
    this._playerCollisions();
    const end = this._playerCollider.end;
    this._controls.moveTo(end.x, end.y, end.z);
  }
  private _playerCollisions() {
    const result = this._worldOctree.capsuleIntersect(this._playerCollider);
    if (result) {
      this._playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(this._playerVelocity)
      );
      this._playerCollider.translate(
        result.normal.multiplyScalar(result.depth)
      );
    }
  }
  private _animate() {
    const delta = this._clock.getDelta();
    this._playerControls(delta);
    if (this._keyMoveFlag) {
      this._updatePlayer(delta);
    }
    this._controls.update(delta);
    this._renderer.render(this._scene, this._camera);
    this._animations.forEach((func) => {
      func(delta);
    });
    if (this._options.debug) {
      this._stats.update();
    }
    requestAnimationFrame(this._animate.bind(this));
  }
  private _initEvent() {
    window.addEventListener("keydown", (e) => {
      this._keystates[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      this._keystates[e.code] = false;
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let startxy: [number, number];
    this._options.container.addEventListener("mousedown", (e) => {
      startxy = [e.clientX, e.clientY];
      this._keyMoveFlag = false;
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
          this._playerCollider.set(
            new THREE.Vector3(v3.x, 0.35, v3.z),
            new THREE.Vector3(v3.x, 1, v3.z),
            0.35
          );
          const end = this._playerCollider.end;
          this._controls.moveTo(end.x, end.y, end.z);
        }
        const odataMesh = this._findOData(mesh.object);
        if (mesh.object && odataMesh?.oData) {
          if (this._options.debug) {
            this._transformControls.attach(odataMesh);
          } else {
            if (odataMesh.oData.url) {
              this._options.imageClick(odataMesh);
            }
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
    const gltf = (await modelLoader({ url, onProgress })) as GLTF;
    if (position) {
      gltf.scene.position.set(position.x, position.y, position.z);
    }
    if (scale) {
      gltf.scene.scale.set(scale, scale, scale);
    }
    this._eventMeshes.push(gltf.scene);
    this._scene.add(gltf.scene);
    this._worldOctree.fromGraphNode(gltf.scene);
  }

  //加载机器人，glb
  async loadRobot(params: any) {
    const { url, position, scale, rotation, onProgress } = params;
    const gltf = (await modelLoader({ url, onProgress })) as GLTF;
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

  addAnimate(func: Function) {
    this._animations.push(func);
  }
}
