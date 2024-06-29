import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
const demosSection = document.getElementById("demos");
let handLandmarker = undefined;
let runningMode = "VIDEO";
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = "630px";

const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 2
  });
  demosSection.classList.remove("invisible");
};
createHandLandmarker();

const model = await tf.loadLayersModel('./Model1/model.json');

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");

const hasGetUserMedia = () => { var _a; return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia); };

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
  if (!handLandmarker) {
    console.log("Wait! HandLandmarker not loaded yet.");
    return;
  }
  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }

  const constraints = {
    video: true
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
var a = [],
    lh = [],
    rh = [];
var c = 0,
    hands = 0,
    f_num = 20,
    hand_pre = 0;

const actions = ["Swipe Up", "Swipe Down", "Swipe Left", "Swipe Right", "Tab", "Ctrl_A", "Backspace", "Enter"];

document.addEventListener('keydown', function (event) {
  if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    // Scroll Up logic
    window.scrollBy(0, -100); // You can adjust the pixel value to control the scrolling amount
  } else if (event.key === 'ArrowDown' || event.key === 'PageDown') {
    // Scroll Down logic
    window.scrollBy(0, 100); // You can adjust the pixel value to control the scrolling amount
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Tab is hidden, stop predictions
    webcamRunning = false;
  } else if (document.visibilityState === 'visible') {
    // Tab is visible, resume predictions
    if (webcamRunning) {
      predictWebcam();
    }
  }
});

async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#04b00f",
        lineWidth: 2.5
      });
      drawLandmarks(canvasCtx, landmarks, {
        color: "#1b02fa",
        lineWidth: 0.2
      });
    }

    if ((results.landmarks).length > 0) {
      hands = 1;
      hand_pre = hand_pre + 1;
      if (results.handednesses[0][0].categoryName == 'Right') {
        for (const landmarks of results.landmarks[0]) {
          rh.push(landmarks.x);
          rh.push(landmarks.y);
          rh.push(landmarks.z);
        }
        if ((results.handednesses).length == 1)
          for (let i = 0; i < 63; i++) lh.push(0.0);
      }
      if (results.handednesses[0][0].categoryName == 'Left') {
        for (const landmarks of results.landmarks[0]) {
          lh.push(landmarks.x);
          lh.push(landmarks.y);
          lh.push(landmarks.z);
        }
        if ((results.handednesses).length == 1)
          for (let i = 0; i < 63; i++) rh.push(0.0);
      }
      if ((results.handednesses).length == 2 && results.handednesses[1][0].categoryName == 'Left') {
        for (const landmarks of results.landmarks[1]) {
          lh.push(landmarks.x);
          lh.push(landmarks.y);
          lh.push(landmarks.z);
        }
      }
      if ((results.handednesses).length == 2 && results.handednesses[1][0].categoryName == 'Right') {
        for (const landmarks of results.landmarks[1]) {
          rh.push(landmarks.x);
          rh.push(landmarks.y);
          rh.push(landmarks.z);
        }
      }
    } else if (hands == 1) {
      for (let i = 0; i < 63; i++) lh.push(0.0);
      for (let i = 0; i < 63; i++) rh.push(0.0);
    }
    if (hands == 1) {
      var temp = rh.concat(lh);
      a.push(temp);
      if (a.length == 20) {
        hands = 0;
        if (hand_pre >= 10) {
          const inputTensor = tf.expandDims(a, 0);
          const res = model.predict(inputTensor).arraySync()[0];

          let maxi = -5,
              max_i = 0;
          for (let k = 0; k < 8; k++)
              if (res[k] > maxi) {
                  maxi = res[k];
                  max_i = k;
              }

          const opt = actions[max_i];

          console.log(opt);

          gestureOutput.style.display = "block";
          gestureOutput.style.width = videoWidth;
          const categoryName = opt;

          const categoryScore = parseFloat(maxi * 100).toFixed(2);
          gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %`;

          if (categoryName !== "") {
              speak(categoryName);
          }

          if (categoryName === 'Swipe Up') {
            // Scroll Up logic
            window.scrollBy(0, -100); // You can adjust the pixel value to control the scrolling amount
          } else if (categoryName === 'Swipe Down') {
            // Scroll Down logic
            window.scrollBy(0, 100); // You can adjust the pixel value to control the scrolling amount
          }
        }
        hand_pre = 0;
        a = [];
      }
      lh = [];
      rh = [];
    }
  } else {
    gestureOutput.style.display = "none";
  }

  canvasCtx.restore();
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

// ... Your existing code
