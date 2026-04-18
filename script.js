// ====================== CONFIG & GLOBALS ======================
let scene, camera, renderer
let particlesMesh, linesMesh
let particlePositions, particleVelocities
let mouse = { x: 0, y: 0 }
const PARTICLE_COUNT = 220         // Optimized for performance
const CONNECTION_DISTANCE = 180

// Tailwind initialization
function initTailwind() {
    return {
        config(userConfig = {}) {
            return {
                content: [],
                theme: {
                    extend: {},
                },
                ...userConfig,
            }
        },
        theme: {
            extend: {},
        },
    }
}

// ====================== MATRIX RAIN (2D Canvas) ======================
function initMatrixRain() {
    const canvas = document.getElementById('matrix')
    const ctx = canvas.getContext('2d')
    
    function resizeCanvas() {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    const chars = '01アイウエオカキクケコ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const fontSize = 14
    let columns = canvas.width / fontSize
    let drops = []
    
    // Initialize drops
    function initDrops() {
        drops = []
        for (let x = 0; x < columns; x++) {
            drops[x] = Math.random() * canvas.height / fontSize
        }
    }
    initDrops()
    
    function drawMatrix() {
        ctx.fillStyle = 'rgba(5, 5, 5, 0.1)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = '#00ff9f'
        ctx.font = `${fontSize}px VT323`
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)]
            ctx.fillText(text, i * fontSize, drops[i] * fontSize)
            
            // Reset drop when it reaches bottom
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0
            }
            drops[i]++
        }
    }
    
    function matrixLoop() {
        drawMatrix()
        requestAnimationFrame(matrixLoop)
    }
    
    matrixLoop()
    
    return { resizeCanvas, initDrops }
}

// ====================== THREE.JS 3D PARTICLE NETWORK ======================
function initThreeJS() {
    const canvas = document.getElementById('three')
    
    // Scene setup
    scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x050505, 800, 2200)
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000)
    camera.position.z = 1100
    
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Particles
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    particleVelocities = new Float32Array(PARTICLE_COUNT * 3)
    
    for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
        // Spread in 3D space
        positions[i]     = (Math.random() - 0.5) * 1800
        positions[i + 1] = (Math.random() - 0.5) * 1800
        positions[i + 2] = (Math.random() - 0.5) * 1800
        
        // Neon green + slight cyan variation
        colors[i]     = 0.0
        colors[i + 1] = 1.0
        colors[i + 2] = 0.6 + Math.random() * 0.4
        
        // Small random velocity
        particleVelocities[i]     = (Math.random() - 0.5) * 1.2
        particleVelocities[i + 1] = (Math.random() - 0.5) * 1.2
        particleVelocities[i + 2] = (Math.random() - 0.5) * 1.2
    }
    
    particlePositions = positions
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const material = new THREE.PointsMaterial({
        size: 7,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    })
    
    particlesMesh = new THREE.Points(geometry, material)
    scene.add(particlesMesh)
    
    // Connection lines
    const lineGeometry = new THREE.BufferGeometry()
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00eaff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    })
    linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(linesMesh)
    
    // Mouse interaction + subtle camera tilt
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
        
        // Gentle camera tilt
        camera.position.x = mouse.x * 120
        camera.position.y = mouse.y * 90
        camera.lookAt(0, 0, 0)
    })
    
    // Resize handler
    function resizeThree() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', resizeThree)
    
    // Animation loop
    function animateThree() {
        requestAnimationFrame(animateThree)
        
        // Update particle positions
        const positionsAttr = particlesMesh.geometry.attributes.position
        
        for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
            // Gentle movement + mouse influence
            particlePositions[i]     += particleVelocities[i] + mouse.x * 0.8
            particlePositions[i + 1] += particleVelocities[i + 1] + mouse.y * 0.8
            particlePositions[i + 2] += particleVelocities[i + 2]
            
            // Wrap around space (infinite feel)
            if (Math.abs(particlePositions[i]) > 900) particleVelocities[i] *= -1
            if (Math.abs(particlePositions[i + 1]) > 900) particleVelocities[i + 1] *= -1
            if (Math.abs(particlePositions[i + 2]) > 900) particleVelocities[i + 2] *= -1
        }
        
        positionsAttr.needsUpdate = true
        
        // Dynamic connections
        const linePositions = []
        const posArray = positionsAttr.array
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = posArray[i * 3] - posArray[j * 3]
                const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1]
                const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2]
                
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
                
                if (distance < CONNECTION_DISTANCE) {
                    linePositions.push(
                        posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2],
                        posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2]
                    )
                }
            }
        }
        
        linesMesh.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(linePositions), 3)
        )
        
        renderer.render(scene, camera)
    }
    
    animateThree()
    
    console.log('%c✅ Three.js particle network initialized (220 nodes)', 'color:#00ff9f; font-family:monospace')
}

