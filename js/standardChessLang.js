import {Vector2} from "./libraries/main.js";

/**
 * @type {HTMLInputElement}
 */
const inputElement = document.getElementById("input");
/**
 * @type {HTMLInputElement}
 */
const outputElement = document.getElementById("output");
const runButton = document.getElementById("run");
const clearButton = document.getElementById("clear");
const fileUploadContainer = document.getElementById("file-upload");
/**
 * @type {HTMLInputElement}
 */
const fileInputElement = document.getElementById("code-file");

const LAG_TIME = 15;
const LOCAL_STORAGE_CODE_ID = "shortOCode";
const TAPE_LENGTH = 30_000;
const MAX_NUMBER = 256;

/**
 * @type {number[]}
 */
const tape = [];

let instructionIdx = 0;
let inputType = 0;
let codeIsExecuting = false;
let tapeIdx = 0;
let inputLength = 0;
/**
 * @type {number[]}
 */
let loopStarts = [];

class TokenType {
    static MOVE = 0;
    static CASTLE = 1;
    static GAME_END = -1;
    static PAWN_PROMOTION = 2;
}

class Piece {
    static PAWN = -1;
    static KNIGHT = 0;
    static BISHOP = 1;
    static ROOK = 2;
    static QUEEN = 3;
    static KING = 4;

    static pieceCharacters = "NBRQK";

    /**
     * @return {number} Defaults to Pawn
     * @param {string}string
     */
    static fromChar(string) {
        if(string === undefined || string.length === 0) return -1;
        if(string.length === 1) return Piece.pieceCharacters.indexOf(string);
    }

    /**
     * @returns {string | undefined}
     * @param {number}number
     */
    static getString(number) {
        return Piece.pieceCharacters[number];
    }
}

class Token {
    /**
     * @type {Token[]}
     */
    static tokens = [];

    /**
     * @type {number}
     */
    type;
    /**
     * @type {string}
     */
    value;

    /**
     * @return {boolean}
     * @param {Token}other
     */
    equals(other) {
        return this.value === other.value;
    }

    /**
     * @param {number} type
     * @param {string}value
     */
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    static create(type, value) {
        Token.tokens.push(new Token(type, value));
    }

    /**
     * @param {string} string
     * @return {boolean} if parsing was a success
     */
    static parseString(string) {
        Token.tokens.length = 0;

        try {
            Token.tokensFromString(string);
            return true;
        }catch (e) {
            displayError(e);
            Token.tokens.length = 0;
            return false;
        }
    }

    /**
     * creates a list of tokens based on the given string
     * @param {string} string
     */
    static tokensFromString(string) {
        let idx = 0;
        let char = "";
        let value = "";
        let hasEnd = false;

        /**
         * @returns {string | null}
         */
        function advance() {
            return char = string[idx++];
        }

        /**
         * @returns {string | null}
         */
        function retrieve() {
            return char = string[--idx-1];
        }

        /**
         *
         * @param {string} msg
         */
        function parsingError(msg) {
            throw new Error(`${msg} at character ${idx-value.length} (Parsing)\n"${value}"`);
        }

        while(advance()) {
            while(isWhitespace(advance()));
            if(isWhitespace(retrieve())) advance();

            if(char === undefined) return;

            value = char;

            while(!isWhitespace(advance())) {
                if(char === undefined) break;
                value += char;
            }
            idx--;

            if(value === '#' || value === "1/2") {
                if(hasEnd) parsingError("Game has more than one ending");

                hasEnd = true;
                Token.create(TokenType.GAME_END, value);
                continue;
            }

            if(value === "0-0" || value === "0-0-0") {
                Token.create(TokenType.CASTLE, value);
                continue;
            }

            let i = 0;
            let piece = Piece.fromChar(value[i]);
            let hasTaken = false;
            let isCheck = false;
            let position;
            let isPromotion = false;

            if(piece !== Piece.PAWN) i++;

            if(value[i] === 'x') {
                hasTaken = true;
                i++;
            }

            if((position = getPosition(value[i] + value[i+1])) === null) parsingError("Invalid move");
            i+=2;

            if(value[i] === '+') {
                isCheck = true;
                i++;
            }

            if(piece === Piece.PAWN && value[i] === '=') {
                piece = Piece.fromChar(value[i+1]);

                if(piece !== Piece.PAWN) {
                    isPromotion = true;
                    i+=2;
                }
            }

            if(value.length !== i) parsingError("Invalid move");

            if(isPromotion) PawnPromotionToken.create(value, piece, position, isCheck, hasTaken);
            else MoveToken.create(value, piece, position, isCheck, hasTaken);
        }

        if(!hasEnd) parsingError("Game has no ending");
    }
}

