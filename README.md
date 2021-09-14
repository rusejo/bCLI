# Blockchained Command Line Interface (bCLI)

This is the repository of the [Blockchained Command Line Interface (bCLI)](https://gist.github.com/rusejo/f79268f33812dfaffef7d3caebd1ab4a#View) project. In order to test it, please follow the instructions below. This projects works on Windows, Linux or MacOS.

## Installation

1. Download the folder to your computer or clone the repository with the command: `git clone https://github.com/rusejo/bCLI/`.

2. Open the folder in Visual Studio Code and in terminal execute `npm install`.

3. Once all the dependencies have been install and **before launching the app**, run `npm run rebuild` to restore possible errors caused by the compiler

## Execution 

By default, in the `package.json` file we have two instances working on ports 3000 and 3001. In order to successfully raise the two terminals you must wait at least five seconds between the two.

   1. Run the first terminal with `npm run tty0`. A port error window will pop up. Don't worry, you can close it without any problem.

   2. After five seconds, start the second terminal with `npm run tty1`. Still, accept the error to close the window that pops up.

   3. Once both instances are up, enter commands that do not require spaces between them, for example `ls`, `dir`, `pwd` or `clear`.

   4. Open a browser and point to `localhost:3000` and `localhost:3001` to verify that the transactions have been added to the chains of each instance.

   5. Additionally you can enter a special audit view where you will be able to see per user the commands that have been executed. Access the `/audit` address by pointing to `localhost` in any of the browser windows; the port you use is indistinct.
