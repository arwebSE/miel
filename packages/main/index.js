const os = require("os");
const { join } = require("path");
const { app, BrowserWindow, ipcMain, screen, session } = require("electron");
const isDev = require("electron-is-dev");
const AcrylicBW = require("electron-acrylic-window").BrowserWindow;
const Store = require("electron-store");
const store = new Store();

const isWin7 = os.release().startsWith("6.1");
if (isWin7) app.disableHardwareAcceleration();

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) app.quit();

const ROOT_PATH = {
    dist: join(__dirname, "../.."),
    public: join(__dirname, app.isPackaged ? "../.." : "../../../public"),
};

let win = null;

const createWindow = async () => {
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
        title: "Main window",
        width: winWidth,
        height: winHeight,
        x: dWidth - winWidth,
        y: dHeight - winHeight - 40,

        webPreferences: {
            preload: join(__dirname, "../preload/index.cjs"),
            contextIsolation: false,
            nodeIntegration: true,
        },
        icon: join(ROOT_PATH.public, "logo.svg"),
        autoHideMenuBar: true,
        frame: true,
        resizable: false,
        /* transparent: true,
        backgroundColor: "#00000001", */
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

    win = new AcrylicBW(winConfig);

    // DevTools
    if (isDev) {
        console.log("Running in development");
        const devtools = new BrowserWindow();
        win.webContents.setDevToolsWebContents(devtools.webContents);
        win.webContents.openDevTools({ mode: "detach" });
    } else {
        console.log("Running in production");
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send("main-process-message", new Date().toLocaleString());
        //const winBounds = win.getBounds();
        //devtools.setPosition(winBounds.x - winBounds.width + 360, winBounds.y + winBounds.height);
        //devtools.setSize(winBounds.width * 2 + 10, winBounds.height * 2);
    });

    if (app.isPackaged) {
        win.loadFile(join(__dirname, "../renderer/index.html"));
    } else {
        const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`;
        win.loadURL(url);
        // win.webContents.openDevTools({ mode: 'undocked' })
    }

    /* session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": ["style-src 'self' *.cloudflare.com 'unsafe-inline'; script-src 'self' localho.st 'unsafe-inline' 'unsafe-eval';"],
            },
        });
    }); */
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    win = null;
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("second-instance", () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on("activate", () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
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
