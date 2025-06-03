"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

interface DerechoData {
  x: number
  y: number
  z: number
  category: string
  subCategory: string
  label: string
  keywords?: string[]
}

interface ParticlePoint {
  position: { x: number; y: number; z: number }
  originalPosition: { x: number; y: number; z: number }
  category: string
  subCategory: string
  data: {
    title: string
    content: string
    category: string
    keywords: string[]
  }
}

interface Fuente {
  titulo: string
  autor?: string
  editorial?: string
  ano?: number
  isbn?: string
  fuente?: string
  url?: string
  detalle?: Array<{
    nombre: string
    url: string
  }>
}

interface AreaFuentes {
  area: string
  fuentes: Fuente[]
}

interface BibliografiaData {
  citas: AreaFuentes[]
}

// Colores actualizados según la nueva paleta
const categoryColors: Record<string, number> = {
  "Derecho Administrativo": 0xff00ff, // Rosa Neón
  "Derecho Civil": 0x00ff00, // Verde Eléctrico
  "Derecho Comercial": 0x00ffff, // Cian Brillante
  "Derecho Constitucional": 0x8a2be2, // Violeta Intenso
  "Derecho Internacional Privado": 0xff1493, // Magenta Claro
  "Derecho Internacional Público": 0xba55d3, // Morado Neón
  "Derecho Laboral": 0xffff00, // Amarillo Neón
  "Derecho Penal": 0xff4500, // Rojo Brillante
  "Derecho Procesal": 0xff8c00, // Naranja Neón
  "Derechos Humanos": 0xccff00, // Verde Limón
  "Filosofía y Teoría del Derecho": 0xb2b2ff, // Lila Suave
  "Habilidades y Estrategias": 0xff007f, // Rosa Fucsia
}

const bibliografiaData: BibliografiaData = {
  citas: [
    {
      area: "Teoría y Filosofía del Derecho",
      fuentes: [
        {
          titulo: "Introducción al Estudio del Derecho",
          autor: "Eduardo Soto Kloss",
          editorial: "Universidad de Chile",
          ano: 2019,
          isbn: "978-956-222-465-6",
        },
        {
          titulo: "Fundamentos de Derecho",
          autor: "Julio Faundez",
          editorial: "Universidad Católica de Chile",
          ano: 2021,
          isbn: "978-956-14-2325-8",
        },
        {
          titulo: "Teoría del Derecho Constitucional",
          autor: "Patricio Zapata",
          editorial: "Tirant lo Blanch Chile",
          ano: 2020,
          isbn: "978-956-372-239-5",
        },
      ],
    },
    {
      area: "Derecho Constitucional y Derechos Fundamentales",
      fuentes: [
        {
          titulo: "Constitución Política de la República de Chile",
          fuente: "Biblioteca del Congreso Nacional",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=242302",
        },
        {
          titulo: "Comentarios a la Constitución Política de la República de Chile",
          autor: "Tomás Jordán (coord.)",
          editorial: "Thomson Reuters",
          ano: 2022,
          isbn: "978-956-7419-02-8",
        },
        {
          titulo: "Derechos Humanos en Chile",
          autor: "Claudio Nash Rojas",
          editorial: "Dykinson Chile",
          ano: 2023,
          isbn: "978-956-9390-45-7",
        },
      ],
    },
    {
      area: "Derecho Civil",
      fuentes: [
        {
          titulo: "Código Civil de Chile",
          fuente: "Biblioteca del Congreso Nacional",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=7029",
        },
        {
          titulo: "Tratado de Derecho Civil Chileno. Parte General",
          autor: "Héctor Sánchez Jiménez",
          editorial: "Editorial Jurídica de Chile",
          ano: 2021,
          isbn: "978-956-8814-10-2",
        },
        {
          titulo: "Derecho de las Obligaciones",
          autor: "Francisco Javier Schönfeldt",
          editorial: "Ediciones Jurídicas Tamara",
          ano: 2022,
          isbn: "978-956-8738-14-9",
        },
        {
          titulo: "Contratos Civiles y Mercantiles en Chile",
          autor: "Francisco Muñoz",
          editorial: "Editorial Jurídica de Chile",
          ano: 2020,
          isbn: "978-956-8814-05-8",
        },
      ],
    },
    {
      area: "Derecho Penal",
      fuentes: [
        {
          titulo: "Código Penal de Chile",
          fuente: "Biblioteca del Congreso Nacional",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=1984",
        },
        {
          titulo: "Derecho Penal Chileno. Parte General",
          autor: "Sergio Muñoz Gajardo",
          editorial: "Thomson Reuters",
          ano: 2023,
          isbn: "978-956-7419-19-6",
        },
        {
          titulo: "Derecho Penal Chileno. Parte Especial",
          autor: "Humberto Maturana Novoa",
          editorial: "Editorial Jurídica de Chile",
          ano: 2022,
          isbn: "978-956-8814-26-3",
        },
        {
          titulo: "Proceso Penal Chileno",
          autor: "Alejandro Guzmán Vial Reygadas",
          editorial: "Universidad Alberto Hurtado",
          ano: 2021,
          isbn: "978-956-8271-55-7",
        },
      ],
    },
  ],
}

// Componente de máquina de escribir
const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({
  text,
  speed = 50,
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    setDisplayText("")
    setCurrentIndex(0)
  }, [text])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  return <span>{displayText}</span>
}

