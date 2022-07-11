const { app, screen, BrowserWindow, session, ipcMain } = require("electron");
const { getCity, setCity } = require("./settings");

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
    app.quit();
}

// Create the browser window.
const createWindow = () => {
    const display = screen.getPrimaryDisplay();
    const dWidth = display.bounds.width;
    const dHeight = display.bounds.height;
    const winWidth = 400 + 500;
    const winHeight = 400;
    const mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        x: dWidth - winWidth + 5,
        y: dHeight - winHeight - 35,
        autoHideMenuBar: true,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    //mainWindow.removeMenu();

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": ["style-src 'self' *.jsdelivr.net 'unsafe-inline'; "],
            },
        });
    });
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

ipcMain.on("saveCity", (_event, value) => {
    const storedCity = getCity();
    console.log("Stored city:", storedCity);
    if (value !== storedCity) {
        console.log("Saving city:", value);
        setCity(value);
    }
})
