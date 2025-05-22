import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * Setup
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 10, 20)
scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Orbit Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const ambientLight = new THREE.AmbientLight(0x222222)
scene.add(ambientLight)


const flash = new THREE.PointLight(0xffffff, 3, 50)
flash.position.set(0, 10, 0)
flash.visible = false
scene.add(flash)

// Post-processing: Unreal Bloom
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 1.5, 0.4, 0.85)
bloomPass.threshold = 0
bloomPass.strength = 2
bloomPass.radius = 0.5
composer.addPass(bloomPass)

// Resize
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    composer.setSize(sizes.width, sizes.height)
})

//Lightning
function createLightning() {
    const group = new THREE.Group()
    const mainPath = generatePath(10)

    const mainLine = makeLine(mainPath)
    group.add(mainLine)

    // branches
    for (let i = 2; i < mainPath.length - 2; i += 2) {
        if (Math.random() < 0.5) {
            const branch = generatePath(5, mainPath[i])
            const branchLine = makeLine(branch)
            group.add(branchLine)
        }
    }

    scene.add(group)

    
    setTimeout(() => {
        group.children.forEach(child => {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose())
                } else {
                    child.material.dispose()
                }
            }
            group.remove(child)
        })
        scene.remove(group)
    }, 800)
}

function generatePath(segments, start = new THREE.Vector3(0, 10, 0)) {
    const points = [start.clone()]
    let current = start.clone()

    for (let i = 0; i < segments; i++) {
        current = current.clone()
        current.x += (Math.random() - 0.5) * 4
        current.y -= Math.random() * 4
        current.z += (Math.random() - 0.5) * 4
        points.push(current)
    }

    return points
}

function makeLine(points) {
    const group = new THREE.Group()
    const material = new THREE.LineBasicMaterial({ color: 0x88ccff })

    for (let i = 0; i < 3; i++) {
        const offsetPoints = points.map(p =>
            p.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            ))
        )
        const geometry = new THREE.BufferGeometry().setFromPoints(offsetPoints)
        const line = new THREE.Line(geometry, material)
        group.add(line)
    }

    return group
}

/**
 * Animation loop
 */
const clock = new THREE.Clock()
let nextLightning = 0

const tick = () => {
    const elapsed = clock.getElapsedTime() * 1000

    if (elapsed > nextLightning) {
        createLightning()
        flash.visible = true
        setTimeout(() => (flash.visible = false), 100 + Math.random() * 150)
        nextLightning = elapsed + 2000 + Math.random() * 3000
    }

    controls.update()
    composer.render()
    requestAnimationFrame(tick)
}

tick() 