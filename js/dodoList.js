import {Html} from "./libraries/main.js";

const inputContainer = document.getElementById("add-task-container");
const openInputContainer = document.getElementById("open-add-task");
const taskTable = document.getElementById("todo-tasks");
const taskBody = taskTable.querySelector("tbody");
const inputElements = {
    name: document.getElementById("task-name"),
    description: document.getElementById("task-description")
}
const taskStatuses = "Todo, In Progress, Complete";
/**
 * @type {Task[]}
 */
let taskList = [];
let taskCount = 1;

let addTaskContainerVisible = true;

function changeAddTaskContainer() {
    addTaskContainerVisible = !addTaskContainerVisible;

    if(addTaskContainerVisible) {
        inputContainer.style.removeProperty("display");
        openInputContainer.textContent = "Cancel";
    }else {
        inputContainer.style.display = "none";
        openInputContainer.textContent = "Add Tasks";
    }
}

function loadStorage() {
    taskList = JSON.parse(localStorage.getItem("taskList")) || [];
    taskCount = parseInt(localStorage.getItem("taskCount")) || 0;

    console.log(taskList);

    UI.clearTaskTable();

    taskList.forEach((task) => {
        Controller.addTask(task, false);
    });
}

function updateStorage() {
    localStorage.setItem("taskList", JSON.stringify(taskList));
    localStorage.setItem("taskCount", taskCount);
}

class Controller {
    /**
     * @param {Task} task 
     * @param {boolean} isNew wether the task was just created or comes from the storage
     */
    static addTask(task, isNew = true) {
        let isEdited = false;
        const row = Html.createElement("tr", {innerHTML: `
            <td>${task.id}</td>
            <td><input type="text" readonly value="${task.name}" class="task-data"></td>
            <td><input type="text" readonly value="${task.description}" class="task-data"></td>
            <td><input type="list" name="Status" class="task-status" data-list-items="${taskStatuses}" value="${task.status}"></td>
            <td><i class="fa-solid fa-pen edit-task" tabindex=0></i></td>
            <td><i class="fa-solid fa-trash-can remove-task" tabindex=0></i></td>
        `});
        
        const taskData = row.querySelectorAll(".task-data");

        row.addEventListener("click", (e) => {
            if(e.target.classList.contains("remove-task")) {
                taskList.splice(taskList.indexOf(task), 1);
                row.remove();
                updateStorage();
            }else if(e.target.classList.contains("edit-task")) {
                isEdited = !isEdited;

                if(isEdited) {
                    taskData.forEach(el => {
                        el.setAttribute("data-edit","");
                        el.removeAttribute("readonly");
                    });
                    e.target.classList.remove("fa-pen");
                    e.target.classList.add("fa-check");
                }else {
                    if(taskData[0].value.length === 0) {
                        UI.showAlert("You cannot have a task without a name", taskTable);
                        return;
                    }
                    taskData.forEach(el => {
                        el.removeAttribute("data-edit");
                        el.setAttribute("readonly","");
                    });
                    task.name = taskData[0].value;
                    task.description = taskData[1].value;
                    e.target.classList.add("fa-pen");
                    e.target.classList.remove("fa-check");
                    updateStorage();
                }
            }
        });

        row.querySelector(".task-status").addEventListener("valueChanged", (e) => {
            task.status = e.target.value;
            updateStorage();
        });

        taskBody.appendChild(row);
        
        if(isNew) {
            taskList.push(task);
            updateStorage();
        }
    }

    /**
     * @returns {Task | null}
     */
    static getNewTask() {
        let name = inputElements.name.value;

        if(name.length == 0) {
            UI.showAlert("Please choose a name for the task", inputContainer);
            return null;
        }

        const task = new Task(name, inputElements.description.value)
        
        inputElements.name.value  = "";
        inputElements.description.value = "";

        return task;
    }
}

class UI {
    /**
     * @param {string} msg 
     * @param {HTMLElement} target 
     */
    static showAlert(msg, target) {
        const div = Html.createElement("div", {attributes: {class: "todo-alert"}, innerHTML: msg});

        document.body.appendChild(div);

        target.parentElement.insertBefore(div, target);

        div.addEventListener("click", () => {
            div.remove();
        });

        setTimeout(()=> {
            div.remove();
        },3000);
    }

    static clearTaskTable() {
        taskBody.querySelectorAll("tr").forEach(e => e.remove());
    }
}

class Task {
    /**
     * @type {string}
     */
    name;
    /**
     * @type {string}
     */
    description;
    /**
     * @type {string}
     */
    status;
    /**
     * @type {number}
     */
    id;
    
    /**
     * @param {string} name 
     * @param {string} description
     * @param {number} id
     */
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.status = taskStatuses.split(",")[0].trim();
        this.id = taskCount++;
    }
}

openInputContainer.addEventListener("click", () => {
    changeAddTaskContainer();
});

document.getElementById("add-task").addEventListener("click", (e) => {
    e.preventDefault();
    let newTask = Controller.getNewTask();
    if(newTask != null) Controller.addTask(newTask);
});

document.getElementById("reset-tasks").addEventListener("click", () => {
    UI.clearTaskTable();
    taskCount = 1;
    taskList.length = 0;
    updateStorage();
});

changeAddTaskContainer();
loadStorage();