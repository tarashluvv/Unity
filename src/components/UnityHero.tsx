'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function UnityHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const bg = new THREE.Color('#3b2a22')
    scene.fog = new THREE.FogExp2(bg, 0.18)

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 0, 5.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambient)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(3, 4, 5)
    scene.add(keyLight)
    const fillLight = new THREE.PointLight(0xe7f4ec, 0.6, 20)
    fillLight.position.set(-3, -1, 3)
    scene.add(fillLight)
    const rimLight = new THREE.PointLight(0x1d6f42, 0.35, 20)
    rimLight.position.set(0, 2, -4)
    scene.add(rimLight)

    const logoGroup = new THREE.Group()
    scene.add(logoGroup)

    // Soft backdrop for depth
    const backdropGeo = new THREE.CircleGeometry(2.6, 64)
    const backdropMat = new THREE.MeshBasicMaterial({
      color: 0x241814,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    })
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat)
    backdrop.position.z = -0.8
    scene.add(backdrop)

    const glowGeo = new THREE.RingGeometry(1.35, 2.4, 64)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x1d6f42,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.z = -0.5
    scene.add(glow)

    // Floating particles for depth
    const particleCount = 140
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 10
      positions[i3 + 1] = (Math.random() - 0.5) * 7
      positions[i3 + 2] = -3.5 + Math.random() * 6
    }
    const particlesGeo = new THREE.BufferGeometry()
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particlesMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
    const particles = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particles)

    const loader = new THREE.TextureLoader()
    let disposed = false
    let frameId = 0

    loader.load(
      '/images/unitywhite.svg',
      (texture) => {
        if (disposed) {
          texture.dispose()
          return
        }
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        const img = texture.image as { width?: number; height?: number } | undefined
        const iw = img?.width || 485
        const ih = img?.height || 500
        const aspect = iw / ih
        const h = 2.35
        const w = h * aspect
        const geo = new THREE.PlaneGeometry(w, h)
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
          roughness: 0.35,
          metalness: 0.05,
        })

        // Layered planes to give subtle thickness/depth
        const layers = 7
        const depth = 0.12
        for (let i = 0; i < layers; i++) {
          const t = i / (layers - 1)
          const z = (t - 0.5) * depth
          const m = mat.clone()
          const edge = 1 - Math.abs(t - 0.5) * 2
          m.opacity = 0.25 + edge * 0.75
          const layer = new THREE.Mesh(geo, m)
          layer.position.z = z
          logoGroup.add(layer)
        }
      },
      undefined,
      () => {
        // fail silently if texture can't load
      }
    )

    const onResize = () => {
      if (!container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      logoGroup.rotation.y = t * 0.7
      logoGroup.rotation.x = Math.sin(t * 0.6) * 0.18
      logoGroup.rotation.z = Math.sin(t * 0.35) * 0.04
      logoGroup.position.y = Math.sin(t * 0.9) * 0.08

      glow.rotation.z = t * 0.1
      particles.rotation.y = t * 0.03
      particles.rotation.x = Math.sin(t * 0.2) * 0.05

      camera.position.x = Math.sin(t * 0.25) * 0.15
      camera.position.y = Math.cos(t * 0.22) * 0.1
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)

      logoGroup.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (material) {
          if (Array.isArray(material)) material.forEach((m) => m.dispose())
          else material.dispose()
        }
      })
      scene.remove(logoGroup)
      scene.remove(backdrop)
      backdropGeo.dispose()
      backdropMat.dispose()
      scene.remove(glow)
      glowGeo.dispose()
      glowMat.dispose()
      scene.remove(particles)
      particlesGeo.dispose()
      particlesMat.dispose()

      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}
