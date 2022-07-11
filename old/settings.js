const Store = require("electron-store");
const store = new Store();

const getCity = () => {
    const defaultCity = "Stockholm";
    const city = store.get("city");

    if (city) return city;
    else {
        store.set("city", defaultCity);
        return defaultCity;
    }
};

const setCity = (city) => {
    if (city) store.set("city", city);
    else console.log("city empty, not saving");
};

module.exports = {
    getCity,
    setCity,
};
