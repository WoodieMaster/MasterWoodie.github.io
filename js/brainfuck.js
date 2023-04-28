const input = document.getElementById("input");
const output = document.getElementById("output");
const runButton = document.getElementById("run");
const fileUploadContainer = document.getElementById("file-upload");
/**
 * @type {HTMLInputElement}
 */
const fileInput = document.getElementById("code-file");
/**
 * stores 30_000 items of one byte
 * @type {Uint8Array} */
let array;
/**
 * stores the positions of all passed loops ('[')
 * @type {number[]} */
const loopMarker = [];

let needsInput = false;
let inputText = "";
let currentCode = "";
let codeIdx = 0;
let arrayIdx = 0;
let isRunning = false;

/**removes first char from string and returns it*/
function nextChar() {
    return currentCode[codeIdx++];
}

/**interprets the brainfuck code*/
function interpret() {
    if(!isRunning) return;
    const startTime = Date.now();
    while(codeIdx < currentCode.length) {
        switch(nextChar()) {
            case '>':
                arrayIdx++;
                arrayIdx %= array.length;
                break;
            case '<':
                arrayIdx--;
                arrayIdx < 0 && (arrayIdx = array.length + arrayIdx);
                break;
            case '.':
                console.log(array[arrayIdx]);
                output.value += String.fromCharCode(array[arrayIdx]);
                break;
            case '+':
                array[arrayIdx]++;
                break;
            case '-':
                array[arrayIdx]--;
                break;
            case ',':
                needsInput = true;
                return;
            case '[':
                loopMarker.push(codeIdx-1);
                break;
            case ']':
                let idx = loopMarker.pop();
                if(idx != undefined && array[arrayIdx] != 0)
                    codeIdx = idx;

                requestAnimationFrame(interpret);
                return;
            default:
                break;
        }
    }
    codeFinished();
}

function codeFinished() {
    array = null;
    output.style.removeProperty("border-color");
    needsInput = false;
    isRunning = false;
    runButton.innerHTML = "Run";
}

/**
 * sets value of current element in array
 * @param {number} character the value that gets written to the current element in array
 */
function setInput(character) {
    array[arrayIdx] = character;
    interpret();
}

function run() {
    runButton.innerHTML = "Stop";
    array = new Uint8Array(30_000);
    needsInput = false;
    inputText = "";
    codeIdx = 0;
    arrayIdx = 0;
    isRunning = true;
    currentCode = input.value;
    output.value = "";
    output.style.borderColor = "red";
    loopMarker.length = 0;
    setTimeout(interpret,100);
}

runButton.addEventListener("click", () => {
    if(isRunning) codeFinished();
    else run();
});
document.getElementById("clear").addEventListener("click", () => {
    codeFinished();
    output.value = "";
});
fileUploadContainer.addEventListener("click", e => fileInput.click());
fileInput.addEventListener("change", async e => {
    let file = fileInput.files[0];
    let fr = new FileReader();
    
    if(file == null) return;

    fr.onload = () =>{
      input.value = fr.result;
    }
    fr.readAsText(file);
});
document.addEventListener("keydown", (e) => {
    let charCode = 0;
    switch(e.key) {
        case "Escape":
            codeFinished();
            return;
        case "Enter":
            charCode = 10;
            break;
        default:
            if(e.key.length == 1) charCode = e.key.charCodeAt(0);
            else return;
            break;
    }

    if(needsInput && document.activeElement === output) setInput(charCode);
});