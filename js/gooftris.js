const board = document.getElementById("board");
const timeDisplay = document.getElementById("time");
const startDisplay = document.getElementById("start");
const pointDisplay = document.getElementById("points");
const highScoreDisplay = document.getElementById("high-score");
const holdDisplay = document.getElementById("hold");
const nextShapeDisplay = document.getElementById("next-shape");
const tilePreset = document.createElement("div");
const hiddenTilePreset = document.createElement("div");
const boardColumns = 10;
const boardRows = 20;
const tiles = [[]];
const holdTiles = [[]];
/**
 * @type {Tile[][]}
 */
const nextShapeTiles = [];
const tileColors = ["yellow", "orange", "blue", "purple", "turquoise","green","red"];
const emptyColor = "rgb(50,50,50)";
const maxRotationFix = 3;
const tileShowColumns = 6;
const tileShowRows = 4;
const shapes = [
    [
        [0,0],
        [0,-1],
        [1,0],
        [1,-1]
    ],
    [
        [-1,0],
        [0,0],
        [1,0],
        [1,-1]
    ],
    [
        [-1,-1],
        [-1,0],
        [0,0],
        [1,0]
    ],
    [
        [-1,0],
        [0,-1],
        [0,0],
        [1,0]
    ],
    [
        [-1,0],
        [0,0],
        [1,0],
        [2,0]
    ],
    [
        [-1,0],
        [0,-1],
        [0,0],
        [1,-1]
    ],
    [
        [-1,-1],
        [0,-1],
        [0,0],
        [1,0]
    ]
];
const shapeOrder = [...shapes.map((el, idx) => idx)];
const shape = {id: 2, tiles: [[0,0]], position:[0,0]};

let gameMode = 0;
let startTime;
let targetFrameTime = 600;
let oldTime;
let pauseTime = 0;
let points = 0;
let highScore = 0;
let holdId = null;
let hasSwapped = false;
let currentShapeIdx = shapes.length;
let nextShapeId = 0;

function updateTime(time) {
    const seconds = time % 60;
    const minutes = Math.floor(time / 60);
    timeDisplay.innerHTML = `Time:<br><span class="variable-text">${minutes}:${seconds < 10?"0"+seconds:seconds}</span>`;
}

function setHighScore(value) {
    highScore = value;
    localStorage.setItem('gooftrisHighScore', highScore);
    displayHighScore();
}

function loadHighScore() {
    highScore = parseInt(localStorage.getItem('gooftrisHighScore'));

    if(isNaN(highScore)) setHighScore(0);

    displayHighScore();
}

function displayHighScore() {
    highScoreDisplay.innerHTML = `High Score:<br><span class="variable-text">${highScore}</span>`;
}

function resetTimer() {
    startTime = Date.now();
    oldTime = startTime;
}

function moveShapeDown() {
    if(gameMode !== 2) return;

    drawShape(shape.tiles, shape.position, null);

    const canMove = shape.tiles.every(element => {
        let position = addPosition(element, shape.position);
        position[1]++;

        return position[1] < 0 || (position[1] < boardRows && checkTile(position));
    });

    if(canMove) shape.position[1]++;

    drawShape(shape.tiles, shape.position, shape.id);

    return canMove;
}

function moveShapeHorizontal(dst) {
    if(gameMode !== 2) return;

    drawShape(shape.tiles, shape.position, null);

    const canMove = shape.tiles.every(element => {
        let position = addPosition(element, shape.position);
        position[0] += dst;

        if(position[0] < 0 || position[0] >= boardColumns) return false;

        return position[1] < 0 || checkTile(position);
    });

    if(canMove) shape.position[0] += dst;

    drawShape(shape.tiles, shape.position, shape.id);
}

function drawShape(points, offset, id) {
    points.forEach(point => {
        tiles?.[point[1] + offset[1]]?.[point[0] + offset[0]]?.setId(id);
    });
}

function clearCompleteRows() {
    let numClearedRows = 0;
    let bonusPoints = 1;
    let lastId = -1;
    
    for(let i = 0; i < boardRows; i++) {
        if(tiles[i].every(element => {
            if(lastId === element.id) bonusPoints *= 1.05;
            else lastId = element.id;

            return element.id != null;
        })) {
            numClearedRows++;
            clearRow(i);
        }
    }

    if(numClearedRows > 0) addPoints(numClearedRows * numClearedRows * 10 + Math.ceil(bonusPoints));
}

