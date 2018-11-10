import {clamp} from "./arithmetic.js";
import {calcMHVCToMunsell,
        calcMHVCToRGB255,
        calcMHVCToHex,
        calcMHVCToLab} from "./munsell.js";
import {calcDeltaE00} from "./ciede2000.js";

const hueNumberTable = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"];

const userMHVC = {
  huePrefix: 5,
  hueNumber: 7,

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
  },
  getRGB255: function (clamp = true) {
    return calcMHVCToRGB255.apply(null, [...this.get(), clamp]);
  },
  getHex: function () {
    return calcMHVCToHex.apply(null, this.get());
  }
}

window.userMHVC = userMHVC;

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

  static calcScore(delta, deltaAtZero = 16, deltaAtMax = 1.5) {
    const factor = 10/(deltaAtZero-deltaAtMax);
    return Math.max((deltaAtZero-Math.max(delta, deltaAtMax))*factor, 0);
  }
}

const currentScore = new Score();

const init = () => {
  document.getElementById("value-slider").value = 1;
  document.getElementById("chroma-slider").value = 5;
  document.getElementById("hue-table").getElementsByTagName("td")[userMHVC.hueNumber].className = "selected";
  document.getElementById("hue-prefix-table").getElementsByTagName("td")[userMHVC.huePrefix-1].className = "selected";
  document.getElementById("current-value-indicator").textContent = document.getElementById("value-slider").value;
  document.getElementById("current-chroma-indicator").textContent = document.getElementById("chroma-slider").value;
  reflectUsersInput(userMHVC);
};

const calcRGB255ToHex = (r, g, b) => {
  return ["#", ...[r, g, b].map((x) => clamp(x, 0, 255))
          .map((x) => (x < 16 ? "0" : "")+x.toString(16))].join("");
}

const reflectUsersInput = (mhvc) => {
  const [r, g, b] = mhvc.getRGB255(false);
  const isOutOfGamut = r < 0 || 255 < r || g < 0 || 255 < g || b < 0 || 255 < b;
  showOutOfGamut(isOutOfGamut);
  updateUsersArea(mhvc.getMunsell());
  updateCanvasBackground(calcRGB255ToHex(r, g, b));
}

const showOutOfGamut = (bool) => {
  console.log(bool);
  document.getElementById("south").className = bool ? "dull" : "";
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
  if (mhvc !== null) {
    document.getElementById("system-area")
      .insertAdjacentHTML('afterbegin',
                          `<div>Answer:</div>
<div id="system-label">${calcMHVCToMunsell.apply(null, mhvc)}</div>
<div>Score:</div>
<div>${score.toFixed(1)} <span class="weak">(&Delta;E=${delta.toFixed(1)})</span></div>`);
  }
}

const canvas = document.getElementById("color-canvas");
const ctx = canvas.getContext('2d');
window.canvas = canvas; // for development
window.ctx = ctx;

const fillRightHalfCanvas = (hex) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = hex;
  ctx.fillRect(canvas.width/2, 0, canvas.width/2, canvas.height);
}

const fillWholeCanvas = (hex) => {
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const updateCanvasBackground = (hex) => {
  console.log(hex);
  canvas.style.backgroundColor = hex;
}

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const hideSystemArea = () => {
  document.getElementById("system-area").textContent = "";
}

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const randomMHVCAndRGB255 = () => {
  const hue100 = getRandomInt(0, 101);
  const value = getRandomInt(5, 96)/10;
  for(let i=0; i<100; i++) {
    const chroma = getRandomInt(0, 61)/2;
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
  fillWholeCanvas(calcRGB255ToHex(r, g, b));
  correctMHVC = [hue100, value, chroma];
  correctRGB = [r, g, b];
}

const forward = function* (e) {
  // Corresponds to the main button.
  const originalButtonName = e.textContent;
  while(true) {
    currentScore.reset();
    for (let i=1; i<=10; i++) {
      // Question phase
      clearCanvas();
      setQuestion();
      hideSystemArea();
      e.textContent = `Answer`;
      yield;
      // Answer phase
      const mhvc = userMHVC.get();
      const delta = calcDeltaE00.apply(null, [...calcMHVCToLab.apply(null, mhvc),
                                              ...calcMHVCToLab.apply(null, correctMHVC)]);
      currentScore.add(Score.calcScore(delta));
      updateSystemArea(correctMHVC, delta, currentScore.latest);
      clearCanvas();
      updateCanvasBackground(userMHVC.getHex());
      fillRightHalfCanvas(calcMHVCToHex.apply(null, correctMHVC));
      if (i === 10) {
        e.textContent = `Finish`;
      } else {
        e.textContent = `Go to next (${i}/10)`;
      }
      yield;
    }
    console.log(`Your score is ${currentScore.get()}!`);
    e.textContent = originalButtonName;
    yield;
  }
}

window.forward = forward(document.getElementById("forward-button"));

window.onload = init;

