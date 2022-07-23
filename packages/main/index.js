const os = require("os");
const { join } = require("path");
const { app, BrowserWindow, ipcMain, screen, session } = require("electron");
const { setVibrancy } = require("electron-acrylic-window");
const Store = require("electron-store");
const store = new Store();

const isWin7 = os.release().startsWith("6.1");
if (isWin7) app.disableHardwareAcceleration();

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

const ROOT_PATH = {
    dist: join(__dirname, "../.."),
    public: join(__dirname, app.isPackaged ? "../.." : "../../../public"),
};

const timeConsole = (...args) => {
    const d = new Date();
    console.log(`[${d.toLocaleTimeString()}]`, ...args);
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
    const winWidth = 360;
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
        frame: false,
        resizable: false,
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#00000055",
            symbolColor: "#3a82b3",
        },
    };

    setAutoStart();

    /* if (extDisplay) {
        winConfig.x = extDisplay.bounds.width - dWidth - 88;
        winConfig.y = extDisplay.bounds.y + winHeight - 88;
    } */

    win = new BrowserWindow(winConfig);

    // Test actively push message to the Electron-Renderer
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send("main-process-message", new Date().toLocaleString());
    });

    if (app.isPackaged) {
        win.loadFile(join(__dirname, "../renderer/index.html"));
        timeConsole("Running in production");
    } else {
        const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`;
        win.loadURL(url);
        // DevTools
        timeConsole("Running in development");
        const devtools = new BrowserWindow();
        win.webContents.setDevToolsWebContents(devtools.webContents);
        win.webContents.openDevTools({ mode: "detach" });
        const winBounds = win.getBounds();
        devtools.setPosition(winBounds.x - winBounds.width, winBounds.y - winBounds.height * 2);
        devtools.setSize(winBounds.width * 2, winBounds.height * 2);
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

// autostart
const setAutoStart = (autoStart = getSettings().autoStart) => {
    timeConsole("Setting autoStart:", autoStart);
    app.setLoginItemSettings({
        openAtLogin: autoStart,
        path: app.getPath("exe"),
    });
};

// theme
const setTheme = (theme = getSettings().theme) => {
    timeConsole("Setting theme:", theme);
    const setTranslucent = () => {
        setVibrancy(win, {
            theme: "#15151550",
            effect: "acrylic",
            disableOnBlur: false,
            maximumRefreshRate: 60,
            useCustomWindowRefreshMethod: true,
        });
    };
    switch (getSettings().theme) {
        case "opaque":
            setVibrancy(win, null);
            break;
        case "translucent":
            setTranslucent();
            break;
        default:
            setTranslucent();
            break;
    }
}

const getSettings = () => {
    const store = new Store();
    const settings = store.get("settings");

    if (settings) return settings;
    else {
        const defaultSettings = {
            city: "Stockholm",
            autoStart: false,
            format24: true,
            freedom: false,
            theme: "translucent",
        };
        store.set("settings", defaultSettings);
        return defaultSettings;
    }
};

const setSettings = (settings) => {
    if (settings) store.set("settings", settings);
    else timeConsole("settings empty, not saving");
};

ipcMain.on("saveSettings", (_event, settings) => {
    const storedSettings = getSettings();
    timeConsole("Stored settings:", storedSettings);
    if (settings !== storedSettings) {
        timeConsole("Saving settings:", settings);
        setSettings(settings);
        if (settings.autoStart !== storedSettings.autoStart) {
            setAutoStart(settings.autoStart);
        }
        if (settings.theme !== storedSettings.theme) {
            setTheme(settings.theme);
        }
    }
});
