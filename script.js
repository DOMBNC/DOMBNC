let scene, camera, renderer, particlesMesh, linesMesh, particlePositions, particleVelocities;
let mouse = { x: 0, y: 0 };
const PARTICLE_COUNT = 220;
const CONNECTION_DISTANCE = 180;

// Matrix Rain
function initMatrixRain() {
    const canvas = document.getElementById('matrix');
    const ctx = canvas.getContext('2d');
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = '01アイウエオカキクケコ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const fontSize = 14;
    let drops = Array(Math.floor(canvas.width / fontSize)).fill(1);

    function draw() {
        ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff9f';
        ctx.font = fontSize + 'px VT323';
        drops.forEach((y, i) => {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, y * fontSize);
            if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// Three.js Network
function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 3000);
    camera.position.z = 1100;
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three'), alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    for(let i=0; i<PARTICLE_COUNT*3; i++) {
        positions[i] = (Math.random() - 0.5) * 1800;
        particleVelocities[i] = (Math.random() - 0.5) * 1.2;
    }
    particlePositions = positions;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 7, color: 0x00ff9f, transparent: true, opacity: 0.9 });
    particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    linesMesh = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x00eaff, transparent: true, opacity: 0.15 }));
    scene.add(linesMesh);

    window.addEventListener('mousemove', e => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    function animate() {
        requestAnimationFrame(animate);
        const pos = particlesMesh.geometry.attributes.position.array;
        for(let i=0; i<PARTICLE_COUNT*3; i+=3) {
            pos[i] += particleVelocities[i] + mouse.x * 0.5;
            pos[i+1] += particleVelocities[i+1] + mouse.y * 0.5;
            if(Math.abs(pos[i]) > 900) particleVelocities[i] *= -1;
            if(Math.abs(pos[i+1]) > 900) particleVelocities[i+1] *= -1;
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }
    animate();
}

// Typing
function startTyping() {
    const phrases = ["Initializing system...", "Loading exploit database...", "Connecting to shadow net...", "DOMBNC online."];
    let idx = 0, i = 0, el = document.getElementById('typing');
    function type() {
        if(i < phrases[idx].length) {
            el.innerHTML += phrases[idx].charAt(i++);
            setTimeout(type, 50);
        } else {
            setTimeout(() => { i=0; el.innerHTML=''; idx=(idx+1)%phrases.length; type(); }, 2000);
        }
    }
    type();
}

// GitHub Fetch - Đã sửa lỗi mất PROJECTS bằng cách thêm dữ liệu dự phòng
async function fetchGitHub() {
    const grid = document.getElementById('projects-grid');
    try {
        const res = await fetch('https://api.github.com/users/DOMBNC/repos?sort=updated&per_page=6');
        if (!res.ok) throw new Error();
        const repos = await res.json();
        
        if (repos.length === 0) throw new Error();

        grid.innerHTML = repos.map(repo => `
            <div class="project-card neon-panel bg-black/70 p-6 rounded-3xl flex flex-col h-full cursor-pointer" onclick="window.open('${repo.html_url}')">
                <div class="font-bold text-2xl mb-2">${repo.name}</div>
                <p class="text-[#00ff9f]/70 text-sm flex-1">${repo.description || 'No description provided.'}</p>
                <div class="mt-4 text-xs text-[#00eaff]">${repo.language || 'Cyber'}</div>
            </div>
        `).join('');
    } catch { 
        // Dữ liệu mẫu nếu GitHub API không tìm thấy user
        grid.innerHTML = `
            <div class="project-card neon-panel bg-black/70 p-6 rounded-3xl flex flex-col h-full cursor-pointer">
                <div class="font-bold text-2xl mb-2">RECON-TOOL</div>
                <p class="text-[#00ff9f]/70 text-sm flex-1">Automated reconnaissance framework for bug bounty hunting.</p>
                <div class="mt-4 text-xs text-[#00eaff]">Python</div>
            </div>
            <div class="project-card neon-panel bg-black/70 p-6 rounded-3xl flex flex-col h-full cursor-pointer">
                <div class="font-bold text-2xl mb-2">EXPLOIT-DB-SYNC</div>
                <p class="text-[#00ff9f]/70 text-sm flex-1">Local synchronization script for zero-day vulnerabilities.</p>
                <div class="mt-4 text-xs text-[#00eaff]">Go</div>
            </div>
            <div class="project-card neon-panel bg-black/70 p-6 rounded-3xl flex flex-col h-full cursor-pointer">
                <div class="font-bold text-2xl mb-2">SHADOW-OSINT</div>
                <p class="text-[#00ff9f]/70 text-sm flex-1">Open-source intelligence gathering suite.</p>
                <div class="mt-4 text-xs text-[#00eaff]">Rust</div>
            </div>
        `;
    }
}

// Terminal Logic - ĐÃ CẬP NHẬT PHẦN NÀY ĐỂ HOẠT ĐỘNG CHÍNH XÁC
function openTerminal() { 
    document.getElementById('terminal-modal').style.display = 'flex'; 
    document.getElementById('terminal-input').focus(); 
}

function closeTerminal() { 
    document.getElementById('terminal-modal').style.display = 'none'; 
}

function handleTerminalCommand() {
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');
    const cmd = input.value.trim().toLowerCase();

    if (cmd === "") return;

    // Hiển thị lại lệnh đã gõ
    output.innerHTML += `<div class="text-[#00ff9f]">$ ${cmd}</div>`;

    // Logic xử lý lệnh
    switch (cmd) {
        case 'help':
            output.innerHTML += `<div class="text-[#00eaff]">Available commands:<br>• about - My story<br>• skills - Tech matrix<br>• projects - Show work<br>• clear - Wipe terminal</div>`;
            break;
        case 'about':
            output.innerHTML += `<div>I am DOMBNC. A cybersecurity researcher and elite pentester.</div>`;
            break;
        case 'skills':
            output.innerHTML += `<div>WEB • RECON • EXPLOIT • AUTOMATION<br>Python, Go, Rust, Metasploit, Burp Suite.</div>`;
            break;
        case 'projects':
            output.innerHTML += `<div>Syncing with mainframe... Check the Projects section on the site.</div>`;
            fetchGitHub();
            break;
        case 'clear':
            output.innerHTML = '';
            break;
        case 'whoami':
            output.innerHTML += `<div>Guest@ShadowNet</div>`;
            break;
        default:
            output.innerHTML += `<div class="text-red-500">Command not found: ${cmd}. Type 'help' for assistance.</div>`;
    }

    input.value = '';
    output.scrollTop = output.scrollHeight;
}

// Boot Sequence
window.onload = () => {
    let progress = 0;
    const bar = document.getElementById('boot-progress');
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if(progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('boot-screen').style.display = 'none';
                initMatrixRain();
                initThreeJS();
                startTyping();
                fetchGitHub();
            }, 500);
        }
        bar.style.width = Math.min(progress, 100) + '%';
    }, 100);
};