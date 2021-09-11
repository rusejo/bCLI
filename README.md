# Blockchained Command Line Interface (bCLI)

This will be the develoment process diary and final repository for this project, which is the last instalment for the course of Blockchain from the University Anáhuac México in colaboration with Dr. Barry Cumbie, from the University of North Alabama in Florence, Alabama, on the United States.

## Objetive
Extend the functionality of blockchain concepts into the command line of the OS in order to register all the activities on the chain. 

## Scope
- This is gonna be only a prototype of blockchained OS system command line interface.
- It can be runned on a cross platform, like Windows, MacOS or Linux.
- As an early prototype, it will only accept simple stringed commands, like `ls`, `dir`, `cls`, `clear` or `pwd`, for example.

## Development process: resume
### Technical
From August 29 to September 10th. 
- [X] Develop a CLI on Node.js and explore all that can be done on it - _achieved on August, 29_.
- [X] Upgrade the code in order to parse the inputed commands - _achieved on August, 30_.
- [ ] Find a way to integrate the functionality of the blockchain with the CLI by upgrading its methods and structure.
- Be able to integrate the CLI with a API REST functionality (Express). - _achieved on September, 1st_.
- Be able to manage the functionality over HTTP or "web calls". - _achieved on September, 2nd_.
    - Setting up the server to listening on a port - _achieved on September, 8th_.
- Integrate the functionality with the Blockchain code.
    - Add a new transaction - _achieved on September, 7th_.
    - Mine a new transaction - _achieved on September, 7th_.
    - Broadcast transaction - _on development_. 
- [X] Improve its functionality and see what else can be done - _achieved on September, 10th_.
- Be able to create at least two instances of bCLI.
- [ ] Review and debugging. 

### Theoretical
From September 5th to  September 14.
- [ ] Document all the process on a file/Github. - _on development_
- [ ] Formulate the business case.
- [ ] Generate the presentation and record the demo.
- [ ] Final review.
- [ ] Pack all the files and upload them on Github.
- [ ] Send the email with al the project info to Dr. Barry on **September 14**. 

## Development process: journey

