import "./index.css";
const config = require("../config.json");

const cityInput = document.getElementById("cityInput");
const callButton = document.getElementById("callAPI");
const weatherEl = document.getElementById("weather");
const tempEl = document.getElementById("temp");
const saveButton = document.getElementById("save");

const callAPI = async (city) => {
    const response = await fetch(`${config.weatherURL}?q=${city}&appid=${config.apiKey}&units=metric`);
    const result = await response.json();
    console.log("callAPI", result);
    console.log(`City: ${result.name} Temp: ${result.main.temp}`);
    weatherEl.innerHTML = `City: ${result.name} Temp: ${result.main.temp}`;
    tempEl.innerHTML = result.main.temp;
};

callButton.onclick = () => {
    callAPI(cityInput.value);
    console.log("saved", store.get("city"));
};

saveButton.onclick = () => {
    window.saveCity();
};
