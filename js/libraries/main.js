export class Html {
    /**
     * creates a new html element, where you can directly edit the data of that element
     * @param {string} element type of the element
     * @param {{attributes: {}, innerHTML: string} | undefined} data the data added to the element
     * @param {HTMLElement | undefined} parent the parent to which the elemnt will be appended to
     * @return {HTMLElement}
     */
    static createElement(type, data, parent) {
        const element = document.createElement(type);
        
        if(data == null) return element;

        if(data.innerHTML != undefined) element.innerHTML = data.innerHTML;
        if(data.attributes != undefined) {
            Object.keys(data.attributes).forEach(key => {
                element.setAttribute(key, data.attributes[key]);
            });
        }

        if(parent != null) parent.appendChild(element);

        return element;
    }
}

/**
 * holds all the data for Vector2s and calculations related to them
 */
export class Vector2 {
    /**
     * the x coord of the vector
     * @type {number}
     */
    x;
    /**
     * the y coord of the vector
     * @type {number}
     */
    y;

    /**
     * @param {number} x x coord of the vector
     * @param {number} y y coord of the vector
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * returns the magnitude/length of the vector
     * @returns {number}
     */
    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    /**
     * returns the magnitude/length of the vector, without taking the root, making it more efficient
     * @returns {number}
     */
    sqrMagnitude() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * changes the vector to have a magnitude/length of 1
     * @returns {Vector2} that Vector
     */
    normalize() {
        return this.divide(this.magnitude());
    }

    /**
     * returns a copy of this vector
     * @returns {Vector2}
     */
    copy() {
        return new Vector2(this.x, this.y);
    }

