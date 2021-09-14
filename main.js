const { app, BrowserWindow, ipcMain } = require("electron");
const pty = require("node-pty");
const os = require("os");
var shell = os.platform() === "win32" ? "powershell.exe" : "bash";
var serverPort = "";

//Blockchain require
const Blockchain = require('./blockchain.js');
const bcli = new Blockchain();

//Send API requests to the Blockchain process
const axios = require('axios');

//Electron Connect client declaration for using this app as a multiple instance. Need to match with the server
//Note that we are adding plus 5 to the port for resolve the traffic.
var client = require('electron-connect').client;

let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        height: 470,
        width: 755,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.removeMenu();
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    mainWindow.on("closed", function () {
        mainWindow = null;
    });


    //ipcing
    var ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    ptyProcess.on('data', function (data) {
        mainWindow.webContents.send("terminal.incomingData", data);
        mainWindow.webContents.send("terminal.portNumber", serverPort); //Send the port for windows identifying
        //console.log("Data sent");
    });
    ipcMain.on("terminal.keystroke", (event, key) => {
        ptyProcess.write(key);
    });

    //Recive command from terminal
    var ipc = require('electron').ipcMain;
    ipc.on('terminal.command', function (event, data) {

        //Add a transaction
        axios
            .post(`http://localhost:${serverPort}/transaction/broadcast`,
                { "amount": 1, "sender": `user${serverPort}@localhost.com`, "recipient": "app@server.com", "command": data },
                {
                })
            .then(res => {
                // Mine the transaction
                axios
                    .get(`http://localhost:${serverPort}/mine`, {
                    })
                    .then(res => {
                       console.log("Command and validation executed");
                    })
                    .catch(error => {
                        console.error(error)
                    })
            })
            .catch(error => {
                console.error(error)
            });
    });
}

app.on("ready", function () {
    createWindow();
    
    //Getting the server port
    const http = require('http');
    http.get('http://localhost:8080/port', (res) => {
        res.on('data', (d) => {
            serverPort = d.toString('utf8');
            console.log("Electron Connect server port running on "+parseInt(serverPort) + 5);

            //Register on a network at launch
            var fullNetwork = [3000,3001];
            var currentNetwork = fullNetwork.filter(function(x){return x !== parseInt(serverPort)})
            for (let networkNode of currentNetwork) {
                axios //Use axios module to register nodes
                    .post(`http://localhost:${serverPort}/register-node`,
                        { "newNodeUrl": "http://localhost:" + networkNode },
                        {})
                    .then(res => {
                        console.log("tty registered on the network on port: "+networkNode)
                    })
                    .catch(error => {
                        console.error("error")
                    });
            }
        })
    })

    client.create(mainWindow, { port: parseInt(serverPort) + 5 });
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function () {
    if (mainWindow === null) {
        createWindow();
    }
});