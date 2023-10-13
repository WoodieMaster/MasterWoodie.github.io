/* Lang idea:

- 1 command per line
- end of line: -> <number>
    -> moves to the line given by that number
- $<name> for variable, #<name> for constant
- scream, say, whisper to print text to console (scream: all uppercase, whisper: all lowercase)
- data types: int, string
- write number: ~ + hexadecimal encoding
- use ~ to convert string into number (default 0)
- truthy: true, !0, "adsdo"
- falsy: false, 0, ""
- no booleans can be stored! (changes to 0 | 1)
- empty lines are ignored
*/

/**
 * @type {HTMLInputElement}
 */
const input = document.getElementById("input");
/**
 * @type {HTMLInputElement}
 */
const output = document.getElementById("output");
const runButton = document.getElementById("run");
const clearButton = document.getElementById("clear");
const fileUploadContainer = document.getElementById("file-upload");
/**
 * @type {HTMLInputElement}
 */
const fileInput = document.getElementById("code-file");

const STRING_INDICATOR = '"';
const NUMBER_INDICATOR = '~';
const VARIABLE_INDICATOR = '$';
const CONST_INDICATOR = '#';
const DATA_INDICATOR = '@';


const varibleNames = [];
const variableData = [];

const constNames = [];
const constData = [];


class TokenType {
    static KEY = 0;
    static VALUE = 1;
    static VARIABLE = 2;
    static CONSTANT = 3;
    static INFO = 4;
    static OPERATOR = 5;
    static OPEN_BRACKET = 6;
    static CLOSED_BRACKET = 7;
    static END_OF_COMMAND = 8;

    static tokenNames = [
        "KEY",
        "VAL",
        "VAR",
        "CON",
        "INF",
        "OPR",
        "OBR",
        "CBR",
        "EOC"
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
    
    /**
     * @param {number} type
     * @param {string | number} value 
     */
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    isConstantData() {
        return this.type === TokenType.VALUE || this.type === TokenType.CONSTANT;
    }

    toString() {
        return this.value;
    }

    /**
     * @param {number} type
     * @param {string | number} value
     * @returns {boolean}
     */
    is(type, value) {
        return this.type === type && this.value === value;
    }

    /**
     * @param {string} string
     * @returns {Token[][]} 
     */
    static parseString(string) {
        /**
         * @type {Token[][]}
         */
        const commands = [];

        /**
         * @param {string} msg
         * @param {number} line
         */
        function error(msg, line) {
            msg += ` at line ${line}`;

            Console.error(msg);

            throw new Error(msg);
        }

        varibleNames.length = 0;
        variableData.length = 0;
        constNames.length = 0;
        constData.length = 0;

        let lines = string.split("\n");
        for(let i = 0; i < lines.length; i++) {
            try {
                commands.push(Token.commandFromString(lines[i]));
            }catch (e) {
                error(e, i+1);
            }
        }

        for(let i = commands.length-1; i >= 0; i--) {
            let command = commands[i];
            
            if(command.length === 0) commands.splice(i, 1);
        }

        for(let i = 0; i < lines.length; i++)  {
            try {
                Token.improveVariables(commands[i]);
            }catch (e) {
                error(e, i+1);
            }
        }

        return commands;
    }

    /**
     * creates a list of tokens base on the given string
     * @param {string} line
     * @returns {Token[]} list of tokens
     */
    static commandFromString(line) {
        let tokens = [];
        let idx = 0;
        let char = "";

        /**
         * @returns {string | null}
         */
        function advance() {
            return char = line[idx++];
        }

        function retrieve() {
            idx--;
            return char = line[idx-1];
        }

        while(advance()) {
            let currentValue;

            if(char === '/') {
                if(advance() === '/') return tokens;
                retrieve();
            }

            if(isWhitespace(char)) {                
                // noinspection StatementWithEmptyBodyJS
                while(isWhitespace(advance()));
                retrieve();

                continue;
            }
            
            if(isKeyChar(char)){
                currentValue = char;
                
                while(isKeyChar(advance())) {
                    currentValue += char;
                }
                retrieve();
                tokens.push(new Token(TokenType.KEY, currentValue));
                continue;
            }

            if(char === STRING_INDICATOR) {
                currentValue = "";

                while(advance() && char !== STRING_INDICATOR) {
                    if(char === "\\") {
                        advance();
                        switch(char) {
                            case "n":
                                currentValue += "\n";
                                break;
                            default:
                                currentValue += char;
                        }
                        continue;
                    }
                    currentValue += char;
                }

                if(char !== STRING_INDICATOR) throw "Type Error: Incomplete string";

                tokens.push(new Token(TokenType.VALUE, currentValue));
                continue;
            }

            if(char === NUMBER_INDICATOR) {
                currentValue = "";

                while(isDigit(advance())) {
                    currentValue += char;
                }
                retrieve();

                tokens.push(new Token(TokenType.VALUE, parseInt(currentValue, 16)));
                continue;
            }

            if(char === VARIABLE_INDICATOR) {
                currentValue = "";
                
                while(isKeyChar(advance())) {
                    currentValue += char;
                }
                retrieve();
                tokens.push(new Token(TokenType.VARIABLE, currentValue));
                continue;
            }

            if(char === CONST_INDICATOR) {
                currentValue = "";
                
                while(isKeyChar(advance())) {
                    currentValue += char;
                }
                retrieve();

                tokens.push(new Token(TokenType.CONSTANT, currentValue));
                continue;
            }

            if(char === DATA_INDICATOR) {
                currentValue = "";
                
                while(isKeyChar(advance())) {
                    currentValue += char;
                }
                retrieve();

                tokens.push(new Token(TokenType.INFO, currentValue));
                continue;
            }

            if(isOperator(char)) {
                currentValue = char;

                switch(char) {
                    case '-':
                        if(advance() === '>') {
                            tokens.push(new Token(TokenType.END_OF_COMMAND, undefined));
                            continue;
                        }
                        retrieve();
                        break;
                }

                tokens.push(new Token(TokenType.OPERATOR, currentValue));
                continue;
            }

            if(isBracket(char)) {
                if("[(".includes(char)) tokens.push(new Token(TokenType.OPEN_BRACKET, char));
                else tokens.push(new Token(TokenType.CLOSED_BRACKET, char));

                continue;
            }

            throw `Invalid character ${char}`;
        }

        return tokens;
    }

    /**
     * @param {Token[]} tokens
     */
    static improveVariables(tokens) {
        for(let i = 0; i < tokens.length; i++) {
            if(tokens[i].type === TokenType.VARIABLE) {
                if(!varibleNames.includes(tokens[i].value)) {
                    varibleNames.push(tokens[i].value);
                    variableData.push(undefined);
                }
                tokens[i].value = varibleNames.indexOf(tokens[i].value);
                continue;
            }

            if(tokens[i].type === TokenType.CONSTANT) {
                parseConstant(tokens, i);
            }
        }
    }
}

/**
 * turns a constant into a normal value
 * @param {Token[]} tokens
 * @param {number} constIdx
 */
function parseConstant(tokens, constIdx) {
    let constToken = tokens[constIdx];
    

    if(tokens[constIdx+1]?.is(TokenType.OPERATOR, ":")) {
        let valueToken = tokens[constIdx+2];
        if(valueToken == null) throw `incomplete command`;
        if(constNames.includes(constToken.value)) throw `constant ${constToken.value} has already been defined`;
        if(!valueToken.isConstantData()) throw `constant ${constToken.value} cannot be assigned to ${valueToken.value}`;
        
        if(valueToken.type === TokenType.CONSTANT) parseConstant(tokens, constIdx+2);

        constNames.push(constToken.value);
        constData.push(valueToken.value);
        
        constToken.type = TokenType.VALUE;
        constToken.value = valueToken.value;
        tokens.splice(constIdx+1, 2);
        return;
    }

    if(!constNames.includes(constToken.value)) throw `constant ${constToken.value} has not been defined`;

    constToken.type = TokenType.VALUE;
    constToken.value = constData[constNames.indexOf(constToken.value)];
}

class Console {
    static clear() {
        output.value = "";
        output.style.removeProperty("color");
    }

