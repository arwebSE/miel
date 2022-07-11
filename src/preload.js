const { ipcRenderer } = require("electron");
const { getCity } = require("./settings");
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

const callAPI = async (city) => {
    const response = await fetch(`${config.weatherURL}?q=${city}&appid=${config.apiKey}&units=metric`);
    const result = await response.json();
    console.log("callAPI", result);
    console.log(`City: ${result.name} Temp: ${result.main.temp}`);
    weatherEl.innerHTML = `City: ${result.name} Temp: ${result.main.temp}`;
    tempEl.innerHTML = result.main.temp;
};
