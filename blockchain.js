//This is our blockchain data structure and functionality. (MODULE)

//Bring the hash package to this project to access the library.
const sha256 = require('js-sha256');
const currentNodeUrl = process.argv[3];
const {v4: uuidv4} = require('uuid');

//This is a 'constructor' function: data object.
function Blockchain() {
    this.chain = []; //Initialize the chain to and empty array. We will store all of our blocks here.
    this.pendingTransactions = []; //Hold all the new transactions before they are 'mined' into a block.
    //Node Url data
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    //Genesis block: the concept of the first block in our chain. An empty one. 
    this.createNewBlock(100,'0','0','0');
};

/*Extend object functionality (Method)
  Record the data on a new block*/

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    //Constants variables
    const newBlock = {
        index: this.chain.length + 1, //What block is this in out chain.
        timestamp: Date.now(),
        transactions: this.pendingTransactions, //All of the transactions on this block.
        nonce: nonce, //Unique number (only used once). Proof that we actually create a legit block.
        hash: hash, //The data from our new block.
        previousBlockHash: previousBlockHash, //Data from our current block hashed into a string
        
    };

    this.pendingTransactions = []; //Clears out any pendingTransactions
    this.chain.push(newBlock); //Add the newBlock to the chain.

    return newBlock;
}

//Another method to get the last block
Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
this.pendingTransactions.push(transactionObj);
return this.getLastBlock()['index'] + 1;
//gets the index of the last block of our chain plus one, for a new block
}

//Another method to create a new transaction
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

//Another method to get the last transaction.
Blockchain.prototype.getLastTransaction = function () {
    return this.pendingTransactions[this.pendingTransactions.length - 1];
}

//Method to hash a block: take the block data and give us a hash string.
Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    //Concatenate string
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData); //Turns an object data into a string
    //Pass all of out data as string into the hasher
    const hash = sha256(dataAsString);
    return hash;
}

//Bussines rule: 0, 00, 000, etc.
Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    //Brute force, increment nonce and run the hash until satisfy the business level/difficulty level '0000'.
    let nonce = 0; //let because the variable change.
    //Create a hash block.
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    //Execute this code as long as we don't have '0000'.
    while (hash.substring(0, 2) !== '00') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

Blockchain.prototype.proofOfWorkEasy = function (previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    while (hash.substring(0, 1) !== '0') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        // console.log('previousBlockHash:' + previousBlockHash + 'currentBlockData' + currentBlockData);
        // console.log('nonce:' + nonce + 'hash:' + hash);
    }

    return nonce;
}

Blockchain.prototype.chainIsValid = function (blockchain) {

    let validChain = true;

    // console.log('how we doing?', validChain);
    // console.log('what/s our bc length?', blockchain.length)

    for (var i = 1; i < blockchain.length; i++) {
        // console.log(i);
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];
        const blockHash =
            this.hashBlock(prevBlock['hash'], {
                transactions: currentBlock['transactions'],
                index: currentBlock['index']
            },
                currentBlock['nonce']
            );

        if (blockHash.substring(0, 4) != "0000") validChain = false;
        // console.log(blockHash.substring(0, 4));
        // console.log('got 0000s?', validChain);

        if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false; //chain not valid

        // console.log('got matched hashes to last one?', currentBlock['previousBlockHash'], prevBlock['hash'], validChain);

        // console.log("previousBlockHash==>", prevBlock['hash']);
        // console.log("currentBlockHash ==>", currentBlock['hash']);


    };
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    // console.log(correctNonce, correctPreviousHash, correctHash, correctTransactions);
    // console.log("genesis block hash", genesisBlock['hash'])

    if (!correctNonce || !correctPreviousHash || !correctHash || !correctTransactions) validChain = false;


    return validChain; //true if valid, false if not valid 

}

Blockchain.prototype.getBlock = function (blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
}

Blockchain.prototype.getTransaction = function (transactionId) {
    let correctTransaction = null;
    let correctBlock = null; //cuz we want to know which block the t/x is in too 

    //loop through every block 
    this.chain.forEach(block => {
        //now loop through each t/x in that block
        block.transactions.forEach(transaction => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            }
        });
    });
    return {
        transaction: correctTransaction,
        block: correctBlock
    }
}

Blockchain.prototype.getAddressData = function (address) {
    //we take in an address, so we have to collect all the t/x into a single array
    const addressTransactions = [];
    //new we cycle through all t/x and look in both sender & receiver to match the passed in address
    this.chain.forEach(block => {
        //now cycle through all t/x per block
        block.transactions.forEach(transaction => {
            //now we have access to every single t/x and we test each for sender or recipient
            if (transaction.sender === address || transaction.recipient === address) addressTransactions.push(transaction); //add it to our array if it matches
        });
    });
    //upon commpletion, we've loaded up the array. Now we have to figure out the balance and command for this address
    let balance = 0; //would you do this for you bank? 
    let command = ""; //which command?
    addressTransactions.forEach(transaction => { //also get the command also
        if (transaction.recipient === address) {balance += transaction.amount; command= transaction.command;}
        else if (transaction.sender === address) balance -= transaction.amount;
    });

    return {
        addressTransactions: addressTransactions,
        addressBalance: Math.abs(balance),//To obtain a positive number of commands
        addressCommand :command //Get the command finally
    };

}


//Statement of NodeJS that makes everything a module and bind it to another.
module.exports = Blockchain;