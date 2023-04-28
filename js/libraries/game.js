import { Html, Vector2, Collider, BoxCollider, CircleCollider } from "./main.js";

/**
 * Static class that handles the Game Loop 
 */
export class GameLoop {
    /**
     * function that is called every update
     * @type {()=>{}}
     */
    static updateFn;
    /**
     * @type {boolean} whether the game loop is currently active or not
     */
    static isRunning = false;
    /**
     * the time since the last update was executed
     * @type {number}
     */
    static timeSinceLastUpdate = 0;

    /**
     * 
     * @param {()=>{}} updateFn the function that is called every update
     * @param {number} updateRate the expected time in milliseconds until the next update function is called
     */
    static setup(updateFn = ()=>{}, updateRate = 0) {
        GameLoop.updateFn = updateFn;
        Time.fixedDeltaTime = updateRate;
    }

    static start() {
        GameLoop.isRunning = true;
        Time.start();
        GameLoop.timeSinceLastUpdate = 0;
        requestAnimationFrame(this.loop);
    }

    static stop() {
        GameLoop.isRunning = false;
    }

    static loop() {
        if(!GameLoop.isRunning) return;
        Time.update();
        GameLoop.timeSinceLastUpdate += Time.deltaTime;
        if(GameLoop.timeSinceLastUpdate > 500) {
            GameLoop.timeSinceLastUpdate = 500;
        }
        if(GameLoop.timeSinceLastUpdate >= Time.fixedDeltaTime) {
            GameLoop.updateFn();

            GameLoop.timeSinceLastUpdate -= Time.fixedDeltaTime;
        }

        requestAnimationFrame(GameLoop.loop);
    }
}

export class Time {
    /**
     * the expected time until the next update function is called
     * @type {number}
     */
    static fixedDeltaTime;
    /**
     * the time between the last and the current update
     * @type {number}
     */
    static deltaTime;
    /**
     * the time of the last update
     */
    static lastUpdate;

    static start() {
        Time.deltaTime = 0;
        Time.lastUpdate = Date.now();
    }

    /**
     * calculates the time between the last and the current update + updates lastUpdate
     */
    static update() {
        Time.deltaTime = Date.now() - Time.lastUpdate;
        Time.lastUpdate = Date.now();
    }

    /**
     * calculates the FPS
     * @returns {number}
     */
    static getFPS() {
        return 1000 / Time.deltaTime;
    }
}

export class GameObject {
    /**
     * the collider of the gameObject
     * @type {Collider}
     */
    collider = null;
    /**
     * position of the gameObject
     * @type {Vector2}
     */
    position;
    /**
     * width and height of the gameObject
     * @type {Vector2}
     */
    size;
    /**
     * the html element displayed on the screen
     * @type {HTMLElement}
     */
    html;
    /**
     * the x and y velocity of the gameObject
     * @type {Vector2}
     */
    velocity = Vector2.zero();
    /**
     * whether the object will be moved or not
     * @type {boolean}
     */
    isStatic;
    /**
     * stores the type of the game object -> easier to differentiate between different gameObjects
     * @type {string}
     */
    group;

    /**
     * creates a new GameObject, that holds all the information to position, draw and move it
     * @param {HTMLElement} html the displayed part of the game object
     * @param {Vector2} position the position of the object
     * @param {Vector2} size the width and height of the collider
     * @param {{type: number | undefined, offset: Vector2 | undefined, size: Vector2 | number | undefined} | undefined} colliderData holds the data for the collider. undefined: no collider for this game object 
     * @param {boolean} isStatic whether the gameObject is moved or not
     * @param {string} group type of the gameObject
     */
    constructor(html, position = Vector2.zero(), size = Vector2.zero(), colliderData, isStatic = false, group = "") {
        this.html = html;
        this.position = position;
        this.isStatic = isStatic;
        this.group = group;

        if(colliderData != undefined) {
            let colliderOffset = colliderData.offset;
            let colliderSize = colliderData.size;
            if(colliderOffset == undefined) colliderOffset = Vector2.zero();
            switch(colliderData.type | 0) {
                case 0:
                    if(colliderSize == undefined) colliderSize = size;
                    this.collider = new BoxCollider(colliderSize, position, colliderOffset);
                    break;
                case 1:
                    if(colliderSize == undefined) colliderSize = size.magnitude();
                    this.collider = new CircleCollider(colliderSize, position, colliderOffset);
                    break;
            }
        }
    
        this.html.style.position = "absolute";

        this.setSize(size);
    }

