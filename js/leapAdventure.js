import {BoxCollider, Collider, Html, Input, Vector2} from "./libraries/main.js";
import {GameLoop, Time, GameObject, Camera} from "./libraries/game.js";

//HTML References
const gameContainer = document.getElementById("game");
const headerDisplay = document.getElementById("header");
const scoreDisplay = document.getElementById("score-value");
const pauseMenu = document.getElementById("pause");
const mainMenu = document.getElementById("menu");
const highScoreDisplay = document.getElementById("high-score");
const highScoreValue = document.getElementById("high-score-value");
/**
 * @type {HTMLElement}
 */
const pauseButton = headerDisplay.querySelector("#button-pause");
const tutorialText = document.getElementById("menu-tutorial-text");
const gameModeInput = document.getElementById("game-mode-input");

//fixed player variables
const PLAYER_MOVEMENT_SPEED = 4;
const PLAYER_JUMP_STRENGTH = 16;
const PLAYER_SUPER_JUMP_STRENGTH = 35;
/**
* the start position of the game
*/
const PLAYER_START_POSITION = new Vector2(0,100);
/**
* the size of the player
*/
const PLAYER_IMG_SIZE = new Vector2(36, 48);
const PLAYER_COLLIDER_SIZE = new Vector2(30, 48);
const PLAYER_DASH_Y_SPEED = -10;

//fixed game object variables
/**
 * the values the velocity is multiplied by to reduce speed
 */
const DRAG = new Vector2(.5,.98);
const JUMP_GRAVITY = -.7;
/**
 * how many points one y-unit is worth
 */
const POINTS_PER_UNIT = .05;

//classes
class Platform extends GameObject {
    //constants
    static SIZE = new Vector2(50, 15);
    static HTML = Html.createElement("div",{attributes:{class:"platform"}}, undefined);
    static SPACING_Y = 30;
    static MOVEMENT_SPEED = 3;
    static PLATFORM_START_Y = 50;
    /**
     * the minimum x distance between adjacent Platforms 
     */
    static CLOSEST_X_DST = 10;
    /**
     * how many platforms can be skipped with a single jump
     */
    static PLATFORM_SKIP = 3;
    static PLATFORM_COUNT = 6;
    //non constants
    /**
     * @type {Platform[]}
     */
    static platforms = [];
    /**
     * stores the position of the next platform that will be spawned
     */
    static nextPlatformY = Platform.PLATFORM_START_Y;
    /**
     * stores the amount of platforms since the last one you can jump on
     */
    static lastUsablePlatform = 0;
    /**
     * stores the x position of last generated platform
     */
    static lastXPos = 0;
    /**
     * the data of all the available platforms#
     * @type {[{jump_type:number, img:string, color: string, jump_event:number | undefined}]}
     */
    static platformTypes;
    /**
     * spawn information of the platform types, normal excluded
     * @type {[{min_score: number, spawn_chances: number[], none: number}]}
     */
    static spawnData;
    /**
     * stores how likely moving platforms are spawned, based on the defined score
     * @type {[{min_score: number, chance: number}]}
     */
    static spawnMoverData;
    /**
     * @type {{[platform_name:string]: {moving_platform_chances: [{min_score:number, chance: number}], platform_chances:[{min_score: number, spawn_chances: number[], none: number}], default_platform: number, gravity: number}}}
     */
    static gameModes;
    /**
     * @type {string}
     */
    static gameMode;
    /**
     * @type {number}
     */
    static defaultPlatform = 0;

    /**
     * the type of the platform:
     * - Normal (0): standard platform
     * - Broken (1): breaks instantly on touch - cannot be jumped on
     * - Ghost (2): disappears after touch - can only be jumped on once
     * - Deadly (3): Player dies on touch
     * - Booster (4): gives the player a superjump
     * - Surprise (5): changes into random platform after first touch
     * @type {number}
     */
    type;
    /**
     * wether the platform is moving or not
     * @type {boolean} 
     */
    isMoving;
    /**
     * holds custom data about the platform, based on its type
     */
    data = {};
    
    /**
     * @param {number} type the type of the platform [0 - 4]
     * @param {Vector2} position position of the platform
     * @param {boolean} isMoving whether the platform is moving
     */
    constructor(type, position, isMoving = false) {
        const html = Platform.HTML.cloneNode(true);
        gameContainer.appendChild(html);
        super(html, position, Platform.SIZE, {}, true, "Platform");

        this.isMoving = isMoving;

        this.html.setAttribute("data-platform-type", type);

        if(isMoving) {
            this.data.movementDirection = -1;
            this.html.style.outline = "1px solid cyan";
            this.data.movementSpeed = Platform.MOVEMENT_SPEED * (Math.random() / 2 + .75);
        }
        
        this.setType(type);

        Platform.platforms.push(this);
    }

