"use client";
import { useEffect, useRef } from 'react';
import { MEDIA } from '../../constants/media';

interface HeroShaderCanvasProps {
  isDark: boolean;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform float u_time;
  uniform float u_time_night;
  uniform vec2 u_res;
  uniform vec2 u_mouse;
  uniform float u_progressHover;
  uniform float u_themeTransition; // 1.0 = Night, 0.0 = Day

  uniform sampler2D u_glass_map;
  uniform vec2 u_glass_ratio;
  uniform sampler2D u_villa_map;
  uniform vec2 u_villa_ratio;
  uniform sampler2D u_day_map;
  uniform vec2 u_day_ratio;

  uniform float u_alpha;

  // 3D Simplex Noise
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise3(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.zzzz);

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

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  vec2 coverUV(vec2 uv, vec2 ratio) {
    return (uv - 0.5) * ratio + 0.5;
  }

  void main() {
    float t = u_time;
    float tn = u_time_night;
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    vec2 st = uv - 0.5;
    st.y *= u_res.y / u_res.x;

    // Interactive gooey liquid hover brush effect from gooey-hover-codrops
    float progressHover = clamp(u_progressHover, 0.0, 1.0);
    vec2 mouse = vec2((u_mouse.x / u_res.x) - 0.5, 0.5 - (u_mouse.y / u_res.y));
    mouse.y *= u_res.y / u_res.x;
    float distMouse = length(st - mouse);
    float hoverMask = 1.0 - smoothstep(0.02, 0.14, distMouse);
    vec2 hoverDistort = vec2(
      snoise3(vec3(uv * 5.0, t * 1.5)),
      snoise3(vec3(uv * 5.0 + 10.0, t * 1.5))
    ) * 0.04 * progressHover * hoverMask;

    vec2 uv_dist = uv + hoverDistort;

    // --- NIGHT MODE SEQUENCE (tn = seconds since Night mode start) ---
    // 0.00 - 3.00 -> Blank
    // 3.00 - 4.00 -> Brush starts (glass image painted)
    // 4.00 - 5.00 -> Glass shimmer
    // 5.30 - 6.30 -> Water ripple
    // 6.30 - 7.30 -> Glass melts
    // 7.30 - 8.30 -> Original villa fully visible
    // 8.30 onwards -> Camera slowly pushes in forever

    vec3 nightColor;
    if (tn >= 7.30) {
      float t_push = max(0.0, tn - 8.30);
      float zoomScale = 1.0 / (1.0 + t_push * 0.012);
      vec2 uv_villa_zoomed = (uv_dist - 0.5) * zoomScale + 0.5;
      vec2 uv_villa_final = coverUV(uv_villa_zoomed, u_villa_ratio);
      vec4 villaTex = texture2D(u_villa_map, uv_villa_final);
      nightColor = villaTex.rgb;
    } else {
      float p_brush = clamp((tn - 3.00) / 1.00, 0.0, 1.0);
      float p_shimmer = clamp((tn - 4.00) / 1.00, 0.0, 1.0);
      float p_ripple = clamp((tn - 5.30) / 1.00, 0.0, 1.0);
      float p_melt = clamp((tn - 6.30) / 1.00, 0.0, 1.0);

      // 1. Brush paint reveal mask (3.00 - 4.00s)
      float brushNoise = snoise3(vec3(uv * 4.0, tn * 1.2)) * 0.2;
      float brushRadius = p_brush * 1.45;
      float distCenter = length(uv - 0.5);
      float brushMask = smoothstep(brushRadius, brushRadius - 0.35, distCenter + brushNoise);

      // 2. Water Ripple & Fluid Melt distortion (5.30 - 7.30s)
      float rippleWave = sin(distCenter * 35.0 - tn * 12.0);
      vec2 rippleOffset = normalize(uv - 0.5 + 0.0001) * rippleWave * 0.02 * p_ripple * (1.0 - p_melt);
      vec2 meltNoiseUV = vec2(
        snoise3(vec3(uv * 4.0, tn * 2.0)),
        snoise3(vec3(uv * 4.0 + 5.0, tn * 2.0))
      ) * 0.06 * p_melt * (1.0 - p_melt) * 4.0;

      vec2 uv_glass_final = coverUV(uv_dist + rippleOffset + meltNoiseUV, u_glass_ratio);
      vec4 glassTex = texture2D(u_glass_map, uv_glass_final);

      // 3. Shimmer effect (4.00 - 5.30s)
      float shimmerPos = mix(-0.8, 1.8, p_shimmer);
      float diag = (uv.x + uv.y) * 0.5;
      float shimmerBand = smoothstep(0.2, 0.0, abs(diag - shimmerPos)) * 0.45 * (1.0 - p_melt);
      vec3 shimmerColor = vec3(1.0, 0.95, 0.85) * shimmerBand;
      vec3 glassColor = glassTex.rgb + shimmerColor;

      // 4. Target Villa image
      vec2 uv_villa_final = coverUV(uv_dist, u_villa_ratio);
      vec4 villaTex = texture2D(u_villa_map, uv_villa_final);

      // 5. Melt dissolve transition from Glass to Original Villa (6.30 - 7.30s)
      float meltNoiseMask = snoise3(vec3(uv * 3.0, tn * 1.5)) * 0.25;
      float meltEdge = uv.y + meltNoiseMask;
      float meltThreshold = mix(1.6, -0.4, p_melt);
      float villaAlpha = smoothstep(meltThreshold - 0.2, meltThreshold + 0.2, meltEdge);

      nightColor = mix(glassColor, villaTex.rgb, villaAlpha) * brushMask;
    }

    // --- DAY MODE ---
    vec2 uv_day = coverUV(uv_dist, u_day_ratio);
    vec4 dayTex = texture2D(u_day_map, uv_day);

    // Smooth transition between Day and Night themes
    vec3 finalColor = mix(dayTex.rgb, nightColor, clamp(u_themeTransition, 0.0, 1.0));

    gl_FragColor = vec4(finalColor, u_alpha);
  }
`;

function getRatio(canvasW: number, canvasH: number, imgW: number, imgH: number): [number, number] {
  if (!imgW || !imgH || !canvasW || !canvasH) return [1.0, 1.0];
  const canvasAspect = canvasW / canvasH;
  const imgAspect = imgW / imgH;
  if (canvasAspect > imgAspect) {
    return [1.0, imgAspect / canvasAspect];
  } else {
    return [canvasAspect / imgAspect, 1.0];
  }
}

export default function HeroShaderCanvas({ isDark }: HeroShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texturesRef = useRef<{ [key: string]: { texture: WebGLTexture; width: number; height: number } }>({});
  const isDarkRef = useRef<boolean>(isDark);
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isHoveringRef = useRef<boolean>(false);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) return;

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertShader || !fragShader) {
      canvas.style.display = 'none';
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      canvas.style.display = 'none';
      return;
    }

    canvas.style.display = 'block';
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uTimeNightLoc = gl.getUniformLocation(program, 'u_time_night');
    const uResLoc = gl.getUniformLocation(program, 'u_res');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const uProgressHoverLoc = gl.getUniformLocation(program, 'u_progressHover');
    const uThemeTransitionLoc = gl.getUniformLocation(program, 'u_themeTransition');
    const uAlphaLoc = gl.getUniformLocation(program, 'u_alpha');

    const uGlassMapLoc = gl.getUniformLocation(program, 'u_glass_map');
    const uGlassRatioLoc = gl.getUniformLocation(program, 'u_glass_ratio');
    const uVillaMapLoc = gl.getUniformLocation(program, 'u_villa_map');
    const uVillaRatioLoc = gl.getUniformLocation(program, 'u_villa_ratio');
    const uDayMapLoc = gl.getUniformLocation(program, 'u_day_map');
    const uDayRatioLoc = gl.getUniformLocation(program, 'u_day_ratio');

    const loadTexture = (url: string, callback?: () => void) => {
      if (texturesRef.current[url]) {
        if (callback) callback();
        return;
      }
      const texture = gl.createTexture();
      if (!texture) return;

      const img = new Image();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        texturesRef.current[url] = { texture, width: img.naturalWidth, height: img.naturalHeight };
        if (callback) callback();
      };
      img.onerror = (err) => {
        console.error('Failed to load texture for HeroShaderCanvas:', url, err);
      };
      img.src = url;
    };

    const nightGlassUrl = MEDIA.hero.nightGlass;
    const nightVillaUrl = MEDIA.hero.night;
    const dayUrl = MEDIA.hero.day;

    loadTexture(nightGlassUrl);
    loadTexture(nightVillaUrl);
    loadTexture(dayUrl);

    let animationFrameId: number;
    const startTime = performance.now();
    let nightStartTime = isDarkRef.current ? startTime : 0;
    let lastIsDark = isDarkRef.current;
    let currentThemeTransition = isDarkRef.current ? 1.0 : 0.0;

    let currentHoverProgress = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    gl.uniform1f(uAlphaLoc, 1.0);

    const render = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Reset Night Mode timeline when switching TO Night Mode
      if (isDarkRef.current && !lastIsDark) {
        nightStartTime = now;
      }
      lastIsDark = isDarkRef.current;

      const targetTheme = isDarkRef.current ? 1.0 : 0.0;
      currentThemeTransition += (targetTheme - currentThemeTransition) * 0.06;

      const targetHover = isHoveringRef.current ? 1.0 : 0.0;
      currentHoverProgress += (targetHover - currentHoverProgress) * 0.08;

      currentMouseX += (mouseTargetRef.current.x - currentMouseX) * 0.1;
      currentMouseY += (mouseTargetRef.current.y - currentMouseY) * 0.1;

      const glassObj = texturesRef.current[nightGlassUrl];
      const villaObj = texturesRef.current[nightVillaUrl];
      const dayObj = texturesRef.current[dayUrl];

      // Wait until all textures are loaded
      if (glassObj && villaObj && dayObj) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glassObj.texture);
        gl.uniform1i(uGlassMapLoc, 0);
        const rGlass = getRatio(canvas.width, canvas.height, glassObj.width, glassObj.height);
        gl.uniform2f(uGlassRatioLoc, rGlass[0], rGlass[1]);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, villaObj.texture);
        gl.uniform1i(uVillaMapLoc, 1);
        const rVilla = getRatio(canvas.width, canvas.height, villaObj.width, villaObj.height);
        gl.uniform2f(uVillaRatioLoc, rVilla[0], rVilla[1]);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, dayObj.texture);
        gl.uniform1i(uDayMapLoc, 2);
        const rDay = getRatio(canvas.width, canvas.height, dayObj.width, dayObj.height);
        gl.uniform2f(uDayRatioLoc, rDay[0], rDay[1]);

        gl.uniform1f(uTimeLoc, (now - startTime) * 0.001);
        const timeNight = isDarkRef.current ? (now - nightStartTime) * 0.001 : 0.0;
        gl.uniform1f(uTimeNightLoc, timeNight);
        gl.uniform1f(uThemeTransitionLoc, currentThemeTransition);
        gl.uniform1f(uProgressHoverLoc, currentHoverProgress);
        gl.uniform2f(uResLoc, canvas.width, canvas.height);
        gl.uniform2f(uMouseLoc, currentMouseX, currentMouseY);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseTargetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseEnter = () => {
      isHoveringRef.current = true;
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
      }}
      className="object-cover cursor-pointer"
      aria-hidden="true"
    />
  );
}


