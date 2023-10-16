import {Vector2, Input} from './libraries/main.js';
import {GameLoop} from './libraries/game.js';

const ctx = document.querySelector("canvas").getContext("2d");
const fullCircle = Math.PI * 2;
/**
 * @type {PhysicsObject[]}
 */
const objects = [];
const GRAVITY = new Vector2(0, 1);
const FRICTION = .98;
const WALL_BOUNCE = 1;

let width = 0
let height = 0;
/**
 * @type {PhysicsObject|undefined}
 */
let selectedObject = undefined;

/**
 * @abstract
 */
class Drawable {
    /**
     * @type {Vector2}
     */
    pos;
    /**
     * @type {String | undefined}
     */
    fillStyle;
    /**
     * @type {String | undefined}
     */
    strokeStyle;

    draw() {
        if(this.fillStyle !== undefined) {
            ctx.fillStyle = this.fillStyle;
            ctx.fill();
        }

        if(this.strokeStyle !== undefined) {
            ctx.strokeStyle = this.strokeStyle;
            ctx.stroke();
        }
    }

    setupDraw() {
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.beginPath();
    }

    /**
     * @protected
     * @param pos {Vector2}
     * @param fillStyle {String | undefined}
     * @param strokeStyle {String | undefined}
     */
    constructor(pos, fillStyle = undefined, strokeStyle = undefined) {
        this.pos = pos;
        this.fillStyle = fillStyle;
        this.strokeStyle = strokeStyle;
    }

    toString() {
        return `{pX: ${Math.round(this.pos.x)}, pY: ${Math.round(this.pos.y)}, fillStyle: ${this.fillStyle}, strokeStyle: ${this.strokeStyle}}`;
    }
}

/**
 * @abstract
 */
class PhysicsObject extends Drawable {
    /**
     * @type {Vector2}
     */
    velocity= Vector2.zero();
    /**
     * @type {boolean}
     */
    isStatic = false;

    /**
     * @override
     */
    update() {
        if(!this.isStatic) {
            this.velocity.add(GRAVITY);
            this.velocity.multiply(FRICTION);
            this.pos.add(this.velocity);
        }
    }

    /**
     * @abstract
     * @return {Vector2[]}
     */
    getBoundaries(){};

    /**
     * @abstract
     * @param pos {Vector2}
     * @return {boolean}
     */
    pointCollision(pos) {};

    /**
     * @protected
     * @param pos {Vector2}
     * @param fillStyle {String | undefined}
     * @param strokeStyle {String | undefined}
     */
    constructor(pos, fillStyle, strokeStyle) {
        super(pos, fillStyle, strokeStyle);
    }

    toString() {
        return `{vX: ${Math.round(this.velocity.x)}, vY: ${Math.round(this.velocity.y)}, static: ${this.isStatic}, ${super.toString()}`;
    }

}

class Circle extends PhysicsObject {
    /**
     * @type {number}
     */
    radius;

    /**
     * @override
     */
    draw() {
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, fullCircle);
        super.draw();
    }

    /**
     * @param pos {Vector2}
     * @param radius {number}
     * @param fillStyle {string | undefined}
     * @param strokeStyle {string | undefined}
     */
    constructor(pos = Vector2.zero(), radius, fillStyle = undefined, strokeStyle = undefined) {
        super(pos, fillStyle, strokeStyle);
        this.radius = radius;
    }

    update() {
        super.update();
        bounceOnEdge(this);
    }

    getBoundaries() {
        return [
            Vector2.from(-this.radius),
            Vector2.from(this.radius)
        ]
    }

    toString() {
        return `{rad: ${this.radius}, ${super.toString()}}`
    }

    pointCollision(pos) {
        return Vector2.distance(pos, this.pos) <= this.radius;
    }
}

/**
 * @param physicsObject {PhysicsObject}
 */
function bounceOnEdge(physicsObject) {
    const boundaries = physicsObject.getBoundaries();
    const minPos = Vector2.add(physicsObject.pos, boundaries[0]);
    const maxPos = Vector2.add(physicsObject.pos, boundaries[1]);

    if(minPos.x < 0) {
        physicsObject.pos.x = -boundaries[0].x;
        physicsObject.velocity.x *= -WALL_BOUNCE;
    }else if(maxPos.x > width) {
        physicsObject.pos.x = width-boundaries[1].x;
        physicsObject.velocity.x *= -WALL_BOUNCE;
    }

    if(minPos.y < 0) {
        physicsObject.pos.y = -boundaries[0].y;
        physicsObject.velocity.y *= -WALL_BOUNCE;
    }else if(maxPos.y > height) {
        physicsObject.pos.y = height-boundaries[1].y;
        physicsObject.velocity.y *= -WALL_BOUNCE;
    }
}

/**
 * @param x {number}
 * @param y {number}
 * @return {Vector2}
 */
function screenToWorldPos(x, y) {
    const boundaries = ctx.canvas.getBoundingClientRect();
    return new Vector2(x - boundaries.x, y - boundaries.y);
}

function updateCanvas() {
    width = ctx.canvas.width = window.innerWidth;
    height = ctx.canvas.height = window.innerHeight * .9;

    for(const el of objects) {
        el.setupDraw();
        el.draw();
    }
}

function gameTick() {
    for(const el of objects) {
        el.update();
    }
    updateCanvas();
}

Input.setup();
window.onresize = updateCanvas;
updateCanvas();

Input.addKeyDownEvent('c', () => objects.length = 0);

document.onmousemove = e => {
    if(!selectedObject) return;

    const mousePos = screenToWorldPos(e.x, e.y);

    selectedObject.velocity.from(mousePos.subtract(selectedObject.pos).multiply(1.5))

    selectedObject.pos.from(screenToWorldPos(e.x, e.y));

    document.onmouseup =  e => {
        if(e.button !== 0) return;

        selectedObject.isStatic = false;
        selectedObject = undefined;
    }
}

document.onmousedown = e => {
    if(e.button !== 0) return;

    let mousePos = screenToWorldPos(e.x, e.y);
    let circle;

    if((circle = objects.findLast(el => el.pointCollision(mousePos)))) {
        selectedObject = circle;
        circle.isStatic = true;
        return;
    }

    const color = [
        Math.ceil(Math.random() * 255),
        Math.ceil(Math.random() * 255),
        Math.ceil(Math.random() * 255)
    ]
    circle = new Circle(new Vector2(mousePos.x, mousePos.y), 20, `rgb(${color[0]},${color[1]},${color[2]})`);
    objects.push(circle);

    circle.isStatic = true;

    document.onmouseup =  e => {
        if(e.button !== 0) return;
        mousePos = screenToWorldPos(e.x, e.y);

        circle.velocity.from(mousePos.subtract(circle.pos).multiply(.3))

        circle.isStatic = false;
    }
}

GameLoop.setup(gameTick, 10);
GameLoop.start();