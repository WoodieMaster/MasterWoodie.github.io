import {Html} from "./libraries/main.js";

/***************************************************************************************************************
Nav Bar
****************************************************************************************************************/
const fileName = window.location.pathname.split("/").at(-1);

/**
 * @param {[{type: string, content: string | [{content: string, text:string}], text:string}]} data
 */
function setNavBar(data) {
    let navBar = document.querySelector("nav");
    if(navBar == null) {
        navBar = document.createElement("nav");
        document.body.insertBefore(navBar, document.body.firstChild);
    }

    navBar.innerHTML = '<ul class="nav"></ul>';
    const navList = navBar.children[0];
    let currentLinkFound = false;
    data.forEach(e => {
        let newItem;
        if(e.type === "link") {
            newItem = Html.createElement("li", {attributes:{class:"nav-item"},innerHTML: '<a class="nav-link" href=""></a>'});
            newItem.children[0].innerHTML = e.text;
            newItem.children[0].setAttribute("href", e.content);

            const linkedFile = e.content.split("/").at(-1);
            if(!currentLinkFound && linkedFile === fileName) {
                newItem.className = "activeNav";
                newItem.children[0].setAttribute("href","#");
                currentLinkFound = true;
            }
        }else if(e.type === "dropdown") {
            newItem = Html.createElement("li", {attributes:{class:"nav-item"},innerHTML: `<div class="dropdown">
            <a class="nav-link" href=""></a>
            <ul class="dropdown-content"></ul>
            </div>`});
            newItem.children[0].children[0].innerHTML = e.text;
            
            e.content.forEach(e2 => {
                let newDropItem = Html.createElement("li", {attributes:{class:"dropdown-item"},innerHTML: '<a class="dropdown-link" href=""></a>'});
                newDropItem.children[0].innerHTML = e2.text;
                newDropItem.children[0].setAttribute("href", e2.content);
                

                const linkedFile = e2.content.split("/").at(-1);
                if(!currentLinkFound && linkedFile === fileName) {
                    newItem.className = "activeNav";
                    newDropItem.className = "dropdown-item-selected";
                    newDropItem.children[0].setAttribute("href","#");
                    currentLinkFound = true;
                }

                newItem.children[0].children[1].appendChild(newDropItem);
            });
        }

        navList.appendChild(newItem);
    });
}

fetch("json/navBar.json").then((response) => {
    return response.json();
  })
  .then((data) => {
    setNavBar(data);
});

/***************************************************************************************************************
Custom List Type
****************************************************************************************************************/

//Switch Lists

class SwitchList {
    /**
     * @type {SwitchList[]}
     */
    static switchLists = [];
    /**
     * the switch list itself
     * @type {HTMLElement}
     */
    listElement;
    /**
     * the li children of the list
     * @type {HTMLElement[]}
     */
    listItemElements = [];
    /**
     * @type {HTMLElement}
     */
    switchCounter;

    /**
     * @param {HTMLElement} listElement 
     */
    constructor(listElement) {
        this.listElement = listElement;
        for(let i = 0; i < listElement.children.length; i++) {
            let child = listElement.children[i];
            
            if(child.nodeName === "LI") {
                child.style.display = 'none';
                this.listItemElements.push(child);
            }

            if(child.classList.contains("switch-list-counter") && this.switchCounter == null) this.switchCounter = child;
        }

        const leftButton = Html.createElement("button", {attributes: {
            class: "switch-list-button switch-list-button-left",
            style: "position: absolute; transform: scaleX(-100%)"
        }}, listElement);

        const rightButton = Html.createElement("button", {attributes: {
            class: "switch-list-button switch-list-button-right",
            style: "position: absolute;"
        }}, listElement);

        leftButton.addEventListener("click", () => {
            let idx = this.getCurrentSwitchIdx();
            this.setSwitchIdx(idx - 1);
        });

        rightButton.addEventListener("click", () => {
            let idx = this.getCurrentSwitchIdx();
            this.setSwitchIdx(idx + 1);
        });

        this.setSwitchIdx(this.getCurrentSwitchIdx());
    }

    setSwitchIdx(idx) {
        this.listElement.setAttribute("data-switch-idx", idx);
    }

    update() {
        let idx = parseInt(this.listElement.getAttribute("data-switch-idx")) || 0;
        let listLength = this.listItemElements.length;

        if(idx > listLength - 1) {
            this.setSwitchIdx(idx % listLength);
            return;
        }else if(idx < 0) {
            this.setSwitchIdx(listLength - (-idx % listLength));
            return;
        }

        this.listItemElements.forEach(el => el.style.display ="none");
        this.listItemElements[idx].style.display = "block";
        if(this.switchCounter) this.switchCounter.innerHTML = `${idx+1}/${listLength}`;
    }

    /**
     * @returns {number}
     */
    getCurrentSwitchIdx() {
        return parseInt(this.listElement.getAttribute("data-switch-idx")) || 0;
    }

    /**
     * @param {HTMLElement} element the element to add
    */
    static add(element) {
        SwitchList.switchLists.push(new SwitchList(element));
    }

    /**
     * @param {HTMLElement} element 
     */
    static remove(element) {
        let idx = SwitchList.switchLists.findIndex(el => el.listElement.isSameNode(element));
        SwitchList.switchLists.slice(idx, 1);
    }