class MoveToken extends Token {
    /**
     * @type {number}
     */
    piece;
    /**
     * @type {Vector2}
     */
    position;
    /**
     * @type {boolean}
     */
    isCheck;
    /**
     * @type {boolean}
     */
    hasTaken;
    
    /**
     * @param {string} value
     * @param {number} piece
     * @param {Vector2} position
     * @param {boolean} isCheck
     * @param {boolean} hasTaken
     */
    constructor(value, piece, position, isCheck = false, hasTaken = false) {
        super(0, value);
        this.piece = piece;
        this.position = position;
        this.isCheck = isCheck;
        this.hasTaken = hasTaken;
    }

    static create(value, piece, position, isCheck = false, hasTaken = false) {
        Token.tokens.push(new MoveToken(value, piece, position, isCheck, hasTaken));
    }

    /**
     * @return {MoveToken}
     * @param {PawnPromotionToken}promotionMove
     */
    static from(promotionMove) {
        return new MoveToken(promotionMove.value, promotionMove.newPiece, promotionMove.position, promotionMove.isCheck, promotionMove.hasTaken)
    }
}

class PawnPromotionToken extends Token {
    /**
     * @type {Vector2}
     */
    position;
    /**
     * @type {boolean}
     */
    isCheck;
    /**
     * @type {boolean}
     */
    hasTaken;
    /**
     * @type {number}
     */
    newPiece;

    /**
     * @param {string} value
     * @param {number} newPiece
     * @param {Vector2} position
     * @param {boolean} isCheck
     * @param {boolean} hasTaken
     */
    constructor(value, newPiece, position, isCheck = false, hasTaken = false) {
        super(2, value);
        this.newPiece = newPiece;
        this.position = position;
        this.isCheck = isCheck;
        this.hasTaken = hasTaken;
    }

    static create(value, newPiece, position, isCheck = false, hasTaken = false) {
        Token.tokens.push(new PawnPromotionToken(value, newPiece, position, isCheck, hasTaken));
    }
}

class Console {
    static clear() {
        outputElement.value = "";
        outputElement.style.removeProperty("color");
    }

    /**
     * 
     * @param {string} msg 
     */
    static error(msg) {
        outputElement.value = msg;
        outputElement.style.color = "red";
    }

    /**
     * 
     * @param {any} msg
     */
    static log(msg) {
        outputElement.value += msg+"\n";
    }
}

function startExecution() {
        setInput(0);
        instructionIdx = 0;
        loopStarts = [];
        tape.length = 0;
        for(let i = 0; i < TAPE_LENGTH; i++) tape.push(0);

        Console.clear();
        outputElement.style.borderColor = "red";
        runButton.innerHTML = "Stop";
        codeIsExecuting = true;
        if(!Token.parseString(inputElement.value)) return;

        requestAnimationFrame(runCode);
    }

