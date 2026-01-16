import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, ArrowRight, MapPin, Clock, Phone } from 'lucide-react';

const YellowMoonBakery = () => {
  const canvasRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

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

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);

    let startTime = Date.now();
    function render() {
      const time = (Date.now() - startTime) * 0.001;
      gl.uniform1f(timeLocation, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    render();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      setTimeout(() => {
        el.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 100 + i * 100);
    });
  }, [currentPage]);

  const menuItems = [
    { category: 'Morning Pastries', items: [
      { name: 'Cardamom Croissant', desc: 'Laminated butter pastry with aromatic cardamom', price: '$6' },
      { name: 'Honey Sesame Roll', desc: 'Soft milk bread with tahini swirl and honey glaze', price: '$5' },
      { name: 'Lemon Poppy Cake', desc: 'Bright citrus with delicate poppy seed crumb', price: '$5' }
    ]},
    { category: 'Artisan Breads', items: [
      { name: 'Turmeric Sourdough', desc: 'Naturally leavened with golden turmeric', price: '$8' },
      { name: 'Black Sesame Focaccia', desc: 'Olive oil bread with toasted black sesame', price: '$7' },
      { name: 'Walnut Rye', desc: 'Hearty rye with roasted walnuts', price: '$9' }
    ]},
    { category: 'Sweet Treats', items: [
      { name: 'Rose Pistachio Tart', desc: 'Almond cream with rosewater and pistachios', price: '$7' },
      { name: 'Brown Butter Cookie', desc: 'Crisp edges, chewy center, flaky salt', price: '$4' },
      { name: 'Saffron Panna Cotta', desc: 'Silky custard with saffron and citrus', price: '$8' }
    ]}
  ];

  const Navigation = () => (
    <header style={{
      padding: '2rem 5%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      zIndex: 100
    }}>
      <div 
        className="fade-in"
        onClick={() => setCurrentPage('home')}
        style={{
          fontSize: '1.1rem',
          letterSpacing: '0.15em',
          color: '#f2c55c',
          fontWeight: 300,
          cursor: 'pointer'
        }}>
        YMB
      </div>
      
      {/* Desktop Nav */}
      <nav className="fade-in" style={{
        display: window.innerWidth > 768 ? 'flex' : 'none',
        gap: '2.5rem',
        fontSize: '0.9rem',
        letterSpacing: '0.08em'
      }}>
        <a onClick={() => setCurrentPage('menu')} style={{ 
          color: currentPage === 'menu' ? '#f2c55c' : '#e8d4a8', 
          textDecoration: 'none', 
          transition: 'color 0.3s',
          cursor: 'pointer'
        }}>MENU</a>
        <a onClick={() => setCurrentPage('story')} style={{ 
          color: currentPage === 'story' ? '#f2c55c' : '#e8d4a8', 
          textDecoration: 'none', 
          transition: 'color 0.3s',
          cursor: 'pointer'
        }}>STORY</a>
        <a onClick={() => setCurrentPage('visit')} style={{ 
          color: currentPage === 'visit' ? '#f2c55c' : '#e8d4a8', 
          textDecoration: 'none', 
          transition: 'color 0.3s',
          cursor: 'pointer'
        }}>VISIT</a>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: window.innerWidth <= 768 ? 'block' : 'none',
          background: 'none',
          border: 'none',
          color: '#f2c55c',
          cursor: 'pointer',
          padding: 0
        }}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 10, 6, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem',
          zIndex: 99
        }}>
          <a onClick={() => { setCurrentPage('menu'); setMenuOpen(false); }} style={{ 
            color: '#f2c55c', 
            fontSize: '1.5rem',
            letterSpacing: '0.1em',
            cursor: 'pointer'
          }}>MENU</a>
          <a onClick={() => { setCurrentPage('story'); setMenuOpen(false); }} style={{ 
            color: '#f2c55c', 
            fontSize: '1.5rem',
            letterSpacing: '0.1em',
            cursor: 'pointer'
          }}>STORY</a>
          <a onClick={() => { setCurrentPage('visit'); setMenuOpen(false); }} style={{ 
            color: '#f2c55c', 
            fontSize: '1.5rem',
            letterSpacing: '0.1em',
            cursor: 'pointer'
          }}>VISIT</a>
        </div>
      )}
    </header>
  );

  const HomePage = () => (
    <>
      <Navigation />
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 5%',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 className="fade-in" style={{
          fontSize: 'clamp(3rem, 8vw, 7rem)',
          fontWeight: 300,
          letterSpacing: '0.02em',
          color: '#f2c55c',
          marginBottom: '1.5rem',
          lineHeight: 1.1
        }}>
          Yellow Moon<br/>Bakery
        </h1>
        
        <p className="fade-in" style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
          color: '#d4b88a',
          maxWidth: '600px',
          lineHeight: 1.6,
          fontWeight: 300,
          letterSpacing: '0.03em',
          marginBottom: '3rem'
        }}>
          Familiar flavors in modern forms
        </p>

        <button 
          className="fade-in"
          onClick={() => setCurrentPage('menu')}
          style={{
            padding: '1rem 3rem',
            fontSize: '0.9rem',
            letterSpacing: '0.15em',
            background: 'rgba(242, 197, 92, 0.1)',
            border: '1px solid rgba(242, 197, 92, 0.4)',
            color: '#f2c55c',
            cursor: 'pointer',
            transition: 'all 0.4s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(242, 197, 92, 0.2)';
            e.target.style.borderColor = '#f2c55c';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(242, 197, 92, 0.1)';
            e.target.style.borderColor = 'rgba(242, 197, 92, 0.4)';
          }}>
          EXPLORE MENU
        </button>
      </main>
      <footer className="fade-in" style={{
        padding: '2rem 5%',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        letterSpacing: '0.08em',
        color: '#8a7355'
      }}>
        <div>EST. 2026</div>
        <div>HANDCRAFTED DAILY</div>
      </footer>
    </>
  );

  const MenuPage = () => (
    <>
      <Navigation />
      <main style={{
        flex: 1,
        padding: '4rem 5% 8rem',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%'
      }}>
        <h1 className="fade-in" style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 300,
          letterSpacing: '0.05em',
          color: '#f2c55c',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          Our Menu
        </h1>
        <p className="fade-in" style={{
          fontSize: '1.1rem',
          color: '#d4b88a',
          textAlign: 'center',
          marginBottom: '4rem',
          letterSpacing: '0.03em'
        }}>
          Fresh daily, rooted in tradition
        </p>

        {menuItems.map((section, idx) => (
          <div key={idx} className="fade-in" style={{ marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#f2c55c',
              letterSpacing: '0.1em',
              fontWeight: 300,
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(242, 197, 92, 0.2)',
              paddingBottom: '0.5rem'
            }}>
              {section.category}
            </h2>
            {section.items.map((item, i) => (
              <div key={i} style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '2rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    color: '#e8d4a8',
                    letterSpacing: '0.05em',
                    fontWeight: 400,
                    marginBottom: '0.5rem'
                  }}>
                    {item.name}
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#a89268',
                    lineHeight: 1.5,
                    letterSpacing: '0.02em'
                  }}>
                    {item.desc}
                  </p>
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  color: '#f2c55c',
                  fontWeight: 300,
                  letterSpacing: '0.05em'
                }}>
                  {item.price}
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>
    </>
  );

  const StoryPage = () => (
    <>
      <Navigation />
      <main style={{
        flex: 1,
        padding: '4rem 5% 8rem',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        <h1 className="fade-in" style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 300,
          letterSpacing: '0.05em',
          color: '#f2c55c',
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          Our Story
        </h1>

        <div className="fade-in" style={{
          fontSize: '1.1rem',
          color: '#d4b88a',
          lineHeight: 1.8,
          letterSpacing: '0.02em',
          marginBottom: '2.5rem'
        }}>
          Yellow Moon Bakery began with a simple question: what if we could take the flavors we grew up with and reimagine them through a contemporary lens?
        </div>

        <div className="fade-in" style={{
          fontSize: '1.1rem',
          color: '#d4b88a',
          lineHeight: 1.8,
          letterSpacing: '0.02em',
          marginBottom: '2.5rem'
        }}>
          Founded in 2026, we draw inspiration from traditional techniques passed down through generations, infusing them with modern sensibilities. Each pastry tells a story of connection between heritage and innovation.
        </div>

        <div className="fade-in" style={{
          fontSize: '1.1rem',
          color: '#d4b88a',
          lineHeight: 1.8,
          letterSpacing: '0.02em',
          marginBottom: '2.5rem'
        }}>
          We source our ingredients from local farms and artisan producers, choosing quality over convenience. Our grains are stone-milled, our butter is cultured, and our honey comes from rooftop hives just blocks away.
        </div>

        <div className="fade-in" style={{
          fontSize: '1.1rem',
          color: '#d4b88a',
          lineHeight: 1.8,
          letterSpacing: '0.02em',
          marginBottom: '3rem'
        }}>
          Every morning before sunrise, our bakers begin their work by hand, shaping dough that has been fermenting overnight. The result is bread and pastries that carry the warmth of human touch and the depth of time-honored craft.
        </div>

        <div className="fade-in" style={{
          textAlign: 'center',
          fontSize: '1.3rem',
          color: '#f2c55c',
          fontStyle: 'italic',
          letterSpacing: '0.03em',
          marginTop: '4rem'
        }}>
          "Baking is an act of patience and presence"
        </div>
      </main>
    </>
  );

  const VisitPage = () => (
    <>
      <Navigation />
      <main style={{
        flex: 1,
        padding: '4rem 5% 8rem',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%'
      }}>
        <h1 className="fade-in" style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 300,
          letterSpacing: '0.05em',
          color: '#f2c55c',
          marginBottom: '4rem',
          textAlign: 'center'
        }}>
          Visit Us
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '4rem'
        }}>
          <div className="fade-in">
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <MapPin size={24} style={{ color: '#f2c55c', marginTop: '0.2rem', flexShrink: 0 }} />
              <div>
                <h3 style={{
                  fontSize: '1.2rem',
                  color: '#e8d4a8',
                  letterSpacing: '0.08em',
                  fontWeight: 400,
                  marginBottom: '0.5rem'
                }}>
                  Location
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#a89268',
                  lineHeight: 1.6,
                  letterSpacing: '0.02em'
                }}>
                  458 Elm Street<br />
                  Downtown District<br />
                  Portland, OR 97214
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <Clock size={24} style={{ color: '#f2c55c', marginTop: '0.2rem', flexShrink: 0 }} />
              <div>
                <h3 style={{
                  fontSize: '1.2rem',
                  color: '#e8d4a8',
                  letterSpacing: '0.08em',
                  fontWeight: 400,
                  marginBottom: '0.5rem'
                }}>
                  Hours
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#a89268',
                  lineHeight: 1.6,
                  letterSpacing: '0.02em'
                }}>
                  Tuesday – Friday: 7am – 6pm<br />
                  Saturday – Sunday: 8am – 4pm<br />
                  Monday: Closed
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <Phone size={24} style={{ color: '#f2c55c', marginTop: '0.2rem', flexShrink: 0 }} />
              <div>
                <h3 style={{
                  fontSize: '1.2rem',
                  color: '#e8d4a8',
                  letterSpacing: '0.08em',
                  fontWeight: 400,
                  marginBottom: '0.5rem'
                }}>
                  Contact
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#a89268',
                  lineHeight: 1.6,
                  letterSpacing: '0.02em'
                }}>
                  (503) 555-MOON<br />
                  hello@yellowmoonbakery.com
                </p>
              </div>
            </div>
          </div>

          <div className="fade-in">
            <h3 style={{
              fontSize: '1.2rem',
              color: '#e8d4a8',
              letterSpacing: '0.08em',
              fontWeight: 400,
              marginBottom: '1.5rem'
            }}>
              What to Know
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              fontSize: '1rem',
              color: '#a89268',
              lineHeight: 2,
              letterSpacing: '0.02em'
            }}>
              <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: '#f2c55c' }}>•</span>
                Our most popular items sell out by mid-morning on weekends
              </li>
              <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: '#f2c55c' }}>•</span>
                Limited seating available, perfect for a quiet morning
              </li>
              <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: '#f2c55c' }}>•</span>
                We accept cash, cards, and digital payments
              </li>
              <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: '#f2c55c' }}>•</span>
                Special orders available with 48 hours notice
              </li>
              <li style={{ paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: '#f2c55c' }}>•</span>
                Street parking and bike racks available
              </li>
            </ul>
          </div>
        </div>

        <div className="fade-in" style={{
          marginTop: '4rem',
          padding: '2.5rem',
          background: 'rgba(242, 197, 92, 0.05)',
          border: '1px solid rgba(242, 197, 92, 0.2)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '1.1rem',
            color: '#d4b88a',
            lineHeight: 1.8,
            letterSpacing: '0.02em'
          }}>
            We're located in the heart of the downtown arts district, surrounded by independent galleries and vintage shops. Come early for the freshest selection, stay for the neighborhood charm.
          </p>
        </div>
      </main>
    </>
  );

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      minHeight: '100vh', 
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />

      {!webglSupported && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #0f0a06 0%, #1a120a 50%, #0f0a06 100%)',
          zIndex: 0
        }} />
      )}

      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'menu' && <MenuPage />}
        {currentPage === 'story' && <StoryPage />}
        {currentPage === 'visit' && <VisitPage />}
      </div>
    </div>
  );
};

export default YellowMoonBakery;