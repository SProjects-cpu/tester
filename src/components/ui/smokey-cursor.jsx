import { useRef, useEffect } from 'react';

const SmokeyCursor = ({
  simulationResolution = 128,
  dyeResolution = 512,
  densityDissipation = 3,
  velocityDissipation = 2,
  curl = 5,
  splatRadius = 0.25,
  splatForce = 6000,
  enableShading = true,
  colorUpdateSpeed = 10,
  backgroundColor = { r: 0, g: 0, b: 0 }
}) => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    // Check for extensions
    const ext = gl.getExtension('OES_texture_half_float');
    const extLinear = gl.getExtension('OES_texture_half_float_linear');
    
    if (!ext) {
      console.warn('Half float textures not supported');
      return;
    }

    // Resize canvas
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Shaders
    const vertexShader = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const displayFragmentShader = `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      void main() {
        vec4 color = texture2D(uTexture, vUv);
        float alpha = max(color.r, max(color.g, color.b));
        // Subtle, low contrast for non-blinding effect
        gl_FragColor = vec4(color.rgb * 0.7, alpha * 0.35);
      }
    `;

    const splatFragmentShader = `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      uniform float aspectRatio;
      void main() {
        vec2 p = vUv - point;
        p.x *= aspectRatio;
        float splat = exp(-dot(p, p) / radius);
        vec3 base = texture2D(uTarget, vUv).rgb;
        gl_FragColor = vec4(base + splat * color, 1.0);
      }
    `;

    const advectionFragmentShader = `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;
      void main() {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
      }
    `;

    // Compile shader
    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    // Create program
    const createProgram = (vs, fs) => {
      const program = gl.createProgram();
      const vertShader = compileShader(gl.VERTEX_SHADER, vs);
      const fragShader = compileShader(gl.FRAGMENT_SHADER, fs);
      if (!vertShader || !fragShader) return null;
      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program error:', gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    // Create FBO
    const createFBO = (w, h) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, extLinear ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, extLinear ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Framebuffer incomplete');
        return null;
      }

      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return { texture, fbo, width: w, height: h };
    };

    // Create double FBO
    const createDoubleFBO = (w, h) => {
      const fbo1 = createFBO(w, h);
      const fbo2 = createFBO(w, h);
      if (!fbo1 || !fbo2) return null;
      
      return {
        read: fbo1,
        write: fbo2,
        swap() {
          const temp = this.read;
          this.read = this.write;
          this.write = temp;
        }
      };
    };

    // Initialize programs
    const displayProgram = createProgram(vertexShader, displayFragmentShader);
    const splatProgram = createProgram(vertexShader, splatFragmentShader);
    const advectionProgram = createProgram(vertexShader, advectionFragmentShader);

    if (!displayProgram || !splatProgram || !advectionProgram) {
      console.error('Failed to create programs');
      return;
    }

    // Create buffers
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    
    const elemBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    
    const aPosition = gl.getAttribLocation(displayProgram, 'aPosition');
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // Initialize FBOs
    const velocity = createDoubleFBO(simulationResolution, simulationResolution);
    const density = createDoubleFBO(dyeResolution, dyeResolution);

    if (!velocity || !density) {
      console.error('Failed to create FBOs');
      return;
    }

    // Mouse tracking
    const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false };

    const updatePointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX / rect.width;
      const y = 1.0 - e.clientY / rect.height;
      pointer.dx = (x - pointer.x) * 10;
      pointer.dy = (y - pointer.y) * 10;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = Math.abs(pointer.dx) > 0.001 || Math.abs(pointer.dy) > 0.001;
    };

    // HSV to RGB conversion for vibrant colors
    const HSVtoRGB = (h, s, v) => {
      let r, g, b;
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);
      
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = v; g = t; b = p;
      }
      
      return { r, g, b };
    };

    window.addEventListener('mousemove', updatePointer);
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0]);
      }
    }, { passive: true });

    // Splat function
    const splat = (x, y, dx, dy, color) => {
      gl.useProgram(splatProgram);
      gl.uniform1i(gl.getUniformLocation(splatProgram, 'uTarget'), 0);
      gl.uniform1f(gl.getUniformLocation(splatProgram, 'aspectRatio'), canvas.width / canvas.height);
      gl.uniform2f(gl.getUniformLocation(splatProgram, 'point'), x, y);
      gl.uniform3f(gl.getUniformLocation(splatProgram, 'color'), dx * 0.3, dy * 0.3, 0);
      gl.uniform1f(gl.getUniformLocation(splatProgram, 'radius'), splatRadius / 100);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
      gl.viewport(0, 0, velocity.write.width, velocity.write.height);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      velocity.swap();

      // Use subtle rainbow color to avoid blinding effect
      gl.uniform3f(gl.getUniformLocation(splatProgram, 'color'), color.r * 1.0, color.g * 1.0, color.b * 1.0);
      gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, density.write.fbo);
      gl.viewport(0, 0, density.write.width, density.write.height);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      density.swap();
    };

    // Animation loop
    let lastTime = Date.now();
    let colorOffset = 0;
    const update = () => {
      const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
      lastTime = Date.now();

      if (pointer.moved) {
        // Generate smooth rainbow colors that transition continuously
        colorOffset += dt * 0.5; // Smooth color transition speed
        const hue = (colorOffset % 1.0);
        const color = HSVtoRGB(hue, 0.6, 0.7); // Lower saturation and brightness for subtle effect
        splat(pointer.x, pointer.y, pointer.dx * splatForce, pointer.dy * splatForce, color);
        pointer.moved = false;
      }

      // Advection
      gl.useProgram(advectionProgram);
      gl.uniform2f(gl.getUniformLocation(advectionProgram, 'texelSize'), 1 / dyeResolution, 1 / dyeResolution);
      gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dt'), dt);
      gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dissipation'), 1.0 - densityDissipation / 100);
      gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uVelocity'), 0);
      gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uSource'), 1);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, density.write.fbo);
      gl.viewport(0, 0, density.write.width, density.write.height);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      density.swap();

      // Display
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(displayProgram);
      gl.uniform1i(gl.getUniformLocation(displayProgram, 'uTexture'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

      animationIdRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', updatePointer);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [simulationResolution, dyeResolution, densityDissipation, velocityDissipation, curl, splatRadius, splatForce, enableShading, colorUpdateSpeed, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

export default SmokeyCursor;
