
const WB_INFO = {"right": {"mac": "DB:2A:78:F4:C5:87",
                           "serviceUUID": "713d0000-503e-4c75-ba94-3148f18d941e",
                           "characteristicUUID": "713d0003-503e-4c75-ba94-3148f18d941e"},
                 "left": {"mac": "C6:82:1A:9E:7E:75",
                          "serviceUUID": "713d0000-503e-4c75-ba94-3148f18d941e",
                          "characteristicUUID": "713d0003-503e-4c75-ba94-3148f18d941e"}};

const COLLAR_MAC = "FD:47:FE:FA:57:50";
const COLLAR_SERVICE_UUID = "713d0000-503e-4c75-ba94-3148f18d941e";
const COLLAR_CHARACTERISTIC_UUID = "713d0003-503e-4c75-ba94-3148f18d941e";

var wbData;
var collarData;

var zeroWB = new Uint8Array([0x00, 0x00]);
var zeroCollar = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

// in ms
const VIBRATION_DURATION = 500;
const VIBRATION_OFFSET = 20;

async function connectRightWB() {
    ble.connect(WB_INFO.right.mac,
                function() {rightWBConnection.innerHTML = "Right wristband connected";},
                function () {rightWBConnection.innerHTML = "Right wristband NOT connected";});
}

async function connectLeftWB() {
    ble.connect(WB_INFO.left.mac,
                function() {leftWBConnection.innerHTML = "Left wristband connected";},
                function () {leftWBConnection.innerHTML = "Left wristband NOT connected";});
}

async function connectCollar() {
    ble.connect(COLLAR_MAC,
                function() {collarConnection.innerHTML = "Collar connected";},
                function () {collarConnection.innerHTML = "Collar NOT connected";});
}

async function connectWBs() {
    connectRightWB();
    connectLeftWB();
}

async function connectWearables() {
    connectWBs();
    connectCollar();
}

async function vibrateWB(wb, motor, vibrationDuration) {
    var wbInfo = WB_INFO[wb];
    switch (motor) {
        case "front":
            wbData = new Uint8Array([0x00, 0xFF]);
            break;
        case "back":
            wbData = new Uint8Array([0xFF, 0x00]);
            break;
        case "both":
            wbData = new Uint8Array([0xFF, 0xFF]);
    }
    console.log("XXXXXXXXXXXXXX WRISTBAND XXXXXXXXXXXXXXX");

    ble.write(wbInfo.mac,
                  wbInfo.serviceUUID,
                  wbInfo.characteristicUUID,
                  wbData.buffer,
                  function () {stopWBIn(wb, vibrationDuration);},
                  function() {console.log("YYYYYYYYYYY WRISTBAND YYYYYYYYYYY");});

}


async function stopWBIn(wb, vibrationDuration) {
    var wbInfo = WB_INFO[wb];
    setTimeout(function () {
        ble.write(wbInfo.mac,
                  wbInfo.serviceUUID,
                  wbInfo.characteristicUUID,
                  zeroWB.buffer);
    }, vibrationDuration);
}

async function vibrateCollar(collarData, vibrationDuration) {
    ble.write(COLLAR_MAC,
              COLLAR_SERVICE_UUID,
              COLLAR_CHARACTERISTIC_UUID,
              collarData.buffer,
              function () {stopCollarIn(vibrationDuration);},
              function () {console.log("YYYYYYYYYYY COLLAR YYYYYYYYYYY");});
}

async function stopCollarIn(vibrationDuration) {
    setTimeout(function () {
        ble.write(COLLAR_MAC,
                  COLLAR_SERVICE_UUID,
                  COLLAR_CHARACTERISTIC_UUID,
                  zeroCollar.buffer);
    }, vibrationDuration);
}

async function wbDispatchForward() {
    vibrateWB("right", "front", VIBRATION_DURATION);
    vibrateWB("left", "front", VIBRATION_DURATION);
}

async function wbDispatchSlightRight() {
    vibrateWB("right", "front", VIBRATION_DURATION);
}

async function wbDispatchRight() {
    vibrateWB("right", "front", VIBRATION_DURATION);
    setTimeout(function () {vibrateWB("right", "both", VIBRATION_DURATION);}, VIBRATION_OFFSET);
}

async function wbDispatchSharpRight() {
    vibrateWB("right", "back", VIBRATION_DURATION);
}