    /**
     * @param {HTMLElement} element
     */
    static updateSwitchList(element) {
        SwitchList.switchLists.find((switchList) => switchList.listElement.isSameNode(element)).update();
    }
}


/***************************************************************************************************************
Custom Input Types
****************************************************************************************************************/

//Selection List input
/**
 * @type {HTMLElement[]}
*/
const listInputs = [];

const inputListElement = Html.createElement("div", {attributes:{id:"list-input"}});

const listInputChangedEvent = new CustomEvent("valueChanged", {
    cancelable: true,
    bubbles: false
});

/**
* @type {HTMLElement | null}
*/
let activeListInput = null;
/**
 * whether the html contains a InputList element
 * @type {boolean}
 */
let hasInputListElement = false;
let activeListItems = null;

/**
* 
* @param {HTMLElement} el
*/
function setInputList(el) {
   if(el == null) {
       inputListElement.innerHTML = "";
       inputListElement.style.display = "none";
       activeListInput.style.removeProperty("border-radius");
       activeListInput = null;
       activeListItems = null;
       return;
   }
   activeListItems = getListItems(el);
   activeListInput = el;
   inputListElement.style.display = "block";
   

   let height = getComputedStyle(activeListInput).height;
   inputListElement.style.height = "fit-content";

   let idx = 0;
   activeListItems.forEach(itemText=> {
       const item = Html.createElement("input", {attributes:{class:"list-input-item", type:"button", value: itemText,
       "data-input-list-idx": idx++, style: `height: ${height}`}})

       inputListElement.appendChild(item);
   });

}

function updateListInput() {
    if(activeListInput == null) return;
    const inputStyle = getComputedStyle(activeListInput);
    const elementRect = activeListInput.getBoundingClientRect();

    if(inputStyle.display === "none" || inputStyle.visibility === "hidden" || elementRect.width === 0) {
        setInputList(null);
        return;
    }


    activeListInput.style.borderBottomLeftRadius = "0";
    activeListInput.style.borderBottomRightRadius = "0";
    let borderRadius = inputStyle.borderRadius;
    inputListElement.style.borderBottomLeftRadius = borderRadius;
    inputListElement.style.borderBottomRightRadius = borderRadius;

    inputListElement.style.top = elementRect.top + scrollY + elementRect.height + "px";
    inputListElement.style.left = elementRect.left + scrollX + "px";
    inputListElement.style.width = elementRect.width + "px";

}

/**
* 
* @param {Element} el 
* @returns {string[]}
*/
function getListItems(el) {
   return el.getAttribute("data-list-items").split(",").map((item)=>item.trim());
}

/**
* 
* @param {Element} el 
*/
function setupListInput(el) {
    el.setAttribute("readonly","true");
    el.classList.add("input-list");
}

function updateActiveInputList(idx) {
    activeListInput.value = getListItems(activeListInput)[idx == null ? 0 : idx];
    activeListInput.dispatchEvent(listInputChangedEvent);
}

/**
 * @param {HTMLElement} el 
 */
function addListInput(el) {
    listInputs.push(el); 
    setupListInput(el);

    if(!hasInputListElement) {
        document.body.appendChild(inputListElement);
        hasInputListElement = true;
    }
}

document.addEventListener("click",(e) => {
    if(activeListInput != null) {
        if(e.target.classList.contains("list-input-item")) {
            let idx = parseInt(e.target.getAttribute("data-input-list-idx"));
            updateActiveInputList(idx);
        }
        
        setInputList(null);
    }else if(listInputs.includes(e.target)) {
        setInputList(e.target);
    }
});

/***************************************************************************************************************
GENERAL
****************************************************************************************************************/
const mutationObserver = new MutationObserver((mutationList) => {
    updateListInput();
    mutationList.forEach(item => {
        if(item.type === "childList") {
            item.addedNodes.forEach(node => {
                if(node.nodeType !== 1) return;
                //input list
                if(node.nodeName === "INPUT" && node.getAttribute("type") === "list") addListInput(node);
                else {
                    node.querySelectorAll('input[type="list"]').forEach(child => {
                        addListInput(child);
                    });
                }

                //switch list
                if(node.nodeName === "UL" && node.classList.contains("switch-list")) SwitchList.add(node);
                node.querySelectorAll("ul.switch-list").forEach(child => {
                    SwitchList.add(child);
                });
            });

            item.removedNodes.forEach(node => {
                if(listInputs.includes(node)) listInputs.splice(listInputs.indexOf(node), 1);
                else SwitchList.remove(node);
            })
        }else if(item.type === "attributes") {
            if(item.target.nodeName === "UL" && item.target.classList.contains("switch-list") && item.attributeName === "data-switch-idx") {
                SwitchList.updateSwitchList(item.target);
            }
        }
    });
});

mutationObserver.observe(document, {attributes: true, childList: true, subtree: true });

document.querySelectorAll("input[type=list]").forEach((el) => addListInput(el));
document.querySelectorAll("ul.switch-list").forEach((el) => SwitchList.add(el));

//Stuff
console.log("%cGoof %cBall","font-size:3rem","color:red");