    /**
     * 
     * @param {string} msg 
     */
    static error(msg) {
        output.value = msg;
        output.style.color = "red";
    }

    /**
     * 
     * @param {string} msg 
     */
    static log(msg) {
        output.value += msg+"\n";
    }
}

/**
 * @param {string} char 
 * @returns {boolean | null}
 */
function isWhitespace(char) {
    if(char == null) return null;

    return /\s/g.test(char);
}

/**
 * 
 * @param {string} char 
 */
function isKeyChar(char) {
    if(char == null) return null;
    
    return "abcdefghiklmnopqrstuvwxyz0123456789_".includes(char.toLowerCase());
}

/**
 * @param {string} char 
 */
function isDigit(char) {
    if(char == null) return null;

    return "0123456789abcdef".includes(char.toLowerCase());
}

/**
 * @param {string} char 
 */
function isOperator(char) {
    if(char == null) return null;

    return "!/*+-=%:".includes(char);
}

/**
 * @param {string} char 
 */
function isBracket(char) {
    if(char == null) return null;

    return "[]()".includes(char);
}

/**
 * @param {Token[][]} commands
 */
function printTokenList(commands) {
    if(commands == null) return;
    Console.log("-------------------------------------");
    commands.forEach(tokens => {
        tokens.forEach(token => {
            let value = token.value;
            switch(token.type) {
                case TokenType.VALUE:
                    if(typeof token.value === "string") value = deString(value);
                    else value = "~" + value;
                    break;
                case TokenType.END_OF_COMMAND:
                    Console.log(TokenType.tokenNames[TokenType.END_OF_COMMAND]);
                    return;
            }

            Console.log(TokenType.tokenNames[token.type] + ": " + value);
        });
        Console.log("-------------------------------------");
    });
}

/**
 * @param {Token[][]} commands
 */
function printTokenText(commands) {
    if(commands == null) return;

    commands.forEach(tokens => {
        Console.log(tokens.reduce((val, token) => {
            let value = token.value;

            switch(token.type) {
                case TokenType.VALUE:
                    if(typeof token.value === "string") value = deString(value);
                    else value = "~" + value;
                    break;
                case TokenType.END_OF_COMMAND:
                    value =  "EOC";
                    break;
                case TokenType.VARIABLE:
                    value = '$' + value;
                    break;
            }
            
            return val + value + " ";
        }, ""));
        console.log("---");
    });
}

/**
 * @param {string} string
 * @returns {string}
 */
function deString(string) {
    return '"' + string.replace("\n", "\\n").replace("\"", "\\\"") + '"';
}

runButton.addEventListener("click", () => {
    Console.clear();
    let commands = Token.parseString(input.value);
    printTokenText(commands);
    printTokenList(commands);
});
clearButton.addEventListener("click", () => {
    Console.clear();
});
fileInput.addEventListener("change", async () => {
    let file = fileInput.files[0];
    let fr = new FileReader();
    
    if(file == null) return;

    fr.onload = () => {
        if(fr.result instanceof String) input.value = fr.result;
    }
    fr.readAsText(file);
});
fileUploadContainer.addEventListener("click", () => fileInput.click());