    /**
     * 
     * @param {number} type 
     */
    setType(type) {
        this.html.style.backgroundSize = "100%";
        this.type = type;
        this.html.style.backgroundImage = `url(${Platform.platformTypes[type].img})`;
        this.html.style.boxShadow = `0 0 13px 2px ${Platform.platformTypes[type].color}`;
    }

    update() {
        if(this.position.y + this.size.y / 2 + Platform.SPACING_Y < Camera.position.y - Camera.size.y / 2) {
            this.remove();
        }
        
        if(this.isMoving) {
            this.position.x += this.data.movementDirection * this.data.movementSpeed;
            if(Math.abs(this.position.x) + this.size.x / 2 >= Camera.size.x / 2) this.data.movementDirection = -(this.position.x / Math.abs(this.position.x));
        }

        this.draw();
    }

    remove() {
        Platform.platforms.splice(Platform.platforms.indexOf(this), 1);
        this.html.remove();
    }

    /** - called when player touches the platform
     * - returned numbers: 
     * - -1: death
     * - 0: no jump
     * - 1: normal jump
     * - 2: super jump
     * @returns {number} what happens to the player based on the type of the platform  
     */
    onPlayerTouch() {
        let platformData = Platform.platformTypes[this.type];

        if(platformData.jump_event !== undefined) {
            //-1: remove platform, 0: set random platform type
            switch(platformData.jump_event) {
                case -1:
                    this.remove();
                    break;
                case 0:
                    this.setType(Math.floor(Math.random() * Platform.PLATFORM_COUNT));
                    break;
            }
        }

        return platformData.jump_type;
    }

    static removeAllPlatforms() {
        for(let i = Platform.platforms.length - 1; i >= 0; i--) {
            Platform.platforms[i].remove();
        }
    }

    static setup() {
        Platform.removeAllPlatforms();
        Platform.nextPlatformY = Platform.PLATFORM_START_Y;
    }

    /**
     * adds new Platforms
     * @returns {boolean} whether new Platforms were added or not
     */
    static addPlatforms() {
        function createPlatform() {
            /**
             * @type {{min_score:number, spawn_chances:number[], none:number}}
             */
            let currentSpawnTypeData = {min_score:0, spawn_chances:[0], none:0};
            for(let i = Platform.spawnData.length-1; i >= 0; i--) {
                if(Platform.spawnData[i].min_score < score) {
                    currentSpawnTypeData = Platform.spawnData[i];
                    break;
                }
            }

            let type = Platform.defaultPlatform;
            let chanceSum = 0;
            let typeRandom = Math.random();
            let typeFound = false;

            if(currentSpawnTypeData != null) {
                for(let i = 0; i < currentSpawnTypeData.spawn_chances.length; i++) {
                    chanceSum += currentSpawnTypeData.spawn_chances[i];
                    if(typeRandom < chanceSum) {
                        typeFound = true;
                        type = i;
                        if(Platform.platformTypes[i].jump_type > 0) Platform.lastUsablePlatform = 0;
                        else {
                            Platform.lastUsablePlatform++;
                            if(Platform.lastUsablePlatform > Platform.PLATFORM_SKIP) {
                                type = Platform.defaultPlatform;
                                Platform.lastUsablePlatform = 0;
                            }
                        }
                        break;
                    }
                }
    
                if(!typeFound ) {
                    if(typeRandom < currentSpawnTypeData.none + chanceSum && Platform.lastUsablePlatform < Platform.PLATFORM_SKIP) {
                        Platform.lastUsablePlatform++;
                        return;
                    }
                    else Platform.lastUsablePlatform = 0;
                }
            }else Platform.lastUsablePlatform = 0;

            let currentMoveChance = 0;
            for(let i = Platform.spawnMoverData.length-1; i >= 0; i--) {
                if(Platform.spawnMoverData[i].min_score < score) {
                    currentMoveChance = Platform.spawnMoverData[i].chance;
                    break;
                }
            }

            let isMoving = Math.random() < currentMoveChance;
            let xPos = 0;
            do {
                xPos = Math.floor(Math.random() * (Camera.size.x - Platform.SIZE.x)) + Platform.SIZE.x / 2 - Camera.size.x / 2;
            }while (Math.abs(xPos - Platform.lastXPos) < Platform.SIZE.x / 4);

            Platform.lastXPos = xPos;

            new Platform(type, new Vector2(xPos, Platform.nextPlatformY), isMoving);
        }

        if(Platform.nextPlatformY < Camera.position.y + Camera.size.y / 2 + Platform.SPACING_Y) {
            createPlatform();
            Platform.nextPlatformY += Platform.SPACING_Y;           
            return true;
        }
        return false;
    }

