# Blockchained Command Line Interface (bCLI)

This will be the develoment process diary and final repository for this project, which is the last instalment for the course of Blockchain from the University Anáhuac México in colaboration with Dr. Barry Cumbie, from the University of North Alabama in Florence, Alabama, on the United States.

## Objetive
Extend the functionality of blockchain concepts into the command line of the OS in order to register all the activities on the chain. 

## Scope
- This is gonna be only a prototype of blockchained OS system command line interface.
- It can run on Windows, MacOS and Linux.

## Development process: resume
### Technical
From August 29 to September 4th. 
- [X] Develop a CLI on Node.js and explore all that can be done on it - _achieved on August, 29_.
- [X] Upgrade the code in order to parse the inputed commands - _achieved on August, 30_.
- [ ] Find a way to integrate the functionality of the blockchain with the CLI by upgrading its methods.
- [ ] Upgrade the code to figure a way to create more command lines instances (at least three).
- [ ] Improve its functionality and see what else can be done.
- [ ] Review and debugging. 

### Theoretical
From September 5th to  September 14.
- [ ] Document all the process on a file/Github.
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

### Resources

[Identify a javascript keystroke](https://www.codegrepper.com/code-examples/javascript/javascript+function+to+save+an+entry+after+clicking+enter
)

[Send messages in electron](https://stackoverflow.com/questions/32780726/how-to-access-dom-elements-in-electron)

[Electron official page](https://www.electronjs.org/docs/api/ipc-renderer)

[Get Hostname](https://stackoverflow.com/questions/7507015/get-hostname-of-current-request-in-node-js-express/7507507#7507507)

