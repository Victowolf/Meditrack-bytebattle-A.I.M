window.onload = async () => {
    console.log("Admin dashboard loaded!");
    loadDoctors();
    loadPatients();
    loadAuditLogs();
    init3DBlockchainVisualization();
};

function loadDoctors() {
    const doctorList = document.getElementById("doctor-list");
    const doctors = ["Dr. Smith", "Dr. Johnson", "Nurse Williams", "Dr. Garcia"];
    
    if (doctorList) {
        doctorList.innerHTML = "";
        doctors.forEach(doctor => {
            const item = document.createElement("li");
            item.textContent = doctor;
            doctorList.appendChild(item);
        });
    }
}

function loadPatients() {
    const patientList = document.getElementById("patient-list");
    const patients = ["P. Wilson", "P. Davis", "P. Thompson", "P. Martinez"];
    
    if (patientList) {
        patientList.innerHTML = "";
        patients.forEach(patient => {
            const item = document.createElement("li");
            item.textContent = patient;
            patientList.appendChild(item);
        });
    }
}

function loadAuditLogs() {
    const logConsole = document.getElementById("log-console");
    if (logConsole) {
        const logs = [
            "[2025-05-15 09:45:23] INFO: System startup complete",
            "[2025-05-15 09:47:12] WARN: Failed authentication attempt from 192.168.1.45",
            "[2025-05-15 09:52:01] INFO: Dr. Smith accessed patient record #1278",
            "[2025-05-15 10:01:34] INFO: New block added to blockchain (height: 24601)"
        ];
        logConsole.innerHTML = logs.join("<br>");
    }
}

function addLogEntry(message) {
    const logConsole = document.getElementById("log-console");
    if (logConsole) {
        const timestamp = new Date().toLocaleTimeString();
        logConsole.innerHTML = `[${timestamp}] ${message}<br>${logConsole.innerHTML}`;
    }
}

// ===== Blockchain Visualization Logic =====

async function init3DBlockchainVisualization() {
    const canvas = document.getElementById("block-canvas");

    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }

    addLogEntry("INFO: Initializing blockchain visualization");
    await new Promise(requestAnimationFrame);

    const width = canvas.clientWidth || 600;
    const height = canvas.clientHeight || 300;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 10, 7);
    scene.add(light);

    const grid = new THREE.GridHelper(40, 10, 0x555555, 0x333333);
    scene.add(grid);

    let cubes = [];

    try {
        cubes = await createBlockchainCubes(scene);
        addLogEntry("INFO: Blockchain blocks rendered");

        canvas.addEventListener("click", (e) => onCanvasClick(e, camera, scene, cubes));

    } catch (err) {
        console.error("❌ Blockchain fetch error:", err);
        addLogEntry("ERROR: Not able to fetch");

        const errorSprite = createTextSprite("Not able to fetch");
        errorSprite.position.set(0, 0, 0);
        scene.add(errorSprite);
    }

    function animate() {
        requestAnimationFrame(animate);
        cubes.forEach(c => c.rotation.y += c.userData.rotationSpeed || 0.005);
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
        const newW = canvas.clientWidth || 600;
        const newH = canvas.clientHeight || 300;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
    });
}

async function createBlockchainCubes(scene) {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    const latestBlock = await provider.getBlockNumber();
    const count = 15;

    const spacing = 3;
    const blockColor = 0xf5a623;
    const cubes = [];
    const positions = new Map();
    const blockMap = new Map();

    for (let i = 0; i < count; i++) {
        const blockNum = latestBlock - i;
        const block = await provider.getBlock(blockNum, true); // include transactions
        blockMap.set(block.hash, block);
    }

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

    [...blockMap.values()].forEach((block, index) => {
        const material = new THREE.MeshStandardMaterial({ color: blockColor });
        const cube = new THREE.Mesh(geometry, material);

        const x = index * spacing - (count * spacing) / 2;
        cube.position.set(x, 0, 0);
        cube.userData = {
            blockNumber: block.number,
            hash: block.hash,
            parentHash: block.parentHash,
            txCount: block.transactions.length,
            rotationSpeed: 0.005
        };

        scene.add(cube);
        cubes.push(cube);
        positions.set(block.hash, cube.position);
    });

    // Connect each cube to its parent
    cubes.forEach(cube => {
        const from = cube.position;
        const to = positions.get(cube.userData.parentHash);
        if (to) {
            const points = [from.clone(), to.clone()];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
        }
    });

    return cubes;
}

function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = '28px sans-serif';
    ctx.fillText(message, 50, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(15, 4, 1);

    return sprite;
}

// ===== Mouse Interaction for Block Popup =====

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Create popup element
const popup = document.createElement('div');
popup.id = 'block-popup';
popup.style.position = 'absolute';
popup.style.background = '#fff';
popup.style.border = '1px solid #ccc';
popup.style.borderRadius = '8px';
popup.style.padding = '10px';
popup.style.fontSize = '12px';
popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
popup.style.display = 'none';
popup.style.zIndex = '10';
popup.style.pointerEvents = 'none';
document.body.appendChild(popup);

function onCanvasClick(event, camera, scene, cubes) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        const cube = intersects[0].object;
        const data = cube.userData;

        popup.innerHTML = `
            <strong>Block #${data.blockNumber}</strong><br>
            <b>Hash:</b> ${data.hash.slice(0, 10)}...<br>
            <b>Parent:</b> ${data.parentHash.slice(0, 10)}...<br>
            <b>Transactions:</b> ${data.txCount}
        `;
        popup.style.left = `${event.clientX + 10}px`;
        popup.style.top = `${event.clientY + 10}px`;
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
    }
}