    /**
     * positions the gameObject on the screen
     */
    draw() {
        const screenPos = Vector2.subtract(this.position, Camera.position);
        screenPos.add(Vector2.divide(Camera.size,2));
        screenPos.subtract(Vector2.divide(this.size, 2));

        this.html.style.left = screenPos.x + "px";
        this.html.style.bottom = screenPos.y + "px";
    }

    move() {
        if(this.isStatic) return;

        this.position.add(this.velocity);
    }

    /**
     * is run every frame; can be overridden by subclasses
     */
    update() {
        this.move();
        this.draw();
    }

    /**
     * @param {Vector2} size the width and height of the gameObject  
     */
    setSize(size) {
        this.size = size;
        this.html.style.width = size.x + "px";
        this.html.style.height = size.y + "px";
    }

    remove() {
        this.html.remove();
    }
}

/**
 * the static class holding the information for a camera for
 */
export class Camera {
    /**
     * the position of the camera
     * @type {Vector2}
     */
    static position;
    /**
     * the width and height of the screen
     * @type {Vector2}
     */
    static size;
    /**
     * the element representing the screen of the game
     * @type {HTMLElement}
     */
    static screen;
    /**
     * the smallest x and y coordinates for the camera
     */
    static minPos;
    /**
     * the largest x and y coordinates for the camera
     */
    static maxPos;
    /**
     * the multiplier for the x and y movement
     * @type {Vector2}
     */
    static movementSpeed;
    /**
     * value that the y value needs to be multiplied to stay the same as x
     * @type {number}
     */
    static screenRatio;

    /**
     * sets all the required information for the camera
     * @param {HTMLElement} screen the screen where the game is displayed
     * @param {Vector2} position the position of the camera
     * @param {Vector2} minPos the minimum x and y coordinates for the camera
     * @param {Vector2} maxPos the maximum x and y coordinates for the camera
     * @param {Vector2} movementSpeed the x and y multipliers for the camera movement
     */
    static setup(screen=document.body,position=Vector2.zero(),minPos=Vector2.from(-Infinity),maxPos=Vector2.from(Infinity),movementSpeed=Vector2.one()) {
        Camera.screen = screen;
        Camera.position = position;
        Camera.minPos = minPos;
        Camera.maxPos = maxPos;
        Camera.movementSpeed = movementSpeed;

        let screenBounds = screen.getBoundingClientRect();
        Camera.size = new Vector2(screenBounds.width, screenBounds.height);

        Camera.screen.style.isolation = "isolate";
        Camera.screen.style.position = "relative";
        Camera.screen.style.overflow = "hidden";
        
        Camera.checkBoundaries();
    }

    /**
     * 
     * @param {Vector2} targetPosition the position the camera should go to
     */
    static moveTo(targetPosition) {
        Camera.position.add(Vector2.axisDistance(targetPosition, Camera.position).multiply(Camera.movementSpeed));
        Camera.checkBoundaries();
    }

    /**
     * sets the camera to the target position
     * @param {Vector2} targetPosition the position the camera should go to
     */
    static setPosition(targetPosition) {
        Camera.position.from(targetPosition);
        Camera.checkBoundaries();
    }

    /**
     * keeps the position of the camera inside the given boundaries
     */
    static checkBoundaries() {
        Camera.position.from(Vector2.max(Vector2.min(Camera.position,Camera.maxPos), Camera.minPos));
    } 
}