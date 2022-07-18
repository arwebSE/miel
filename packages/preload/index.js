require("dotenv").config();
const { ipcRenderer } = require("electron");
const Store = require("electron-store");
const store = new Store();

const apiUrl = "https://miel-api.arwebse.repl.co";

const domReady = (condition = ["complete", "interactive"]) => {
    return new Promise((resolve) => {
        if (condition.includes(document.readyState)) {
            resolve(true);
        } else {
            document.addEventListener("readystatechange", () => {
                if (condition.includes(document.readyState)) {
                    resolve(true);
                }
            });
        }
    });
};

const safeDOM = {
    append(parent, child) {
        if (!Array.from(parent.children).find((e) => e === child)) {
            return parent.appendChild(child);
        }
    },
    remove(parent, child) {
        if (Array.from(parent.children).find((e) => e === child)) {
            return parent.removeChild(child);
        }
    },
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
    const className = `loaders-css__square-spin`;
    const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
    const oStyle = document.createElement("style");
    const oDiv = document.createElement("div");

    oStyle.id = "app-loading-style";
    oStyle.innerHTML = styleContent;
    oDiv.className = "app-loading-wrap";
    oDiv.innerHTML = `<div class="${className}"><div></div></div>`;

    return {
        appendLoading() {
            safeDOM.append(document.head, oStyle);
            safeDOM.append(document.body, oDiv);
        },
        removeLoading() {
            safeDOM.remove(document.head, oStyle);
            safeDOM.remove(document.body, oDiv);
        },
    };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = (ev) => {
    ev.data.payload === "removeLoading" && removeLoading();
};

setTimeout(removeLoading, 4999);

// ----------------------------------------------------------------------

domReady().then(() => {
    const getDayName = (date = new Date(), locale = "en-US") => {
        return date.toLocaleDateString(locale, { weekday: "short" });
    };

    const getElements = (days) => {
        const cTemp = document.getElementById("temp");
        const cCondition = document.getElementById("condition");
        const cCity = document.getElementById("city");
        const cIcon = document.getElementById("cIcon");
        const cFeel = document.getElementById("feel");
        const cHumidity = document.getElementById("humidity");
        const cMin = document.getElementById("cMin");
        const cMax = document.getElementById("cMax");
        const updatedAt = document.getElementById("updatedAt");
        const sunrise = document.getElementById("sunrise");
        const sunset = document.getElementById("sunset");

        const forecast = [];
        for (let index = 0; index < days; index++) {
            const dayObject = {};
            dayObject.dayEl = document.getElementsByClassName("day")[index];
            dayObject.fIcon = document.getElementsByClassName("fIcon")[index];
            dayObject.hiTemp = document.getElementsByClassName("hiTemp")[index];
            dayObject.loTemp = document.getElementsByClassName("loTemp")[index];
            dayObject.dayName = document.getElementsByClassName("dayName")[index];
            forecast.push(dayObject);
        }
        return {
            cTemp,
            cCondition,
            cCity,
            cIcon,
            cFeel,
            cHumidity,
            cMin,
            cMax,
            updatedAt,
            sunrise,
            sunset,
            forecast,
        };
    };

    const setData = (el, res) => {
        const sunrise = new Date(res.current.sunrise * 1000);
        const sunset = new Date(res.current.sunset * 1000);
        const updatedAt = new Date(res.current.dt * 1000);
        const days = res.daily.length;

        el.cTemp.innerHTML = Math.round(res.current.temp);
        el.cCondition.innerHTML = res.current.weather[0].main;
        el.cIcon.src = `http://openweathermap.org/img/wn/${res.current.weather[0].icon}@2x.png`;
        el.cCity.innerHTML = res.geo.name;
        el.cFeel.innerHTML = Math.round(res.current.feels_like);
        el.cHumidity.innerHTML = res.current.humidity;
        el.cMin.innerHTML = Math.round(res.daily[0].temp.min);
        el.cMax.innerHTML = Math.round(res.daily[0].temp.max);
        el.updatedAt.innerHTML = `${updatedAt.getHours()}:${updatedAt.getMinutes()}`;
        el.sunrise.innerHTML = `${sunrise.getHours()}:${sunrise.getMinutes()}`;
        el.sunset.innerHTML = `${sunset.getHours()}:${sunset.getMinutes()}`;

        console.log("Got " + days + " days of forecast", res.daily);
        for (let index = 0; index < 7; index++) {
            const fDay = res.daily[index + 1];
            el.forecast[index].dayEl.style.display = "block";
            el.forecast[index].fIcon.src = `http://openweathermap.org/img/wn/${fDay.weather[0].icon}@2x.png`;
            el.forecast[index].hiTemp.innerHTML = Math.round(fDay.temp.max);
            el.forecast[index].loTemp.innerHTML = Math.round(fDay.temp.min);
            el.forecast[index].dayName.innerHTML = getDayName(new Date(fDay.dt * 1000));
        }
    };

    const toggleSettings = () => {
        const popupEl = document.getElementById("popup");
        const dState = popupEl.style.display;
        if (dState === "block") popupEl.style.display = "none";
        else popupEl.style.display = "block";
        console.log("Settings opened");
    };

    const getCity = () => {
        const defaultCity = "Stockholm";
        const city = store.get("city");

        if (city) return city;
        else {
            store.set("city", defaultCity);
            return defaultCity;
        }
    };

    const setupSettings = () => {
        const settingsButton = document.getElementById("settings");
        const cityInput = document.getElementById("cityInput");
        const saveButton = document.getElementById("saveCity");

        const city = getCity();
        cityInput.value = city;

        settingsButton.addEventListener("click", () => {
            toggleSettings();
        });

        saveButton.addEventListener("click", () => {
            ipcRenderer.send("saveCity", cityInput.value);
            console.log("saved button pressed");
            callAPI(cityInput.value);
            toggleSettings();
        });
    };

    const callAPI = async (city) => {
        console.log("Calling API for " + city);
        const days = 7;
        const verify = "b2d100b565620e1b1765";
        const res = await fetch(`${apiUrl}/weather?q=${city}&verify=${verify}`);
        const result = await res.json();
        setData(getElements(days), result);
        console.log("Got data", result);
    };

    callAPI(getCity());
    setupSettings();
});
