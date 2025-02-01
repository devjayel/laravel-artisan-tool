const { app, BrowserWindow } = require("electron");
const path = require("path");
const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const { exec, spawn } = require("child_process");

let mainWindow;
let serverProcess = null; // Laravel server process
let reactProcess = null; // React server process

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, "assets", "favicon.ico"),
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
        autoHideMenuBar: true,
        show: false,
    });

    mainWindow.on("ready-to-show", mainWindow.show);

    const isDev = !app.isPackaged;

    mainWindow.loadURL(
        isDev
            ? "http://localhost:5173" // Vite dev server
            : `file://${path.join(__dirname, "dist/index.html")}` // Production build
    );
});

app.on("window-all-closed", () => {
    if (serverProcess) {
        if (process.platform === "win32") {
            exec(`taskkill /pid ${serverProcess.pid} /T /F`);
        } else {
            serverProcess.kill("SIGTERM");
        }
    }

    // Cleanup React server
    if (reactProcess) {
        if (process.platform === "win32") {
            exec(`taskkill /pid ${reactProcess.pid} /T /F`);
        } else {
            reactProcess.kill("SIGTERM");
        }
    }

    if (process.platform !== "darwin") {
        app.quit();
    }
});

const dbPath = path.join(__dirname, "database.json");

ipcMain.on("get-all", (event) => {
    const data = readDB();
    event.sender.send("data-response", data);
});

ipcMain.on("execute:command", (event, data) => {
    const { artisan, project } = data;
    const { folder: path, name } = project;

    exec(artisan, { cwd: path }, (error, stdout, stderr) => {
        if (error) {
            console.error(stderr);
            console.error(`Error executing command: ${error}`);
            event.sender.send("command-error", error.message);
            return;
        }

        console.log(`Command output: ${stdout}`);
        event.sender.send("command-success", stdout);
    });
});

// Handle folder selection
ipcMain.handle("select:folder", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
    });

    // Check if the dialog was canceled
    if (result.canceled || !result.filePaths.length) {
        return { error: "No folder selected" };
    }

    const folderPath = result.filePaths[0];

    // Ensure folderPath is a valid string
    if (typeof folderPath !== "string") {
        throw new Error("Invalid folder path received");
    }

    // Check for the .env file in the selected folder
    const envPath = path.join(folderPath, ".env");

    if (!fs.existsSync(envPath)) {
        return { folder: folderPath, error: ".env file not found in the selected folder" };
    }

    // Read the .env file
    const envContent = fs.readFileSync(envPath, "utf-8");

    // Extract APP_NAME using regex
    const appNameMatch = envContent.match(/^APP_NAME=(.+)$/m);
    const appName = appNameMatch ? appNameMatch[1].trim() : null;

    if (!appName) {
        return { folder: folderPath, error: "APP_NAME not found in the .env file" };
    }

    return { folder: folderPath, name: appName };
});

// Handle Laravel verification
ipcMain.handle("verify:laravel", async (event, folderPath) => {
    console.log(folderPath);
    try {
        const requiredFiles = ["artisan", ".env", "composer.json"];
        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(folderPath, file))) {
                return false; // Missing a key file
            }
        }
        return true; // All key files found
    } catch (error) {
        console.error("Error verifying Laravel project:", error);
        return false;
    }
});

// Handle project save
ipcMain.handle("save:project", async (event, projectData) => {
    try {
        if (!projectData || typeof projectData !== "object") {
            throw new Error("Invalid project data");
        }

        mainWindow.webContents.send("save-to-storage", projectData);
        return { success: true };
    } catch (error) {
        console.error("Error saving project:", error);
        return { success: false, error: error.message };
    }
});

// Handle project load
ipcMain.handle("load:project", async () => {
    try {
        // Request data from renderer
        mainWindow.webContents.send("load-from-storage");
        return new Promise((resolve) => {
            ipcMain.once("storage-data", (event, data) => {
                resolve({ success: true, data });
            });
        });
    } catch (error) {
        console.error("Error loading project:", error);
        return { success: false, error: error.message };
    }
});

function readDB() {
    if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath, "utf-8");
        return JSON.parse(data);
    }
    return {};
}

// Laravel Server Handlers
ipcMain.handle("start:server", async (event, data) => {
    try {
        if (serverProcess) {
            return { error: "Laravel server is already running" };
        }

        const { project } = data;
        serverProcess = spawn("php", ["artisan", "serve"], {
            cwd: project.folder,
            shell: true,
        });

        serverProcess.stdout.on("data", (data) => {
            console.log(`Laravel Server output: ${data}`);
            mainWindow.webContents.send("server-output", data.toString());
        });

        serverProcess.stderr.on("data", (data) => {
            console.error(`Laravel Server error: ${data}`);
            mainWindow.webContents.send("server-error", data.toString());
        });

        serverProcess.on("close", (code) => {
            console.log(`Laravel Server process exited with code ${code}`);
            serverProcess = null;
            mainWindow.webContents.send("server-stopped");
        });

        return { success: true };
    } catch (error) {
        console.error("Error starting Laravel server:", error);
        return { error: error.message };
    }
});

ipcMain.handle("stop:server", async () => {
    try {
        if (!serverProcess) {
            return { error: "No Laravel server is running" };
        }

        if (process.platform === "win32") {
            exec(`taskkill /pid ${serverProcess.pid} /T /F`);
        } else {
            serverProcess.kill("SIGTERM");
        }

        serverProcess = null;
        return { success: true };
    } catch (error) {
        console.error("Error stopping Laravel server:", error);
        return { error: error.message };
    }
});

// React Server Handlers
ipcMain.handle("start:react", async (event, data) => {
    try {
        if (reactProcess) {
            return { error: "React server is already running" };
        }

        const { project } = data;
        reactProcess = spawn("npm", ["run", "dev"], {
            cwd: project.folder,
            shell: true,
        });

        reactProcess.stdout.on("data", (data) => {
            console.log(`React output: ${data}`);
            mainWindow.webContents.send("react-output", data.toString());
        });

        reactProcess.stderr.on("data", (data) => {
            console.error(`React error: ${data}`);
            mainWindow.webContents.send("react-error", data.toString());
        });

        reactProcess.on("close", (code) => {
            console.log(`React process exited with code ${code}`);
            reactProcess = null;
            mainWindow.webContents.send("react-stopped");
        });

        return { success: true };
    } catch (error) {
        console.error("Error starting React:", error);
        return { error: error.message };
    }
});

ipcMain.handle("stop:react", async () => {
    try {
        if (!reactProcess) {
            return { error: "No React server is running" };
        }

        if (process.platform === "win32") {
            exec(`taskkill /pid ${reactProcess.pid} /T /F`);
        } else {
            reactProcess.kill("SIGTERM");
        }

        reactProcess = null;
        return { success: true };
    } catch (error) {
        console.error("Error stopping React:", error);
        return { error: error.message };
    }
});
