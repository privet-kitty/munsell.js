import {calcMHVCToMunsell,
        calcMHVCToRGB255,
        calcMHVCToHex,
        calcMHVCToLab} from "./munsell.js";

const hueNumberTable = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"];

const currentMHVC = {
  huePrefix: 5,
  hueNumber: 5,

  readValue: function (e) {
    document.getElementById("current-value-indicator").textContent = e.value;
    reflectUsersInput(this);
  },

  readChroma: function (e) {
    document.getElementById("current-chroma-indicator").textContent = e.value;
    reflectUsersInput(this);
  },

  readHuePrefix: function (e) {
    const nextValue = parseInt(e.textContent);
    const nextIndex = nextValue-1;
    const oldIndex = this.huePrefix-1;
    const huePrefixCollection = document.getElementById("hue-prefix-table").getElementsByTagName("td");
    huePrefixCollection[oldIndex].className = ""; // unselect the old one
    huePrefixCollection[nextIndex].className = "selected";
    this.huePrefix = nextValue;
    reflectUsersInput(this);
  },

  readHueNumber: function (e) {
    const nextName = e.textContent;
    const nextIndex = hueNumberTable.indexOf(nextName);
    const oldIndex = this.hueNumber;
    const hueNumberCollection = document.getElementById("hue-table").getElementsByTagName("td");
    hueNumberCollection[oldIndex].className = ""; // unselect the old one
    hueNumberCollection[nextIndex].className = "selected";
    this.hueNumber = nextIndex;
    reflectUsersInput(this);
  },

  get: function () {
    return [this.hueNumber * 10 + this.huePrefix,
            parseFloat(document.getElementById("value-slider").value),
            parseFloat(document.getElementById("chroma-slider").value)];
  },
  getMunsell: function () {
    return calcMHVCToMunsell.apply(null, this.get());
  }
}

window.currentMHVC = currentMHVC;

class Score {
  constructor() {
    this.score = 0;
    this.latest = 0;
  }

  get() {
    return this.score;
  }
  add(x) {
    this.score += x;
    this.latest = x;
  }
  reset() {
    this.score = 0;
    this.latest = 0;
  }

  static calcScore(delta) {
    return Math.max((16-Math.max(delta, 1))/2, 0);
  }
}

const currentScore = new Score();

const init = () => {
  document.getElementById("hue-table").getElementsByTagName("td")[currentMHVC.hueNumber].className = "selected";
  document.getElementById("hue-prefix-table").getElementsByTagName("td")[currentMHVC.huePrefix-1].className = "selecreflectted";
  document.getElementById("current-value-indicator").textContent = document.getElementById("value-slider").value;
  document.getElementById("current-chroma-indicator").textContent = document.getElementById("chroma-slider").value;
  setQuestion();
  reflectUsersInput(currentMHVC);
};

const reflectUsersInput = (mhvc) => {
  updateUsersArea(mhvc.getMunsell());
}

const updateUsersArea = (str) => {
  document.getElementById("users-label").textContent = str;
}

const hideUsersLabel = () => {
  document.getElementById("users-label").textContent = "";
}


let correctMHVC = [0, 0, 0];
let correctRGB = [0, 0, 0];

const calcDeltaE = (l1, a1, b1, l2, a2, b2) => {
  return Math.sqrt(Math.pow(l1-l2, 2)+Math.pow(a1-a2, 2)+Math.pow(b1-b2, 2));
}


const updateSystemArea = (mhvc, delta, score) => {
  document.getElementById("system-area").textContent = "";
  document.getElementById("system-area")
    .insertAdjacentHTML('afterbegin',
                        `<div>Answer:</div>
<div id="system-label">${calcMHVCToMunsell.apply(null, mhvc)}</div>
<div>Score:</div>
<div>${score.toFixed(1)} (&Delta;E=${delta.toFixed(1)})</div>`);
}

const canvas = document.getElementById("color-canvas");
const ctx = canvas.getContext('2d');
const updateCanvas = () => {
  ctx.fillStyle = `${calcMHVCToHex.apply(null, currentMHVC.get())}`;
  ctx.rect(0, 0, canvas.width/2, canvas.height);
  ctx.fill();
}
const restoreCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const hideSystemArea = () => {
  document.getElementById("system-area").textContent = "";
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
  correctMHVC = [hue100, value, chroma];
  correctRGB = [r, g, b];
}

const forward = function* (e) {
  // Corresponds to the main button.
  const originalButtonName = e.textContent;
  while (true) {
    const mhvc = currentMHVC.get();
    const delta = calcDeltaE.apply(null, [...calcMHVCToLab.apply(null, mhvc),
                                          ...calcMHVCToLab.apply(null, correctMHVC)]);
    currentScore.add(Score.calcScore(delta));
    updateSystemArea(correctMHVC, delta, currentScore.latest);
    updateCanvas();
    console.log();
    e.textContent = "Next color";
    yield;
    setQuestion();
    hideSystemArea();
    restoreCanvas();
    e.textContent = originalButtonName;
    yield;
  }
}

window.forward = forward(document.getElementById("forward-button"));

window.onload = init;