    /**
     * sets a new value for that vector
     * @param {number} x the x coordinate of the vector
     * @param {number} y the y coordinate of the vector
     * @returns {Vector2} that vector
     */
    set(x,y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * sets its values to the values of another vector
     * @param {Vector2} other the vector which values will be copied 
     * @returns 
     */
    from(other) {
        this.x = other.x;
        this.y = other.y
        return this;
    }

    /**
     * @returns {string}
     */
    toString() {
        return `[${this.x}|${this.y}]`;
    }

    /**
     * removes that object
     */
    remove() {
        delete this.x;
        delete this.y;
    }

    /**
     * adds another vector / number to this vector
     * @param {Vector2 | number} other the other value
     * @returns {Vector2} this vector
     */
    add(other) {
        if(typeof other === 'number') {
            this.x += other;
            this.y += other;
        }else {
            this.x += other.x;
            this.y += other.y;
        }

        return this;
    }

    /**
     * subtracts another vector / number to this vector
     * @param {Vector2 | number} other the other value
     * @returns {Vector2} this vector
     */
    subtract(other) {
        if(typeof other === 'number') {
            this.x -= other;
            this.y -= other;
        }else {
            this.x -= other.x;
            this.y -= other.y;
        }

        return this;
    }

    /**
     * multiplies this vector with another vector / number
     * @param {Vector2 | number} other the other value
     * @returns {Vector2} this vector
     */
    multiply(other) {
        if(typeof other === 'number') {
            this.x *= other;
            this.y *= other;
        }else {
            this.x *= other.x;
            this.y *= other.y;
        }

        return this;
    }

    /**
     * divides this vector by another vector / number
     * @param {Vector2 | number} other the other value
     * @returns {Vector2} this vector
     */
    divide(other) {
        if(typeof other === 'number') {
            this.x /= other;
            this.y /= other;
        }else {
            this.x /= other.x;
            this.y /= other.y;
        }

        return this;
    }

    /**
     * adds to vectors together
     * @param {Vector2} a 
     * @param {Vector2} b 
     * @returns {Vector2}
     */
    static add(a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    /**
     * subtracts vector a from vector b
     * @param {Vector2} a 
     * @param {Vector2} b
     * @returns {Vector2} 
     */
    static subtract(a,b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    /**
     * divides to vectors | one vector by a number
     * @param {Vector2} a
     * @param {Vector2 | number} b
     * @returns {Vector2}
     */
    static divide(a,b) {
        if(typeof b === 'number') {
            return new Vector2(a.x / b, a.y / b);
        }else {
            return new Vector2(a.x / b.x, a.y / b.y);
        }
    }

    /**
     * multiplies two vectors | one vector with a number
     * @param {Vector2} a
     * @param {Vector2 | number} b
     * @returns {Vector2}
     */
    static multiply(a,b) {
        if(typeof b === 'number') {
            return new Vector2(a.x * b, a.y * b);
        }else {
            return new Vector2(a.x * b.x, a.y * b.y);
        }
    }

    /**
     * creates a vector of the value [0,1] or the direction up
     * @returns {Vector2}
     */
    static up() {
        return new Vector2(0,1);
    }
    
    /**
     * creates a vector of the value [0,-1] or the direction down
     * @returns {Vector2}
     */
    static down() {
        return new Vector2(0,-1);
    }

    /**
     * creates a vector of the value [-1,0] or the direction left
     * @returns {Vector2}
     */
    static left() {
        return new Vector2(-1, 0);
    }
    
    /**
     * creates a vector of the value [1,0] or the direction right
     * @returns {Vector2}
     */
    static right() {
        return new Vector2(1,0);
    }

    /**
     * creates a vector of the value [1,1]
     * @returns {Vector2}
     */
    static one() {
        return new Vector2(1,1);
    }
    
    /**
     * creates a vector of the value [0,0]
     * @returns {Vector2}
     */
    static zero() {
        return new Vector2(0,0);
    }

    /**
     * calculates the distance between two vectors
     * @param {Vector2} a 
     * @param {Vector2} b 
     * @returns {number}
     */
    static distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    /**
     * calculates the x and y distances between two vectors
     * @param {Vector2} a 
     * @param {Vector2} b 
     * @returns 
     */
    static axisDistance(a, b) {
        return new Vector2(a.x-b.x, a.y-b.y);
    }

    /**
     * calculates the distance between two vectors, without calculating the root
     * @param {Vector2} a 
     * @param {Vector2} b 
     * @returns {number}
     */
    static sqrdst(a,b) {
        return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
    }

    /**
     * checks if two vectors are the same
     * @param {Vector2} a 
     * @param {Vector2} b 
     * @returns {boolean}
     */
    static equals(a,b) {
        return a.x == b.x && a.y == b.y;
    }

    /**
     * returns a new vector containing the smallest x and the smallest y value of the 2 given vectors
     * @param {Vector2} a 
     * @param {Vector2} b 
     * @returns {Vector2}
     */
    static min(a,b) {
        return new Vector2(Math.min(a.x,b.x), Math.min(a.y,b.y));
    }

    /**
     * returns a new vector containing the largest x and the largest y value of the 2 given vectors
     * @param {Vector2} a 
     * @param {Vector2} b 
     * @returns {Vector2}
     */
    static max(a,b) {
        return new Vector2(Math.max(a.x,b.x), Math.max(a.y,b.y));
    }

    /**
     * creates a new Vector from a single value
     * @param {number} value the x and y value of the Vector
     * @returns {Vector2}
     */
    static from(value) {
        return new Vector2(value, value);
    }
}

/**
 * The main class for the collision detection
 */
export class Collider {
    /**
     * the position of the Collider
     * @type {Vector2}
     */
    position;
    /**
     * the offset of the collider
     * @type {Vector2}
     */
    offset;
    /**
     * the type of the collider
     * 0: BoxCollider
     * 1: CircleCollider
     * @type {number}
     */
    type;
    /**
     * the dimensions of the collider
     * @type {number | Vector2}
     */
    size;
    
    /**
     * @param {Vector2} position the position of the collider
     * @param {Vector2} offset the offset of the collider
     * @param {number | Vector2} size the size of the collider
     * @param {number} type the type of the collider (circle, rectangle)
     */
    constructor(position = Vector2.zero(), offset = Vector2.zero(), size, type = 0) {
        this.position = position;
        this.type = type;
        this.offset = offset;
        this.size = size;
    }

    /**
     * checks the collision between two colliders
     * @param {Collider} other the other collider
     * @returns {boolean}
     */
    collisionCheck(other) {
        let thisPos = Vector2.add(this.position, this.offset);
        let thisSize = this.type === 0? Vector2.divide(this.size, 2):this.size / 2;
        let otherPos = Vector2.add(other.position, other.offset);
        let otherSize = other.type === 0? Vector2.divide(other.size, 2):other.size / 2;

        if(this.type === other.type) {
            if(this.type === 0) return thisPos.x - thisSize.x < otherPos.x + otherSize.x && thisPos.y - thisSize.y < otherPos.y + otherSize.y && thisPos.x + thisSize.x > otherPos.x - otherSize.x && thisPos.y + thisSize.y > otherPos.y - otherSize.y;
            
            if(this.type === 1) return Vector2.sqrdst(thisPos, otherPos) < (thisSize + otherSize) ** 2;
            
            return false;
        }

        /**
         * @type {CircleCollider}
         */
        let circle;
        /**
         * @type {Vector2}
         */
        let circlePos;
        /**
         * @type {number}
         */
        let circleSize;
        /**
         * @type {BoxCollider}
         */
        let box;
        /**
         * @type {Vector2}
         */
        let boxPos;
        let boxSize;
        

        if(this.type === 0) { 
            box = this;
            boxPos = thisPos;
            boxSize = thisSize;
            circle = other;
            circlePos = otherPos;
            circleSize = otherSize;
        }else {
            circle = this;
            circlePos = thisPos;
            circleSize = thisSize;
            box = other;
            boxPos = otherPos;
            boxSize = otherSize;
        }
                
        let closestX = Math.min(Math.max(circlePos.x , boxPos.x - boxSize.x), boxPos.x + boxSize.x);
        let closestY = Math.min(Math.max(circlePos.y, boxPos.y - boxSize.y), boxPos.y + boxSize.y);

        let dstX = circlePos.x - closestX;
        let dstY = circlePos.y - closestY;
        let dstSqrt = dstY ** 2 + dstX ** 2;

        return dstSqrt <= circleSize ** 2;
    }
}

/**
 * creates a rectangular Collider
 */
export class BoxCollider extends Collider {
    /**
     * @param {Vector2} size the size of the collision area 
     * @param {Vector2} position the position of the collision area
     * @param {Vector2} offset the offset of the collision area
     */
    constructor(size = Vector2.one(), position = Vector2.zero(), offset) {
        super(position, offset, size, 0);
    }
}

/**
 * creates a circular collider
 */
export class CircleCollider extends Collider {

    /**
     * @param {number} size the diameter of the collision area
     * @param {Vector2} position the position of the collision area
     * @param {Vector2} offset the offset of the collision area
     */
    constructor(size = 0, position = Vector2.zero(), offset) {
        super(position, offset, size, 1);
    }
}

export class Input {
    /**
     * stores all the currently pressed keys
     * @type {string[]}
     */
    static keys = [];

    /**
     * stores all the events that will be executed when the key is pressed
     * @type {{[key:string]:[()=>{}]}}
     */
    static keyEvents = {};

    /**
     * holds the mouse information
     * @type {{pos:Vector2, buttons: number[]}}
     */
    static mouse = {pos: Vector2.zero(), buttons:[]};
    
    /**
     * sets everything up for receiving input
     */
    static setup() {
        document.addEventListener("keydown", e => {
            if(!Input.getKey(e.key)) {
                Input.keys.push(e.key);
                Input.keyEvents[e.key]?.forEach(event => event());
            }
        });
        
        document.addEventListener("keyup", e => {
            Input.keys.splice(Input.keys.indexOf(e.key),1);
        });

        document.addEventListener("mousemove", e => {
            Input.mouse.pos.set(e.clientX,e.clientY);
        });

        document.addEventListener("mousedown", e => {
            Input.mouse.buttons.push(e.button);
        });

        document.addEventListener("mouseup", e => {
            Input.mouse.buttons.splice(Input.mouse.buttons.indexOf(e.button), 1);
        });
    }

    /**
     * clears the keys array
     */
    static clear() {
        Input.keys.length = 0;
    }
    
    /**
     * checks if the given key is pressed
     * @param {string} key the key you want to check for 
     * @returns {boolean}
     */
    static getKey(key) {
        return Input.keys.includes(key);
    }

    /**
     * checks if at least one of the given keys is pressed
     * @param {string[]} keys 
     */
    static getKeyGroup(keys) {
        return keys.some(key => Input.getKey(key));
    }

    /**
     * checks if the given MouseButton is pressed
     * @param {number} button the button you searched for
     * @returns {boolean}
     */
    static getMouseButton(button) {
        return Input.mouse.buttons.includes(button);
    }

    /**
     * checks if at least one of the given keys is pressed
     * @param {number[]} buttons
     */
    static getMouseButtonGroup(buttons) {
        return buttons.some(button => Input.getMouseButton(button));
    }

    /**
     * adds an event that triggers when the given key is pressed
     * @param {string} key the key to check for
     * @param {()=>{}} callbackfn the function executed when the key is pressed
     */
    static addKeyDownEvent(key, callbackfn) {
        if(Input.keyEvents[key] == null) Input.keyEvents[key] = [];
        
        Input.keyEvents[key].push(callbackfn);
    }
}

export class Help {
    /**
     * @param {string} a 
     * @param {string} b
     * @returns {number} 
     */
    static compareGermanTextString(a,b) {
        const string = "aäbcdefghijklmnoöpqrsßtuüvwxyz";
        
        if(a.length > b.length) return 1;
        if(a.length < b.length) return -1;

        for(let i = 0; i < a.length; i++) {
            aValue = string.indexOf(a[i].toLowerCase());
            if(aValue < 0) aValue = a.charCodeAt(i);
            bValue = string.indexOf(b[i]);
            if(bValue < 0) bValue = a.charCodeAt(i);
            
            if(aValue < bValue) return -1;
            if(aValue > bValue) return 1;
        }

        return 0;
    }

    /**
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    static random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
}