function addPoints(amount) {
    points += amount;

    if(points > highScore) setHighScore(points);
}

function clearRow(row) {
    for(let i = row; i > 0; i--) {
        for(let j = 0; j < boardColumns; j++) {
            tiles[i][j].setId(tiles[i-1][j].id);
        }
    }

    tiles[0].forEach(tile => {tile.setId(null)});
}

function pause() {
    gameMode = 1;
    changeDisplay();
    pauseTime = Date.now();
}

function unpause() {
    if(gameMode === 1) startTime += Date.now() - pauseTime;
    
    oldTime = Date.now();
    gameMode = 2;
    changeDisplay();
    requestAnimationFrame(gameLoop);
}

function setDisplayStyle(message, buttonText, isVisible = true) {
    if(!isVisible) {
        startDisplay.style.display = "none"
        return;
    }
    startDisplay.firstElementChild.innerHTML = message;
    startDisplay.children[1].innerHTML = buttonText;
    startDisplay.style.display = "block";
}

function changeDisplay() {
    switch (gameMode) {
        case -1:
            setDisplayStyle("TETRIS", "PLAY");
            break;
        case 0:
            setDisplayStyle("GAME OVER", "RESTART");
            break;
        case 1:
            setDisplayStyle("PAUSE", "RESUME");
            break;
        default:
            setDisplayStyle("","",false);
            break;
    }
}

function checkDeath() {
    const lost = shape.tiles.some(tile => tile[1] + shape.position[1] < 0);
    
    if(lost) {
        death();
    }
}

function death() {
    gameMode = 0;
    changeDisplay();
}

function rotate() {
    if(shape.id === 0)
        return;

    drawShape(shape.tiles, shape.position, null);

    let newTiles = shape.tiles.map(tile => [-tile[1], tile[0]]);
    let newPosition = shape.position;

    let success = newTiles.every(tile => checkTile(addPosition(tile, newPosition)));

    if(!success) {
        const newRotation = fixRotation(newTiles, newPosition);
        if(newRotation != null) {
            success = true;
            newPosition = newRotation.position;
            newTiles = newRotation.tiles;
        }
    }

    if(success) {
        shape.position = newPosition;
        shape.tiles = newTiles;
    }

    drawShape(shape.tiles, shape.position, shape.id);
}

function fixRotation(newTiles, newPosition) {
    const oldBorder = getBorders(shape.tiles);
    const newBorder = getBorders(newTiles);
    let checkCount;

    if(newBorder.height > oldBorder.height) {
        checkCount = Math.ceil(newBorder.length / 2);
        for(let i = 0; i <= checkCount; i++) {
            newPosition[1]--;
            if(newTiles.every(tile => checkTile(addPosition(tile, newPosition)))) {
                return {tiles: newTiles, position: newPosition}; 
            }
        }

        newPosition[1] += checkCount + 1;

        for(let i = 0; i <= checkCount; i++) {
            newPosition[1]++;
            if(newTiles.every(tile => checkTile(addPosition(tile, newPosition)))) {
                return {tiles: newTiles, position: newPosition}; 
            }
        }

        newPosition[1] -= checkCount + 1;

        return null;
    }else {
        checkCount = Math.ceil(newBorder.length / 2) + 1;

        for(let i = 0; i <= checkCount; i++) {
            newPosition[0]--;
            if(newTiles.every(tile => checkTile(addPosition(tile, newPosition)))) {
                return {tiles: newTiles, position: newPosition}; 
            }
        }

        newPosition[0] += checkCount + 1;

        for(let i = 0; i <= checkCount; i++) {
            newPosition[0]++;
            if(newTiles.every(tile => checkTile(addPosition(tile, newPosition)))) {
                return {tiles: newTiles, position: newPosition}; 
            }
        }

        newPosition[0] -= checkCount + 1;

        for(let i = 0; i < maxRotationFix; i++) {
            newPosition[1]--;
            if(newTiles.every(tile => checkTile(addPosition(tile, newPosition)))) {
                return {tiles: newTiles, position: newPosition}; 
            }
        }

        newPosition[1] += maxRotationFix;
        
        return null;
    }
}

