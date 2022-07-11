import { join } from "path";
import { app, BrowserWindow, ipcMain, screen } from "electron";

export const ROOT_PATH = {
    // /dist
    dist: join(__dirname, "../.."),
    // /dist or /public
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
    const dWidth = display.bounds.width;
    const dHeight = display.bounds.height;
    const winWidth = 400 + 400;
    const winHeight = 400;

    const win = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        x: dWidth - winWidth + 5,
        y: dHeight - winHeight - 35,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, "./preload.js"),
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: join(ROOT_PATH.public, "logo.svg"),
    });

    // Test active push message to Renderer-process.
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send("main-process-message", new Date().toLocaleString());
    });

    if (app.isPackaged) {
        win.loadFile(join(ROOT_PATH.dist, "index.html"));
    } else {
        win.loadURL(url);
    }

    // Open the DevTools.
    win.webContents.openDevTools();

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

ipcMain.on("saveCity", (_event, value) => {
    const storedCity = getCity();
    console.log("Stored city:", storedCity);
    if (value !== storedCity) {
        console.log("Saving city:", value);
        setCity(value);
    }
})
