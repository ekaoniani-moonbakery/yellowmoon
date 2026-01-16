// WebGL Shader Background
function initWebGL() {
    const canvas = document.getElementById('webgl-canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        document.getElementById('fallback-bg').classList.add('active');
        return;
    }

    // Vertex shader
    const vertexShaderSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    // Fragment shader with dither/grain effect
    const fragmentShaderSource = `
        precision mediump float;
        uniform float time;
        uniform vec2 resolution;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for(int i = 0; i < 5; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        float dither(vec2 uv) {
            return fract(dot(uv, vec2(0.5, 0.5)) * 64.0);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / resolution;
            vec2 p = uv * 2.0 - 1.0;
            p.x *= resolution.x / resolution.y;

            float gradient = uv.y * 0.7 + 0.3;
            vec2 cloudUv = uv * 3.0 + time * 0.02;
            float clouds = fbm(cloudUv) * 0.3;
            
            vec2 moonPos = vec2(0.3, 0.6);
            float moonDist = length(uv - moonPos);
            float moon = smoothstep(0.15, 0.12, moonDist);
            float glow = exp(-moonDist * 4.0) * 0.2;

            float intensity = gradient + clouds + glow;
            
            vec3 darkBg = vec3(0.08, 0.06, 0.04);
            vec3 warmYellow = vec3(0.95, 0.75, 0.35);
            vec3 midTone = vec3(0.25, 0.18, 0.10);
            
            vec3 color = mix(darkBg, midTone, intensity);
            color = mix(color, warmYellow, moon);
            color += warmYellow * glow * 0.5;

            float grain = hash(uv + time * 0.1) * 0.08;
            color += grain;

            float ditherPattern = dither(gl_FragCoord.xy) * 0.03;
            color += ditherPattern;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // Compile shader
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
        document.getElementById('fallback-bg').classList.add('active');
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Set up geometry
    const vertices = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');

    // Resize handler
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);

    // Animation loop
    const startTime = Date.now();
    function render() {
        const time = (Date.now() - startTime) * 0.001;
        gl.uniform1f(timeLocation, time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }
    render();
}

// Navigation and Page Switching
let currentPage = 'home';

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById(`page-${pageName}`);
    if (page) {
        page.classList.add('active');
        currentPage = pageName;
        
        // Update nav active state
        document.querySelectorAll('.desktop-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageName) {
                link.classList.add('active');
            }
        });

        // Animate elements
        animateFadeIns();
        
        // Close mobile menu
        document.getElementById('mobile-menu').classList.remove('active');
        document.querySelector('.menu-icon').style.display = 'block';
        document.querySelector('.close-icon').style.display = 'none';
    }
}

function animateFadeIns() {
    const fadeElements = document.querySelectorAll('.page.active .fade-in');
    fadeElements.forEach((el, i) => {
        el.classList.remove('visible');
        setTimeout(() => {
            el.classList.add('visible');
        }, 100 + i * 100);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize WebGL
    initWebGL();

    // Logo click
    document.getElementById('logo').addEventListener('click', () => {
        showPage('home');
    });

    // Navigation links
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            showPage(page);
        });
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');
    const closeIcon = document.querySelector('.close-icon');

    mobileMenuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('active');
        menuIcon.style.display = isOpen ? 'none' : 'block';
        closeIcon.style.display = isOpen ? 'block' : 'none';
    });

    // Initial animation
    setTimeout(() => {
        animateFadeIns();
    }, 100);
});
