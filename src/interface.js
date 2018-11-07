import {calcMHVCToMunsell,
        calcMHVCToRGB255} from "./munsell.js";

let currentHuePrefix = 5;
let currentHueNumber = 0;
const hueNumberTable = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"];

const init = () => {
  document.getElementById("hue-table").getElementsByTagName("td")[currentHueNumber].className = "selected";
  document.getElementById("hue-prefix-table").getElementsByTagName("td")[currentHuePrefix-1].className = "selected";
  document.getElementById("current-value-indicator").textContent = document.getElementById("value-slider").value;
  document.getElementById("current-chroma-indicator").textContent = document.getElementById("chroma-slider").value;
  setQuestion();
};

window.selectValue = (e) => {
  document.getElementById("current-value-indicator").textContent = e.value;
  reflectUsersInput();
};

window.selectChroma = (e) => {
  document.getElementById("current-chroma-indicator").textContent = e.value;
  reflectUsersInput();
};

window.selectHuePrefix = (e) => {
  const nextValue = parseInt(e.textContent);
  const nextIndex = nextValue-1;
  const oldIndex = currentHuePrefix-1;
  const huePrefixCollection = document.getElementById("hue-prefix-table").getElementsByTagName("td");
  huePrefixCollection[oldIndex].className = ""; // unselect the old one
  huePrefixCollection[nextIndex].className = "selected";
  currentHuePrefix = nextValue;
  reflectUsersInput();
};

window.selectHueNumber = (e) => {
  const nextName = e.textContent;
  const nextIndex = hueNumberTable.indexOf(nextName);
  const oldIndex = currentHueNumber;
  const hueNumberCollection = document.getElementById("hue-table").getElementsByTagName("td");
  hueNumberCollection[oldIndex].className = ""; // unselect the old one
  hueNumberCollection[nextIndex].className = "selected";
  currentHueNumber = nextIndex;
  reflectUsersInput();
};

const reflectUsersInput = () => {
  showUsersLabel();
}

const getCurrentMHVCObject = () => {
  return { "hue_number": currentHueNumber,
           "hue_name": hueNumberTable[currentHueNumber],
           "hue_prefix": currentHuePrefix,
           "value": parseFloat(document.getElementById("value-slider").value),
           "chroma": parseFloat(document.getElementById("chroma-slider").value)
         };
};

const getCurrentMHVC = () => {
  const obj = getCurrentMHVCObject();
  return [obj["hue_number"]*10 + obj["hue_prefix"],
          obj["value"],
          obj["chroma"]];
};

const showUsersLabel = () => {
  document.getElementById("users-label").textContent
    = calcMHVCToMunsell.apply(null, getCurrentMHVC());
}


let correctMHVC = [0, 0, 0];

const showSystemLabel = () => {
  document.getElementById("system-label").textContent
    = calcMHVCToMunsell.apply(null, correctMHVC);
}

const getRandomInt = (max) => {
  max = Math.floor(max);
  return Math.floor(Math.random() * max);
}

const randomMHVCAndRGB255 = () => {
  const hue100 = getRandomInt(101);
  const value = getRandomInt(101)/10;
  for(let i=0; i<100; i++) {
    const chroma = getRandomInt(61)/2;
    const randomRGB = calcMHVCToRGB255(hue100, value, chroma, false);
    if (!randomRGB.map((x) => 0 <= x && x <= 255).includes(false)) {
      return [hue100, value, chroma, ...randomRGB];
      break;
    }
  }
  return [hue100, value, 0, ...calcMHVCToRGB255(hue100, value, 0)];
}

const setQuestion = () => {
  const [hue100, value, chroma, r, g, b] = randomMHVCAndRGB255();
  document.getElementById("color-canvas").style.background = `rgb(${r}, ${g}, ${b})`;
  console.log( `rgb(${r}, ${g}, ${b})`);
  correctMHVC = [hue100, value, chroma];
}

const forward = function* (e) {
  // Corresponds to the main button.
  while (true) {
    const mhvc = getCurrentMHVC();
    showUsersLabel();
    showSystemLabel();
    console.log(calcMHVCToMunsell.apply(null, mhvc));
    const originalButtonName = e.textContent;
    e.textContent = "Next color";
    yield;
    setQuestion();
    e.textContent = originalButtonName;
    yield;
  }
}

window.forward = forward(document.getElementById("forward-button"));

window.onload = init;

