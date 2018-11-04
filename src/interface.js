import * as Munsell from "./munsell.js"

let currentHuePrefix = 5;
let currentHueNumber = 0;
const hueNumberTable = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"];

const init = () => {
    document.getElementById("hue-table").getElementsByTagName("td")[currentHueNumber].className = "selected";
    document.getElementById("hue-prefix-table").getElementsByTagName("td")[currentHuePrefix-1].className = "selected";
    document.getElementById("current-value-indicator").textContent = document.getElementById("value-slider").value;
    document.getElementById("current-chroma-indicator").textContent = document.getElementById("chroma-slider").value;
}

window.changeValue = (e) => {
    document.getElementById("current-value-indicator").textContent = e.value;
}

window.changeChroma = (e) => {
    document.getElementById("current-chroma-indicator").textContent = e.value;
}

window.changeHuePrefix = (e) => {
    const nextValue = parseInt(e.textContent);
    const nextIndex = nextValue-1;
    const oldIndex = currentHuePrefix-1;
    const huePrefixCollection = document.getElementById("hue-prefix-table").getElementsByTagName("td");
    huePrefixCollection[oldIndex].className = ""; // unselect the old one
    huePrefixCollection[nextIndex].className = "selected";
    currentHuePrefix = nextValue;
}

window.changeHueNumber = (e) => {
    const nextName = e.textContent;
    const nextIndex = hueNumberTable.indexOf(nextName);
    const oldIndex = currentHueNumber;
    const hueNumberCollection = document.getElementById("hue-table").getElementsByTagName("td");
    hueNumberCollection[oldIndex].className = ""; // unselect the old one
    hueNumberCollection[nextIndex].className = "selected";
    currentHueNumber = nextIndex;
}

const getCurrentMHVC = () => {
    return { "hue_number": currentHueNumber,
             "hue_name": hueNumberTable[currentHueNumber],
             "hue_prefix": currentHuePrefix,
             "value": document.getElementById("value-slider").value,
             "chroma": document.getElementById("chroma-slider").value              
           }
}

window.onload = init;