function runCode() {
    /**
     * @returns {Token}
     */
    function advance() {
        return instruction = Token.tokens[instructionIdx++];
    }

    /**
     * @returns {Token | undefined}
     */
    function retrieve() {
        return instruction = Token.tokens[--instructionIdx-1];
    }

    /**
     *
     * @param {string} msg
     */
    function runtimeError(msg) {
        throw new Error(`${msg} at Instruction ${instructionIdx+1} (Runtime) \n"${instruction?.value || ""}"`);
    }

    /**
     * @returns {MoveToken}
     */
    function getNextMove() {
        let token = advance();

        if(token === undefined) runtimeError("No token defined");

        switch (token.type) {
            case TokenType.MOVE:
                return token;
            case TokenType.PAWN_PROMOTION:
                return MoveToken.from(token);
            default: runtimeError("Wrong token type");
        }
    }

    function getNumberParam() {
        let nextMove = getNextMove();
        let number = nextMove.position.x*8 + nextMove.position.y;

        if(nextMove.isCheck) number += 64;
        if(nextMove.hasTaken) number += 128;

        return number;
    }

    /**
     * @param {MoveToken}move
     */
    function evaluateMove(move) {
        let positionDifference = getPositionDifference(move.position);
        let checkOrTake = move.isCheck || move.hasTaken;
        let amount = 1;
        switch (move.piece) {
            case Piece.KING:
                if(checkOrTake) amount = getNumberParam();
                if(tape[tapeIdx] > 0) break;
                if(positionDifference > 0) instructionIdx -= amount + checkOrTake;
                else if(positionDifference < 0) instructionIdx += amount;
                break;
            case Piece.QUEEN:
                switch (Math.abs(positionDifference)) {
                    case 0:
                        setTapeValue(Math.floor(Math.random() * 256));
                        break;
                    case 1:
                        if(checkOrTake) setTapeValue(tapeIdx);
                        else setTapeValue(outputElement.value.length);
                        break;
                    case 2:
                        if(tape[tapeIdx]) setTapeValue(0);
                        else setTapeValue(1);
                        break;
                    case 3:
                        if(checkOrTake) setTapeValue(getNumberParam());
                        else setTapeValue(0);
                        break;
                    case 4:
                        break;
                    case 5:
                        break;
                }
                break;
            case Piece.ROOK:

                //calculate move amount
                if(checkOrTake) amount = getNumberParam();

                if(positionDifference > 0) changeTapeIdx(-amount);
                else if(positionDifference < 0) changeTapeIdx(amount);

                break;
            case Piece.BISHOP:
                if(positionDifference > 0) {
                    if(checkOrTake) setInput(2);
                    else setInput(1);
                    break;
                }else if(positionDifference < 0) {
                    if(checkOrTake) outputElement.value += tape[tapeIdx];
                    else outputElement.value += String.fromCharCode(tape[tapeIdx]);
                }else {
                    if(checkOrTake) amount = getNumberParam();
                    if(amount === 0) {
                        setTapeValue(outputElement.value.charCodeAt(0))
                        outputElement.value = "";
                        break;
                    }
                    setTapeValue(outputElement.value.charCodeAt(outputElement.value.length-amount));
                    outputElement.value = outputElement.value.slice(0,-amount);
                }
                break;
            case Piece.KNIGHT:
                if(checkOrTake) amount = getNumberParam();

                if(positionDifference > 0) changeTapeValue(-amount);
                else if(positionDifference < 0) changeTapeValue(amount);
                break;
        }
    }

    /**
     * @type {Token}
     */
    let instruction;
    try {
        let startTime = Date.now();
        while(advance()) {
            if(!codeIsExecuting) break;

            if(instruction.type === TokenType.GAME_END) break;

            if(instruction.type === TokenType.MOVE) {
                evaluateMove(instruction);
            }else if(instruction.type === TokenType.PAWN_PROMOTION) {
                evaluateMove(MoveToken.from(instruction));
                continue;
            }else if(instruction.type === TokenType.CASTLE) {
                if(instruction.value.length === 5) {
                    if(loopStarts.length === 0) runtimeError("No Start of Loop");
                    instructionIdx = loopStarts.pop();
                }

                loopStarts.push(instructionIdx);
            }

            if(inputType) return;
            if(Date.now() > LAG_TIME + startTime) {
                requestAnimationFrame(runCode);
                return;
            }
        }

        if(instruction === undefined) {
            retrieve();
            runtimeError("The Game does not have a result");
        }
        terminateCode();
    }catch(e) {
        displayError(e);
    }
}

