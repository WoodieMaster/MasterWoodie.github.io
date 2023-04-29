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

const LETTER_VALUE_START = "a".charCodeAt(0);
const DIGIT_VALUE_START = "0".charCodeAt(0);

/**
 * @type {[string|number]}
 */
const stack = [];

let marker = {};
let instructionIdx = 0;
let waitForInput = 0;
let inputLength = 0;
let codeIsExecuting = false;

/**
 * @returns {string | number}
 */
function popFromStack() {
    let val = stack.pop();
    if(val == undefined) throw "There is no value to pop from stack";
    return val;
}
const operators = {
    '+': () => {
        let right = popFromStack();
        let left = popFromStack();

        let value = left + right;
        
        if(typeof value === "number") value = checkNumber(value);
        
        stack.push(value);
    },
    '-': () => {
        let right = popFromStack();
        let left = popFromStack();
        if(typeof right === typeof left) {
            if(typeof right === "string") {
                stack.push(left.replaceAll(right, ""));
                return;
            }

            stack.push(checkNumber(left - right));
            return;
        }
        
        if(typeof right === "string") {
            stack.push(right.substring(left));
            return;
        }

        stack.push(left.substring(0, left.length-right));
    },
    '*': () => {
        let right = popFromStack();
        let left = popFromStack();
        if(typeof right === typeof left) {
            if(typeof right === "string") {
                stack.push("N/A");
                return;
            }

            stack.push(checkNumber(left * right));
            return;
        }
        
        if(typeof right === "string") {
            left = Math.abs(left);
            stack.push(right.repeat(left));
            return;
        }

        right = Math.abs(right);
        stack.push(left.repeat(right));
    },
    '/': () => {
        let right = popFromStack();
        let left = popFromStack();
        if(typeof right === typeof left && typeof right === "number") {

            stack.push(checkNumber(left / right));
            return;
        }

        stack.push("N/A");
    },
    '%': () => {
        let right = popFromStack();
        let left = popFromStack();
        if(typeof right === typeof left && typeof right === "number") {
            stack.push(checkNumber(left % right));
            return;
        }

        stack.push("N/A");
    },
    '~': () => {
        let value = popFromStack();

        if(typeof value === "number") {
            stack.push(value);
            return;
        }

        stack.push(checkNumber(parseFloat(value)));
    },
    '\'': () => {
        let value = popFromStack();

        if(typeof value === "string") stack.push(value);
        else stack.push(String.fromCharCode(Math.abs(value)))
    },
    ',': () => {outputElement.value += popFromStack()},
    '!': () => {stack.push(+!popFromStack())},
    'X': () => {popFromStack()},
    '^': () => {
        let i = popFromStack();
        let val = popFromStack();
        
        if(typeof i === 'string') i = i.length;

        while(i-- > 0) stack.push(val);
    },
    'S': () => {stack.push(popFromStack().toString())},
    'N': () => {
        let val = popFromStack();
        if(typeof val === "number") {
            stack.push(val);
            return;
        }

        for(let i = 0; i < val.length; i++) {
            stack.push(val.charCodeAt(i));
        }
    },
    '>': () => {
        let amount = popFromStack();

        if(typeof amount === "string") amount = amount.length;

        if(popFromStack()) instructionIdx += amount;
    },
    '.': () => {
        setInput(1);
    },
    '=': () => {
        let right = popFromStack();
        let left = popFromStack();
        if(typeof left === typeof right) {
            if(left < right) stack.push(-1);
            else if(left > right) stack.push(1);
            else stack.push(0);
            return;
        }
        
        if(typeof left === "string") stack.push(1);
        else stack.push(-1); 
    },
    'v': () => {
        let length = popFromStack();
        let values = [];

        if(typeof length === "string") length = length.length;

        while(length-- > 0) {
            values.push(popFromStack());
        }

        stack.push(...values);
    },
    '_': () => {
       setInput(2);
    },
    ':': () => {
        setInput(3);
    },
    'D': () => {
        let amount = popFromStack();
        if(typeof amount === "string") {
            amount = amount.length;
        }

        outputElement.value = outputElement.value.substring(0, outputElement.value.length-amount);
    },
    'T': () => {stack.push(typeof popFromStack() === "string"?1:0)},
    'C': () => {outputElement.value = ""},
    'L': () => {
        let value = popFromStack();
        
        if(typeof value === "string") {
            stack.push(value.length);
            return;
        }

        let count = 1;
        value = Math.abs(Math.floor(value));
        while(value >= 10) {
            count++;
            value = Math.floor(value/10);
        }

        stack.push(count);
    },
    '|': () => {stack.push(+!!(popFromStack() || popFromStack()))},
    '&': () => {stack.push(+!!(popFromStack() && popFromStack()))},
    '?': () => {stack.push(Math.random())},
    '°': () => {
        let value = popFromStack();

        if(typeof value === 'string') {
            stack.push(value);
            return;
        }

        stack.push(Math.floor(value));
    },
    'l': () => {stack.push(stack.length)}
}

