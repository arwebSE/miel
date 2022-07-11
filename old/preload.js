const { ipcRenderer } = require("electron");
const { getCity } = require("../src/settings");
const config = require("../config.json");

document.addEventListener("DOMContentLoaded", () => {
    const cityInput = document.getElementById("cityInput");
    const saveButton = document.getElementById("saveCity");
    const callButton = document.getElementById("callAPI");
    const weatherEl = document.getElementById("weather");
    const tempEl = document.getElementById("temp");

    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };
    for (const dependency of ["chrome", "node", "electron"]) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }

    const callAPI = async (city) => {
        const response = await fetch(`${config.weatherURL}?q=${city}&key=${config.apiKey}&aqi=no&alerts=no&days=7`);
        const result = await response.json();
        console.log("callAPI", result);
        console.log(`City: ${result.location.name} cTemp: ${result.current.temp_c}`);
        weatherEl.innerHTML = `City: ${result.name} Temp: ${result.main.temp}`;
        tempEl.innerHTML = result.main.temp;
    };

    // get city from store and replace input value
    const city = getCity();
    cityInput.value = city;

    saveButton.onclick = () => {
        ipcRenderer.send("saveCity", cityInput.value);
    };

    callButton.onclick = () => {
        if (cityInput.value) callAPI(cityInput.value);
    };
});
