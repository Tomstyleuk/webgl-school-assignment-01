import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

window.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.getElementById('webgl')

  const app = new ThreeApp(wrapper)
  app.resize()
  app.render()
}, false)


class ThreeApp {

  /**
   * Size
   */
  static WINDOW_SIZE = {
    width: window.innerWidth,
    height: window.innerHeight
  }


  /**
   * Camera
   */
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: this.WINDOW_SIZE.width / this.WINDOW_SIZE.height,
    near: 0.1,
    far: 100,
    position: new THREE.Vector3(8, 4, 8),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
  }


  /**
   * Render
   */
  static RENDERER_PARAM = {
    clearColor: 0xf7f7f7,
    width: this.WINDOW_SIZE.width,
    height: this.WINDOW_SIZE.height
  }


  /**
   * Material
   */
  static MATERIAL_PARAM = {
    color: 0x3399ff,
    metalness: 0.15,
    roughness: 0.15,
    transmission: 0.5, // The transmission option is responsible for applying transparency
    thickness: 0.5, // Add refraction
  }


  /**
   * directional Light
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xfff0dd,
    intensity: 0.6,
    // position: new THREE.Vector3(2.0, 1.0, 10.0),
    position: new THREE.Vector3(2.0, 5.0, 3.0),
    castShadow: true,
  };


  /**
   * Ambient Light
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xcdcdcd,
    intensity: 3,
  };


  /**
   * Grid Helper
   */
  static GRID_PARAM = {
    size: 10,
    division: 10,
    colorCenterLine: 0x000000,
    colorGrid: 0x000000,
    opacity: 0.2,
    transparent: true
  }


  renderer;
  scene;
  camera;
  geometry;
  material;
  mesh;
  controls;
  directionalLight;
  helper;
  ambientLight;
  ground;
  grid;

  /* Helper */
  axesHelper;

  /* set position mesh */
  xAxis;
  zAxis;

  /* animation */
  clock;
  elapsedTime;
  speed;


  /**
   * constructor
   */
  constructor(wrapper) {
    /**
     * initialise Render
     * カメラが撮影したオブジェクトを現像してスクリーンに映す
     */
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setClearColor(color)
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearAlpha(0.0); // set background color transparent in webgl
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    wrapper.appendChild(this.renderer.domElement)


    // Scene
    this.scene = new THREE.Scene()


    // Camera
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    )
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position)
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt)


    // Geometry & Material
    const count = 100;
    this.geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7)
    this.xAxis = -5
    this.zAxis = -5
    this.geometryArr = [];
    for (let i = 0; i < count; ++i) {

      this.material = new THREE.MeshPhysicalMaterial({
        // color: this.debugObject.color,
        roughness: ThreeApp.MATERIAL_PARAM.roughness,
        metalness: ThreeApp.MATERIAL_PARAM.metalness,
        transmission: ThreeApp.MATERIAL_PARAM.transmission,
        thickness: ThreeApp.MATERIAL_PARAM.thickness,
      })
      const mesh = new THREE.Mesh(this.geometry, this.material)
      mesh.castShadow = true;

      // Random color
      const r = Math.round(Math.random() * 255);
      const g = Math.round(Math.random() * 255);
      const b = Math.round(Math.random() * 255);
      this.material.color.set(`rgb(${r},${g},${b})`);

      mesh.position.x = this.xAxis + 0.5
      mesh.position.y = (Math.random() * 1.0 + 0.5) // 0.5 - 1.5
      mesh.position.z = this.zAxis + 0.5

      this.scene.add(mesh);

      this.geometryArr.push(mesh);

      this.xAxis++
      if (this.xAxis >= 5) {
        this.xAxis = -5
        this.zAxis++
      }
    }


    // Ground
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshLambertMaterial({
        color: 0xf7f7f7,
      })
    )
    this.ground.rotation.x = - Math.PI / 2;
    this.ground.position.y = -2.4;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);


    // Grid Helper
    // this.grid = new THREE.GridHelper(ThreeApp.GRID_PARAM.size, ThreeApp.GRID_PARAM.division, ThreeApp.GRID_PARAM.colorCenterLine, ThreeApp.GRID_PARAM.colorGrid);
    // this.grid.position.y = -2.3;
    // this.grid.material.opacity = ThreeApp.GRID_PARAM.opacity;
    // this.grid.material.transparent = ThreeApp.GRID_PARAM.transparent;
    // this.scene.add(this.grid);


    /**
     * Light
     */
    this.directionalLight = new THREE.DirectionalLight(ThreeApp.DIRECTIONAL_LIGHT_PARAM);
    this.directionalLight.castShadow = true;

    //  Optimise the shadow maps
    this.directionalLight.shadow.mapSize.width = 256
    this.directionalLight.shadow.mapSize.height = 256
    this.directionalLight.shadow.camera.far = 5
    this.scene.add(this.directionalLight);

    // this.helper = new THREE.DirectionalLightHelper(this.directionalLight, 10, 'red');
    // this.scene.add(this.helper);

    // 環境光
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);


    /**
     * Helper
     */
    // this.axesHelper = new THREE.AxesHelper(10);
    // this.scene.add(this.axesHelper);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true


    // Set this to 'constructor(ThreeApp)' because this can be varied depending on when it is called.
    this.render = this.render.bind(this)


    // Start measuring the time after loading a page
    this.clock = new THREE.Clock()
  }


  /**
   * Resize
   */
  resize() {
    window.addEventListener('resize', () => {
      // カメラのパラメータが変更されたときは行列を更新する
      this.camera.updateProjectionMatrix();
      this.camera.aspect = window.innerWidth / window.innerHeight;

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }, false);
  }


  render() {
    const elapsedTime = this.clock.getElapsedTime()
    const angle = elapsedTime * 0.05

    // Update each mesh's position.y
    this.geometryArr.forEach((mesh, index) => {
      mesh.position.y = Math.sin(angle * index) * 0.4 + (Math.sin(elapsedTime * 0.32))
    });

    requestAnimationFrame(this.render);

    // Update Controls
    this.controls.update()

    // Draw a scene
    this.renderer.render(this.scene, this.camera)
  }
}
