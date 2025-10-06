import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Pane } from "tweakpane"

class App {
  #threejs_ = null
  #camera_ = null

  #scene_ = null
  #clock_ = null
  #controls_ = null

  #debugParams_ = {}

  constructor() {}

  async initialize() {
    this.#clock_ = new THREE.Clock(true)

    window.addEventListener(
      "resize",
      () => {
        this.#onWindowResize_()
      },
      false
    )

    await this.#setupProject_()

    this.#onWindowResize_()
    this.#raf_()
  }

  async #setupProject_() {
    this.#threejs_ = new THREE.WebGLRenderer()
    this.#threejs_.shadowMap.enabled = true
    this.#threejs_.shadowMap.type = THREE.PCFSoftShadowMap
    document.body.appendChild(this.#threejs_.domElement)

    const fov = 70
    const aspect = window.innerWidth / window.innerHeight
    const near = 0.1
    const far = 1000
    this.#camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far)
    this.#camera_.position.set(2, 1, 2)
    this.#camera_.lookAt(new THREE.Vector3(0, 0, 0))

    this.#controls_ = new OrbitControls(
      this.#camera_,
      this.#threejs_.domElement
    )
    this.#controls_.enableDamping = true
    this.#controls_.target.set(0, 0, 0)

    this.#scene_ = new THREE.Scene()
    this.#scene_.background = new THREE.Color(0x000000)

    //light
    const light = new THREE.DirectionalLight(0xffffff, 3.14159)
    light.position.set(5, 20, 5)
    light.target.position.set(0, 0, 0)
    this.#scene_.add(light)
    this.#scene_.add(light.target)

    //load mid-grey texture
    const loader = new THREE.TextureLoader()
    const midGreyTextrue = loader.load("./resources/textures/mid-grey.png")
    midGreyTextrue.colorSpace = THREE.SRGBColorSpace

    //create a cube
    //const cubeGeo = new THREE.BoxGeometry(1, 1, 1)
    const geo = new THREE.SphereGeometry(1, 32, 32)
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.0,
      metalness: 0.0,
    })
    const cubeMesh = new THREE.Mesh(geo, cubeMat)
    this.#scene_.add(cubeMesh)

    //debug UI
    const pane = new Pane()
    this.#debugParams_ = {
      outputColorSpace: {
        type: THREE.SRGBColorSpace,
        options: {
          "Linear SRGB": THREE.LinearSRGBColorSpace,
          "SRGB": THREE.SRGBColorSpace,
        },
      },
      midGrey: {
        type: midGreyTextrue.colorSpace,
        options: {
          "No color": THREE.NoColorSpace,
          "Linear SRGB": THREE.LinearSRGBColorSpace,
          "SRGB": THREE.SRGBColorSpace,
        },
      },
    }

    const hdrFolder = pane.addFolder({ title: "HDR" })
    hdrFolder
      .addBinding(this.#debugParams_.outputColorSpace, "type", {
        options: this.#debugParams_.outputColorSpace.options,
      })
      .on("change", (evt) => {
        this.#threejs_.outputColorSpace = evt.value
      })

    const greyFolder = pane.addFolder({ title: "Mid Gray" })
    greyFolder
      .addBinding(this.#debugParams_.midGrey, "type", {
        options: this.#debugParams_.midGrey.options,
      })
      .on("change", (evt) => {
        midGreyTextrue.colorSpace = evt.value
        midGreyTextrue.needsUpdate = true
      })

    this.#LoadCubeMap_("./resources/skybox/cubemaps/rosendal_park_sunset/")
  }

  #LoadCubeMap_(path) {
    const faces = ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]
    const loader = new THREE.CubeTextureLoader()
    loader.setPath(path)
    const cubeTexture = loader.load(faces)

    this.#scene_.background = cubeTexture
    this.#scene_.environment = cubeTexture
  }

  #onWindowResize_() {
    const dpr = window.devicePixelRatio
    const canvas = this.#threejs_.domElement
    canvas.style.width = window.innerWidth + "px"
    canvas.style.height = window.innerHeight + "px"
    const w = canvas.clientWidth
    const h = canvas.clientHeight

    const aspect = w / h

    this.#threejs_.setSize(w * dpr, h * dpr, false)
    this.#camera_.aspect = aspect
    this.#camera_.updateProjectionMatrix()
  }

  #raf_() {
    requestAnimationFrame((t) => {
      this.#step_(this.#clock_.getDelta())
      this.#render_()
      this.#raf_()
    })
  }

  #render_() {
    this.#threejs_.render(this.#scene_, this.#camera_)
  }

  #step_(timeElapsed) {
    this.#controls_.update(timeElapsed)
  }
}

let APP_ = null

window.addEventListener("DOMContentLoaded", async () => {
  APP_ = new App()
  await APP_.initialize()
})
