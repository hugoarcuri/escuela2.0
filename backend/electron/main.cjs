const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let mainWindow;
let serverProcess;

function startServer() {
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, "backend", "dist", "index.js")
    : path.join(__dirname, "..", "src", "index.ts");

  if (app.isPackaged) {
    serverProcess = fork(serverPath, [], { stdio: "pipe" });
  } else {
    const tsx = path.join(__dirname, "..", "node_modules", ".bin", "tsx");
    serverProcess = fork(tsx, [serverPath], { stdio: "pipe" });
  }

  serverProcess.stdout?.on("data", (data) => console.log(`[server] ${data}`));
  serverProcess.stderr?.on("data", (data) => console.error(`[server] ${data}`));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Gestión de Calificaciones",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = app.isPackaged
    ? `http://localhost:3001`
    : `http://localhost:5173`;

  mainWindow.loadURL(url);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  setTimeout(createWindow, 2000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