/**
 * @param {number}type 0: no input
 */
function setInput(type) {
    if(type === inputType) return;

    if(inputLength > 0) {
        outputElement.value = outputElement.value.slice(0, -inputLength);
        inputLength = 0;
    }

    inputType = type;
}

function changeTapeIdx(amount) {
    tapeIdx += amount;
    tapeIdx %= tape.length;

    if(tapeIdx < 0) tapeIdx += tape.length;
}

function changeTapeValue(amount) {
    tape[tapeIdx] += amount;
    tape[tapeIdx] %= MAX_NUMBER;

    if(tape[tapeIdx] < 0) tape[tapeIdx] += MAX_NUMBER;
}

/**
 * @param {number}amount
 */
function setTapeValue(amount) {
    if(!isFinite(amount)) amount = 0;
    amount %= MAX_NUMBER;
    if(amount < 0) amount += MAX_NUMBER;

    tape[tapeIdx] = amount;
}

/**
 * returns x - y
 * @param {Vector2}position
 * @returns {number}
 */
function getPositionDifference(position) {
    return position.x - position.y;
}

/**
 * @param {string} msg
 */
function displayError(msg) {
    console.error(msg);
    Console.error(msg);
    terminateCode();
}

/**
 * @param {string} char 
 * @returns {boolean}
 */
function isWhitespace(char) {
    return /\s/g.test(char);
}

/**
 * @param {string} string
 * @returns {Vector2 | null}
 */
function getPosition(string) {
    if(string.length !== 2) return null;

    let position = new Vector2(string.charCodeAt(0) - 'a'.charCodeAt(0), string[1]-1);

    if(position.x < 8 && position.y < 8 && position.x >= 0 && position.y >= 0) return position;
    return null;
}

function terminateCode() {
    outputElement.style.removeProperty("border-color");
    codeIsExecuting = false;
    runButton.innerHTML = "Run";
    tape.length = 0;
}

runButton.addEventListener("click", () => {
    if(codeIsExecuting) terminateCode();
    else startExecution();
});
clearButton.addEventListener("click", () => {
    Console.clear();
});
fileUploadContainer.addEventListener("click", () => fileInputElement.click());
fileInputElement.addEventListener("change", async () => {
    let file = fileInputElement.files[0];
    let fr = new FileReader();
    
    if(file == null) return;

    fr.onload = () =>{
        inputElement.value = fr.result.toString();
    }
    
    fr.readAsText(file);
});
inputElement.addEventListener("change", () => {
    localStorage.setItem(LOCAL_STORAGE_CODE_ID, inputElement.value);
});
document.addEventListener("keydown", e => {
    let key = e.key;

    if(!codeIsExecuting) return;

    if(key === "Escape") {
        terminateCode();
        return;
    }

    if(inputType && document.activeElement === outputElement) {
        e.preventDefault();
        if(key === "Enter") key = "\n";
        if(key === "Tab") key = "\t";
        if(key === "Delete" || key === "Backspace") key = "\b";

        if(key.length > 1) return;

        if(inputType === 1) {
            setTapeValue(key.charCodeAt(0));
            setInput(0);
            requestAnimationFrame(runCode);
            return;
        }

        if(key === '\n') {
            if(inputLength === 0) setTapeValue(0);
            else setTapeValue(parseInt(outputElement.value.slice(-inputLength)));

            setInput(0);
            requestAnimationFrame(runCode);
            return;
        }

        if(key >= '0' && key <= '9') {
            outputElement.value += key;
            inputLength++;
        }
    }
});

inputElement.value = localStorage.getItem(LOCAL_STORAGE_CODE_ID) || "";