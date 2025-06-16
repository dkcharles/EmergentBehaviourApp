// MathJax configuration for inline and display math
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  }
};

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('simulation-canvas');
    const ctx = canvas.getContext('2d');

    let simState = {
        isRunning: false, animationFrameId: null, currentSim: 'gameOfLife',
        grid: [], agents: [], cells: [], boids: [], terrainPoints: [],
        width: 800, height: 600, cols: 0, rows: 0, frameCount: 0,
        gameOfLife: { resolution: 10, initialDensity: 0.2, speed: 5, maxCells: 20000, },
        slimeMould: { resolution: 10, agentCount: 1500, sensorDist: 15, sensorAngle: 0.5, turnSpeed: 0.2, decayRate: 0.98, },
        mitosis: { initialCellCount: 1, growthRate: 0.1, splitRadius: 25, splitJitter: 15, maxCells: 750, },
        flocking: { 
            boidCount: 150, alignmentForce: 0.5, cohesionForce: 0.3, separationForce: 0.8, 
            perceptionRadius: 50, leaderFollowForce: 0.2 
        },
        caveGen: { resolution: 8, fillPercentage: 45, smoothingSteps: 5 },
        fractalLandscape: { detailLevel: 7, roughness: 0.6, waterLevel: 0.4, speed: 5, step: 0, range: 0 },
        perlinLandscape: { scale: 80, octaves: 4, persistence: 0.5, lacunarity: 2.0, seed: 1, speed: 5, currentX: 0 }
    };

    const parameterConfig = {
        gameOfLife: [
            { key: 'resolution', label: 'Cell Size', min: 2, max: 20, step: 1 },
            { key: 'initialDensity', label: 'Initial Density', min: 0.1, max: 0.9, step: 0.05 },
            { key: 'speed', label: 'Speed', min: 1, max: 10, step: 1 },
            { key: 'maxCells', label: 'Max Cells', min: 5000, max: 50000, step: 1000 }
        ],
        slimeMould: [
            { key: 'resolution', label: 'Grid Size', min: 2, max: 20, step: 1 },
            { key: 'agentCount', label: 'Agent Count', min: 100, max: 4000, step: 100 },
            { key: 'sensorDist', label: 'Sensor Distance', min: 5, max: 50, step: 1 },
            { key: 'sensorAngle', label: 'Sensor Angle', min: 0.1, max: 1.5, step: 0.01 },
            { key: 'turnSpeed', label: 'Turn Speed', min: 0.05, max: 0.5, step: 0.01 },
            { key: 'decayRate', label: 'Decay Rate', min: 0.8, max: 0.99, step: 0.005 }
        ],
        mitosis: [
            { key: 'initialCellCount', label: 'Initial Cells', min: 1, max: 10, step: 1 },
            { key: 'growthRate', label: 'Growth Rate', min: 0.05, max: 0.5, step: 0.01 },
            { key: 'splitRadius', label: 'Split Radius', min: 10, max: 50, step: 1 },
            { key: 'splitJitter', label: 'Size Jitter', min: 0, max: 25, step: 1 },
            { key: 'maxCells', label: 'Max Cells', min: 100, max: 1500, step: 50 }
        ],
        flocking: [
            { key: 'boidCount', label: 'Boid Count', min: 10, max: 500, step: 10 },
            { key: 'alignmentForce', label: 'Alignment', min: 0, max: 2, step: 0.1 },
            { key: 'cohesionForce', label: 'Cohesion', min: 0, max: 2, step: 0.1 },
            { key: 'separationForce', label: 'Separation', min: 0, max: 2, step: 0.1 },
            { key: 'perceptionRadius', label: 'Perception', min: 10, max: 200, step: 5 },
            { key: 'leaderFollowForce', label: 'Follow Leader', min: 0, max: 1, step: 0.05 },
        ],
        caveGen: [
             { key: 'resolution', label: 'Cell Size', min: 4, max: 20, step: 1 },
             { key: 'fillPercentage', label: 'Initial Fill %', min: 30, max: 70, step: 1 },
             { key: 'smoothingSteps', label: 'Smoothing Steps', min: 1, max: 10, step: 1 },
        ],
        fractalLandscape: [
             { key: 'detailLevel', label: 'Detail Level (n)', min: 5, max: 9, step: 1 },
             { key: 'roughness', label: 'Roughness', min: 0.1, max: 1.0, step: 0.05 },
             { key: 'waterLevel', label: 'Water Level', min: 0.1, max: 0.9, step: 0.05 },
             { key: 'speed', label: 'Generation Speed', min: 1, max: 10, step: 1 },
        ],
        perlinLandscape: [
            { key: 'scale', label: 'Scale', min: 10, max: 200, step: 5 },
            { key: 'octaves', label: 'Octaves', min: 1, max: 8, step: 1 },
            { key: 'persistence', label: 'Persistence', min: 0.1, max: 1.0, step: 0.05 },
            { key: 'lacunarity', label: 'Lacunarity', min: 1.5, max: 4.0, step: 0.1 },
            { key: 'seed', label: 'Seed', min: 1, max: 1000, step: 1 },
            { key: 'speed', label: 'Generation Speed', min: 1, max: 10, step: 1 },
        ]
    };

    const simSelect = document.getElementById('sim-select');
    const startPauseBtn = document.getElementById('start-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const explainBtn = document.getElementById('explain-btn');
    const statusDisplay = document.getElementById('status-display');
    const paramsContainer = document.getElementById('params-container');
    const modal = document.getElementById('explanation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSpinner = document.getElementById('modal-spinner');
    const modalText = document.getElementById('modal-text');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    window.addEventListener('resize', resizeCanvas);
    simSelect.addEventListener('change', switchSimulation);
    startPauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', () => resetSimulation(true));
    explainBtn.addEventListener('click', handleExplainClick);
    modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    setup();
    
    function setup() {
        renderParameterControls();
        resizeCanvas();
    }
    
    function renderParameterControls() {
        paramsContainer.innerHTML = '';
        const currentParamsConfig = parameterConfig[simState.currentSim];
        if (!currentParamsConfig) return;
        const gridClass = currentParamsConfig.length > 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex flex-col gap-4';
        paramsContainer.className = `params-panel p-4 rounded-lg shadow-lg mb-4 ${gridClass}`;
        currentParamsConfig.forEach(param => {
            const paramWrapper = document.createElement('div');
            const label = document.createElement('label');
            label.htmlFor = `param-${param.key}`;
            label.className = "flex justify-between text-sm font-medium text-white mb-1";
            const labelText = document.createElement('span');
            labelText.textContent = param.label;
            const valueDisplay = document.createElement('span');
            valueDisplay.id = `value-${param.key}`;
            let displayValue = simState[simState.currentSim][param.key];
            valueDisplay.textContent = Number.isInteger(displayValue) && displayValue > 1000 ? displayValue.toLocaleString() : displayValue;
            label.appendChild(labelText);
            label.appendChild(valueDisplay);
            const slider = document.createElement('input');
            slider.type = 'range'; slider.id = `param-${param.key}`;
            slider.min = param.min; slider.max = param.max; slider.step = param.step;
            slider.value = displayValue;
            slider.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                simState[simState.currentSim][param.key] = newValue;
                valueDisplay.textContent = Number.isInteger(newValue) && newValue > 1000 ? newValue.toLocaleString() : newValue;
            });
            slider.addEventListener('change', () => resetSimulation(true));
            paramWrapper.appendChild(label);
            paramWrapper.appendChild(slider);
            paramsContainer.appendChild(paramWrapper);
        });
    }

    function resizeCanvas() {
        const container = canvas.parentElement;
        simState.width = container.clientWidth;
        simState.height = Math.floor(simState.width * 0.75);
        canvas.width = simState.width; canvas.height = simState.height;
        resetSimulation(true);
    }

    function switchSimulation(event) {
        simState.currentSim = event.target.value;
        startPauseBtn.disabled = simState.currentSim === 'caveGen';
        pauseSimulation(); renderParameterControls(); resetSimulation(true);
    }

    function togglePause() {
        simState.isRunning = !simState.isRunning;
        if (simState.isRunning) startSimulation();
        else pauseSimulation();
    }
    
    function startSimulation() {
        if (simState.currentSim === 'fractalLandscape' && simState.fractalLandscape.step <= 1) {
            resetSimulation(true);
        }
         if (simState.currentSim === 'perlinLandscape' && simState.perlinLandscape.currentX >= simState.width) {
             resetSimulation(true);
        }
        simState.isRunning = true;
        startPauseBtn.textContent = 'Pause';
        animate();
    }

    function pauseSimulation() {
        simState.isRunning = false;
        startPauseBtn.textContent = 'Start';
        if (!statusDisplay.textContent.includes('limit')) {
             statusDisplay.textContent = `Status: Paused`;
        }
        if (simState.animationFrameId) cancelAnimationFrame(simState.animationFrameId);
    }

    function resetSimulation(reinitialize) {
        pauseSimulation();
        let res = simState[simState.currentSim]?.resolution || simState.gameOfLife.resolution;
        
        simState.cols = Math.floor(simState.width / res);
        simState.rows = Math.floor(simState.height / res);

        if (reinitialize) {
            switch (simState.currentSim) {
                case 'gameOfLife': initGameOfLife(); break;
                case 'slimeMould': initSlimeMould(); break;
                case 'mitosis': initMitosis(); break;
                case 'flocking': initFlocking(); break;
                case 'caveGen': initCaveGen(); break;
                case 'fractalLandscape': initFractalLandscape(); break;
                case 'perlinLandscape': initPerlinLandscape(); break;
            }
        } else {
             draw();
        }
        statusDisplay.textContent = `Status: Paused`;
    }

    function animate() {
        if (!simState.isRunning) return;
        simState.animationFrameId = requestAnimationFrame(animate);

        const speedControl = simState[simState.currentSim]?.speed;
        if (speedControl) {
             if (simState.currentSim !== 'perlinLandscape') { // Use frame skipping for most
                const framesToWait = Math.floor((11 - speedControl) * 6) + 1;
                simState.frameCount++;
                if (simState.frameCount < framesToWait) return;
                simState.frameCount = 0;
            }
        }

        update();
        draw();
    }

    function update() {
        switch (simState.currentSim) {
            case 'gameOfLife': updateGameOfLife(); break;
            case 'slimeMould': updateSlimeMould(); break;
            case 'mitosis': updateMitosis(); break;
            case 'flocking': updateFlocking(); break;
            case 'fractalLandscape': updateFractalLandscape(); break;
            case 'perlinLandscape': updatePerlinLandscape(); break;
        }
    }

    function draw() {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, simState.width, simState.height);

        switch (simState.currentSim) {
            case 'gameOfLife': drawGameOfLife(); break;
            case 'slimeMould': drawSlimeMould(); break;
            case 'mitosis': drawMitosis(); break;
            case 'flocking': drawFlocking(); break;
            case 'caveGen': drawCaveGen(); break;
            case 'fractalLandscape': drawFractalLandscape(); break;
            case 'perlinLandscape': drawPerlinLandscape(); break;
        }
        if (simState.isRunning) {
            statusDisplay.textContent = `Status: Running (${simState.currentSim})`;
        }
    }
    
    async function handleExplainClick() {
        const currentSimName = simSelect.options[simSelect.selectedIndex].text;
        const currentParams = simState[simState.currentSim];

        modalTitle.textContent = `Explanation for: ${currentSimName}`;
        modalText.innerHTML = '';
        modalSpinner.style.display = 'flex';
        modal.classList.remove('hidden');

        const paramDescription = Object.entries(currentParams)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n');

        const prompt = `
Provide a technical and detailed explanation for the following simulation. Output your response directly in simple HTML.

You are an expert in computational algorithms, explaining concepts to a university-level audience. Use UK English spellings (e.g., 'centre', 'colour', 'neighbour').

**Simulation Name:** ${currentSimName}

**Current Parameters:**
${paramDescription}

Structure the response with the following HTML tags:
- <h4> for headings.
- <p> for paragraphs.
- <pre><code> for pseudocode blocks.
- <ul> and <li> for bulleted lists.
- <strong> for emphasis.
- For all LaTeX mathematical expressions, wrap them in a <span> tag. Do not use Markdown. For example: <span>$E=mc^2$</span> or <span>$$\\sum_{i=0}^{n} i = \\frac{n(n+1)}{2}$$</span>
`;

            
        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiUrl = 'https://gkey.netlify.app/.netlify/functions/explain';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts[0].text) {
                 let htmlResponse = result.candidates[0].content.parts[0].text;
                 htmlResponse = htmlResponse.replace(/^```html\n/, '').replace(/\n```$/, '');
                 modalText.innerHTML = htmlResponse;
                 if (window.MathJax) {
                     window.MathJax.typesetPromise([modalText]);
                 }
            } else {
                modalText.innerHTML = "<p>Could not get an explanation. The response from the AI was empty.</p>";
            }

        } catch (error) {
            console.error("Error fetching explanation:", error);
            modalText.innerHTML = `<p>An error occurred while fetching the explanation.</p><pre>${error.message}</pre>`;
        } finally {
            modalSpinner.style.display = 'none';
        }
    }

    // --- Simulation Logic ---
    function initGameOfLife() { simState.grid = createGrid(simState.cols, simState.rows, () => (Math.random() < simState.gameOfLife.initialDensity ? 1 : 0)); draw(); }
    function updateGameOfLife() { const nextGenGrid = createGrid(simState.cols, simState.rows); let liveCellCount = 0; for (let col = 0; col < simState.cols; col++) { for (let row = 0; row < simState.rows; row++) { const cell = simState.grid[col][row]; const neighbours = countNeighbours(simState.grid, col, row); if (cell === 1 && (neighbours < 2 || neighbours > 3)) nextGenGrid[col][row] = 0; else if (cell === 0 && neighbours === 3) nextGenGrid[col][row] = 1; else nextGenGrid[col][row] = cell; if (nextGenGrid[col][row] === 1) liveCellCount++; } } if (liveCellCount > simState.gameOfLife.maxCells) { simState.grid = nextGenGrid; draw(); pauseSimulation(); statusDisplay.textContent = `Status: Paused - Cell limit (${simState.gameOfLife.maxCells.toLocaleString()}) reached.`; return; } simState.grid = nextGenGrid; }
    function drawGameOfLife() { const res = simState.gameOfLife.resolution; ctx.fillStyle = '#6366f1'; for (let col = 0; col < simState.cols; col++) { for (let row = 0; row < simState.rows; row++) { if (simState.grid[col] && simState.grid[col][row] === 1) { ctx.fillRect(col * res, row * res, res - 1, res - 1); } } } }
    function initSlimeMould() { simState.grid = createGrid(simState.cols, simState.rows, () => 0); simState.agents = []; for (let i = 0; i < simState.slimeMould.agentCount; i++) { simState.agents.push({ x: Math.random() * simState.width, y: Math.random() * simState.height, angle: Math.random() * 2 * Math.PI, }); } draw(); }
    function updateSlimeMould() { const { sensorAngle, sensorDist, turnSpeed, decayRate } = simState.slimeMould; simState.agents.forEach(agent => { const val_f = getTrailValue(agent.x + Math.cos(agent.angle) * sensorDist, agent.y + Math.sin(agent.angle) * sensorDist); const val_l = getTrailValue(agent.x + Math.cos(agent.angle - sensorAngle) * sensorDist, agent.y + Math.sin(agent.angle - sensorAngle) * sensorDist); const val_r = getTrailValue(agent.x + Math.cos(agent.angle + sensorAngle) * sensorDist, agent.y + Math.sin(agent.angle + sensorAngle) * sensorDist); if (val_f > val_l && val_f > val_r) {} else if (val_l > val_r) agent.angle -= turnSpeed; else if (val_r > val_l) agent.angle += turnSpeed; agent.x += Math.cos(agent.angle); agent.y += Math.sin(agent.angle); const res = simState.slimeMould.resolution; const gridX = Math.floor(agent.x / res), gridY = Math.floor(agent.y / res); if (gridX >= 0 && gridX < simState.cols && gridY >= 0 && gridY < simState.rows) { simState.grid[gridX][gridY] = Math.min(1, simState.grid[gridX][gridY] + 0.5); } if (agent.x < 0) agent.x = simState.width; if (agent.x > simState.width) agent.x = 0; if (agent.y < 0) agent.y = simState.height; if (agent.y > simState.height) agent.y = 0; }); const nextGrid = createGrid(simState.cols, simState.rows, () => 0); for (let col = 1; col < simState.cols - 1; col++) { for (let row = 1; row < simState.rows - 1; row++) { let sum = (simState.grid[col-1][row] + simState.grid[col+1][row] + simState.grid[col][row-1] + simState.grid[col][row+1]) * 0.2; sum += (simState.grid[col-1][row-1] + simState.grid[col+1][row-1] + simState.grid[col-1][row+1] + simState.grid[col+1][row+1]) * 0.05; sum -= simState.grid[col][row]; nextGrid[col][row] = Math.max(0, simState.grid[col][row] + sum) * decayRate; } } simState.grid = nextGrid; }
    function getTrailValue(x, y) { const res = simState.slimeMould.resolution; const gridX = Math.floor(x / res), gridY = Math.floor(y / res); return (gridX >= 0 && gridX < simState.cols && gridY >= 0 && gridY < simState.rows) ? simState.grid[gridX][gridY] : 0; }
    function drawSlimeMould() { const res = simState.slimeMould.resolution; for (let col = 0; col < simState.cols; col++) { for (let row = 0; row < simState.rows; row++) { const alpha = simState.grid[col][row]; if (alpha > 0.01) { ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`; ctx.fillRect(col * res, row * res, res, res); } } } }
    function initMitosis() { simState.cells = []; for (let i = 0; i < simState.mitosis.initialCellCount; i++) { simState.cells.push({ x: simState.width / 2 + (Math.random() - 0.5) * 50, y: simState.height / 2 + (Math.random() - 0.5) * 50, radius: 10, color: `hsl(${Math.random() * 360}, 70%, 60%)`, }); } draw(); }
    function updateMitosis() { const { growthRate, splitRadius, splitJitter, maxCells } = simState.mitosis; if (simState.cells.length >= maxCells) { if(simState.isRunning) { pauseSimulation(); statusDisplay.textContent = `Status: Paused - Cell limit (${maxCells.toLocaleString()}) reached.`; } return; } const newCells = []; simState.cells.forEach(cell => { if (simState.cells.length + newCells.length < maxCells) { cell.radius += growthRate; const effectiveSplitRadius = splitRadius + (Math.random() - 0.5) * splitJitter; if (cell.radius > effectiveSplitRadius) { const angle = Math.random() * Math.PI * 2; const newRadius = cell.radius * 0.7; newCells.push( {...cell, x: cell.x + Math.cos(angle) * newRadius, radius: newRadius, color: `hsl(${Math.random() * 360}, 70%, 60%)`}, {...cell, x: cell.x - Math.cos(angle) * newRadius, y: cell.y - Math.sin(angle) * newRadius, radius: newRadius, color: `hsl(${Math.random() * 360}, 70%, 60%)`} ); } else { newCells.push(cell); } } else { newCells.push(cell); } }); simState.cells = newCells; for (let i = 0; i < simState.cells.length; i++) { for (let j = i + 1; j < simState.cells.length; j++) { const [cellA, cellB] = [simState.cells[i], simState.cells[j]]; const dx = cellB.x - cellA.x, dy = cellB.y - cellA.y; const dist = Math.sqrt(dx * dx + dy * dy); const totalRadius = cellA.radius + cellB.radius; if (dist > 0 && dist < totalRadius) { const overlap = (totalRadius - dist) * 0.5; const angle = Math.atan2(dy, dx); cellA.x -= Math.cos(angle) * overlap; cellA.y -= Math.sin(angle) * overlap; cellB.x += Math.cos(angle) * overlap; cellB.y += Math.sin(angle) * overlap; } } } }
    function drawMitosis() { simState.cells.forEach(cell => { ctx.beginPath(); ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2); ctx.fillStyle = cell.color; ctx.fill(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.stroke(); }); }
    
    function initFlocking() { simState.boids = []; simState.frameCount = 0; for (let i = 0; i < simState.flocking.boidCount; i++) { simState.boids.push({ x: Math.random() * simState.width, y: Math.random() * simState.height, vx: Math.random() * 4 - 2, vy: Math.random() * 4 - 2, isLeader: false, wanderAngle: Math.random() * 2 * Math.PI, }); } electLeaders(); draw(); }
    function updateFlocking() { simState.frameCount++; if (simState.frameCount % 300 === 0) { electLeaders(); } const { alignmentForce, cohesionForce, separationForce, perceptionRadius, leaderFollowForce } = simState.flocking; const maxSpeed = 4; simState.boids.forEach(boid => { let alignment = { x: 0, y: 0 }; let cohesion = { x: 0, y: 0 }; let separation = { x: 0, y: 0 }; let follow = { x: 0, y: 0 }; let wander = { x: 0, y: 0 }; let neighbours = 0; if (boid.isLeader) { boid.wanderAngle += (Math.random() - 0.5) * 0.5; wander.x = Math.cos(boid.wanderAngle) * 0.2; wander.y = Math.sin(boid.wanderAngle) * 0.2; } else { let closestLeader = null; let minLeaderDist = Infinity; simState.boids.forEach(other => { if (boid !== other) { const d = Math.sqrt((boid.x - other.x) ** 2 + (boid.y - other.y) ** 2); if (d < perceptionRadius) { alignment.x += other.vx; alignment.y += other.vy; cohesion.x += other.x; cohesion.y += other.y; if (d < perceptionRadius / 2) { separation.x += (boid.x - other.x) / d; separation.y += (boid.y - other.y) / d; } neighbours++; if (other.isLeader && d < minLeaderDist) { minLeaderDist = d; closestLeader = other; } } } }); if (neighbours > 0) { alignment.x = (alignment.x / neighbours - boid.vx) * alignmentForce; alignment.y = (alignment.y / neighbours - boid.vy) * alignmentForce; cohesion.x = ((cohesion.x / neighbours) - boid.x) * cohesionForce * 0.01; cohesion.y = ((cohesion.y / neighbours) - boid.y) * cohesionForce * 0.01; separation.x *= separationForce; separation.y *= separationForce; } if (closestLeader) { follow.x = (closestLeader.x - boid.x) * leaderFollowForce * 0.01; follow.y = (closestLeader.y - boid.y) * leaderFollowForce * 0.01; } else { boid.wanderAngle += (Math.random() - 0.5) * 0.3; wander.x = Math.cos(boid.wanderAngle) * 0.1; wander.y = Math.sin(boid.wanderAngle) * 0.1; } } boid.vx += alignment.x + cohesion.x + separation.x + follow.x + wander.x; boid.vy += alignment.y + cohesion.y + separation.y + follow.y + wander.y; boid.vx += (Math.random() - 0.5) * 0.1; boid.vy += (Math.random() - 0.5) * 0.1; const speed = Math.sqrt(boid.vx ** 2 + boid.vy ** 2); if (speed > maxSpeed) { boid.vx = (boid.vx / speed) * maxSpeed; boid.vy = (boid.vy / speed) * maxSpeed; } boid.x += boid.vx; boid.y += boid.vy; if (boid.x > simState.width + 10) boid.x = -10; if (boid.x < -10) boid.x = simState.width + 10; if (boid.y > simState.height + 10) boid.y = -10; if (boid.y < -10) boid.y = simState.height + 10; }); }
    function drawFlocking() { simState.boids.forEach(boid => { ctx.save(); ctx.translate(boid.x, boid.y); ctx.rotate(Math.atan2(boid.vy, boid.vx)); ctx.fillStyle = boid.isLeader ? '#facc15' : '#ec4899'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }); }
    function electLeaders() { simState.boids.forEach(b => b.isLeader = false); const numLeaders = Math.max(1, Math.floor(simState.flocking.boidCount / 20)); const shuffledBoids = simState.boids.sort(() => 0.5 - Math.random()); for (let i = 0; i < numLeaders; i++) { if (shuffledBoids[i]) { shuffledBoids[i].isLeader = true; } } }
    
    function initCaveGen() {
        simState.grid = createGrid(simState.cols, simState.rows, () => (Math.random() < (simState.caveGen.fillPercentage / 100) ? 1 : 0));
        for (let i = 0; i < simState.caveGen.smoothingSteps; i++) {
            const nextGrid = createGrid(simState.cols, simState.rows);
            for (let c = 0; c < simState.cols; c++) {
                for (let r = 0; r < simState.rows; r++) {
                    const wallNeighbours = countNeighbours(simState.grid, c, r);
                    if (simState.grid[c][r] === 1) { 
                        nextGrid[c][r] = wallNeighbours >= 4 ? 1 : 0;
                    } else {
                         nextGrid[c][r] = wallNeighbours >= 5 ? 1 : 0;
                    }
                }
            }
            simState.grid = nextGrid;
        }
        draw();
    }

    function drawCaveGen() {
        const res = simState.caveGen.resolution;
        for (let col = 0; col < simState.cols; col++) {
            for (let row = 0; row < simState.rows; row++) {
                if (simState.grid[col] && simState.grid[col][row] === 1) {
                    ctx.fillStyle = '#9ca3af'; // Gray-400 for walls
                    ctx.fillRect(col * res, row * res, res, res);
                }
            }
        }
    }
    
    function initFractalLandscape() {
        const detail = simState.fractalLandscape.detailLevel;
        const size = Math.pow(2, detail) + 1;
        simState.grid = createGrid(size, size);
        simState.cols = size;
        simState.rows = size;

        // Seed the corners
        simState.grid[0][0] = Math.random();
        simState.grid[0][size - 1] = Math.random();
        simState.grid[size - 1][0] = Math.random();
        simState.grid[size - 1][size - 1] = Math.random();
        
        simState.fractalLandscape.step = size - 1;
        simState.fractalLandscape.range = 1.0;
        draw();
    }
    
    function updateFractalLandscape() {
        const { roughness } = simState.fractalLandscape;
        let step = simState.fractalLandscape.step;
        let range = simState.fractalLandscape.range;
        const size = simState.cols;

        if (step <= 1) {
            pauseSimulation();
            return;
        }

        const halfStep = step / 2;

        // Diamond step
        for (let y = 0; y < size - 1; y += step) {
            for (let x = 0; x < size - 1; x += step) {
                const avg = (simState.grid[x][y] + simState.grid[x + step][y] + simState.grid[x][y + step] + simState.grid[x + step][y + step]) / 4;
                simState.grid[x + halfStep][y + halfStep] = avg + (Math.random() - 0.5) * range;
            }
        }

        // Square step
        for (let y = 0; y < size; y += halfStep) {
            for (let x = (y + halfStep) % step; x < size; x += step) {
                let sum = 0;
                let count = 0;
                if (x - halfStep >= 0) { sum += simState.grid[x - halfStep][y]; count++; }
                if (x + halfStep < size) { sum += simState.grid[x + halfStep][y]; count++; }
                if (y - halfStep >= 0) { sum += simState.grid[x][y - halfStep]; count++; }
                if (y + halfStep < size) { sum += simState.grid[x][y + halfStep]; count++; }
                if (count > 0) {
                     simState.grid[x][y] = (sum / count) + (Math.random() - 0.5) * range;
                }
            }
        }

        simState.fractalLandscape.range *= roughness;
        simState.fractalLandscape.step = halfStep;
    }


    function drawFractalLandscape() {
        const waterLevel = simState.fractalLandscape.waterLevel;
        const size = simState.cols;
        if (!size) return;

        const resX = simState.width / size;
        const resY = simState.height / size;
        
        // Normalize the grid before drawing
        let min = Infinity, max = -Infinity;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const val = simState.grid[x][y];
                if (val === undefined) continue;
                if (val < min) min = val;
                if (val > max) max = val;
            }
        }
        const range = max - min;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const rawVal = simState.grid[x][y];
                if(rawVal === undefined) continue;
                
                const val = range > 0 ? (rawVal - min) / range : 0;

                let color = '';
                if (val < waterLevel) { // Deep to light blue
                    const waterShade = 120 + Math.floor((val / waterLevel) * 135);
                    color = `rgb(40, 80, ${waterShade})`;
                } else { // Greens to browns to white
                    const landVal = (val - waterLevel) / (1 - waterLevel);
                    if (landVal < 0.2) color = '#3f6212'; // Dark Green
                    else if (landVal < 0.5) color = '#84cc16'; // Green
                    else if (landVal < 0.8) color = '#a16207'; // Brown
                    else color = '#ffffff'; // White
                }
                ctx.fillStyle = color;
                ctx.fillRect(x * resX, y * resY, Math.ceil(resX), Math.ceil(resY));
            }
        }
    }
    
    // --- Perlin Noise Landscape ---
    function initPerlinLandscape() {
        simState.terrainPoints = new Array(simState.width);
        simState.perlinLandscape.currentX = 0;
        draw();
    }

    function updatePerlinLandscape(){
        const { scale, octaves, persistence, lacunarity, seed, speed } = simState.perlinLandscape;
        const noise = new Perlin(seed);
        
        const columnsPerFrame = Math.ceil(speed);

        for(let i = 0; i < columnsPerFrame; i++) {
            const x = simState.perlinLandscape.currentX;

            if (x >= simState.width) {
                pauseSimulation();
                return;
            }

            let amplitude = 1;
            let frequency = 1;
            let noiseHeight = 0;
            
            for (let j = 0; j < octaves; j++) {
                const sampleX = x / scale * frequency;
                const perlinValue = noise.get(sampleX, 0); // 1D noise
                noiseHeight += perlinValue * amplitude;

                amplitude *= persistence;
                frequency *= lacunarity;
            }
            
            const y = simState.height / 2 + noiseHeight * (simState.height / 4);
            simState.terrainPoints[x] = y;

            simState.perlinLandscape.currentX++;
        }
    }

    function drawPerlinLandscape() {
         // Draw sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, simState.height / 2);
        sky.addColorStop(0, '#4f46e5'); // Indigo-600
        sky.addColorStop(1, '#a5b4fc'); // Indigo-300
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, simState.width, simState.height);

        // Draw terrain
        ctx.beginPath();
        ctx.moveTo(0, simState.height);
        for (let x = 0; x < simState.perlinLandscape.currentX; x++) {
            ctx.lineTo(x, simState.terrainPoints[x]);
        }
        ctx.lineTo(simState.perlinLandscape.currentX -1, simState.height);
        ctx.closePath();
        
        // Fill terrain with gradient
        const terrain = ctx.createLinearGradient(0, simState.height / 3, 0, simState.height);
        terrain.addColorStop(0, '#bef264'); // Lime-300
        terrain.addColorStop(0.5, '#4d7c0f'); // Lime-800
        terrain.addColorStop(1, '#a16207'); // Yellow-700
        ctx.fillStyle = terrain;
        ctx.fill();
    }
    
    // --- Perlin Noise Implementation ---
    function Perlin(seed) {
        const p = new Uint8Array(512);
        const a = new Array(256);
        for (let i=0; i<256; i++) a[i] = i;

        let n = 256;
        let t, r;
        const s = seed || Math.random();
        for (let i = 0; i < 256; i++) {
            a[i] = i;
        }
        while (--n) {
            t = a[n];
            r = Math.floor((s * n) % 256);
            a[n] = a[r];
            a[r] = t;
        }

        for (let i = 0; i < 256; i++) {
            p[i] = p[i + 256] = a[i];
        }

        function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
        function lerp(t, a, b) { return a + t * (b - a); }
        function grad(hash, x, y) {
            const h = hash & 15;
            const u = h < 8 ? x : y;
            const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        }

        this.get = function (x, y) {
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            x -= Math.floor(x);
            y -= Math.floor(y);
            const u = fade(x);
            const v = fade(y);
            const A = p[X] + Y;
            const B = p[X + 1] + Y;
            return lerp(v, lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)), lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1)));
        };
    }


    // --- Utility and Interaction Functions ---
    function countNeighbours(grid, x, y) {
        let count = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) continue;
                const col = x + i;
                const row = y + j;
                if (simState.currentSim === 'gameOfLife') {
                    const wrappedCol = (x + i + simState.cols) % simState.cols;
                    const wrappedRow = (y + j + simState.rows) % simState.rows;
                     if(grid[wrappedCol] && grid[wrappedCol][wrappedRow]) {
                        count += grid[wrappedCol][wrappedRow];
                    }
                } 
                else {
                     if (col >= 0 && col < simState.cols && row >= 0 && row < simState.rows) {
                        if (grid[col] && grid[col][row] === 1) {
                            count++;
                        }
                    } else {
                        if (simState.currentSim === 'caveGen') {
                            count++;
                        }
                    }
                }
            }
        }
        return count;
    }

    function createGrid(cols, rows, initializer = () => 0) { return new Array(cols).fill(null).map(() => new Array(rows).fill(null).map(initializer)); }
    function handleMouseDown(event) { if (simState.currentSim === 'gameOfLife') { canvas.isDrawing = true; drawOnCanvas(event); } else if (simState.currentSim === 'mitosis') { if (simState.cells.length < simState.mitosis.maxCells) { const rect = canvas.getBoundingClientRect(); simState.cells.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, radius: 10, color: `hsl(${Math.random() * 360}, 70%, 60%)`, }); if(!simState.isRunning) draw(); } } }
    function handleMouseMove(event) { if (simState.currentSim === 'gameOfLife' && canvas.isDrawing) { drawOnCanvas(event); } }
    window.addEventListener('mouseup', () => { canvas.isDrawing = false; });
    function drawOnCanvas(event) { const rect = canvas.getBoundingClientRect(); const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top; const res = simState.gameOfLife.resolution; const col = Math.floor(mouseX / res); const row = Math.floor(mouseY / res); if (col >= 0 && col < simState.cols && row >= 0 && row < simState.rows) { if (simState.grid[col]) simState.grid[col][row] = 1; for(let i = -1; i <= 1; i++) { for(let j = -1; j <= 1; j++) { if (i === 0 && j === 0) continue; if (Math.random() > 0.6) { const drawCol = col + i; const drawRow = row + j; if (drawCol >= 0 && drawCol < simState.cols && simState.grid[drawCol] && drawRow >= 0 && drawRow < simState.rows) { simState.grid[drawCol][drawRow] = 1; } } } } } if (!simState.isRunning) { draw(); } }
}); 