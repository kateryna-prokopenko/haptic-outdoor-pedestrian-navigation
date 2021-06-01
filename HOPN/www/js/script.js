//import * as wrbls from "./wearableControls.js";

//variable initialization
var routeToken = "empty";
const BASE_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking'
    + '?api_key=5b3ce3597851110001cf6248ffe984c1029d4f54bd688fd9efa6078a'
    + '&start='
    + '&end=';
var requestURL = '';

var endLongitude, endLatitude, currentLongitude, currentLatitude = '';
var accuracy = 0;

var responseJSON;

var errorP = document.getElementById("error");
var requestURLp = document.getElementById("reqUrl");
var instructionsP = document.getElementById("instructions");
var responseP = document.getElementById("response");
var distanceP = document.getElementById("distance");

var test1 = document.getElementById("test1");
var test2 = document.getElementById("test2");
var test3 = document.getElementById("test3");
var collarConnection = document.getElementById("collarConnection");
var rightWBConnection = document.getElementById("rightWBConnection");
var leftWBConnection = document.getElementById("leftWBConnection");

setTimeout(connectWearables, 2000);


//distance in km
function getDistanceBetweenWaypoints(pointX, pointY) {
    var lonX = pointX[0];
    var latX = pointX[1];
    var lonY = pointY[0];
    var latY = pointY[1];
    const EARTH_RAD = 6371; // km
    var dLat = deg2rad(latY-latX); // degrees
    var dLon = deg2rad(lonY-lonX);
    var a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(latX)) * Math.cos(deg2rad(latY)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var distance = EARTH_RAD * c; // km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

async function updateCurrentPosition() {
    if (navigator.geolocation) {
        const promise = new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(function (position) {
            currentLongitude = position.coords.longitude;
            currentLatitude = position.coords.latitude;
            test3.innerHTML = "Current longitude: " + currentLongitude.toFixed
                + "<br />Current latitude: " + currentLatitude
                + "<br />Accuracy: " + position.coords.accuracy;
            accuracy = position.coords.accuracy;
            resolve();
        }, reject, {enableHighAccuracy: true});
    });
        return promise;
    } else {
        errorP.innerHTML = "Geolocation not supported";
        return Promise.resolve();
    }
}

function appendStartToRequestURL() {
    requestURL = BASE_URL;
    var fstSlice = requestURL.slice(0, requestURL.indexOf('&start=') + '&start='.length);
    var sndSlice = requestURL.slice(requestURL.indexOf('&end='),);
    requestURL = fstSlice + currentLongitude + ',%20' + currentLatitude + sndSlice;
}

function setEndCoordinates() {
    var destForm = document.getElementById("destination");
    endLatitude = destForm.elements["endLatitude"].value;
    endLongitude = destForm.elements["endLongitude"].value;
}

function appendEndToRequestURL() {
    requestURL = requestURL + endLongitude + ',%20' + endLatitude;
}

function hideForm() {
    var destForm = document.getElementById("destination");
    destForm.reset()
    destForm.style.display = "none";
    document.getElementById("formHeadline").style.display = "none";
}

async function assembleRequestURL() {
    try {
        await updateCurrentPosition();
    }
    catch (error) {
        console.error(error);
    }
    setEndCoordinates();
    hideForm();
    appendStartToRequestURL();
    appendEndToRequestURL();
}

async function assembleRequestURLFromCoordinates(startLat, startLon, endLat, endLon) {
    currentLatitude = startLat;
    currentLongitude = startLon;
    endLatitude = endLat;
    endLongitude = endLon;
    hideForm();
    appendStartToRequestURL();
    appendEndToRequestURL();
}

// get request to openrouteservice
async function sendRequest() {
    const promise = new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        request.open('GET', requestURL);
        request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                responseJSON = JSON.parse(this.responseText);
                console.log(responseJSON);
                resolve();
        }
    };
    request.send();
});
    return promise;
}

async function getDirections() {
    await assembleRequestURL();
    await sendRequest();
}

async function getDirectionsPhysic() {
    await assembleRequestURLFromCoordinates(49.01225, 8.41346, 49.01303, 8.41078);
    await sendRequest();
}

async function getDirectionsStartup() {
    await assembleRequestURLFromCoordinates(49.01186, 8.41145, 49.01280, 8.41349);
    await sendRequest();
}

async function route() {
    console.log("START ROUTE");

    if (routeToken == "empty") {
        await getDirections();
    }
    else if (routeToken == "physic") {
        await getDirectionsPhysic();
    }
    else if (routeToken == "startup") {
        await getDirectionsStartup();
    }

    var steps = responseJSON["features"][0]["properties"]["segments"][0]["steps"];
    var waypoints = responseJSON["features"][0]["geometry"]["coordinates"];
    var n = 0;
    var varsUpdated = false;
    var currentStep, instructionWaypoint;

    var interval = setInterval(async function() {
        if (!varsUpdated) {
            currentStep = steps[n];
            instructionWaypoint = waypoints[currentStep["way_points"][0]];
            varsUpdated = true;
        }
        var distance = getDistanceBetweenWaypoints([currentLongitude, currentLatitude], instructionWaypoint);
        var threshold = 0.01;//accuracy/1000 + 0.01;
        if (distance <= threshold) {
            instructionsP.innerHTML = "Instruction " + n + ": " + currentStep["instruction"];
            vibrateAccordingToInstruction(currentStep["instruction"]);
            n++;
            varsUpdated = false;
            if (n >= steps.length) {
                clearInterval(interval);
            }
        }
        distanceP.innerHTML = "Distance to next waypoint: " + (distance * 1000).toFixed(1) + "m"
            + "<br />Threshhold: " + threshold * 1000 + "m";
        await updateCurrentPosition();
    }, 3000);
}

async function routePhysic() {
    routeToken = "physic";
    route();
}

async function routeStartup() {
    routeToken = "startup";
    route();
}