class SpecialCharacter {
    static TEXT_BREAK = "\"$#;";

    static STRING = SpecialCharacter.TEXT_BREAK[0];
    static CODE_BLOCK = SpecialCharacter.TEXT_BREAK[1];
    static MARKER = SpecialCharacter.TEXT_BREAK[2];
    static END = SpecialCharacter.TEXT_BREAK[3];
    static ESCAPE = '\\';
    static COMMENT = '/';
}

class TokenType {
    static TEXT = 0;
    static VALUE = 1;
    static OPERATOR = 2;
    static JUMP = 3;

    static tokenNames = [
        "TXT",
        "VAL",
        "OPR",
        "JMP"
    ]
}

class Token {
    /**
     * @type {number}
     */
    type;
    /**
     * @type {string | number}
     */
    value;

    static tokens = [];
    
    /**
     * @param {number} type 
     * @param {string | number} value 
     */
    constructor(type, value) {
        this.type = type;
        this.value = value;

        Token.tokens.push(this);
    }

    /**
     * @param {string} type 
     * @param {string | number} value
     * @returns {boolean}
     */
    is(type, value) {
        return this.type === type && this.value === value;
    }

    /**
     * @param {string} string
     */
    static parseString(string) {

        marker = {};
        stack.length = 0;
        Token.tokens.length = 0;

        try {
            Token.tokensFromString(string);
        }catch (e) {
            displayError(e);
            Token.tokens.length = 0;
            return;
        }
    }

