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

// GitHub Fetch
async function fetchGitHub() {
    const grid = document.getElementById('projects-grid');
    try {
        const res = await fetch('https://api.github.com/users/DOMBNC/repos?sort=updated&per_page=6');
        const repos = await res.json();
        grid.innerHTML = repos.map(repo => `
            <div class="project-card neon-panel bg-black/70 p-6 rounded-3xl flex flex-col h-full cursor-pointer" onclick="window.open('${repo.html_url}')">
                <div class="font-bold text-2xl mb-2">${repo.name}</div>
                <p class="text-[#00ff9f]/70 text-sm flex-1">${repo.description || 'No description'}</p>
                <div class="mt-4 text-xs text-[#00eaff]">${repo.language || 'Code'}</div>
            </div>
        `).join('');
    } catch { grid.innerHTML = '<p class="col-span-full">Offline Mode Active</p>'; }
}

// Terminal Logic
function openTerminal() { document.getElementById('terminal-modal').style.display = 'flex'; document.getElementById('terminal-input').focus(); }
function closeTerminal() { document.getElementById('terminal-modal').style.display = 'none'; }
function handleTerminalCommand() {
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');
    const cmd = input.value.toLowerCase();
    output.innerHTML += `<div>$ ${cmd}</div>`;
    if(cmd === 'help') output.innerHTML += `<div>Available: about, skills, clear</div>`;
    else if(cmd === 'clear') output.innerHTML = '';
    else output.innerHTML += `<div>Command not found.</div>`;
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
            document.getElementById('boot-screen').style.display = 'none';
            initMatrixRain();
            initThreeJS();
            startTyping();
            fetchGitHub();
        }
        bar.style.width = progress + '%';
    }, 100);
};