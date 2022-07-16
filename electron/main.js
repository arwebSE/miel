const { join } = require("path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const AcrylicBW = require("electron-acrylic-window").BrowserWindow;
const Store = require("electron-store");
const store = new Store();

const ROOT_PATH = {
    dist: join(__dirname, "../.."),
    public: join(__dirname, app.isPackaged ? "../.." : "../../../public"),
};

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
/* if (require("electron-squirrel-startup")) {
    app.quit();
} */

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`;

const createWindow = () => {
    const display = screen.getPrimaryDisplay();
    /* const displays = screen.getAllDisplays();
    const extDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0;
    }); */
    const dWidth = display.bounds.width;
    const dHeight = display.bounds.height;
    const winWidth = 365;
    const winHeight = 210;

    const winConfig = {
        width: winWidth,
        height: winHeight,
        x: dWidth - winWidth,
        y: dHeight - winHeight - 40,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, "./preload.js"),
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: join(ROOT_PATH.public, "logo.svg"),
        frame: true,
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#111",
            symbolColor: "#3a82b3",
        },
        vibrancy: {
            theme: "#00000044",
            effect: "dark",
            disableOnBlur: false,
            maximumRefreshRate: 60,
            useCustomWindowRefreshMethod: false,
        },
    };

    /* if (extDisplay) {
        winConfig.x = extDisplay.bounds.width - dWidth - 88;
        winConfig.y = extDisplay.bounds.y + winHeight - 88;
    } */

    const win = new AcrylicBW(winConfig);

    // DevTools
    //const devtools = new BrowserWindow();
    //win.webContents.setDevToolsWebContents(devtools.webContents);
    //win.webContents.openDevTools({ mode: "detach" });

    // Test active push message to Renderer-process.

    win.webContents.on("did-finish-load", () => {
        win?.webContents.send("main-process-message", new Date().toLocaleString());
        //const winBounds = win.getBounds();
        //devtools.setPosition(winBounds.x - winBounds.width + 360, winBounds.y + winBounds.height);
        //devtools.setSize(winBounds.width * 2 + 10, winBounds.height * 2);
    });

    if (app.isPackaged) {
        win.loadFile(join(ROOT_PATH.dist, "index.html"));
    } else {
        win.loadURL(url);
    }

    /* session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": ["style-src 'self' *.jsdelivr.net 'unsafe-inline'; "],
            },
        });
    }); */
};

// This method will be called when Electron has finished init
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// macOS fix
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

const getCity = () => {
    const store = new Store();
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

ipcMain.on("saveCity", (_event, value) => {
    const storedCity = getCity();
    console.log("Stored city:", storedCity);
    console.log("Saving city:", value);
    if (value !== storedCity) {
        console.log("Saving city:", value);
        setCity(value);
    }
});