// ====================== GITHUB PROJECTS FETCH ======================
async function fetchGitHubProjects() {
    const container = document.getElementById('projects-grid')
    container.innerHTML = `<div class="col-span-full text-center py-12 text-[#00eaff]">FETCHING FROM GITHUB...</div>`
    
    try {
        const res = await fetch('https://api.github.com/users/DOMBNC/repos?sort=updated&per_page=9')
        
        if (!res.ok) throw new Error('GitHub API rate limit or user not found')
        
        const repos = await res.json()
        
        container.innerHTML = ''
        
        if (repos.length === 0) {
            throw new Error('No public repositories found')
        }
        
        repos.forEach(repo => {
            const cardHTML = `
            <div onclick="window.open('${repo.html_url}', '_blank')" 
                 class="project-card neon-panel bg-black/70 p-6 cursor-pointer rounded-3xl flex flex-col h-full">
                <div class="flex justify-between items-start mb-4">
                    <div class="font-bold text-2xl">${repo.name}</div>
                    ${repo.stargazers_count > 0 ? `<div class="flex items-center text-[#00eaff]"><span class="text-xl">★</span><span class="ml-1">${repo.stargazers_count}</span></div>` : ''}
                </div>
                <p class="flex-1 text-[#00ff9f]/70 text-base line-clamp-3">${repo.description || 'No description provided.'}</p>
                <div class="mt-6 flex justify-between items-center text-xs">
                    <div class="flex items-center">
                        ${repo.language ? `<span class="px-3 py-1 bg-[#00eaff]/10 text-[#00eaff] rounded-2xl">${repo.language}</span>` : ''}
                    </div>
                    <div class="text-[#00ff9f]/50">${new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                </div>
            </div>`
            container.innerHTML += cardHTML
        })
    } catch (err) {
        console.error(err)
        container.innerHTML = `
        <div class="col-span-full neon-panel p-8 text-center">
            <div class="text-3xl mb-3">⚠️</div>
            <p>Could not fetch live GitHub repos.<br>Showing placeholder projects.</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div class="project-card neon-panel p-6">RECON-PIPELINE (Private)</div>
                <div class="project-card neon-panel p-6">ZERO-DAY-BURP (Public)</div>
                <div class="project-card neon-panel p-6">SHADOW-OSINT (Public)</div>
            </div>
        </div>`
    }
}

// ====================== TYPING ANIMATION ======================
function startTypingAnimation() {
    const phrases = [
        "Initializing system...",
        "Loading exploit database...",
        "Connecting to shadow net...",
        "Recon pipeline active...",
        "DOMBNC online."
    ]
    let index = 0
    const el = document.getElementById('typing')
    
    function typeNext() {
        el.innerHTML = ''
        let i = 0
        const phrase = phrases[index]
        
        function typeChar() {
            if (i < phrase.length) {
                el.innerHTML += phrase.charAt(i)
                i++
                setTimeout(typeChar, 45)
            } else {
                setTimeout(() => {
                    index = (index + 1) % phrases.length
                    typeNext()
                }, 1800)
            }
        }
        typeChar()
    }
    typeNext()
}

// ====================== TERMINAL ======================
function openTerminal() {
    const modal = document.getElementById('terminal-modal')
    modal.classList.remove('hidden')
    modal.classList.add('flex')
    
    // Welcome message
    const output = document.getElementById('terminal-output')
    output.innerHTML = `
    <div class="text-[#00eaff]">Welcome to DOMBNC Secure Terminal v4.2.1</div>
    <div class="text-[#00ff9f]/60">Type <span class="text-[#00eaff]">help</span> for available commands.</div><br>`
    
    document.getElementById('terminal-input').focus()
}

function closeTerminal() {
    const modal = document.getElementById('terminal-modal')
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    document.getElementById('terminal-output').innerHTML = ''
}