function getBorders(tiles) {
    let minX = 0;
    let minY = 0;
    let maxX = 0;
    let maxY = 0;

    tiles?.forEach(tile => {
        if(tile[0] < minX) minX = tile[0];
        else if(tile[0] > maxX) maxX = tile[0];

        if(tile[1] < minY) minY = tile[1];
        else if(tile[1] > maxY) maxY = tile[1];
    });

    return {minX: minX, maxX: maxX, minY: minY, maxY: maxY, length: maxX - minX + 1, height: maxY - minY + 1};
}

function checkTile(position) {
    return tiles[position[1]]?.[position[0]]?.id === null;
}

function addPosition(pos1, pos2) {
    return [pos1[0] + pos2[0], pos1[1] + pos2[1]];
}

function newShape() {
    checkDeath();
    clearCompleteRows();

    createNewShape();
    updateNextShape();
    hasSwapped = false;
}

function createNewShape(id = nextShapeId) {
    const shapeId = id;
    shape.tiles = shapes[shapeId];
    shape.id = shapeId;

    updateFrameTime();

    let leftDst = 0;
    let rightDst = 0;
    shape.tiles.forEach(tile => {
        if(tile[0] < leftDst) leftDst = tile[0];
        else if(tile[0] > rightDst) rightDst = tile[0];
    });

    shape.position[0] = Math.floor(Math.random() * (boardColumns - (rightDst - leftDst))) - leftDst;
    shape.position[1] = 0;

    if(shape.tiles.some(tile => tile[1] >= 0 && !checkTile(addPosition(tile, shape.position))))  {
        death();
    }
    
    drawShape(shape.tiles, shape.position, shape.id);
}

function updateFrameTime() {
    targetFrameTime = 700 - Math.min(Math.log(points * points + 1) * 20, 100);
}

function shuffleShapes() {
    for(let i = 0; i < shapeOrder.length; i++) {
        const otherIdx = Math.floor(Math.random() * shapeOrder.length)

        const temp = shapeOrder[i]
        shapeOrder[i] = shapeOrder[otherIdx]
        shapeOrder[otherIdx] = temp;
    }
}

function getNextShapeId() {
    currentShapeIdx++;

    if(currentShapeIdx >= shapeOrder.length) {
        currentShapeIdx = 0;
        shuffleShapes();
    }
    return shapeOrder[currentShapeIdx];
}

function displayPoints() {
    pointDisplay.innerHTML = `Points:<br><span class="variable-text">${points}</span>`;
}

function start() {
    if(gameMode <= 0) {
        createBoard();
        resetTimer();

        createHold();
        createNextShapeDisplay();
        shuffleShapes();
        nextShapeId = shapeOrder[0];
        updateNextShape();
        newShape();

        points = 0;
        startDisplay.classList.add("fast-load");
    }

    unpause();
}

function updateHold() {
    if(hasSwapped)
        return;

    hasSwapped = true;

    holdTiles.forEach(row => row.forEach(tile => tile.setId(null)))

    const newHoldId = shape.id;

    const offDst = calcOffDst(newHoldId);
    shapes?.[newHoldId]?.forEach(shape => {
        holdTiles[shape[1] + offDst[1]]?.[shape[0] + offDst[0]]?.setId(newHoldId);
    });

    drawShape(shape.tiles, shape.position, null);

    if(holdId === null) newShape();
    else createNewShape(holdId);

    holdId = newHoldId
}

function updateNextShape() {
    nextShapeTiles.forEach(row => row.forEach(tile => tile.setId(null)))

    nextShapeId = getNextShapeId();
    const offDst = calcOffDst(nextShapeId);
    shapes?.[nextShapeId]?.forEach(shape => {
        nextShapeTiles[shape[1] + offDst[1]]?.[shape[0] + offDst[0]]?.setId(nextShapeId);
    });
}

function calcOffDst(shapeId) {
    const shapeBorders = getBorders(shapes[shapeId]);

    let offWidth = Math.floor((tileShowColumns - shapeBorders.length) / 2) - shapeBorders.minX;
    let offHeight = Math.ceil((tileShowRows - shapeBorders.height) / 2) - shapeBorders.minY;

    return [offWidth, offHeight];
}

