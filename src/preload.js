const Store = require("electron-store");
const store = new Store();

const cityInput = document.getElementById("cityInput");

window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ["chrome", "node", "electron"]) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});

console.log("current city", store.get("city"));

window.saveCity = function () {
    console.log("saving", cityInput.value);
    //store.set("city", cityInput.value);
    console.log("saved", store.get("city"));
};
