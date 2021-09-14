const ipc = require("electron").ipcRenderer;

//Variable to concatenate the keystrockes of the command
var command = "";
var term = new Terminal();
term.open(document.getElementById('terminal'));

//Send command string to the Blockchained process
var input = document.getElementById("terminal");
input.addEventListener("keyup", function (event, data) {
    if (event.keyCode === 13) {
        ipc.send('terminal.command', command.slice(0,-1));
        //Clean the command variable
        command = "";
    }
});

//Whatever we recieve on the terminal
ipc.on("terminal.incomingData", (event, data) => {
    term.write(data);
});

//Getting the port for displaying on the window title
ipc.on("terminal.portNumber", (event, data) => {
    document.getElementById("title").innerHTML="bCLI on localhost:" +data;
});

//Whatever we write on the terminal
term.onData(e => {
    //Get the keystrokes for the commands.
    command = command + e;
    ipc.send("terminal.keystroke", e);
});