    /**
     * creates a list of tokens base on the given string
     * @param {string} string
     */
    static tokensFromString(string) {
        let idx = 0;
        let char = "";

        /**
         * @returns {string | null}
         */
        function advance() {
            return char = string[idx++];
        }

        /**
         * 
         * @param {string} msg 
         */
        function parsingError(msg) {
            throw new Error(`${msg} at character ${idx} (Parsing)\n"${string.substring(Math.max(0, idx-10), Math.min(string.length-1,idx+10))}"`);
        }

        while(advance()) {
            let currentValue = "";

            if(char === SpecialCharacter.MARKER) {
                while(advance() !== SpecialCharacter.END) {
                    if(char == undefined) parsingError("Marker has no defined ending");
                    
                    currentValue += char;
                }
                if(marker[currentValue] != undefined) parsingError(`The marker "${currentValue}" has already been set`);

                marker[currentValue] = Token.tokens.length;
                continue;
            }

            if(char === SpecialCharacter.CODE_BLOCK) {
                while(advance() !== SpecialCharacter.END) {
                    if(char == undefined) parsingError("Code Block has no defined error");
                    currentValue = "";

                    if(char === SpecialCharacter.STRING) {
                        while(advance() !== SpecialCharacter.STRING) {
                            if(!char) parsingError(`String isn't stopped`);
                            if(char === SpecialCharacter.ESCAPE) {
                                if(!advance()) parsingError(`String isn't stopped`);
                                
                                if(char === 'n') char = '\n';
                                else if(char === 't') char = '\t';
                            } 
                            
                            currentValue += char;
                        }
                        new Token(TokenType.VALUE, currentValue);
                        continue;
                    }

                    if(isDigit(char)) {
                        let isFloat = false;
                        
                        currentValue = char;
                        
                        while(isDigit(advance()) || char === '.') {
                            if(char === '.') {
                                if(isFloat) break;

                                isFloat = true;
                            }

                            currentValue += char;
                        }
                        idx--;

                        new Token(TokenType.VALUE, parseFloat(currentValue));
                        continue;
                    }

                    if(Object.keys(operators).includes(char)) {
                        new Token(TokenType.OPERATOR, char);
                        continue;
                    }

                    if(char === SpecialCharacter.MARKER) {
                        while(advance() !== SpecialCharacter.END) {
                            if(char == undefined) parsingError(`String isn't stopped`);("Marker has no defined ending");
                            
                            currentValue += char;
                        }
                                
                        new Token(TokenType.JUMP, currentValue);
                        continue;
                    }

                    if(isWhitespace(char)) {
                        while(isWhitespace(advance()));
                        idx--;
                        continue;
                    };

                    parsingError(`Invalid character ${char}`);
                }
                continue;
            }

            while(!SpecialCharacter.TEXT_BREAK.includes(char)) {
                if(char === SpecialCharacter.COMMENT) {
                    if(advance() === SpecialCharacter.COMMENT) {
                        while(advance() && char !== '\n');
                        if(!char) break;
                    }else {
                        idx--;
                        char = SpecialCharacter.COMMENT;
                    }
                }

                if(char === SpecialCharacter.ESCAPE) {
                    if(!advance()) parsingError(`No escaped character defined`);
                };
                
                currentValue += char;
                
                if(!advance()) break;
            }
            idx--;

            new Token(TokenType.TEXT, currentValue);
        }
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
     * @param {string} msg 
     */
    static log(msg) {
        outputElement.value += msg+"\n";
    }
}

function startExecution() {
    setInput(0);
    instructionIdx = 0;
    stack.length = 0;

    Console.clear();
    outputElement.style.borderColor = "red";
    runButton.innerHTML = "Stop";
    codeIsExecuting = true;
    Token.parseString(inputElement.value);

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
     * 
     * @param {string} msg 
     */
    function runtimeError(msg) {
        throw new Error(`${msg} at Instruction ${instructionIdx+1} (Runtime) \n[${TokenType.tokenNames[instruction.type]}: ${instruction.value}]`);
    }

    /**
     * @type {Token}
     */
    let instruction;
    try {
        while(advance()) {
            if(!codeIsExecuting) break;

            if(instruction.type === TokenType.TEXT) {
                outputElement.value += instruction.value;
                continue;
            }
    
            if(instruction.type === TokenType.VALUE) {
                if(typeof instruction.value === "number") stack.push(checkNumber(instruction.value));
                else stack.push(instruction.value);
                
                continue;
            }
    
            if(instruction.type === TokenType.JUMP) {
                if(marker[instruction.value] == undefined) runtimeError(`No marker for "${instruction.value}" detected`);
                instructionIdx = marker[instruction.value];
                requestAnimationFrame(runCode);
                return;
            }
    
            if(instruction.type === TokenType.OPERATOR) {
                try {
                    operators[instruction.value]();
                }catch(e) {
                    runtimeError(e);
                }
            }
    
            if(waitForInput) return;
        }
        terminateCode();
    }catch(e) {
        displayError(e);
    }
}

/**
 * @param {number} number 
 * @returns {string | number}
 */
function checkNumber(number) {
    if(isNaN(number)) return "N/A";
    if(number > Number.MAX_VALUE) return "Infinity";
    if(number < -Number.MAX_VALUE) return "-Infinity";
    return number;
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
function isLetterOrUnderscore(char) {
    let charVal = char.charCodeAt(0);

    return char === "_" || (charVal >= LETTER_VALUE_START && charVal < LETTER_VALUE_START + 26);
}

/**
 * @param {string} char 
 * @returns {boolean}
 */
function isWhitespace(char) {
    return /\s/g.test(char);
}

/**
 * 
 * @param {string} char
 * @returns {boolean} 
 */
function isDigit(char) {
    let charVal = char.charCodeAt(0);

    return charVal >= DIGIT_VALUE_START && charVal < DIGIT_VALUE_START + 10;
}

/**
 * @param {Token[]} tokens
 */
function printTokenList(tokens) {
    if(tokens == null) return;
    
    tokens.forEach(token => {
        let value = token.value;
        if(token.type === TokenType.VALUE || token.type === TokenType.TEXT) {
                if(typeof token.value === "string") value = deString(value);
        }

        Console.log(TokenType.tokenNames[token.type] + ": " + value);
    });

    Console.log("------------");
    Object.keys(marker).forEach(key => {
        Console.log(`${key}: ${marker[key]}`);
    });

}

/**
 * @param {string} string
 * @returns {string}
 */
function deString(string) {
    return '"' + string.replace("\n", "\\n").replace("\"", "\\\"") + '"';
}

/**
 * @param {number} type 0: no Input, 1: single character, 2: string 
 */
function setInput(type) {
    inputLength = 0;
    waitForInput = type;
}

function terminateCode() {
    outputElement.style.removeProperty("border-color");
    codeIsExecuting = false;
    setInput(0);
    runButton.innerHTML = "Run";
}

runButton.addEventListener("click", () => {
    if(codeIsExecuting) terminateCode();
    else startExecution();
});
clearButton.addEventListener("click", e => {
    Console.clear();
});
fileUploadContainer.addEventListener("click", e => fileInputElement.click());
fileInputElement.addEventListener("change", async e => {
    let file = fileInputElement.files[0];
    let fr = new FileReader();
    
    if(file == null) return;

    fr.onload = () =>{
        inputElement.value = fr.result;
    }
    
    fr.readAsText(file);
});
document.addEventListener("keydown", e => {
    if(!codeIsExecuting) return;

    let key = e.key;
    if(key === "Escape") {
        terminateCode();
        return;
    }

    if(waitForInput && outputElement === document.activeElement) {
        e.preventDefault();
        if(key === "Enter") key = "\n";
        if(key === "Tab") key = "\t";
        if(key === "Delete" || key === "Backspace") key = "\b";

        if(key.length === 1) {
            if(waitForInput === 1) {
                stack.push(key);
                setInput(0);
                requestAnimationFrame(runCode);
                return;
            }

            if(key === "\b") {
                if(inputLength > 0) {
                    inputLength--;
                    outputElement.value = outputElement.value.substring(0, outputElement.value.length-1);
                }
                return;
            }

            if(waitForInput === 2) {
                if(key === "\n") {
                    stack.push(outputElement.value.substring(outputElement.value.length-inputLength, outputElement.value.length));
                    setInput(0);
                    requestAnimationFrame(runCode);
                    return;
                }
    
                inputLength++;
                outputElement.value += key;

                return;
            }

            if(key === "\n") {
                stack.push(parseFloat(outputElement.value.substring(outputElement.value.length-inputLength, outputElement.value.length)));
                setInput(0);
                requestAnimationFrame(runCode);
                return;
            }

            if(isDigit(key) || (key === '-' && inputLength === 0) || (key === '.' && !outputElement.value.substring(outputElement.value.length-inputLength, outputElement.value.length).includes('.'))) {
                inputLength++;
                outputElement.value += key;
                return;
            }
        }
        
    }

});
document.querySelector("#info p").innerHTML = `Interpreter Info:<br>
    Max number: ${Number.MAX_SAFE_INTEGER}<br>
    Min number: ${Number.MIN_SAFE_INTEGER}`;