    /**
     * @param {string} gameMode 
     */
    static setGameMode(gameMode) {
        let data = Platform.gameModes[gameMode];
        Platform.gameMode = gameMode;
        Platform.spawnData = data.platform_chances;
        Platform.defaultPlatform = data.default_platform;
        Platform.spawnMoverData = data.moving_platform_chances;

        if(data.gravity !== undefined) gravity = data.gravity;
        else gravity = JUMP_GRAVITY;

        highScoreValue.innerHTML = highScores[gameMode].toString();

        localStorage.setItem("lastGamemode", Platform.gameMode);
    }
}

//functions
/**
 * is executed when the game starts
 */
function setupGame() {
    //hide / remove menu elements
    mainMenu.style.display = 'none';
    setTutorialVisibility(false);
    
    //show / add game elements
    player = new GameObject(Html.createElement("div", {attributes:{id:"player"}}, gameContainer), PLAYER_START_POSITION.copy(), PLAYER_IMG_SIZE, {size: PLAYER_COLLIDER_SIZE});
    pauseButton.style.display = 'block';

    activeGame = true;

    setupScore();

    Camera.setPosition(PLAYER_START_POSITION.copy());
    Platform.setup();
    new Platform(Platform.defaultPlatform, Vector2.zero());
    // noinspection StatementWithEmptyBodyJS
    while(Platform.addPlatforms());

    unpause();
}

/**
 * runs every update
 */
function gameTick() {
    playerTick();

    //Camera movement
    if(player.position.y > Camera.position.y) {
        Camera.moveTo(player.position);
        updateScore();
        // noinspection StatementWithEmptyBodyJS
        while(Platform.addPlatforms());
        gameContainer.style.backgroundPosition = `0 ${Camera.position.y / 2}px`;
    }

    Platform.platforms.forEach(platform => {
        platform.update();
    });
}

function playerTick() {
    handlePlayerMovement();
    player.move();
    playerCollision();
    player.draw();
    player.velocity.multiply(DRAG);
    if(player.velocity.y > .1) player.velocity.y += JUMP_GRAVITY;
    else player.velocity.y += gravity;
    

    if(player.velocity.x < 0) player.html.style.transform = "scaleX(-1)";
    else if(player.velocity.x > 0) player.html.style.transform = "scaleX(1)";
}

function playerCollision() {
    if(player.velocity.y < 0) {
        let playerBottom = player.position.y - player.velocity.y - player.size.y / 2;
        let collidingPlatform = Platform.platforms.find(platform => playerBottom > platform.position.y + platform.size.y / 2 && platform.collider.collisionCheck(player.collider));
        if(collidingPlatform != null) {
            switch(collidingPlatform.onPlayerTouch()) {
                case -1: 
                    menu();
                    break;
                case 1:
                    player.position.y += (collidingPlatform.position.y + collidingPlatform.size.y / 2) - (player.position.y - player.size.y / 2);
                    player.velocity.y = PLAYER_JUMP_STRENGTH;
                    break;
                case 2:
                    player.position.y += (collidingPlatform.position.y + collidingPlatform.size.y / 2) - (player.position.y - player.size.y / 2);
                    player.velocity.y = PLAYER_SUPER_JUMP_STRENGTH;
                    break;
            }
        }else if(player.position.y - player.size.y / 2 < Camera.position.y - Camera.size.y / 2) menu();
    }

    if(player.position.x > Camera.size.x / 2) {
        player.position.x -= Camera.size.x;
    }else if(player.position.x < Camera.size.x / -2) {
        player.position.x += Camera.size.x;
    }
}

function handlePlayerMovement() {
    let movementDir = Input.getKeyGroup(["d","ArrowRight","D"]) - Input.getKeyGroup(["a","ArrowLeft","A"]);

    player.velocity.x += movementDir * PLAYER_MOVEMENT_SPEED;
    if(Input.getKeyGroup(["s","ArrowDown"]) && player.velocity.y < .2) player.velocity.y += PLAYER_DASH_Y_SPEED;
}

function setupScore() {
    score = 0;
    scoreDisplay.innerText = "0";
}

function updateScore() {
    let currentScore = Math.floor((player.position.y - PLAYER_START_POSITION.y) * POINTS_PER_UNIT);
    score = Math.max(currentScore, score);
    scoreDisplay.innerText = score.toString();

    if(score > highScores[Platform.gameMode]) {
        highScores[Platform.gameMode] = score;
    }
    storeData();
}

function pause() {
    GameLoop.stop();
    pauseMenu.style.display = "block";
    pauseButton.className = "fa-solid fa-play";
}

function unpause() {
    GameLoop.start();
    pauseMenu.style.display = "none";
    pauseButton.className = "fa-solid fa-pause";
}

function storeData() {
    localStorage.setItem("highScores", JSON.stringify(highScores));
    localStorage.setItem("lastScore", score.toString());
}

