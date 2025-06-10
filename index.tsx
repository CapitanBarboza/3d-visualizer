"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export default function Visualizador3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [categoryLabel, setCategoryLabel] = useState({ show: false, text: "", category: "", x: 0, y: 0 })
  const [detailedInfo, setDetailedInfo] = useState({
    show: false,
    category: "",
    title: "",
    content: "",
    position: { x: 0, y: 0, z: 0 },
    keywords: [] as string[],
    x: 0,
    y: 0,
  })
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({})
  const [viewMode, setViewMode] = useState("all")
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)

  // Referencias para Three.js
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const pointsRef = useRef<THREE.Points | null>(null)
  const clickTargetsRef = useRef<THREE.Mesh[]>([])
  const particlePointsRef = useRef<any[]>([])
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0))
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const animationIdRef = useRef<number | null>(null)

  // Colores para categorías
  const categoryColors = {
    "Derecho Administrativo": 0xff6b6b,
    "Derecho Civil": 0x4ecdc4,
    "Derecho Comercial": 0xffe66d,
    "Derecho Constitucional": 0xa8e6cf,
    "Derecho Internacional Privado": 0x95e1d3,
    "Derecho Internacional Público": 0xc7ceea,
    "Derecho Laboral": 0xffd93d,
    "Derecho Penal": 0xff8b94,
    "Derecho Procesal": 0xfdcb6e,
    "Derechos Humanos": 0xffaa5b,
    "Filosofía y Teoría del Derecho": 0xb2b2ff,
    "Habilidades y Estrategias": 0x81ecec,
  }

  useEffect(() => {
    let isMouseDown = false
    let isMiddleMouseDown = false
    let prevMouseX = 0
    let prevMouseY = 0
    let cameraPhi = Math.PI / 2
    let cameraTheta = 0

    // Inicializar Three.js
    const initThree = () => {
      if (!containerRef.current) return

      // Crear escena
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Crear cámara
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000)
      camera.position.set(0, 0, 50)
      cameraRef.current = camera

      // Crear renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000)
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Controles de órbita
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.target = cameraTargetRef.current
      controlsRef.current = controls

      // Raycaster para interacción
      raycasterRef.current = new THREE.Raycaster()
      mouseRef.current = new THREE.Vector2()

      // Cargar datos
      loadData()

      // Event listeners
      setupEventListeners(renderer.domElement)

      // Animación
      animate()

      // Resize handler
      window.addEventListener("resize", onWindowResize)

      return () => {
        window.removeEventListener("resize", onWindowResize)
        if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
        renderer.dispose()
        containerRef.current?.removeChild(renderer.domElement)
      }
    }

    const loadData = async () => {
      setLoading(true)
      try {
        // Cargar JSON
        const jsonResponse = await fetch(
          "https://raw.githubusercontent.com/CapitanBarboza/MineCamp/refs/heads/main/json_reubicado_por_centroides.json",
        )
        if (!jsonResponse.ok) {
          throw new Error(`Error HTTP: ${jsonResponse.status}`)
        }
        const jsonData = await jsonResponse.json()

        // Procesar datos y contar categorías
        const stats: Record<string, number> = {}
        jsonData.forEach((item: any) => {
          if (!stats[item.category]) {
            stats[item.category] = 0
          }
          stats[item.category]++
        })

        setCategoryStats(stats)
        particlePointsRef.current = jsonData.map((item: any) => ({
          position: { x: item.x, y: item.y, z: item.z },
          category: item.category,
          subCategory: item.subCategory,
          data: {
            title: item.label,
            content: item.subCategory + " - " + (item.keywords ? item.keywords.join(", ") : "N/A"),
            category: item.category,
            keywords: item.keywords || [],
          },
        }))

        // Cargar modelo GLB
        const loader = new GLTFLoader()
        loader.load(
          "https://raw.githubusercontent.com/CapitanBarboza/3d-visualizer/8183c32596d3aef78e77d427bd679f29e75659ef/public/puntos_derecho_clusterizados_2.glb",
          (gltf) => {
            if (sceneRef.current) {
              // Ajustar escala y posición del modelo
              gltf.scene.scale.set(1, 1, 1)
              sceneRef.current.add(gltf.scene)

              // Crear partículas basadas en los datos JSON
              createParticles()
              createInvisibleClickTargets()

              // Enfocar la cámara en el modelo
              if (pointsRef.current) {
                frameObject(pointsRef.current)
              }

              setLoading(false)
            }
          },
          (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + "% cargado")
          },
          (error) => {
            console.error("Error cargando GLB:", error)
            setLoading(false)
          },
        )
      } catch (error) {
        console.error("Error cargando datos:", error)
        setLoading(false)
      }
    }

    const createParticles = () => {
      if (pointsRef.current && sceneRef.current) {
        sceneRef.current.remove(pointsRef.current)
        pointsRef.current.geometry.dispose()
        if (pointsRef.current.material instanceof THREE.Material) {
          pointsRef.current.material.dispose()
        } else if (Array.isArray(pointsRef.current.material)) {
          pointsRef.current.material.forEach((m) => m.dispose())
        }
      }

      const numParticlesToCreate = particlePointsRef.current.length
      if (numParticlesToCreate === 0) {
        console.warn("No hay datos para crear partículas.")
        return
      }

      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(numParticlesToCreate * 3)
      const colors = new Float32Array(numParticlesToCreate * 3)
      const sizes = new Float32Array(numParticlesToCreate)

      for (let i = 0; i < numParticlesToCreate; i++) {
        const pointData = particlePointsRef.current[i]

        positions[i * 3] = pointData.position.x
        positions[i * 3 + 1] = pointData.position.y
        positions[i * 3 + 2] = pointData.position.z

        const categoryColor = categoryColors[pointData.category as keyof typeof categoryColors] || 0x888888
        const color = new THREE.Color(categoryColor)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
        sizes[i] = 0.8 + Math.random() * 0.4
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

      geometry.computeBoundingSphere()

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
        vertexShader: `
          attribute float size;
          varying vec3 vColor;
          varying float vAlpha;
          varying float vRandomSeed;
          uniform float time;

          float hash(vec3 p) {
            p = fract(p * 0.3183099 + 0.1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          
          void main() {
            vColor = color;
            vRandomSeed = hash(position);

            vec3 currentPosition = position;

            vec4 worldPosition = modelMatrix * vec4(currentPosition, 1.0);
            vec4 mvPosition = viewMatrix * worldPosition;
            float t = time * 0.0001;
            
            vec3 floatMovement = vec3(
              sin(t*0.8+vRandomSeed*2.0)*0.06,
              cos(t*0.6+vRandomSeed*1.5)*0.06,
              sin(t*1.0+vRandomSeed*2.5)*0.06
            );
            mvPosition.xyz += floatMovement;
            float distance = length(mvPosition.xyz);
            
            float baseSizeForShader = 1.0 + vRandomSeed * 0.5;
            float pulseEffect = 1.0 + sin(time*0.003+vRandomSeed*3.14159)*0.25;
            
            gl_PointSize = size * baseSizeForShader * pulseEffect * (160.0 / max(distance * 0.3, 0.5));
                                    
            float distanceAlphaFade = 1.0 - smoothstep(10.0, 70.0, distance);
            vAlpha = distanceAlphaFade * 0.9;
            
            gl_Position = projectionMatrix * mvPosition;
          }`,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;
          varying float vRandomSeed;
          uniform float time;
          
          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            
            if (dist > 0.5) discard;
            
            float t = time * 0.0025;
            
            float coreStrength = smoothstep(0.08, 0.0, dist) * 2.0;
            float glowStrength = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.3;
            
            vec3 baseColor = vColor * 1.8;
            
            float shimmer = 0.9 + sin(t * 10.0 + vRandomSeed * 20.0) * 0.1;
            
            vec3 finalColor = baseColor * (coreStrength + glowStrength) * shimmer;
            
            float finalOpacity = (coreStrength + glowStrength * 0.2) * vAlpha * shimmer;
            finalOpacity = clamp(finalOpacity * 1.7, 0.25, 1.0);
            
            gl_FragColor = vec4(finalColor, finalOpacity);
          }`,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const points = new THREE.Points(geometry, material)
      pointsRef.current = points
      if (sceneRef.current) {
        sceneRef.current.add(points)
      }
    }

    const createInvisibleClickTargets = () => {
      // Eliminar targets anteriores
      clickTargetsRef.current.forEach((target) => sceneRef.current?.remove(target))
      clickTargetsRef.current = []

      if (particlePointsRef.current.length === 0) return

      particlePointsRef.current.forEach((pointData, index) => {
        const sphereGeometry = new THREE.SphereGeometry(0.6, 8, 8)
        const sphereMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthTest: false,
        })
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        sphere.position.set(pointData.position.x, pointData.position.y, pointData.position.z)
        sphere.userData = {
          index: index,
          pointData: pointData,
        }
        sceneRef.current?.add(sphere)
        clickTargetsRef.current.push(sphere)
      })
    }

    const updateParticleVisibility = () => {
      if (!pointsRef.current) return

      const colors = pointsRef.current.geometry.attributes.color.array
      const sizes = pointsRef.current.geometry.attributes.size.array

      particlePointsRef.current.forEach((point, i) => {
        const isVisible = viewMode === "all" || point.category === currentCategory

        if (isVisible) {
          const categoryColor = categoryColors[point.category as keyof typeof categoryColors] || 0x888888
          const color = new THREE.Color(categoryColor)
          colors[i * 3] = color.r
          colors[i * 3 + 1] = color.g
          colors[i * 3 + 2] = color.b
          sizes[i] = 0.8 + Math.random() * 0.4
        } else {
          // Hacer las partículas casi invisibles
          colors[i * 3] = 0.1
          colors[i * 3 + 1] = 0.1
          colors[i * 3 + 2] = 0.1
          sizes[i] = 0.1
        }
      })

      pointsRef.current.geometry.attributes.color.needsUpdate = true
      pointsRef.current.geometry.attributes.size.needsUpdate = true
    }

    const focusOnCategory = (category: string) => {
      if (!pointsRef.current) return

      // Encontrar los límites de los puntos de esta categoría
      const categoryPoints = particlePointsRef.current.filter((p) => p.category === category)
      if (categoryPoints.length === 0) return

      let minX = Number.POSITIVE_INFINITY,
        minY = Number.POSITIVE_INFINITY,
        minZ = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY,
        maxY = Number.NEGATIVE_INFINITY,
        maxZ = Number.NEGATIVE_INFINITY

      categoryPoints.forEach((point) => {
        minX = Math.min(minX, point.position.x)
        minY = Math.min(minY, point.position.y)
        minZ = Math.min(minZ, point.position.z)
        maxX = Math.max(maxX, point.position.x)
        maxY = Math.max(maxY, point.position.y)
        maxZ = Math.max(maxZ, point.position.z)
      })

      // Calcular centro y tamaño
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const centerZ = (minZ + maxZ) / 2

      cameraTargetRef.current.set(centerX, centerY, centerZ)

      const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
      const distance = size * 2

      if (cameraRef.current) {
        cameraRef.current.position.x =
          cameraTargetRef.current.x + distance * Math.sin(cameraPhi) * Math.sin(cameraTheta)
        cameraRef.current.position.y = cameraTargetRef.current.y + distance * Math.cos(cameraPhi)
        cameraRef.current.position.z =
          cameraTargetRef.current.z + distance * Math.sin(cameraPhi) * Math.cos(cameraTheta)

        cameraRef.current.lookAt(cameraTargetRef.current)

        if (controlsRef.current) {
          controlsRef.current.target = cameraTargetRef.current
          controlsRef.current.update()
        }
      }
    }

    const frameObject = (object: THREE.Object3D) => {
      if (!object.geometry || !object.geometry.boundingSphere || !cameraRef.current) {
        console.warn("frameObject: Objeto o geometría/boundingSphere no válidos para encuadrar.")
        if (cameraRef.current) {
          cameraRef.current.position.set(0, 0, 40)
          cameraRef.current.lookAt(cameraTargetRef.current)
        }
        return
      }

      const boundingSphere = object.geometry.boundingSphere
      cameraTargetRef.current.copy(boundingSphere.center)

      const size = boundingSphere.radius * 2
      const fov = cameraRef.current.fov * (Math.PI / 180)
      let cameraZ = Math.abs(size / 2 / Math.tan(fov / 2))
      cameraZ *= 1.2 // fitOffset

      if (cameraRef.current) {
        cameraRef.current.position.x = cameraTargetRef.current.x + cameraZ * Math.sin(cameraPhi) * Math.sin(cameraTheta)
        cameraRef.current.position.y = cameraTargetRef.current.y + cameraZ * Math.cos(cameraPhi)
        cameraRef.current.position.z = cameraTargetRef.current.z + cameraZ * Math.sin(cameraPhi) * Math.cos(cameraTheta)

        cameraRef.current.lookAt(cameraTargetRef.current)
        cameraRef.current.updateProjectionMatrix()

        if (controlsRef.current) {
          controlsRef.current.target = cameraTargetRef.current
          controlsRef.current.update()
        }
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      event.preventDefault()
      if (!isMouseDown && !isMiddleMouseDown) {
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1

        if (cameraRef.current) {
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
          const intersects = raycasterRef.current.intersectObjects(clickTargetsRef.current)

          if (intersects.length > 0) {
            const pointData = intersects[0].object.userData.pointData
            if (pointData && (viewMode === "all" || pointData.category === currentCategory)) {
              setCategoryLabel({
                show: true,
                text: pointData.subCategory,
                category: pointData.category,
                x: event.clientX,
                y: event.clientY,
              })
              if (rendererRef.current) {
                rendererRef.current.domElement.style.cursor = "pointer"
              }
            } else {
              setCategoryLabel((prev) => ({ ...prev, show: false }))
              if (rendererRef.current) {
                rendererRef.current.domElement.style.cursor = "crosshair"
              }
            }
          } else {
            setCategoryLabel((prev) => ({ ...prev, show: false }))
            if (rendererRef.current) {
              rendererRef.current.domElement.style.cursor = "crosshair"
            }
          }
        }
      } else if (isMouseDown) {
        const deltaX = event.clientX - prevMouseX
        const deltaY = event.clientY - prevMouseY

        cameraPhi -= deltaY * 0.002
        cameraTheta -= deltaX * 0.002

        cameraPhi = Math.max(0.01, Math.min(Math.PI - 0.01, cameraPhi))

        if (cameraRef.current) {
          const radius = cameraRef.current.position.distanceTo(cameraTargetRef.current)
          cameraRef.current.position.x =
            cameraTargetRef.current.x + radius * Math.sin(cameraPhi) * Math.sin(cameraTheta)
          cameraRef.current.position.y = cameraTargetRef.current.y + radius * Math.cos(cameraPhi)
          cameraRef.current.position.z =
            cameraTargetRef.current.z + radius * Math.sin(cameraPhi) * Math.cos(cameraTheta)

          cameraRef.current.lookAt(cameraTargetRef.current)

          if (controlsRef.current) {
            controlsRef.current.update()
          }
        }

        prevMouseX = event.clientX
        prevMouseY = event.clientY
        setCategoryLabel((prev) => ({ ...prev, show: false }))
        setDetailedInfo((prev) => ({ ...prev, show: false }))
      } else if (isMiddleMouseDown) {
        const deltaX = event.clientX - prevMouseX
        const deltaY = event.clientY - prevMouseY

        if (cameraRef.current) {
          const panSpeed = 0.015 * (cameraRef.current.position.distanceTo(cameraTargetRef.current) / 30)

          const right = new THREE.Vector3()
          const up = new THREE.Vector3()
          cameraRef.current.matrix.extractBasis(right, up, new THREE.Vector3())

          const panOffset = new THREE.Vector3()
          panOffset.add(right.multiplyScalar(-deltaX * panSpeed))
          panOffset.add(up.multiplyScalar(deltaY * panSpeed))

          cameraRef.current.position.add(panOffset)
          cameraTargetRef.current.add(panOffset)

          cameraRef.current.lookAt(cameraTargetRef.current)

          if (controlsRef.current) {
            controlsRef.current.target = cameraTargetRef.current
            controlsRef.current.update()
          }
        }

        prevMouseX = event.clientX
        prevMouseY = event.clientY
        setCategoryLabel((prev) => ({ ...prev, show: false }))
        setDetailedInfo((prev) => ({ ...prev, show: false }))
      }
    }

    const onPointClick = (event: MouseEvent) => {
      event.preventDefault()
      if (isMouseDown || isMiddleMouseDown) return

      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1

      if (cameraRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
        const intersects = raycasterRef.current.intersectObjects(clickTargetsRef.current)

        if (intersects.length > 0) {
          const pointData = intersects[0].object.userData.pointData
          if (pointData && (viewMode === "all" || pointData.category === currentCategory)) {
            setCategoryLabel((prev) => ({ ...prev, show: false }))
            setDetailedInfo({
              show: true,
              category: pointData.category,
              title: pointData.data.title,
              content: pointData.subCategory,
              position: pointData.position,
              keywords: pointData.data.keywords,
              x: event.clientX,
              y: event.clientY,
            })
          }
        } else {
          setDetailedInfo((prev) => ({ ...prev, show: false }))
        }
      }
    }

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        isMouseDown = true
        prevMouseX = event.clientX
        prevMouseY = event.clientY
        document.body.style.cursor = "grabbing"
      } else if (event.button === 1) {
        isMiddleMouseDown = true
        prevMouseX = event.clientX
        prevMouseY = event.clientY
        document.body.style.cursor = "move"
        event.preventDefault()
      }
      setCategoryLabel((prev) => ({ ...prev, show: false }))
      setDetailedInfo((prev) => ({ ...prev, show: false }))
    }

    const onMouseUp = (event: MouseEvent) => {
      if (event.button === 0 && isMouseDown) {
        isMouseDown = false
        document.body.style.cursor = "grab"
      } else if (event.button === 1 && isMiddleMouseDown) {
        isMiddleMouseDown = false
        document.body.style.cursor = "crosshair"
      }
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (cameraRef.current) {
        const zoomSpeed = 0.1
        const direction = new THREE.Vector3()
        cameraRef.current.getWorldDirection(direction)

        const moveDistance = -event.deltaY * zoomSpeed

        cameraRef.current.position.addScaledVector(direction, moveDistance)

        const minZoomDistance = 0.1
        const maxZoomDistance = 300

        const currentDistanceToTarget = cameraRef.current.position.distanceTo(cameraTargetRef.current)

        if (currentDistanceToTarget < minZoomDistance) {
          const dirToCam = new THREE.Vector3()
            .subVectors(cameraRef.current.position, cameraTargetRef.current)
            .normalize()
          cameraRef.current.position.copy(cameraTargetRef.current).addScaledVector(dirToCam, minZoomDistance)
        }
        if (currentDistanceToTarget > maxZoomDistance) {
          const dirToCam = new THREE.Vector3()
            .subVectors(cameraRef.current.position, cameraTargetRef.current)
            .normalize()
          cameraRef.current.position.copy(cameraTargetRef.current).addScaledVector(dirToCam, maxZoomDistance)
        }

        if (controlsRef.current) {
          controlsRef.current.update()
        }
      }
      setCategoryLabel((prev) => ({ ...prev, show: false }))
      setDetailedInfo((prev) => ({ ...prev, show: false }))
    }

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }

    const setupEventListeners = (domElement: HTMLCanvasElement) => {
      domElement.addEventListener("mousemove", onMouseMove)
      domElement.addEventListener("click", onPointClick)
      domElement.addEventListener("mousedown", onMouseDown)
      document.addEventListener("mouseup", onMouseUp)
      domElement.addEventListener("wheel", onWheel)
      domElement.addEventListener("contextmenu", onContextMenu)
    }

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      const deltaTime = 16
      if (
        pointsRef.current &&
        pointsRef.current.material instanceof THREE.ShaderMaterial &&
        pointsRef.current.material.uniforms
      ) {
        pointsRef.current.material.uniforms.time.value += deltaTime
      }

      if (cameraRef.current) {
        cameraRef.current.lookAt(cameraTargetRef.current)
      }

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    const onWindowResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)

        if (
          pointsRef.current &&
          pointsRef.current.material instanceof THREE.ShaderMaterial &&
          pointsRef.current.material.uniforms
        ) {
          pointsRef.current.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight)
        }
      }
    }

    // Inicializar Three.js
    initThree()

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
      }

      window.removeEventListener("resize", onWindowResize)
    }
  }, [])

  const handleFilterByCategory = (category: string) => {
    setCurrentCategory(category)
    setViewMode("category")
    updateParticleVisibility()
    focusOnCategory(category)
  }

  const handleShowAllCategories = () => {
    setCurrentCategory(null)
    setViewMode("all")
    updateParticleVisibility()
    resetCameraView()
  }

  const updateParticleVisibility = () => {
    if (!pointsRef.current) return

    const colors = pointsRef.current.geometry.attributes.color.array
    const sizes = pointsRef.current.geometry.attributes.size.array

    particlePointsRef.current.forEach((point, i) => {
      const isVisible = viewMode === "all" || point.category === currentCategory

      if (isVisible) {
        const categoryColor = categoryColors[point.category as keyof typeof categoryColors] || 0x888888
        const color = new THREE.Color(categoryColor)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
        sizes[i] = 0.8 + Math.random() * 0.4
      } else {
        // Hacer las partículas casi invisibles
        colors[i * 3] = 0.1
        colors[i * 3 + 1] = 0.1
        colors[i * 3 + 2] = 0.1
        sizes[i] = 0.1
      }
    })

    pointsRef.current.geometry.attributes.color.needsUpdate = true
    pointsRef.current.geometry.attributes.size.needsUpdate = true
  }

  const focusOnCategory = (category: string) => {
    if (!pointsRef.current || !cameraRef.current) return

    // Encontrar los límites de los puntos de esta categoría
    const categoryPoints = particlePointsRef.current.filter((p) => p.category === category)
    if (categoryPoints.length === 0) return

    let minX = Number.POSITIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY,
      minZ = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY,
      maxZ = Number.NEGATIVE_INFINITY

    categoryPoints.forEach((point) => {
      minX = Math.min(minX, point.position.x)
      minY = Math.min(minY, point.position.y)
      minZ = Math.min(minZ, point.position.z)
      maxX = Math.max(maxX, point.position.x)
      maxY = Math.max(maxY, point.position.y)
      maxZ = Math.max(maxZ, point.position.z)
    })

    // Calcular centro y tamaño
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2

    cameraTargetRef.current.set(centerX, centerY, centerZ)

    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    const distance = size * 2

    // Calcular nueva posición de cámara
    const cameraPhi = Math.PI / 2
    const cameraTheta = 0

    cameraRef.current.position.x = cameraTargetRef.current.x + distance * Math.sin(cameraPhi) * Math.sin(cameraTheta)
    cameraRef.current.position.y = cameraTargetRef.current.y + distance * Math.cos(cameraPhi)
    cameraRef.current.position.z = cameraTargetRef.current.z + distance * Math.sin(cameraPhi) * Math.cos(cameraTheta)

    cameraRef.current.lookAt(cameraTargetRef.current)

    if (controlsRef.current) {
      controlsRef.current.target = cameraTargetRef.current
      controlsRef.current.update()
    }
  }

  const resetCameraView = () => {
    if (pointsRef.current && cameraRef.current) {
      frameObject(pointsRef.current)
    }
  }

  const frameObject = (object: THREE.Object3D) => {
    if (!object.geometry || !object.geometry.boundingSphere || !cameraRef.current) {
      console.warn("frameObject: Objeto o geometría/boundingSphere no válidos para encuadrar.")
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 40)
        cameraRef.current.lookAt(cameraTargetRef.current)
      }
      return
    }

    const boundingSphere = object.geometry.boundingSphere
    cameraTargetRef.current.copy(boundingSphere.center)

    const size = boundingSphere.radius * 2
    const fov = cameraRef.current.fov * (Math.PI / 180)
    let cameraZ = Math.abs(size / 2 / Math.tan(fov / 2))
    cameraZ *= 1.2 // fitOffset

    const cameraPhi = Math.PI / 2
    const cameraTheta = 0

    cameraRef.current.position.x = cameraTargetRef.current.x + cameraZ * Math.sin(cameraPhi) * Math.sin(cameraTheta)
    cameraRef.current.position.y = cameraTargetRef.current.y + cameraZ * Math.cos(cameraPhi)
    cameraRef.current.position.z = cameraTargetRef.current.z + cameraZ * Math.sin(cameraPhi) * Math.cos(cameraTheta)

    cameraRef.current.lookAt(cameraTargetRef.current)
    cameraRef.current.updateProjectionMatrix()

    if (controlsRef.current) {
      controlsRef.current.target = cameraTargetRef.current
      controlsRef.current.update()
    }
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={containerRef} className="w-full h-full"></div>

      {/* Indicador de carga */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white p-5 rounded-lg text-center">
          <p className="text-xl font-mono">Cargando Datos...</p>
        </div>
      )}

      {/* Etiqueta de categoría */}
      <div
        className={`absolute pointer-events-none bg-[rgba(15,15,15,0.95)] text-white px-6 py-4 border-l-[3px] border-[#6B5EFF] transition-opacity duration-300 ${categoryLabel.show ? "opacity-100 transform-none" : "opacity-0 translate-y-2"}`}
        style={{
          left: `${categoryLabel.x - 100}px`,
          top: `${categoryLabel.y - 50}px`,
          zIndex: 2000,
          backdropFilter: "blur(10px)",
        }}
        data-category={categoryLabel.category}
      >
        {categoryLabel.text}
        <span className="block text-xs font-light tracking-wider mt-1 opacity-70">{categoryLabel.category}</span>
      </div>

      {/* Información detallada */}
      <div
        className={`absolute pointer-events-none bg-[rgba(15,15,15,0.98)] text-white max-w-md transition-all duration-300 ${detailedInfo.show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"}`}
        style={{
          left: `${detailedInfo.x + 20}px`,
          top: `${detailedInfo.y - 10}px`,
          zIndex: 3000,
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="bg-gradient-to-r from-[#6B5EFF] to-[#8B7FFF] p-6 relative">
          <div className="text-white/90 text-xs font-light uppercase tracking-wider mb-1">{detailedInfo.category}</div>
          <div className="font-medium text-base leading-snug text-white">{detailedInfo.title}</div>
          <div className="absolute top-5 right-6 text-xs text-white/50 font-mono">
            [{detailedInfo.position.x.toFixed(1)}, {detailedInfo.position.y.toFixed(1)},{" "}
            {detailedInfo.position.z.toFixed(1)}]
          </div>
        </div>
        <div className="p-6 bg-[rgba(20,20,20,0.95)]">
          <div className="text-white/80 leading-relaxed text-sm">{detailedInfo.content}</div>
          <div className="flex flex-wrap gap-2 mt-3">
            {detailedInfo.keywords.map((keyword, index) => (
              <span
                key={index}
                className="bg-[rgba(107,94,255,0.1)] px-2.5 py-1 rounded-xl border border-[rgba(107,94,255,0.2)] text-xs text-white/50"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Título */}
      <div className="absolute top-8 left-8 text-white z-100 flex items-start">
        <div className="w-0.5 bg-white/50 mr-4 self-stretch"></div>
        <div className="flex flex-col">
          <div className="text-xs text-white/70 mb-1 uppercase tracking-wider">ABOGRADO CLUSTER</div>
          <h1 className="text-2xl font-medium leading-tight text-white m-0">La Nueva Era del Derecho Digital</h1>
        </div>
      </div>

      {/* Controles de visualización */}
      <div className="absolute top-8 right-8 bg-[rgba(20,20,20,0.95)] p-4 rounded-lg text-white text-xs z-100 backdrop-blur-md border border-white/10">
        <button
          className={`bg-[rgba(107,94,255,0.2)] border border-[rgba(107,94,255,0.3)] text-white px-4 py-2 rounded mx-1 text-xs uppercase tracking-wider transition-all hover:bg-[rgba(107,94,255,0.4)] hover:-translate-y-0.5 ${viewMode === "all" ? "bg-[#6B5EFF] border-[#6B5EFF]" : ""}`}
          onClick={handleShowAllCategories}
        >
          Todas
        </button>
        <button
          className={`bg-[rgba(107,94,255,0.2)] border border-[rgba(107,94,255,0.3)] text-white px-4 py-2 rounded mx-1 text-xs uppercase tracking-wider transition-all hover:bg-[rgba(107,94,255,0.4)] hover:-translate-y-0.5 ${viewMode === "category" ? "bg-[#6B5EFF] border-[#6B5EFF]" : ""}`}
          onClick={() => {
            if (currentCategory) {
              handleFilterByCategory(currentCategory)
            } else {
              // Si no hay categoría seleccionada, mostrar la primera
              const firstCategory = Object.keys(categoryStats)[0]
              if (firstCategory) {
                handleFilterByCategory(firstCategory)
              }
            }
          }}
        >
          Por Categoría
        </button>
        <button
          className="bg-[rgba(107,94,255,0.2)] border border-[rgba(107,94,255,0.3)] text-white px-4 py-2 rounded mx-1 text-xs uppercase tracking-wider transition-all hover:bg-[rgba(107,94,255,0.4)] hover:-translate-y-0.5"
          onClick={resetCameraView}
        >
          Reset Vista
        </button>
      </div>

      {/* Panel de estadísticas */}
      <div className="absolute bottom-8 right-8 bg-[rgba(20,20,20,0.95)] p-5 rounded-lg text-white text-xs z-100 backdrop-blur-md border border-white/10 max-h-[400px] overflow-y-auto min-w-[250px]">
        <h3 className="m-0 mb-4 text-sm font-medium uppercase tracking-wider text-[#6B5EFF]">
          Estadísticas de Categorías
        </h3>
        <div>
          {Object.entries(categoryStats)
            .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
            .map(([category, count]) => (
              <div
                key={category}
                className="flex items-center justify-between py-2 border-b border-white/5 cursor-pointer hover:bg-[rgba(107,94,255,0.1)] hover:px-2 hover:-mx-2 transition-all"
                onClick={() => handleFilterByCategory(category)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                  style={{
                    backgroundColor: `rgb(${Math.floor(new THREE.Color(categoryColors[category as keyof typeof categoryColors] || 0x888888).r * 255)}, ${Math.floor(new THREE.Color(categoryColors[category as keyof typeof categoryColors] || 0x888888).g * 255)}, ${Math.floor(new THREE.Color(categoryColors[category as keyof typeof categoryColors] || 0x888888).b * 255)})`,
                  }}
                ></div>
                <div className="flex-1 text-xs">{category}</div>
                <div className="text-xs text-white/60 font-mono">{count}</div>
              </div>
            ))}
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 font-medium flex justify-between">
          <span>Total</span>
          <span>{Object.values(categoryStats).reduce((sum, count) => sum + (count as number), 0)}</span>
        </div>
      </div>
    </div>
  )
}
