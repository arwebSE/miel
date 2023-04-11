const os = require("os");
const { join } = require("path");
const { app, BrowserWindow, ipcMain, screen, session, Tray, Menu } = require("electron");
const { setVibrancy } = require("electron-acrylic-window");
const Store = require("electron-store");
const store = new Store();
const args = require("minimist")(process.argv);

const isWin7 = os.release().startsWith("6.1");
if (isWin7) app.disableHardwareAcceleration();

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

const timeConsole = (...args) => {
    const d = new Date();
    console.log(`[${d.toLocaleTimeString()}]`, ...args);
};

let win = null;

// vite dev server url
const VITE_URL = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`;

let PUB_PATH = join(__dirname, "../../public");
const MODE = app.isPackaged ? "PRODUCTION" : args.inspect ? "DEBUG" : "DEV";
switch (MODE) {
    case "DEV":
        timeConsole("Running in DEV MODE");
        PUB_PATH = VITE_URL;
        break;
    case "PRODUCTION":
        timeConsole("Running in PRODUCTION");
        PUB_PATH = join(__dirname, "../..");
        break;
    case "DEBUG":
        timeConsole("Running in DEBUG MODE");
        PUB_PATH = join(__dirname, "../../public");
        break;
    default:
        break;
}

const ROOT_PATH = {
    dist: join(__dirname, "../.."),
    public: PUB_PATH,
};

console.log("public path", ROOT_PATH.public);

const createWindow = async () => {
    const display = screen.getPrimaryDisplay();
    const dWidth = display.bounds.width;
    const dHeight = display.bounds.height;
    const winWidth = 361;
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
        /* autoHideMenuBar: true, */
        frame: false,
        resizable: false,
        titleBarStyle: "hidden",
        /* titleBarOverlay: {
            color: "#00000000",
            symbolColor: "#3a82b3",
        }, */
        /* transparent: true, */
    };

    setAutoStart();

    win = new BrowserWindow(winConfig);

    // Test actively push message to the Electron-Renderer
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send("main-process-message", new Date().toLocaleString());
        setTheme();
        setAlwaysOnTop();
    });

    // OPEN DEVTOOLS ON START
    if (MODE === "DEV") {
        win.loadURL(VITE_URL);
        devTools();
    } else {
        win.loadFile(join(__dirname, "../renderer/index.html"));
        if (MODE === "DEBUG") {
            devTools();
        }
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

const devTools = () => {
    // DevTools
    const devtools = new BrowserWindow();
    win.webContents.setDevToolsWebContents(devtools.webContents);
    win.webContents.openDevTools({ mode: "detach" });
    const winBounds = win.getBounds();
    devtools.setPosition(winBounds.x - winBounds.width, winBounds.y - winBounds.height * 2);
    devtools.setSize(winBounds.width * 2, winBounds.height * 2);
    devtools.setAlwaysOnTop(true);
};

app.whenReady().then(() => {
    createWindow();
    createTray();
});

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
    let startupArgs = "";
    if (args.inspect) startupArgs = "--inspect";
    timeConsole(`Setting autoStart: ${autoStart}, args: ${startupArgs}`);
    app.setLoginItemSettings({
        openAtLogin: autoStart,
        path: app.getPath("exe"),
        args: [startupArgs],
    });
};

// always on top
const setAlwaysOnTop = (alwaysOnTop = getSettings().alwaysOnTop) => {
    timeConsole("Setting alwaysOnTop:", alwaysOnTop);
    if (win) {
        win.setAlwaysOnTop(alwaysOnTop, "screen-saver");
    }
};

// system tray icon
const createTray = () => {
    const trayIconPath =  join(ROOT_PATH.public + "/icon.png").replace(/\/{2,}/, '/');
    console.log("trayIconPath", trayIconPath);
    const tray = new Tray(trayIconPath);
    tray.setToolTip("miEl");

    tray.on("click", () => {
        win.show();
    });
    // show menu on right click
    tray.on("right-click", () => {
        const menuConfig = buildTrayMenu();
        tray.popUpContextMenu(menuConfig);
    });
};

const buildTrayMenu = () => {
    return Menu.buildFromTemplate([
        {
            label: "Show",
            click: () => {
                win.show();
            },
        },
        // about window
        {
            label: "About",
            click: () => {
                const aboutPath = join(ROOT_PATH.public, "/about.html");
                console.log("aboutPath", aboutPath);
                const aboutWindow = new BrowserWindow({
                    width: 400,
                    height: 400,
                    webPreferences: {
                        nodeIntegration: true,
                    },
                });
                aboutWindow.loadFile(aboutPath);
            },
        },
        {
            label: "Quit",
            click: () => {
                app.quit();
            },
        },
    ]);
};

// theme
const setTheme = async (theme = getSettings().theme) => {
    timeConsole("Setting theme:", theme);
    const performance = {
        disableOnBlur: false,
        maximumRefreshRate: 60,
        useCustomWindowRefreshMethod: true,
        debug: true,
    };
    const setTranslucent = () => {
        setVibrancy(win, {
            theme: "dark",
            effect: "acrylic",
            ...performance,
        });
    };
    switch (getSettings().theme) {
        case "opaque":
            setVibrancy(win, null);
            win.webContents.send("theme", "opaque");
            break;
        case "translucent":
            setTranslucent();
            win.webContents.send("theme", "translucent");
            break;
        case "classic":
            setVibrancy(win, null);
            win.webContents.send("theme", "classic");
            //win.webContents.reloadIgnoringCache();
            break;
        default:
            setTranslucent();
            win.webContents.send("theme", "translucent");
            break;
    }
};

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
            icons: "default",
            alwaysOnTop: false,
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
        if (settings.alwaysOnTop !== storedSettings.alwaysOnTop) {
            setAlwaysOnTop(settings.alwaysOnTop);
        }
    }
    //win.webContents.reloadIgnoringCache();
});

ipcMain.on("exit", (_event, _arg) => {
    app.quit();
});

ipcMain.on("minimize", (_event, _arg) => {
    //win.minimize();
    win.hide();
});
