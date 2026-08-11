import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
      v_uv = vec2(a_position.x, -a_position.y) * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform float u_dpr;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec2 u_size;
  varying vec2 v_uv;

  float roundedBox(vec2 uv, vec2 center, vec2 size, float radius) {
      vec2 q = abs(uv - center) - size + radius;
      return length(max(q, 0.0)) - radius;
  }

  float roundedBoxSDF(vec2 p, vec2 b, float r) {
      vec2 d = abs(p) - b + vec2(r);
      return length(max(d, 0.0)) - r;
  }

  vec2 getNormal(vec2 uv, vec2 center, vec2 size, float radius) {
      vec2 eps = vec2(1.0) / u_resolution * 2.0;
      vec2 p = uv - center;
      float dx = (roundedBoxSDF(p + vec2(eps.x, 0.0), size, radius) - roundedBoxSDF(p - vec2(eps.x, 0.0), size, radius)) * 0.5;
      float dy = (roundedBoxSDF(p + vec2(0.0, eps.y), size, radius) - roundedBoxSDF(p - vec2(0.0, eps.y), size, radius)) * 0.5;
      vec2 gradient = vec2(dx, dy);
      float dxy1 = roundedBoxSDF(p + eps, size, radius);
      float dxy2 = roundedBoxSDF(p - eps, size, radius);
      vec2 diag = vec2(dxy1 - dxy2);
      gradient = mix(gradient, diag, 0.25);
      if (length(gradient) < 0.001) return vec2(0.0);
      return normalize(gradient);
  }

  void main() {
      vec2 pixelUV = (v_uv * u_resolution) / u_dpr;
      vec2 center = u_mouse;
      vec2 size = u_size * 0.5;

      vec2 local = (pixelUV - center) / size;
      local.y *= u_resolution.x / u_resolution.y;

      float radius = 32.0;
      float dist = roundedBox(pixelUV, center, size, radius);

      if (dist > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
      }

      float r = clamp(length(local * 1.0), 0.0, 1.0);
      float curvature = pow(r, 1.0);
      vec2 domeNormal = normalize(local) * curvature;
      float eta = 1.0 / 1.5;
      vec2 incident = -domeNormal;
      vec2 refractVec = refract(incident, domeNormal, eta);

      float contourFalloff = exp(-abs(dist) * 0.4);
      vec2 normal = getNormal(pixelUV, center, size, radius);
      vec2 domeNormalContour = normal * pow(contourFalloff, 1.5);
      vec2 refractVecContour = refract(vec2(0.0), domeNormalContour, eta);

      float edgeWeight = smoothstep(0.0, 1.0, abs(dist));
      float radialWeight = smoothstep(0.5, 1.0, r);
      float combinedWeight = clamp((edgeWeight * 1.0) + (-radialWeight * 0.5), 0.0, 1.0);

      vec3 base = vec3(0.18, 0.18, 0.22);

      float edgeFalloff = smoothstep(0.01, 0.0, dist);
      float verticalBand = 1.0 - smoothstep(-1.5, -0.2, local.y);
      float topShadow = edgeFalloff * verticalBand;
      vec3 shadowColor = vec3(0.0);
      base = mix(base, shadowColor, topShadow * 0.12);

      float edge = 1.0 - smoothstep(0.0, 0.03, dist * -2.0);
      vec3 glow = vec3(0.95, 0.95, 1.0);
      vec3 color = mix(base, glow, edge * 0.55);

      float alpha = 0.55;
      gl_FragColor = vec4(color, alpha);
  }
`

export function LiquidGlassCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      canvas.getContext('webgl', { antialias: true, alpha: true }) ||
      (canvas.getContext('experimental-webgl', { antialias: true, alpha: true }) as WebGLRenderingContext | null)
    if (!gl) return

    let animId: number

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        return null
      }
      return shader
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_resolution')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uSize = gl.getUniformLocation(program, 'u_size')
    const uDpr = gl.getUniformLocation(program, 'u_dpr')

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const parent = canvas.parentElement
      const width = parent ? parent.clientWidth : window.innerWidth
      const height = parent ? parent.clientHeight : window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    window.addEventListener('resize', resize)
    resize()

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform2f(uMouse, width / 2, height - 60)
      gl.uniform2f(uSize, width * 0.88, 80)
      if (uDpr) gl.uniform1f(uDpr, dpr)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}