function gameLoop() {
    if(gameMode !== 2)
    	return;

    const currentTime = Date.now();

    while(currentTime - oldTime > targetFrameTime) {
        oldTime += targetFrameTime;
        if(!moveShapeDown()) {
            newShape();
        }

        displayPoints();
    }
    updateTime(Math.floor((currentTime - startTime) / 1000));

    requestAnimationFrame(gameLoop);
}

function createBoard() {
    board.style.gridTemplateColumns = `repeat(${boardColumns}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${boardRows}, 1fr)`;
    board.innerHTML = "";
    tilePreset.className = "tile";

    tiles.length = 0;
    for(let i = 0; i < boardRows; i++) {
        tiles.push([]);
        for(let j = 0; j < boardColumns; j++) {
            const currentTile = new Tile(tilePreset.cloneNode(true));
            board.appendChild(currentTile.html);
            currentTile.setId(null);
            tiles[i].push(currentTile);
        }
    }
}

function createHold() {
    holdDisplay.style.gridTemplateColumns = `repeat(${tileShowColumns}, 1fr)`;
    holdDisplay.style.gridTemplateRows = `repeat(${tileShowRows}, 1fr)`;
    holdDisplay.innerHTML = "";

    hiddenTilePreset.className = "hidden-tile tile";

    holdId = null;

    holdTiles.length = 0;
    for(let i = 0; i < tileShowRows; i++) {
        holdTiles.push([]);
        for(let j = 0; j < tileShowColumns; j++) {
            const currentTile = new Tile(hiddenTilePreset.cloneNode(true));
            holdDisplay.appendChild(currentTile.html);
            currentTile.setId(null);
            holdTiles[i].push(currentTile);
        }
    }
}

function createNextShapeDisplay() {
    nextShapeDisplay.style.gridTemplateColumns = `repeat(${tileShowColumns}, 1fr)`;
    nextShapeDisplay.style.gridTemplateRows = `repeat(${tileShowRows}, 1fr)`;
    nextShapeDisplay.innerHTML = "";

    hiddenTilePreset.className = "hidden-tile tile";

    nextShapeTiles.length = 0;
    for(let i = 0; i < tileShowRows; i++) {
        nextShapeTiles.push([]);
        for(let j = 0; j < tileShowColumns; j++) {
            const currentTile = new Tile(hiddenTilePreset.cloneNode(true));
            nextShapeDisplay.appendChild(currentTile.html);
            currentTile.setId(null);
                nextShapeTiles[i].push(currentTile);
        }
    }
}

function load() {
    createBoard();
    createHold();
    createNextShapeDisplay();

    loadHighScore();

    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.animationPlayState = "running";
    let waitTime = (parseFloat(getComputedStyle(loadingScreen).animationDuration) + parseFloat(getComputedStyle(loadingScreen).animationDelay)) * 1000 + 50;

    gameMode = -1
    changeDisplay()
    displayPoints()
    displayHighScore()
    updateTime(0)
    setTimeout(() => loadingScreen.remove(), waitTime);
}

class Tile {
    constructor(tile) {
        this.html = tile;
        this.id = null;
    }

    setId(id) {
        if(id == null || id < 0 || id >= tileColors.length) {
            this.html.style.backgroundColor = emptyColor;
            this.id = null;
        } else {
            this.id = id;
            this.html.style.backgroundColor = tileColors[this.id];
        }
    }
}

document.addEventListener("keydown", event => {
    switch(event.key) {
        case "c":
            updateHold();
            break;
        case "ArrowDown":
        case "s":
            moveShapeDown();
            break;
        case "ArrowLeft":
        case "a":
            moveShapeHorizontal(-1);
            break;
        case "ArrowRight":
        case "d":
            moveShapeHorizontal(1);
            break;
        case "ArrowUp":
        case "w":
            rotate();
            break;
        case "Enter":
            start();
            break;
        case "Escape":
            if(gameMode === 2) pause();
            else if(gameMode === 1) unpause();
            break;
        case " ":
            if(gameMode !== 2)
                break;
            // noinspection StatementWithEmptyBodyJS
            while(moveShapeDown());
            newShape();
            break;
    }
});

startDisplay.lastElementChild.addEventListener("click", start);

load();