### Setting the base app.
First, I had to follow [this tutorial](https://www.youtube.com/watch?v=vhDBbbMJWoY) to create a prototype of a command line interface (CLI) using Electron and Xterm. In the project folder, I had to install some npm packages, like:

```
npm i electron
npm i electron-tools
npm i node-pty xterm 
```
As the code giving me the error due to VB compiler, the same way as in the tutorial, also I had to install `npm i electron-rebuild` and rebuild the electron package to be able to run the app. All of this was hard because I had some dependencies version failures. Even I had to test it also on Linux to figure out the problem.

### Parse the CLI arguments
Once the app is running, the first challenge to resolve is how can I parse the command arguments that I introduce in order to sending them after to a blockchained process? We just need the commands, not all the printed ones that we get as soon as we type on it.

It needs first capture on Javascript the event of the enter action and then use ipc method to comunicate this action between the rendered file and the process file. As the command line takes each of the keystrokes that we introduce as a character, I need to capture it when I hit enter, save it on a variable and sending it into the blockchained process; then clear the variable content to start over again each time. 

The following code resumes all of this:

On `index.js`

``` javascript
//Variable to concatenate the keystrokes of the command
var command = "";
var term = new Terminal();
term.open(document.getElementById('terminal'));

//Send command string to the Blockchained process
var input = document.getElementById("terminal");
input.addEventListener("keyup", function (event, data) {
    if (event.keyCode === 13) {
        ipc.send('terminal.command', command);
        //Clean the command variable
        command = "";
    }
});
```

On `main.js`
``` javascript
//Recive command from terminal
    var ipc = require('electron').ipcMain;
    ipc.on('terminal.command', function (event, data) {
        //Further actions
    });
```

### Enhacing bCLI as a REST API

Ok. By now a I can get the commands, but how can be used. The basic blockchain code uses POST and GET operations to manage the information. So, in order to integrate the CLI with the blockchain code, I need to turn the app in a REST API backend. I've read [this article](https://medium.com/@keshavagrawal/electron-js-react-js-express-js-b0fb2aa8233f) to get the explanation of how to do it on my proyect, and followed up [this tutorial](https://expressjs.com/es/starter/hello-world.html) to achieve on it.

First, on the project, we need to install `npm i express --save`, to save it as a dependecy.

Create a `app.js` to act a a server:

``` javascript
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
```
Then create the file `renderer.js` to spawn the server on `app.js`

``` javascript
let server = require('./app');
```
And finally, on `index.html` load the previous file.

``` HTML
<script src="./renderer.js"></script>
```

By doing this, when I execute the bCLI, the express server will be loaded simultaneously with the app. Back-end and front-end ready!

### Handling HTTP methods and responses (GET and POST).

In order to request HTTP calls to send nd recieve information, as the Blockchain code does, we need to establish that communication channel between the `main.js` and de `app.js` or where the calls will be. For that purpose, we need the [axios library](https://nodejs.dev/learn/make-an-http-post-request-using-nodejs) by installing `npm i axios`.

Then, right after we recieve the command from the prompt, on `main.js` add:

``` javascript
//POST or GET Request
        axios
            .post/get('URL', {
                command: data
            })
            .then(res => {
                console.log(res);
            })
            .catch(error => {
                console.error(error)
            })
```

In order to diplay the proper information passed through the POST method, on the `app.js`, we need to include a body parser `app.use(express.json());`, and get the responde by `req.body.command`.

### Setting up the server

In order to use the blockchain structure, we need to have a server up on a certain point (by now). To achieve that, we installed `npm i nodemon` and configure the `package.json` to be able to be ready. We add the following line to rthe scripts section of the file:

```javascript
"server":"app.js 3001 http://localhost:3001",
```
So, with that, we need to run first `npm run server` and after excecute out CLI. Then we'll have everything to proceed to the next part.

### bCLI Blockchain structure

To the prototype of Blockchain, we add the command data on it.

```javascript
Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash, command) {
    //Constants variables
    const newBlock = {
        index: this.chain.length + 1, //What block is this in out chain.
        timestamp: Date.now(),
        transactions: this.pendingTransactions, //All of the transactions on this block.
        nonce: nonce, //Unique number (only used once). Proof that we actually create a legit block.
        hash: hash, //The data from our new block.
        previousBlockHash: previousBlockHash, //Data from our current block hashed into a string
        //The OS command
        command: command
    };

    this.pendingTransactions = []; //Clears out any pendingTransactions
    this.chain.push(newBlock); //Add the newBlock to the chain.

    return newBlock;
}
```

And update its methods in order to use it, like:

```Javascript
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient, command) {
    const newTransaction = {
        //Create a new transaction object
        amount: amount,
        sender: sender,
        recipient: recipient,
        command:command,
        transactionId: uuidv4().split('-').join('')
    };
    return newTransaction;
    //Save data into the transactions array.
   // this.pendingTransactions.push(newTransaction);
   // return this.getLastBlock()['index'] + 1; //Get the index of the last block of out chain plus one for a new block
}
```
On `app.js`, we add all the Blockchain API calls. Now, in order to use it, right after `main.js` catches the comand from the renderer, we collect the data and send it to the API call:

```javascript
//Recive command from terminal
    var ipc = require('electron').ipcMain;
    ipc.on('terminal.command', function (event, data) {
        const blockData = [{
            "amount": 1,
            "sender": "localhost.com",
            "recipient": "server.com",
            "command": data
        }];
        //Add a transaction
        axios
            .post('http://localhost:3000/transaction', {
                command: blockData
            })
            .then(res => {
                console.log(res);
            })
            .catch(error => {
                console.error(error)
            });
            //Mine the transaction
            axios
            .get('http://localhost:3000/mine', {
            })
            .then(res => {
                console.log(res);
            })
            .catch(error => {
                console.error(error)
            })
        console.log(bcli);
    });
```

### Multiple bCLI instances.

The idea was simple: run multiple applications, each listening to its own server. Up to this point we already have Express installed, and with nodemon running, we can pull up as many servers as we want along with their ports. However, we have only one electron application. What we need are several instances of that application running on different servers, each on its own port.

For this point, nodemon has a limitation: we can't run both scripts at the same time; either we monitor the server script or the application script. However, we need nodemon to monitor the server script because that is where it gets the port. The solution was not easy.

The solution found is a module that performs the same process but for applications made in Electron. With this, it is possible to raise a service at the same time that the application is running. So, we installed `npm i electron-connect`. Once installed, the client will be the main application process, in `main.js`, and the server in `app.js`. In each of them, we add the instructions to run as such. 

On `main.js`, we need to run rhe client once the app is ready. 

```javascript
app.on("ready", function(){
    createWindow();
    client.create(mainWindow, {port:parseInt(puertoServidor)+5});
});
```

On `app.js`, add the server instruction:

```javascript
var electron = require('electron-connect').server.create({ port: parseInt(port) + 5 });
```

#### The 'Port communication problem'.



Translated with www.DeepL.com/Translator (free version)


- Create multiple instances of bCLI to broadcast the chain. 

### Resources

[Identify a javascript keystroke](https://www.codegrepper.com/code-examples/javascript/javascript+function+to+save+an+entry+after+clicking+enter
)

[Send messages in electron](https://stackoverflow.com/questions/32780726/how-to-access-dom-elements-in-electron)

[Electron official page](https://www.electronjs.org/docs/api/ipc-renderer)

[Get Hostname](https://stackoverflow.com/questions/7507015/get-hostname-of-current-request-in-node-js-express/7507507#7507507)

[Express and Electron](https://www.it-swarm-es.com/es/node.js/como-usar-electron-con-una-aplicacion-express-existente/808567082/)