export default function TerminalStyleVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const particlesRef = useRef<THREE.Points>()
  const glbModelRef = useRef<THREE.Group>()
  const raycasterRef = useRef<THREE.Raycaster>()
  const mouseRef = useRef<THREE.Vector2>()
  const clickTargetsRef = useRef<THREE.Mesh[]>([])
  const particlePointsRef = useRef<ParticlePoint[]>([])
  const animationIdRef = useRef<number>()
  const timeRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState("LOADING DATA...")
  const [derechoData, setDerechoData] = useState<DerechoData[]>([])
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({})
  const [showSources, setShowSources] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0)
  const [currentSource, setCurrentSource] = useState<Fuente | null>(null)
  const [categoryLabel, setCategoryLabel] = useState<{
    show: boolean
    x: number
    y: number
    text: string
    category: string
  }>({ show: false, x: 0, y: 0, text: "", category: "" })
  const [detailedInfo, setDetailedInfo] = useState<{
    show: boolean
    x: number
    y: number
    data: any
  }>({ show: false, x: 0, y: 0, data: null })

  // Estados para exploración automática
  const [autoExploreMode, setAutoExploreMode] = useState(false)
  const [currentExploredPoint, setCurrentExploredPoint] = useState<ParticlePoint | null>(null)

  // Estados para audio
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [audioVolume, setAudioVolume] = useState(0.3)

  // Camera control variables
  const cameraControlsRef = useRef({
    phi: Math.PI / 2,
    theta: 0,
    target: new THREE.Vector3(0, 0, 0),
    isMouseDown: false,
    isMiddleMouseDown: false,
    prevMouseX: 0,
    prevMouseY: 0,
    autoRotate: true,
    autoRotateSpeed: 0.001,
    lastMouseMoveTime: Date.now(),
    mouseIdleThreshold: 3000,
  })

  // Auto explore state - Modificado para enfocar el GLB desde diferentes perspectivas
  const autoExploreRef = useRef({
    isActive: false,
    lastChangeTime: Date.now(),
    changeInterval: 5000, // 5 segundos entre cambios de perspectiva
    isTransitioning: false,
    transitionStartTime: 0,
    transitionDuration: 3000, // 3 segundos de transición
    startPosition: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    glbCenter: new THREE.Vector3(0, 0, 0), // Centro del GLB
    minDistance: 8, // Distancia mínima al GLB
    maxDistance: 25, // Distancia máxima al GLB
    currentPerspective: "",
  })

  // Obtener todas las fuentes en un array plano
  const allSources = bibliografiaData.citas.flatMap((area) => area.fuentes)

  // Efecto para inicializar audio
  useEffect(() => {
    const initAudio = () => {
      // Crear elemento de audio
      const audio = new Audio()

      // URL de música ambiental (puedes cambiar esta URL por cualquier MP3)
      // Usando una URL de ejemplo - puedes reemplazarla con tu propio archivo
      audio.src = "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" // Placeholder
      audio.loop = true
      audio.volume = audioVolume
      audio.preload = "auto"

      audio.addEventListener("canplaythrough", () => {
        setAudioLoaded(true)
        console.log("[AUDIO] Audio loaded successfully")
      })

      audio.addEventListener("error", (e) => {
        console.log("[AUDIO] Error loading audio:", e)
        setAudioLoaded(false)
      })

      audioRef.current = audio
    }

    initAudio()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Función para toggle de audio
  const toggleAudio = async () => {
    if (!audioRef.current || !audioLoaded) return

    try {
      if (isAudioPlaying) {
        audioRef.current.pause()
        setIsAudioPlaying(false)
        console.log("[AUDIO] Audio paused")
      } else {
        await audioRef.current.play()
        setIsAudioPlaying(true)
        console.log("[AUDIO] Audio playing")
      }
    } catch (error) {
      console.log("[AUDIO] Error toggling audio:", error)
    }
  }

  // Función para cambiar volumen
  const handleVolumeChange = (newVolume: number) => {
    setAudioVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  // Efecto para cambiar fuentes automáticamente
  useEffect(() => {
    if (allSources.length > 0 && !autoExploreMode) {
      const interval = setInterval(() => {
        setCurrentSourceIndex((prev) => (prev + 1) % allSources.length)
      }, 6000) // Tiempo más largo para leer mejor

      return () => clearInterval(interval)
    }
  }, [allSources.length, autoExploreMode])

  useEffect(() => {
    if (allSources.length > 0) {
      setCurrentSource(allSources[currentSourceIndex])
    }
  }, [currentSourceIndex, allSources])

  // Efecto para cerrar paneles cuando se activa auto explore
  useEffect(() => {
    if (autoExploreMode) {
      setShowSources(false)
      setShowStats(false)
      setCategoryLabel((prev) => ({ ...prev, show: false }))

      // Activar auto explore
      autoExploreRef.current.isActive = true
      autoExploreRef.current.lastChangeTime = Date.now()

      // Calcular centro del GLB
      if (glbModelRef.current) {
        const box = new THREE.Box3().setFromObject(glbModelRef.current)
        autoExploreRef.current.glbCenter = box.getCenter(new THREE.Vector3())
      }

      // Iniciar inmediatamente
      setTimeout(() => {
        selectNextPerspective()
      }, 500)
    } else {
      // Desactivar auto explore
      autoExploreRef.current.isActive = false
      autoExploreRef.current.isTransitioning = false
      setDetailedInfo((prev) => ({ ...prev, show: false }))
      setCurrentExploredPoint(null)
      cameraControlsRef.current.autoRotate = true
    }
  }, [autoExploreMode])

  // Función para generar perspectivas aleatorias del GLB
  const generateRandomPerspective = () => {
    const perspectives = [
      "Vista Superior",
      "Vista Inferior",
      "Vista Frontal",
      "Vista Posterior",
      "Vista Lateral Izquierda",
      "Vista Lateral Derecha",
      "Vista Diagonal Superior",
      "Vista Diagonal Inferior",
      "Vista Panorámica",
      "Vista de Detalle",
    ]

    const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)]

    // Generar posición aleatoria alrededor del GLB
    const phi = Math.random() * Math.PI // 0 a π (arriba a abajo)
    const theta = Math.random() * Math.PI * 2 // 0 a 2π (rotación completa)
    const distance =
      autoExploreRef.current.minDistance +
      Math.random() * (autoExploreRef.current.maxDistance - autoExploreRef.current.minDistance)

    const x = autoExploreRef.current.glbCenter.x + distance * Math.sin(phi) * Math.cos(theta)
    const y = autoExploreRef.current.glbCenter.y + distance * Math.cos(phi)
    const z = autoExploreRef.current.glbCenter.z + distance * Math.sin(phi) * Math.sin(theta)

    return {
      position: new THREE.Vector3(x, y, z),
      target: autoExploreRef.current.glbCenter.clone(),
      name: randomPerspective,
    }
  }

  // Función para seleccionar la siguiente perspectiva
  const selectNextPerspective = () => {
    if (!autoExploreRef.current.isActive) return

    const perspective = generateRandomPerspective()
    autoExploreRef.current.currentPerspective = perspective.name

    console.log(`[AUTO EXPLORE] Cambiando a perspectiva: ${perspective.name}`)

    // Iniciar transición
    startTransitionToPerspective(perspective)

    // Seleccionar un punto aleatorio para mostrar información
    if (particlePointsRef.current.length > 0) {
      const randomPoint = particlePointsRef.current[Math.floor(Math.random() * particlePointsRef.current.length)]
      setCurrentExploredPoint(randomPoint)
      setDetailedInfo({
        show: true,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        data: randomPoint,
      })
    }
  }

  // Función para iniciar transición a una perspectiva
  const startTransitionToPerspective = (perspective: {
    position: THREE.Vector3
    target: THREE.Vector3
    name: string
  }) => {
    if (!cameraRef.current) return

    const autoExplore = autoExploreRef.current
    const controls = cameraControlsRef.current

    // Configurar transición
    autoExplore.isTransitioning = true
    autoExplore.transitionStartTime = Date.now()
    autoExplore.lastChangeTime = Date.now()

    // Guardar posiciones actuales
    autoExplore.startPosition.copy(cameraRef.current.position)
    autoExplore.startTarget.copy(controls.target)

    // Configurar destino
    autoExplore.endPosition.copy(perspective.position)
    autoExplore.endTarget.copy(perspective.target)

    // Desactivar rotación automática
    controls.autoRotate = false

    console.log(`[AUTO EXPLORE] Iniciando transición a: ${perspective.name}`)
  }

  // Función para actualizar auto explore
  const updateAutoExplore = () => {
    if (!autoExploreRef.current.isActive || !cameraRef.current) return

    const autoExplore = autoExploreRef.current
    const controls = cameraControlsRef.current
    const currentTime = Date.now()

    if (autoExplore.isTransitioning) {
      // Durante la transición
      const elapsed = currentTime - autoExplore.transitionStartTime
      const progress = Math.min(elapsed / autoExplore.transitionDuration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3) // Easing suave

      // Interpolar posición y target
      cameraRef.current.position.lerpVectors(autoExplore.startPosition, autoExplore.endPosition, easeProgress)
      controls.target.lerpVectors(autoExplore.startTarget, autoExplore.endTarget, easeProgress)

      if (progress >= 1) {
        // Transición completada
        autoExplore.isTransitioning = false
        console.log(`[AUTO EXPLORE] Transición completada a: ${autoExplore.currentPerspective}`)
      }
    } else {
      // Verificar si es tiempo de cambiar perspectiva
      const timeSinceLastChange = currentTime - autoExplore.lastChangeTime
      if (timeSinceLastChange > autoExplore.changeInterval) {
        console.log(`[AUTO EXPLORE] Tiempo para cambiar perspectiva (${timeSinceLastChange}ms)`)
        selectNextPerspective()
      }
    }
  }

  // Función para toggle del auto explore mode
  const toggleAutoExploreMode = () => {
    setAutoExploreMode((prev) => !prev)
  }

  const initializeData = async () => {
    try {
      setLoadingText("LOADING JSON DATA...")

      const response = await fetch(
        "https://raw.githubusercontent.com/CapitanBarboza/MineCamp/refs/heads/main/json_reubicado_por_centroides.json",
      )

      if (!response.ok) {
        throw new Error(`HTTP ERROR: ${response.status}`)
      }

      const jsonData: DerechoData[] = await response.json()

      const stats: Record<string, number> = {}
      jsonData.forEach((item) => {
        if (!stats[item.category]) {
          stats[item.category] = 0
        }
        stats[item.category]++
      })

      setDerechoData(jsonData)
      setCategoryStats(stats)

      console.log("[DEBUG] JSON data loaded:", jsonData.length, "elements")
    } catch (error) {
      console.error("[DEBUG] Error loading JSON data:", error)
      setLoadingText("ERROR LOADING DATA. PLEASE RELOAD.")
    }
  }

  const createParticles = () => {
    if (!sceneRef.current) return

    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current)
      particlesRef.current.geometry.dispose()
      if (Array.isArray(particlesRef.current.material)) {
        particlesRef.current.material.forEach((mat) => mat.dispose())
      } else {
        particlesRef.current.material.dispose()
      }
    }

    particlePointsRef.current = []
    const numParticles = derechoData.length

    if (numParticles === 0) {
      console.warn("[DEBUG] No data to create particles.")
      return
    }

    console.log(`[DEBUG] Creating ${numParticles} particles with balanced glow.`)

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(numParticles * 3)
    const originalPositions = new Float32Array(numParticles * 3)
    const colors = new Float32Array(numParticles * 3)
    const sizes = new Float32Array(numParticles)
    const velocities = new Float32Array(numParticles * 3)
    const phases = new Float32Array(numParticles)

    for (let i = 0; i < numParticles; i++) {
      const jsonItem = derechoData[i]

      positions[i * 3] = jsonItem.x
      positions[i * 3 + 1] = jsonItem.y
      positions[i * 3 + 2] = jsonItem.z

      originalPositions[i * 3] = jsonItem.x
      originalPositions[i * 3 + 1] = jsonItem.y
      originalPositions[i * 3 + 2] = jsonItem.z

      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02

      phases[i] = Math.random() * Math.PI * 2

      particlePointsRef.current.push({
        position: { x: jsonItem.x, y: jsonItem.y, z: jsonItem.z },
        originalPosition: { x: jsonItem.x, y: jsonItem.y, z: jsonItem.z },
        category: jsonItem.category,
        subCategory: jsonItem.subCategory,
        data: {
          title: jsonItem.label,
          content: jsonItem.subCategory + " - " + (jsonItem.keywords ? jsonItem.keywords.join(", ") : "N/A"),
          category: jsonItem.category,
          keywords: jsonItem.keywords || [],
        },
      })

      const categoryColor = categoryColors[jsonItem.category] || 0xff00ff
      const color = new THREE.Color(categoryColor)

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      sizes[i] = 0.4 + Math.random() * 0.6
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("originalPosition", new THREE.BufferAttribute(originalPositions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1))
    geometry.computeBoundingSphere()

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        flowStrength: { value: 1.0 },
        waveAmplitude: { value: 2.0 },
        waveFrequency: { value: 0.3 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 velocity;
        attribute float phase;
        attribute vec3 originalPosition;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vRandomSeed;
        varying float vIntensity;
        
        uniform float time;
        uniform float flowStrength;
        uniform float waveAmplitude;
        uniform float waveFrequency;

        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x) {
          return mod289(((x*34.0)+1.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r) {
          return 1.79284291400159 - 0.85373472095314 * r;
        }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        
        void main() {
          vColor = color;
          vRandomSeed = hash(originalPosition);
          
          float t = time * 0.0005;
          
          vec3 noisePos = originalPosition * 0.08 + vec3(t * 0.2);
          vec3 flowOffset = vec3(
            snoise(noisePos + vec3(0.0, 0.0, 0.0)),
            snoise(noisePos + vec3(100.0, 0.0, 0.0)),
            snoise(noisePos + vec3(0.0, 100.0, 0.0))
          ) * waveAmplitude;
          
          float radius = length(originalPosition.xz);
          float angle = atan(originalPosition.z, originalPosition.x) + t * waveFrequency;
          vec3 spiralOffset = vec3(
            cos(angle) * sin(t + vRandomSeed * 6.28) * 0.8,
            sin(t * 0.5 + vRandomSeed * 6.28) * 1.2,
            sin(angle) * sin(t + vRandomSeed * 6.28) * 0.8
          );
          
          vec3 currentPosition = originalPosition + flowOffset * flowStrength + spiralOffset;
          
          vec3 floatMovement = vec3(
            sin(t * 0.6 + vRandomSeed * 2.0) * 0.5,
            cos(t * 0.4 + vRandomSeed * 1.5) * 0.6,
            sin(t * 0.8 + vRandomSeed * 2.5) * 0.5
          );
          
          currentPosition += floatMovement;
          
          vec4 worldPosition = modelMatrix * vec4(currentPosition, 1.0);
          vec4 mvPosition = viewMatrix * worldPosition;
          
          float distance = length(mvPosition.xyz);
          
          float movementIntensity = length(flowOffset + spiralOffset + floatMovement);
          vIntensity = movementIntensity;
          
          float baseSizeForShader = size * (0.8 + movementIntensity * 0.3);
          float pulseEffect = 1.0 + sin(time * 0.003 + vRandomSeed * 3.14159) * 0.3;
          
          gl_PointSize = baseSizeForShader * pulseEffect * (180.0 / max(distance * 0.3, 0.5));
          
          float distanceAlphaFade = 1.0 - smoothstep(20.0, 100.0, distance);
          vAlpha = distanceAlphaFade * (0.6 + movementIntensity * 0.2);
          
          gl_Position = projectionMatrix * mvPosition;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vRandomSeed;
        varying float vIntensity;
        uniform float time;
        
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          
          if (dist > 0.5) discard;
          
          float t = time * 0.002;
          
          float coreStrength = smoothstep(0.12, 0.0, dist) * 2.0;
          float glowStrength = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.4;
          
          vec3 baseColor = vColor * (1.2 + vIntensity * 0.3);
          
          float shimmer = 0.8 + sin(t * 12.0 + vRandomSeed * 20.0) * 0.2;
          
          float trailEffect = 1.0 + vIntensity * 0.3;
          
          vec3 finalColor = baseColor * (coreStrength + glowStrength) * shimmer * trailEffect;
          
          float finalOpacity = (coreStrength + glowStrength * 0.3) * vAlpha * shimmer;
          finalOpacity = clamp(finalOpacity * (1.2 + vIntensity * 0.3), 0.2, 0.8);
          
          gl_FragColor = vec4(finalColor, finalOpacity);
        }`,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    particlesRef.current = new THREE.Points(geometry, material)
    sceneRef.current.add(particlesRef.current)

    createInvisibleClickTargets()
  }

  const createInvisibleClickTargets = () => {
    if (!sceneRef.current) return

    clickTargetsRef.current.forEach((target) => sceneRef.current!.remove(target))
    clickTargetsRef.current = []

    if (particlePointsRef.current.length === 0) return

    particlePointsRef.current.forEach((pointData, index) => {
      const sphereGeometry = new THREE.SphereGeometry(1.2, 8, 8)
      const sphereMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthTest: false,
      })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.set(pointData.originalPosition.x, pointData.originalPosition.y, pointData.originalPosition.z)
      sphere.userData = { index, pointData }
      sceneRef.current!.add(sphere)
      clickTargetsRef.current.push(sphere)
    })
  }

  const updateClickTargets = () => {
    if (!particlesRef.current || clickTargetsRef.current.length === 0) return

    const positions = particlesRef.current.geometry.attributes.position.array

    clickTargetsRef.current.forEach((target, index) => {
      if (index * 3 + 2 < positions.length) {
        target.position.set(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2])
      }
    })
  }

  const frameObject = (object: THREE.Object3D, camera: THREE.Camera, fitOffset = 0.6) => {
    if (!object || !object.children.length) {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 15)
        cameraRef.current.lookAt(cameraControlsRef.current.target)
      }
      return
    }

    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3()).length()
    const center = box.getCenter(new THREE.Vector3())

    cameraControlsRef.current.target.copy(center)

    if (cameraRef.current) {
      const fov = cameraRef.current.fov * (Math.PI / 180)
      let cameraZ = Math.abs(size / 2 / Math.tan(fov / 2))
      cameraZ *= fitOffset

      const { phi, theta } = cameraControlsRef.current
      cameraRef.current.position.x = center.x + cameraZ * Math.sin(phi) * Math.sin(theta)
      cameraRef.current.position.y = center.y + cameraZ * Math.cos(phi)
      cameraRef.current.position.z = center.z + cameraZ * Math.sin(phi) * Math.cos(theta)

      cameraRef.current.lookAt(center)
      cameraRef.current.updateProjectionMatrix()
    }
  }

  const loadGLBModel = async () => {
    if (!sceneRef.current) return

    setLoadingText("LOADING GLB MODEL...")

    const loader = new GLTFLoader()
    const GLB_URL =
      "https://raw.githubusercontent.com/CapitanBarboza/MineCamp/887176f2a3eefe96e0b99d340ebbf10777446103/puntos_derecho_clusterizados_2.glb"

    try {
      const gltf = await loader.loadAsync(GLB_URL)
      console.log("[DEBUG] GLB loaded successfully:", gltf)

      const model = gltf.scene
      model.scale.set(1, 1, 1)
      glbModelRef.current = model

      const vibrantMaterials = Object.keys(categoryColors).map((category) => {
        const color = new THREE.Color(categoryColors[category])
        return new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.3,
          emissive: color,
          emissiveIntensity: 1.0,
          side: THREE.DoubleSide,
        })
      })

      let meshIndex = 0
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materialIndex = meshIndex % vibrantMaterials.length
          child.material = vibrantMaterials[materialIndex]
          meshIndex++
        }
      })

      sceneRef.current.add(model)

      // Calcular centro del GLB para auto explore
      const box = new THREE.Box3().setFromObject(model)
      autoExploreRef.current.glbCenter = box.getCenter(new THREE.Vector3())

      if (particlesRef.current) {
        frameObject(sceneRef.current, cameraRef.current!, 0.6)
      }
    } catch (error) {
      console.error("[DEBUG] Error loading GLB:", error)
      setLoadingText("ERROR LOADING GLB MODEL. CONTINUING WITH PARTICLES ONLY...")

      if (particlesRef.current && cameraRef.current) {
        frameObject(particlesRef.current, cameraRef.current, 0.6)
      }
    }
  }

  const init = async () => {
    if (!containerRef.current) return

    await initializeData()

    sceneRef.current = new THREE.Scene()
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000)
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true })
    rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    rendererRef.current.setClearColor(0x000000)
    containerRef.current.appendChild(rendererRef.current.domElement)

    raycasterRef.current = new THREE.Raycaster()
    mouseRef.current = new THREE.Vector2()

    createParticles()
    await loadGLBModel()

    setLoading(false)
    animate()
  }

  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate)
    timeRef.current += 16

    // Actualizar auto explore
    updateAutoExplore()

    const controls = cameraControlsRef.current
    if (
      controls.autoRotate &&
      !controls.isMouseDown &&
      !controls.isMiddleMouseDown &&
      !autoExploreRef.current.isActive
    ) {
      controls.theta += controls.autoRotateSpeed

      if (cameraRef.current) {
        const radius = cameraRef.current.position.distanceTo(controls.target)
        cameraRef.current.position.x = controls.target.x + radius * Math.sin(controls.phi) * Math.sin(controls.theta)
        cameraRef.current.position.y = controls.target.y + radius * Math.cos(controls.phi)
        cameraRef.current.position.z = controls.target.z + radius * Math.sin(controls.phi) * Math.cos(controls.theta)
      }
    }

    if (particlesRef.current?.material && "uniforms" in particlesRef.current.material) {
      particlesRef.current.material.uniforms.time.value = timeRef.current
    }

    updateClickTargets()

    if (cameraRef.current) {
      cameraRef.current.lookAt(cameraControlsRef.current.target)
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!raycasterRef.current || !mouseRef.current || !cameraRef.current) return

    const controls = cameraControlsRef.current
    controls.lastMouseMoveTime = Date.now()

    if (!controls.isMouseDown && !controls.isMiddleMouseDown && !autoExploreMode) {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersects = raycasterRef.current.intersectObjects(clickTargetsRef.current)

      if (intersects.length > 0) {
        const pointData = intersects[0].object.userData.pointData
        if (pointData) {
          setCategoryLabel({
            show: true,
            x: event.clientX,
            y: event.clientY,
            text: pointData.subCategory,
            category: pointData.category,
          })
        } else {
          setCategoryLabel((prev) => ({ ...prev, show: false }))
        }
      } else {
        setCategoryLabel((prev) => ({ ...prev, show: false }))
      }
    } else if (controls.isMouseDown) {
      controls.autoRotate = false
      autoExploreRef.current.isActive = false
      autoExploreRef.current.isTransitioning = false

      const deltaX = event.clientX - controls.prevMouseX
      const deltaY = event.clientY - controls.prevMouseY

      controls.phi -= deltaY * 0.003
      controls.theta -= deltaX * 0.003
      controls.phi = Math.max(0.01, Math.min(Math.PI - 0.01, controls.phi))

      const radius = cameraRef.current.position.distanceTo(controls.target)
      cameraRef.current.position.x = controls.target.x + radius * Math.sin(controls.phi) * Math.sin(controls.theta)
      cameraRef.current.position.y = controls.target.y + radius * Math.cos(controls.phi)
      cameraRef.current.position.z = controls.target.z + radius * Math.sin(controls.phi) * Math.cos(controls.theta)

      controls.prevMouseX = event.clientX
      controls.prevMouseY = event.clientY
      setCategoryLabel((prev) => ({ ...prev, show: false }))
      setDetailedInfo((prev) => ({ ...prev, show: false }))
      setCurrentExploredPoint(null)
    }
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    const controls = cameraControlsRef.current

    if (event.button === 0) {
      controls.isMouseDown = true
      controls.prevMouseX = event.clientX
      controls.prevMouseY = event.clientY
      controls.autoRotate = false
      autoExploreRef.current.isActive = false
      autoExploreRef.current.isTransitioning = false
    }

    setCategoryLabel((prev) => ({ ...prev, show: false }))
    if (!autoExploreMode) {
      setDetailedInfo((prev) => ({ ...prev, show: false }))
    }
    setCurrentExploredPoint(null)
  }

  const handleMouseUp = (event: React.MouseEvent) => {
    const controls = cameraControlsRef.current

    if (event.button === 0) {
      controls.isMouseDown = false
      controls.lastMouseMoveTime = Date.now()
      setTimeout(() => {
        if (!controls.isMouseDown && !controls.isMiddleMouseDown && !autoExploreMode) {
          controls.autoRotate = true
          controls.autoRotateSpeed = 0.001
        }
      }, 3000)
    }
  }

  const handleClick = (event: React.MouseEvent) => {
    if (!raycasterRef.current || !mouseRef.current || !cameraRef.current) return

    const controls = cameraControlsRef.current
    if (controls.isMouseDown || controls.isMiddleMouseDown || autoExploreMode) return

    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    const intersects = raycasterRef.current.intersectObjects(clickTargetsRef.current)

    if (intersects.length > 0) {
      const pointData = intersects[0].object.userData.pointData
      if (pointData) {
        setCategoryLabel((prev) => ({ ...prev, show: false }))
        setDetailedInfo({
          show: true,
          x: event.clientX,
          y: event.clientY,
          data: pointData,
        })
        setCurrentExploredPoint(pointData)
        controls.lastMouseMoveTime = Date.now()
      }
    } else {
      setDetailedInfo((prev) => ({ ...prev, show: false }))
      setCurrentExploredPoint(null)
    }
  }

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault()

    if (!cameraRef.current) return

    const controls = cameraControlsRef.current
    controls.lastMouseMoveTime = Date.now()

    const zoomSpeed = 0.1
    const direction = new THREE.Vector3()
    cameraRef.current.getWorldDirection(direction)

    const moveDistance = -event.deltaY * zoomSpeed
    cameraRef.current.position.addScaledVector(direction, moveDistance)

    const currentDistance = cameraRef.current.position.distanceTo(controls.target)
    const minDistance = 1.0
    const maxDistance = 100

    if (currentDistance < minDistance) {
      const dirToCam = new THREE.Vector3().subVectors(cameraRef.current.position, controls.target).normalize()
      cameraRef.current.position.copy(controls.target).addScaledVector(dirToCam, minDistance)
    }
    if (currentDistance > maxDistance) {
      const dirToCam = new THREE.Vector3().subVectors(cameraRef.current.position, controls.target).normalize()
      cameraRef.current.position.copy(controls.target).addScaledVector(dirToCam, maxDistance)
    }

    setCategoryLabel((prev) => ({ ...prev, show: false }))
    if (!autoExploreMode) {
      setDetailedInfo((prev) => ({ ...prev, show: false }))
    }
  }

  useEffect(() => {
    init()

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)

        if (particlesRef.current?.material && "uniforms" in particlesRef.current.material) {
          particlesRef.current.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight)
        }
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (derechoData.length > 0) {
      createParticles()
    }
  }, [derechoData])

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-mono cursor-grab">
      <div
        ref={containerRef}
        className="relative w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl font-mono p-5 bg-black/90 rounded text-center backdrop-blur-sm border border-white/30">
          <div className="animate-pulse">{loadingText}</div>
        </div>
      )}

      {/* Banner Publicitario Feria Expogrado */}
      <div className="absolute top-4 right-4 z-20 max-w-xs sm:max-w-sm md:max-w-md">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-1 rounded-lg animate-pulse">
          <div className="bg-black/95 p-3 sm:p-4 rounded-lg backdrop-blur-sm">
            <div className="text-xs sm:text-sm text-white font-bold uppercase tracking-wider mb-2 text-center">
              🎓 FERIA EXPOGRADO 🎓
            </div>
            <div className="text-xs text-white/90 mb-2">
              <div className="font-semibold">📅 6 de Junio</div>
              <div>📍 Pedro de Valdivia 273</div>
              <div>🕘 09:30 AM - 18:00 PM</div>
            </div>
            <div className="text-xs text-white/70 text-center">¡No te lo pierdas!</div>
          </div>
        </div>
      </div>

      {/* Category Label - Solo visible cuando auto explore está desactivado */}
      {!autoExploreMode && categoryLabel.show && (
        <div
          className={`absolute pointer-events-none bg-black/95 text-white px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-300 ease-out z-50 whitespace-nowrap backdrop-blur-sm border border-white/30 ${categoryLabel.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          style={{
            left: Math.max(10, Math.min(categoryLabel.x - 100, window.innerWidth - 200)),
            top: Math.max(10, categoryLabel.y - 50),
          }}
        >
          {categoryLabel.text}
          <div className="text-xs text-white/70 mt-1">{categoryLabel.category}</div>
        </div>
      )}

      {/* Detailed Info - Solo UNA ventana */}
      {detailedInfo.show && detailedInfo.data && (
        <div
          className={`absolute pointer-events-none bg-black/95 text-white max-w-xs sm:max-w-sm md:max-w-md z-50 font-mono overflow-hidden backdrop-blur-lg border border-white/30 transition-all duration-300 ease-out ${detailedInfo.show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"}`}
          style={{
            left: Math.max(10, Math.min(detailedInfo.x + 20, window.innerWidth - 320)),
            top: Math.max(10, Math.min(detailedInfo.y - 10, window.innerHeight - 260)),
          }}
        >
          <div className="bg-white/10 px-3 py-2 border-b border-white/30">
            <div className="text-xs text-white/70 uppercase tracking-wider mb-1">{detailedInfo.data.category}</div>
            <div className="text-sm text-white">{detailedInfo.data.data.title}</div>
            <div className="text-xs text-white/50 mt-1">
              [{detailedInfo.data.originalPosition.x.toFixed(1)}, {detailedInfo.data.originalPosition.y.toFixed(1)},{" "}
              {detailedInfo.data.originalPosition.z.toFixed(1)}]
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-white/80 text-xs mb-2">{detailedInfo.data.data.content}</div>
            {detailedInfo.data.data.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {detailedInfo.data.data.keywords.map((keyword: string, index: number) => (
                  <span key={index} className="bg-white/10 text-xs px-2 py-1 border border-white/20">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terminal Header con Instagram de Abogrado */}
      <div className="absolute top-4 left-4 text-white z-10 font-mono">
        <div className="text-xs text-white/70 mb-1 uppercase tracking-widest">MODE</div>
        <div className="text-base sm:text-lg text-white uppercase tracking-wider">ABOGRADO ENCICLOPEDIA</div>
        <div className="text-xs text-white/70 mt-1">
          DATAPOINTS:{" "}
          {Object.values(categoryStats)
            .reduce((a, b) => a + b, 0)
            .toLocaleString()}
        </div>
        {autoExploreMode && (
          <div className="text-xs text-white/50 mt-1">
            AUTO EXPLORE: {autoExploreRef.current.currentPerspective || "ACTIVE"}
          </div>
        )}
        <div className="mt-2">
          <a
            href="https://www.instagram.com/abogrado_?igsh=ZXNxa2s2eHIyMmQ="
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/60 hover:text-white transition-colors duration-200 uppercase tracking-wider"
          >
            @ABOGRADO_
          </a>
        </div>
      </div>

      {/* Collapsible Stats Panel - Solo visible cuando auto explore está desactivado */}
      {!autoExploreMode && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-black/90 text-white px-3 py-2 text-xs font-mono uppercase tracking-wider border border-white/30 hover:bg-white/10 transition-all duration-200 mb-2 w-full"
          >
            STATS {showStats ? "[-]" : "[+]"}
          </button>
          {showStats && (
            <div className="bg-black/95 border border-white/30 p-3 min-w-48 sm:min-w-64 max-h-60 sm:max-h-80 overflow-y-auto backdrop-blur-sm">
              <div className="text-xs text-white/70 uppercase tracking-widest mb-3">CATEGORIES</div>
              <div className="space-y-1">
                {Object.entries(categoryStats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const color = new THREE.Color(categoryColors[category] || 0xff00ff)
                    return (
                      <div key={category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center flex-1">
                          <div
                            className="w-2 h-2 mr-2 flex-shrink-0"
                            style={{
                              backgroundColor: `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`,
                            }}
                          ></div>
                          <div className="text-white truncate text-xs">{category}</div>
                        </div>
                        <div className="text-white/70 ml-2 text-xs">{count.toLocaleString()}</div>
                      </div>
                    )
                  })}
              </div>
              <div className="mt-3 pt-2 border-t border-white/30 text-xs text-white flex justify-between">
                <span>TOTAL</span>
                <span>
                  {Object.values(categoryStats)
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crédito del desarrollador - Arriba del botón Auto Explore */}
      <div className="absolute bottom-16 sm:bottom-20 left-4 z-10">
        <div className="text-xs text-white/50 font-mono mb-2">
          CREADO POR:{" "}
          <a
            href="https://www.instagram.com/capitan_barboza?igsh=amg2ZXpvN3pldGt2&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors duration-200 uppercase tracking-wider"
          >
            @CAPITAN_BARBOZA
          </a>
        </div>
      </div>

      {/* Auto Explore Toggle */}
      <div className="absolute bottom-4 left-4 z-10">
        <button
          onClick={toggleAutoExploreMode}
          className={`bg-black/90 text-white px-3 py-2 text-xs font-mono uppercase tracking-wider border transition-all duration-200 ${
            autoExploreMode
              ? "border-white/50 hover:bg-white/10 text-white"
              : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
          }`}
        >
          AUTO EXPLORE {autoExploreMode ? "[ON]" : "[OFF]"}
        </button>
      </div>

      {/* Terminal Instructions - Reposicionado para evitar superposición */}
      <div className="absolute bottom-4 left-40 sm:left-48 text-white/60 text-xs z-10 font-mono hidden sm:block">
        <div className="bg-black/30 px-3 py-2 border border-white/20">
          {autoExploreMode ? "AUTO EXPLORE MODE: ACTIVE" : "DRAG: ROTATE | WHEEL: ZOOM | CLICK: DETAILS"}
        </div>
      </div>

      {/* Terminal Instructions Mobile - Visible solo en móviles */}
      <div className="absolute bottom-4 left-4 right-4 text-white/60 text-xs z-10 font-mono sm:hidden">
        <div className="bg-black/30 px-2 py-1 border border-white/20 text-center">
          {autoExploreMode ? "AUTO EXPLORE: ACTIVE" : "TOUCH: ROTATE | PINCH: ZOOM"}
        </div>
      </div>

      {/* Audio Controls - Nuevo posicionamiento en la parte inferior */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/90 border border-white/30 px-3 py-2 text-xs font-mono backdrop-blur-sm flex items-center gap-3">
          <button
            onClick={toggleAudio}
            disabled={!audioLoaded}
            className={`uppercase tracking-wider transition-all duration-200 ${
              isAudioPlaying ? "text-white" : "text-white/60 hover:text-white"
            } ${!audioLoaded ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isAudioPlaying ? "PAUSE" : "PLAY"}
          </button>
          {audioLoaded && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={audioVolume}
              onChange={(e) => handleVolumeChange(Number.parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ffffff ${audioVolume * 100}%, rgba(255,255,255,0.2) ${audioVolume * 100}%)`,
              }}
            />
          )}
          <span className="text-white/50">{Math.round(audioVolume * 100)}%</span>
          {!audioLoaded && <span className="text-white/50">LOADING...</span>}
        </div>
      </div>

      {/* Nuevo Source Panel - Siempre visible, al lado derecho */}
      {!autoExploreMode && currentSource && (
        <div className="absolute bottom-4 right-1/4 z-10 max-w-xs">
          <div className="bg-black/60 border-l border-white/20 px-3 py-2 text-[10px] font-mono backdrop-blur-sm">
            <div className="text-white/40 uppercase tracking-wider mb-1">
              SOURCE {currentSourceIndex + 1}/{allSources.length}
            </div>
            <div className="text-white/80 mb-0.5 truncate">{currentSource.titulo}</div>
            {currentSource.autor && <div className="text-white/60 mb-0.5 truncate">{currentSource.autor}</div>}
            {currentSource.editorial && <div className="text-white/40 mb-0.5 truncate">{currentSource.editorial}</div>}
            {currentSource.ano && <div className="text-white/40 mb-0.5">{currentSource.ano}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
