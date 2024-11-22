const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            nodeIntegration: true,
        },
    });

    const isDev = !app.isPackaged;

    mainWindow.loadURL(
        isDev
            ? "http://localhost:5173" // Vite dev server
            : `file://${path.join(__dirname, "dist/index.html")}` // Production build
    );
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
