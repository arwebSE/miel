require("dotenv").config();
const { ipcRenderer } = require("electron");
const apiKey = process.env["API_KEY"];
const apiUrl = process.env["API_URL"];

function domReady(condition = ["complete", "interactive"]) {
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
}

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
        const updatedAt = document.getElementById("updatedAt");

        const forecast = {};
        for (let index = 0; index < days; index++) {
            const dayObject = {};
            dayObject.dayEl = document.getElementsByClassName("day")[index];
            dayObject.fIcon = document.getElementsByClassName("fIcon")[index];
            dayObject.hiTemp = document.getElementsByClassName("hiTemp")[index];
            dayObject.loTemp = document.getElementsByClassName("loTemp")[index];
            dayObject.dayName = document.getElementsByClassName("dayName")[index];
            forecast[index] = dayObject;
        }
        return { cTemp, cCondition, cCity, cIcon, cFeel, cHumidity, updatedAt, forecast };
    };

    const setData = (result, el) => {
        console.log("el", el);
        el.cTemp.innerHTML = result.current.temp_c;
        el.cCondition.innerHTML = result.current.condition.text;
        el.cIcon.src = result.current.condition.icon;
        el.cCity.innerHTML = result.location.name;
        el.cFeel.innerHTML = result.current.feelslike_c;
        el.cHumidity.innerHTML = result.current.humidity;
        el.updatedAt.innerHTML = result.current.last_updated.split(" ")[1];
        for (let index = 0; index < el.forecast.length; index++) {
            console.log("el.forecast[index]", el.forecast[index]);
            el.forecast[index].dayEl.style.display = "block";
            el.forecast[index].fIcon.src = result.forecast.forecastday[index].day.condition.icon;
            el.forecast[index].hiTemp.innerHTML = Math.round(result.forecast.forecastday[index].day.maxtemp_c);
            el.forecast[index].loTemp.innerHTML = Math.round(result.forecast.forecastday[index].day.mintemp_c);
            el.forecast[index].dayName.innerHTML = getDayName(new Date(result.forecast.forecastday[index].date));
        }
    };

    const callAPI = async (city) => {
        const days = 7;
        const response = await fetch(`${apiUrl}?q=${city}&key=${apiKey}&aqi=no&alerts=no&days=${days}`);
        const result = await response.json();
        setData(result, getElements(days));
    };
    callAPI("Södertälje");
});
