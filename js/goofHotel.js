import {Html} from "./libraries/main.js";

const inputForm = document.querySelector("form");
/**
 * @type {HTMLElement[]}
 */
const inputElements = inputForm.querySelectorAll("input");
const bookingTable = document.getElementById("booking-table").children[1];

class Reservation {
    /**
     * @type {string}
     */
    firstName;
    /**
     * @type {string}
     */
    lastName;
    /**
    * @type {string}
    */
    email;
    /**
     * @type {Date}
     */
    arrivalDate;
    /**
     * @type {number}
     */
    nightAmount;
    /**
     * @type {number}
     */
    peopleAmount;
    /**
     * @type {string}
     */
    roomType;

    getDepartureDate() {
        const date = new Date();
        date.setDate(this.arrivalDate.getDate() + this.nightAmount);
        return date;
    }
}

class UI {
    /**
     * @param {Reservation} reservation 
     */
    static addReservation(reservation) {
        const row = Html.createElement("tr", {innerHTML: `
            <td>${reservation.firstName.concat(" ", reservation.lastName)}</td>
            <td>${reservation.arrivalDate.toLocaleDateString()}</td>
            <td>${reservation.getDepartureDate().toLocaleDateString()}</td>
            <td>${reservation.peopleAmount}</td>
            <td>
                <button class="reservation-green">OK</button>
                <button class="reservation-orange">?</button>
                <button class="reservation-red">X</button>
            </td>
        `});
        
        Controller.displayMessage("New Reservation added");

        row.querySelector(".reservation-green").addEventListener("click", () => UI.setReservationType(row, "green"));
        row.querySelector(".reservation-orange").addEventListener("click", () => UI.setReservationType(row, "orange"));
        row.querySelector(".reservation-red").addEventListener("click", () => UI.setReservationType(row, "red"));

        bookingTable.appendChild(row);
    }

    static clearReservations() {
        while(bookingTable.children.length > 0) {
            bookingTable.children[0].remove();
        }
    }

    /**
     * @param {HTMLElement} el 
     * @param {string} type 
     */
    static setReservationType(el, type) {
        if(type !== el.getAttribute("reservation-type")) {
            el.setAttribute("reservation-type", type);
            el.querySelectorAll("td").forEach(e => e.style.backgroundColor = type);
        }else {
            el.setAttribute("reservation-type", "");
            el.querySelectorAll("td").forEach(e => e.style.removeProperty("background-color"));
        }
    }
}

class Controller {
    /**
     * @param {string} msg 
     */
    static displayError(msg) {
        alert(msg);
    }

    static displayMessage(msg) {
        console.log(msg);
    }

    /**
     * @param {HTMLInputElement} inputElement
     * @returns {boolean} 
     */
    static checkInput(inputElement) {
        let value = inputElement.value;
        let name = inputElement.name;

        if(value.length === 0) {
            Controller.displayError(`Please fill out ${name}`);
            return false;
        }
        switch(inputElement.type) {
            case "email":
                if(!value.includes("@")) {
                    Controller.displayError(`${name} requires an @`);
                    return false;
                }
                break;
            case "number":
                let number = parseInt(value);

                if(isNaN(number)) {
                    Controller.displayError(`${name} needs to be a number`);
                    return false;
                }

                if(number < parseInt(inputElement.getAttribute("min"))) {
                    Controller.displayError(`${name} needs to be greater than or equal to ${parseInt(inputElement.getAttribute("min"))}`); 
                    return false;
                }
                
                if(number > parseInt(inputElement.getAttribute("max"))) {
                    Controller.displayError(`${name} needs to be less than or equal to ${parseInt(inputElement.getAttribute("max"))}`);
                    return false;
                }
                break;

            case "date":
                if(new Date(value).getTime < new Date().getTime()) {
                    Controller.displayError(`${name} cannot be in the past`);
                    return false;
                }
                break;
        }

        return true;
    }
}

inputForm.querySelector("#submit").addEventListener("click", (e) => {
    e.preventDefault();

    for(let i = 0; i < inputElements.length; i++) { 
        if(!Controller.checkInput(inputElements[i])) return;
    }

    const reservation = new Reservation();
    reservation.firstName = inputElements[0].value.trim();
    reservation.lastName = inputElements[1].value.trim();
    reservation.email = inputElements[2].value.trim();
    reservation.arrivalDate = new Date(inputElements[3].value);
    reservation.nightAmount = parseInt(inputElements[4].value);
    reservation.peopleAmount = parseInt(inputElements[5].value);
    reservation.roomType = inputElements[6].value;

    inputElements.forEach(e => {if(!["submit","list"].includes(e.getAttribute("type"))) e.value = "";});
    UI.addReservation(reservation);
});

document.getElementById("clear-reservations").addEventListener("click", () => {
    UI.clearReservations();
});