function load() {
    highScores = JSON.parse(localStorage.getItem("highScores")) || {};
    score = parseInt(localStorage.getItem("lastScore")) || 0;
    let lastGamemode = localStorage.getItem("lastGamemode") || "default";

    fetch("json/leapAdventure.json").then((response) => response.json())
    .then(
      /**
      * @param {{game_modes: {[platform_name:string]: {moving_platform_chances: [{min_score:number, chance: number}], platform_chances:[{min_score: number, spawn_chances: number[], none: number}], default_platform: number, gravity: number}}, platforms: [{jump_type:number, img:string, color:string}]}} data
      */
     (data) => {
        let gameModeNames = Object.keys(data.game_modes);
        Platform.gameModes = data.game_modes;
        Platform.setGameMode(lastGamemode);

        Platform.platformTypes = data.platforms;

        let listItemString = gameModeNames.reduce((value, key) => value + ", " + key);
        gameModeInput.setAttribute("data-list-items", listItemString);
        gameModeInput.setAttribute("value", Platform.gameMode);
        gameModeInput.value = Platform.gameMode;
        gameModeNames.forEach(name => {if(highScores[name] === undefined) {highScores[name] = 0}});
        
        GameLoop.setup(gameTick, 30);
        Camera.setup(gameContainer, PLAYER_START_POSITION.copy(), new Vector2(0,150), new Vector2(0,Infinity), new Vector2(1,.5));
        menu();

        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.animationPlayState = "running";
        let waitTime = (parseFloat(getComputedStyle(loadingScreen).animationDuration) + parseFloat(getComputedStyle(loadingScreen).animationDelay)) * 1000 + 50;

        setTimeout(() => loadingScreen.remove(), waitTime);
    });
}

function menu() {
    //remove / hide game elements
    Platform.removeAllPlatforms();
    player?.remove();
    pauseMenu.style.display = "none";
    pauseButton.style.display = "none";

    //add / show menu elements
    mainMenu.style.display = "block";
    highScoreDisplay.style.display = "block";

    setTutorialVisibility(false);
    GameLoop.stop();
    activeGame = false;
    highScoreValue.innerHTML = highScores[Platform.gameMode].toString();
    scoreDisplay.innerText = score.toString();
}

/**
 * @param {boolean} mode wether its visible or not
 */
function setTutorialVisibility(mode) {
    tutorialOpened = mode;
    if(tutorialOpened) tutorialText.style.display = "block";
    else tutorialText.style.display = "none";
}

//editable variables
/**
 * @type {GameObject}
 */
let player;
/**
 * the current score of the player
 * @type {number}
 */
let score = 0;
/**
 * @type {{[name: string]: number}}
 */
let highScores;
let activeGame = true;
let tutorialOpened = true;
/**
 * the gravity of all the gameObjects
 */
let gravity = -.7;

//code
Input.setup();
Input.addKeyDownEvent("Escape", () => {
    if(!activeGame) {
        setTutorialVisibility(false);
        return;
    }

    if(GameLoop.isRunning) pause();
    else unpause();
});
Input.addKeyDownEvent("i", () => {
    if(!activeGame) {
        setTutorialVisibility(!tutorialOpened);
    }
});
Input.addKeyDownEvent(" ", () => {
    if(!activeGame) setupGame();
    else unpause();
});
Input.addKeyDownEvent("ArrowRight", () => {
    if(tutorialOpened) tutorialText.setAttribute("data-switch-idx", ((parseInt(tutorialText.getAttribute("data-switch-idx")) + 1) || 0).toString());
});
Input.addKeyDownEvent("ArrowLeft", () => {
    if(tutorialOpened) tutorialText.setAttribute("data-switch-idx", ((parseInt(tutorialText.getAttribute("data-switch-idx")) - 1) || 0).toString());
});
Input.addKeyDownEvent("d", () => {
    if(tutorialOpened) tutorialText.setAttribute("data-switch-idx", ((parseInt(tutorialText.getAttribute("data-switch-idx")) + 1) || 0).toString());
});
Input.addKeyDownEvent("a", () => {
    if(tutorialOpened) tutorialText.setAttribute("data-switch-idx", ((parseInt(tutorialText.getAttribute("data-switch-idx")) - 1) || 0).toString());
});

pauseMenu.querySelector("#button-resume").addEventListener("click", () => unpause());
pauseMenu.querySelector("#button-menu").addEventListener("click", () => menu());
mainMenu.querySelector("#button-play").addEventListener("click", () => setupGame());
document.getElementById("button-menu-tutorial").addEventListener("click", () => setTutorialVisibility(!tutorialOpened));
pauseButton.addEventListener("click", () => {
    if(!activeGame) return;

    if(GameLoop.isRunning) pause();
    else unpause();
});
gameModeInput.addEventListener("valueChanged", () => {
    Platform.setGameMode(gameModeInput.value);
});

load();