// SỬA LỖI TẠI ĐÂY: Áp dụng switch/case giúp terminal hiểu nhiều lệnh
function handleTerminalCommand() {
    const input = document.getElementById('terminal-input')
    const cmdRaw = input.value.trim()
    const cmd = cmdRaw.toLowerCase()
    
    if (!cmd) return
    
    const output = document.getElementById('terminal-output')
    
    // Mã hóa (Sanitize) đầu vào của người dùng để chống lỗi HTML (XSS/Phá vỡ giao diện)
    const safeCmd = cmdRaw.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    
    // In lệnh người dùng đã nhập ra màn hình
    output.innerHTML += `<div class="text-[#00ff9f]">$ ${safeCmd}</div>`
    
    // Xử lý logic câu lệnh
    let response = ''
    
    switch (cmd) {
        case 'help':
            response = `Available commands:<br>
            • about — my story<br>
            • skills — full skill matrix<br>
            • projects — latest work<br>
            • contact — reach me<br>
            • clear — wipe terminal<br>
            • whoami — current user`
            break
            
        case 'about':
            response = `I am DOMBNC.<br>Full-time bug bounty hunter &amp; red team operator.<br>Specializing in breaking the unbreakable.`
            break
            
        case 'skills':
            response = `WEB • RECON • EXPLOIT • AUTOMATION<br>Python • Go • Rust • Burp • Nuclei • Custom tooling`
            break
            
        case 'projects':
            response = `Live projects are displayed on the main dashboard.<br>Check the Projects section or my GitHub.`
            fetchGitHubProjects() // Gọi hàm refresh dự án
            break
            
        case 'contact':
            response = `Email: huytrinh870@gmail.com<br>Facebook: <a href="https://www.facebook.com/HuyPK1134" target="_blank" class="underline text-[#00eaff]">Huy Trinh</a><br>Always open for interesting collaborations.`
            break
            
        case 'whoami':
            response = `You are inside the mind of a pentester.`
            break
            
        case 'clear':
            output.innerHTML = ''
            input.value = ''
            return
            
        default:
            response = `Command not found: ${safeCmd}<br>Type <span class="text-[#00eaff]">help</span>`
    }
    
    // Tạo container để chứa câu trả lời
    output.innerHTML += `<div class="text-[#00eaff]/80 mt-1"></div>`
    const responseContainer = output.lastElementChild
    
    // Hiệu ứng Typewriter thông minh (Bỏ qua việc gõ từng chữ đối với thẻ HTML)
    let i = 0
    function typeResponse() {
        if (i < response.length) {
            // Nếu gặp dấu '<', tức là bắt đầu một thẻ HTML
            if (response.charAt(i) === '<') {
                let tag = ''
                // Gom toàn bộ ký tự cho đến khi gặp dấu '>'
                while (response.charAt(i) !== '>' && i < response.length) {
                    tag += response.charAt(i)
                    i++
                }
                tag += '>' // Thêm dấu '>' cuối cùng vào
                responseContainer.innerHTML += tag // In toàn bộ thẻ HTML ra cùng 1 lúc
                i++
            } else {
                // Nếu là ký tự bình thường, in từng chữ
                responseContainer.innerHTML += response.charAt(i)
                i++
            }
            
            setTimeout(typeResponse, 12)
        } else {
            // Hoàn thành việc in
            output.innerHTML += `<br>`
            output.scrollTop = output.scrollHeight
            input.value = ''
        }
    }
    
    typeResponse()
}

// ====================== BOOT SEQUENCE ======================
function bootSequence() {
    const progressBar = document.getElementById('boot-progress')
    let progress = 0
    
    const interval = setInterval(() => {
        progress += Math.random() * 18
        if (progress >= 100) progress = 100
        progressBar.style.width = `${progress}%`
        
        if (progress >= 100) {
            clearInterval(interval)
            setTimeout(() => {
                document.getElementById('boot-screen').style.opacity = '0'
                setTimeout(() => {
                    document.getElementById('boot-screen').style.display = 'none'
                    // Start all systems
                    console.log('%c🚀 DOMBNC Portfolio fully booted', 'color:#00ff9f; font-size:18px')
                }, 600)
            }, 400)
        }
    }, 42)
}

// ====================== MAIN INITIALIZATION ======================
function initializePortfolio() {
    // Tailwind
    initTailwind()
    
    // Canvases
    initMatrixRain()
    initThreeJS()
    
    // Boot animation
    bootSequence()
    
    // Typing
    startTypingAnimation()
    
    // Fetch live GitHub projects
    fetchGitHubProjects()
    
    // Fake scanning bar animation in status panel
    let scan = 42
    setInterval(() => {
        scan = (scan + Math.floor(Math.random() * 7) + 1) % 100
        const bar = document.getElementById('scan-bar')
        const percent = document.getElementById('scan-percent')
        if (bar) bar.style.width = `${scan}%`
        if (percent) percent.textContent = `${scan}%`
    }, 2100)
    
    console.log('%c✅ Advanced 3D Cybersecurity Portfolio ready', 'background:#00ff9f;color:#050505;padding:1px 4px;font-size:13px')
}

// Launch everything
window.onload = initializePortfolio
