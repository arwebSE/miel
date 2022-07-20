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

/* Loader */
function useLoading() {
    const className = `loader`;
    const styleContent = `
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9;
}

.sk-chase {
    width: 40px;
    height: 40px;
    position: relative;
    animation: sk-chase 2.5s infinite linear both;
}
  
.sk-chase-dot {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0; 
    animation: sk-chase-dot 2.0s infinite ease-in-out both; 
}
  
.sk-chase-dot:before {
    content: '';
    display: block;
    width: 25%;
    height: 25%;
    background-color: #fff;
    border-radius: 100%;
    animation: sk-chase-dot-before 2.0s infinite ease-in-out both; 
}
  
.sk-chase-dot:nth-child(1) { animation-delay: -1.1s; }
.sk-chase-dot:nth-child(2) { animation-delay: -1.0s; }
.sk-chase-dot:nth-child(3) { animation-delay: -0.9s; }
.sk-chase-dot:nth-child(4) { animation-delay: -0.8s; }
.sk-chase-dot:nth-child(5) { animation-delay: -0.7s; }
.sk-chase-dot:nth-child(6) { animation-delay: -0.6s; }
.sk-chase-dot:nth-child(1):before { animation-delay: -1.1s; }
.sk-chase-dot:nth-child(2):before { animation-delay: -1.0s; }
.sk-chase-dot:nth-child(3):before { animation-delay: -0.9s; }
.sk-chase-dot:nth-child(4):before { animation-delay: -0.8s; }
.sk-chase-dot:nth-child(5):before { animation-delay: -0.7s; }
.sk-chase-dot:nth-child(6):before { animation-delay: -0.6s; }
  
@keyframes sk-chase {
    100% { transform: rotate(360deg); } 
}
  
@keyframes sk-chase-dot {
    80%, 100% { transform: rotate(360deg); } 
}
  
@keyframes sk-chase-dot-before {
    50% {
        transform: scale(0.4); 
    } 100%, 0% {
        transform: scale(1.0); 
    }
}`;

    const oStyle = document.createElement("style");
    const oDiv = document.createElement("div");

    oStyle.id = "app-loading-style";
    oStyle.innerHTML = styleContent;
    oDiv.className = "app-loading-wrap";
    oDiv.innerHTML = `<div class="${className}"><div class="sk-chase">
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
</div><div></div></div>`;

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
    const iconUrl = "http://openweathermap.org/img/wn";
    let timeouts = [];

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
        const tempFormat = document.getElementsByClassName("tempFormat");

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
            tempFormat,
        };
    };

    const setData = (el, res) => {
        const sunrise = new Date(res.current.sunrise * 1000);
        const sunset = new Date(res.current.sunset * 1000);
        const updatedAt = new Date(res.current.dt * 1000);
        const days = res.daily.length;

        el.cTemp.innerHTML = Math.round(res.current.temp);
        el.cCondition.innerHTML = res.current.weather[0].main;
        el.cIcon.src = `${iconUrl}/${res.current.weather[0].icon}@2x.png`;
        el.cCity.innerHTML = res.geo.name;
        el.cFeel.innerHTML = Math.round(res.current.feels_like);
        el.cHumidity.innerHTML = res.current.humidity;
        el.cMin.innerHTML = Math.round(res.daily[0].temp.min);
        el.cMax.innerHTML = Math.round(res.daily[0].temp.max);
        el.updatedAt.innerHTML = getTime(updatedAt);
        el.sunrise.innerHTML = getTime(sunrise);
        el.sunset.innerHTML = getTime(sunset);
        const tempUnit = getSettings().freedom ? "F" : "C";
        const unitElements = document.getElementsByClassName("tempFormat");
        [].slice.call(unitElements).forEach(function (el) {
            el.innerHTML = tempUnit;
        });

        timeConsole("Got " + days + " days of forecast", res.daily);
        for (let index = 0; index < 7; index++) {
            const fDay = res.daily[index + 1];
            el.forecast[index].dayEl.style.display = "block";
            el.forecast[index].fIcon.src = `${iconUrl}/${fDay.weather[0].icon}@2x.png`;
            el.forecast[index].hiTemp.innerHTML = Math.round(fDay.temp.max);
            el.forecast[index].loTemp.innerHTML = Math.round(fDay.temp.min);
            el.forecast[index].dayName.innerHTML = getDay(new Date(fDay.dt * 1000));
        }
    };

    const toggleSettings = () => {
        const popupEl = document.getElementById("popup");
        const dState = popupEl.style.display;
        if (dState === "block") popupEl.style.display = "none";
        else popupEl.style.display = "block";
        timeConsole("Settings opened");
    };

    const getSettings = () => {
        const settings = store.get("settings");

        if (settings) return settings;
        else {
            const defaultSettings = {
                city: "Stockholm",
                autoStart: false,
                format24: true,
                freedom: false,
            };
            store.set("settings", defaultSettings);
            return defaultSettings;
        }
    };

    const setupSettings = () => {
        const settingsButton = document.getElementById("settings");
        const cityInput = document.getElementById("cityInput");
        const autoStart = document.getElementById("autoStart");
        const format24 = document.getElementById("format24");
        const freedom = document.getElementById("freedom");
        const saveButton = document.getElementById("saveSettings");

        const settings = getSettings();
        cityInput.value = settings.city;
        autoStart.checked = settings.autoStart;
        format24.checked = settings.format24;
        freedom.checked = settings.freedom;

        settingsButton.addEventListener("click", () => {
            toggleSettings();
        });

        saveButton.addEventListener("click", () => {
            const newSettings = {
                city: cityInput.value,
                autoStart: autoStart.checked,
                format24: format24.checked,
                freedom: freedom.checked,
            };
            timeConsole("Sending data to ipcMain", newSettings);
            ipcRenderer.send("saveSettings", newSettings);
            autoRefresh({ city: newSettings.city, reason: "Settings" });
            toggleSettings();
        });

        const updated = document.getElementById("updated");
        updated.addEventListener("click", () => {
            autoRefresh({ reason: "Manual" });
        });
    };

    const callAPI = async (city) => {
        timeConsole("Calling API for " + city);
        const days = 7;
        const verify = "5ecf486e3b8d878a4a87";
        const freedom = getSettings().freedom;
        const url = `${apiUrl}/weather?q=${city}&verify=${verify}&freedom=${freedom}`;
        const warningEl = document.getElementById("warning");
        await fetch(url)
            .then((response) => response.json())
            .then((result) => {
                setData(getElements(days), result);
                timeConsole("Got data", result);
                warningEl.innerHTML = "";
                clearTimeouts();
                normalTimeout();
            })
            .catch((error) => {
                timeConsole("Error fetching API:", error);
                warningEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation fa-xs"></i>`;
                clearTimeouts();
                errorTimeout();
            });
        postMessage({ payload: "removeLoading" }, "*");
    };

    const clearTimeouts = () => {
        timeConsole("Clearing timeouts", timeouts);
        for (var i = 0; i < timeouts.length; i++) {
            clearTimeout(timeouts[i]);
        }
        timeouts = [];
    };

    const errorTimeout = () => {
        timeConsole("Error timeout");
        timeouts.push(
            setTimeout(function () {
                autoRefresh({ reason: "Error" });
            }, 1000 * 60 * 5)
        );
    };

    const normalTimeout = () => {
        timeouts.push(
            setTimeout(function () {
                autoRefresh({ reason: "Auto" });
            }, 1000 * 60 * 30)
        );
    };

    const autoRefresh = async (params) => {
        appendLoading();
        if (params.reason) timeConsole(params.reason, "refresh...");
        else timeConsole("Manual refresh...");
        await callAPI(params.city || getSettings().city);
        removeLoading();
    };

    const timeConsole = (...args) => {
        const d = new Date();
        console.log(`[${d.toLocaleTimeString()}]`, ...args);
    };

    const getTime = (date) => {
        const hour24 = getSettings().format24;
        return date.toLocaleTimeString([], { timeStyle: "short", hour12: !hour24 });
    };

    const getDay = (date = new Date()) => {
        return date.toLocaleDateString([], { weekday: "short" });
    };

    setupSettings();
    autoRefresh({ reason: "Initial" });
});