async function wbDispatchBackward() {
    vibrateWB("right", "back", VIBRATION_DURATION);
    vibrateWB("left", "back", VIBRATION_DURATION);
}

async function wbDispatchSharpLeft() {
    vibrateWB("left", "back", VIBRATION_DURATION);
}

async function wbDispatchLeft() {
    vibrateWB("left", "front", VIBRATION_DURATION);
    setTimeout(function () {vibrateWB("left", "both", VIBRATION_DURATION);}, VIBRATION_OFFSET);
}

async function wbDispatchSlightLeft() {
    vibrateWB("left", "front", VIBRATION_DURATION);
}

async function wbDispatchAll() {
    wbDispatchRight();
    wbDispatchLeft();
}

async function collarDispatch(direction) {
    switch (direction) {
        case "forward":
            collarData = new Uint8Array([0xFF, 0x00, 0x00, 0x00]);
            break;
        case "slight right":
            collarData = new Uint8Array([0xFF, 0x00, 0x00, 0xFF]);
            break;
        case "right":
            collarData = new Uint8Array([0x00, 0x00, 0x00, 0xFF]);
            break;
        case "sharp right":
            collarData = new Uint8Array([0x00, 0x00, 0xFF, 0xFF]);
            break;
        case "backward":
            collarData = new Uint8Array([0x00, 0x00, 0xFF, 0x00]);
            break;
        case "sharp left":
            collarData = new Uint8Array([0x00, 0xFF, 0xFF, 0x00]);
            break;
        case "left":
            collarData = new Uint8Array([0x00, 0xFF, 0x00, 0x00]);
            break;
        case "slight left":
            collarData = new Uint8Array([0xFF, 0xFF, 0x00, 0x00]);
            break;
        case "all":
            collarData = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
    }
    vibrateCollar(collarData, VIBRATION_DURATION);
}

async function collarDispatchForward() {
    collarDispatch("forward");
}

async function collarDispatchSlightRight() {
    collarDispatch("forward");
    setTimeout(function () {collarDispatch("slight right");}, VIBRATION_OFFSET);
}

async function collarDispatchRight() {
    collarDispatch("right");
}

async function collarDispatchSharpRight() {
    collarDispatch("backward");
    setTimeout(function () {collarDispatch("sharp right");}, VIBRATION_OFFSET);
}

async function collarDispatchBackward() {
    collarDispatch("backward");
}

async function collarDispatchSharpLeft() {
    collarDispatch("backward");
    setTimeout(function () {collarDispatch("sharp left");}, VIBRATION_OFFSET);
}

async function collarDispatchLeft() {
    collarDispatch("left");
}

async function collarDispatchSlightLeft() {
    collarDispatch("forward");
    setTimeout(function () {collarDispatch("slight left");}, VIBRATION_OFFSET);
}

async function collarDispatchAll() {
    collarDispatch("all");
}

async function vibrateAccordingToInstruction(instr) {
    if (instr.includes("arrive") || instr.includes("Arrive")) {
        wbDispatchAll();
        collarDispatchAll();
    }
    else if (instr.includes("slight right")
             || instr.includes("keep right")
             || instr.includes("northeast")) {
        wbDispatchSlightRight();
        collarDispatchSlightRight();
    }
    else if (instr.includes("sharp right")
             || instr.includes("southeast")) {
        wbDispatchSharpRight();
        collarDispatchSharpRight();
    }
    else if (instr.includes("right")
             || instr.includes("east")) {
        wbDispatchRight();
        collarDispatchRight();
    }
    else if (instr.includes("sharp left")
             || instr.includes("southwest")) {
        wbDispatchSharpLeft();
        collarDispatchSharpLeft();
    }
    else if (instr.includes("slight left")
            || instr.includes("keep left")
            || instr.includes("northwest")) {
        wbDispatchSlightLeft();
        collarDispatchSlightLeft();
    }
    else if (instr.includes("left")
             || instr.includes("west")) {
        wbDispatchLeft();
        collarDispatchLeft();
    }
    else if (instr.includes("turn around")
             || instr.includes("back")
             || instr.includes("south")) {
        wbDispatchBackward();
        collarDispatchBackward();
    }
    else if (instr.includes("forward")
             || instr.includes("north")) {
        wbDispatchForward();
        collarDispatchForward();
    }
    console.log("AFTER VIBRATION");
}

