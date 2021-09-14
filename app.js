const Blockchain = require('./blockchain.js');
const bcli = new Blockchain();

const { v4: uuidv4 } = require('uuid');
const port = process.argv[2];
const rp = require('request-promise');
const nodeAddress = uuidv4().split('-').join('');

//Our server for the Blockchain process
const express = require('express')
const app = express()

//Our server to pass the port to the main process
const http = require('http');
const server = http.createServer(app);
server.listen(8080, function () {
    console.log("Port information service active")

});

//Our body parser in order to use the JSON format data structure through our processes
app.use(express.json());

//Electron Connect server declaration for using this app as a multiple instance. Need to match with the client
//Note that we are adding plus 5 to the port for resolve the traffic
var electron = require('electron-connect').server.create({ port: parseInt(port) + 5 });

//Get the port information
app.get('/port', (req, res) => {
    res.send(port);
    
    //Counter to stop the service, free the port and allow another instance to use it
    (function countDown(counter) {
        while (counter > 0) {
            console.log(counter)
            return setTimeout(countDown, 1000, counter - 1)
        }server.close();console.log("Port server closed");
        })(5); //After five seconds, the port is closed.

});

//-------- BLOCKCHAIN OPERATIONS----------------------------------

//Blockchain endpoint.
app.get('/blockchain', function (req, res) {
    //Get is our HTTP function and accessing en "endpoint". Blockchain is the name.
    //res.send('Hello, Blockchain Build on Javascript (Node.js & Express.js)');
    res.send(bcli);
    //res = the SERVER/API's response
});

//Transaction endpoint.
app.post('/transaction', function (req, res) {
    const newTransaction = req.body;
    const blockIndex = bcli.addTransactionToPendingTransactions(newTransaction); //this returns the index
    res.json({ note: `transaction will be added in block ${blockIndex} ` });
    //This will "send in" our transaction. 
    //The 'req' is everything we send with the Postman app:
    //const blockIndex = bcli.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    //The 'res':
    //res.json({ note: `Transaction is added on block ${blockIndex}.` });
});

app.post('/transaction/broadcast', function (req, res) {
    const newTransaction = bcli.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient, req.body.command);

    bcli.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];
    bcli.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            res.json({ note: 'transaction created and broadcast successfully' })
        });
});

//Mine - Chain endpoint.
app.get('/mine', function (req, res) {
    //Mine = validate out tx into the chain.
    const lastBlock = bcli.getLastBlock(); //Get the last block. (1)
    const previousBlockHash = lastBlock['hash']; //0
    //All the pending transactions
    const currentBlockData = {
        transactions: bcli.pendingTransactions,
        index: lastBlock['index'] + 1
    };

    //Calculate a new block
    const nonce = bcli.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bcli.hashBlock(previousBlockHash, currentBlockData, nonce);

    //Create a new block.
    const newBlock = bcli.createNewBlock(nonce, previousBlockHash, blockHash);
    //Mining reward. 00 is a code from certain sender. The server address from where the clic is done.
    const requestPromises = [];

    bcli.networkNodes.forEach(networkNodeUrl => {        
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        }
        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises)
        .then(data => {
            const requestOptions = {
                uri: bcli.currentNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 6.25,
                    sender: "00",
                    recipient: nodeAddress
                },
                json: true
            }
            return rp(requestOptions);
        })
        .then(data => {
            res.json({
                note: 'new block mined and broadcast successfully',
                block: newBlock
            });
        });
});

//Recieve a new block
app.post('/receive-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = bcli.getLastBlock();
    //Check hash
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    //Check index
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    //Validate the package
    if (correctHash && correctIndex) {
        bcli.chain.push(newBlock);
        bcli.pendingTransactions = [];
        res.json({
            note: 'new block received and accepted',
            'newBlock': newBlock
        });
    } else {
        res.json({
            note: 'new block rejected',
            newBlock: newBlock
        })
    }
});

//Register a node and broadcast that nonde to the entire network
//Doctor, doctor, doctor.
//register a node and broadcast that node to the entire network
//doctor, doctor, doctor, doctor,... 
app.post('/register-and-broadcast-node', function (req, res) {

    //Recive the name of the recipent (join the network).
    const newNodeUrl = req.body.newNodeUrl;

    //Check if the recipient is not already part or the network.
    //!Need networkNodes info on blockchain.js!
    if (bcli.networkNodes.indexOf(newNodeUrl) == -1) bcli.networkNodes.push(newNodeUrl); //If not, add it.

    //Async computing. Not refresh all. !Instal library
    const regNodesPromises = [];

    //Build our list of network nodes. Doctor.
    bcli.networkNodes.forEach(networkNodeUrl => {
        //hit the register node endpoint
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
        }
        regNodesPromises.push(rp(requestOptions));
    });
    //Sends it all together as a package.
    Promise.all(regNodesPromises)
        .then(data => {
            //use the data
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...bcli.networkNodes, bcli.currentNodeUrl] },
                json: true
            }
            return rp(bulkRegisterOptions);
        })
        .then(data => {
            res.json({ note: 'new node registered with network successfully' });
        });

});

//register a node with the network
app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl; //take the new node url from the body
    const nodeNotAlreadyPresent = bcli.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bcli.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) bcli.networkNodes.push(newNodeUrl);
    res.json({ note: 'new node registered successfully' });
});

//register multiple nodes at once
app.post('/register-nodes-bulk', function (req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;

    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bcli.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bcli.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) bcli.networkNodes.push(networkNodeUrl);
    });
    res.json({ note: 'bulk registration successful' });
});

//Check the other nodes
app.get('/consensus', function (req, res) {
    const requestPromises = [];

    //the first thing we do is make requests to all the other nodes on the network. 
    bcli.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: "GET", //has no body on a get request
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    //this loads up our array of all the blockchains 
    Promise.all(requestPromises)
        .then(blockchains => {
            //this blockchains is an array of all the other blockchains from all the other nodes
            //now we iterate through to see which is the longest

            //we've got to set up some tracking variables for the loop to follow 
            const currentChainLength = bcli.chain.length;
            let maxChainLength = currentChainLength;
            let newLongestChain = null;
            let newPendingTransactions = null;

            //we iterate through all the blockchains in our nw looking for the longest one
            blockchains.forEach(blockchain => {
                //which is the longest? is any longer than ours? 
                if (blockchain.chain.length > maxChainLength) {
                    //this one is longer, so change up some variables
                    maxChainLength = blockchain.chain.length;
                    newLongestChain = blockchain.chain;
                    newPendingTransactions = blockchain.pendingTransactions;
                };

            });

            //now, if there wasn't a longer chain than ours, we do not replace. 
            //newLongestChain would remain null or if a longer invalid one was found...
            if (!newLongestChain || (newLongestChain && !bcli.chainIsValid(newLongestChain))) {
                res.json({
                    note: 'Current chain has not been replaced.',
                    chain: bcli.chain,
                });
                // } else if (newLongestChain && bcli.chainIsValid(newLongestChain)) {
            } else {
                //here we found a longer one so we replace ours with the longer one.
                bcli.chain = newLongestChain;
                bcli.pendingTransactions = newPendingTransactions;
                res.json({
                    note: 'This chain has  been replaced.',
                    chain: bcli.chain,
                });
            }
        });

});

app.get('/block/:blockHash', function (req, res) {
    //send in a block hash and get the block back

    //first thing is to access the passed in paramter
    //e.g. localhost:300X/block/890DSDSIJO998DDSDSB88BDSDS
    const blockHash = req.params.blockHash;

    //invoke our method to get null or the correct block 
    const correctBlock = bcli.getBlock(blockHash);
    res.json({
        block: correctBlock
    });
});

app.get('/transaction/:transactionId', function (req, res) {
    //send in a t/x id and get back the t/x details
    const transactionId = req.params.transactionId;
    const transactionData = bcli.getTransaction(transactionId); //this gives us the t/x and the block as an object
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    });
});

app.get('/address/:address', function (req, res) {
    //send in a specific address and get all the t/x associated with it: sent or received and the balance of this address' account
    const address = req.params.address;
    const addressData = bcli.getAddressData(address); //we get an object{} w t/x 
    res.json({
        addressData: addressData
    })
});

app.get('/audit', function (req, res) {
    res.sendFile('./audit/index.html', { root: __dirname }); //this 2nd argument says look into this directory we are already in and find that 1st file path. 
});

//-------- BLOCKCHAIN OPERATIONS----------------------------------

//Electron Connect start within Express
app.listen(port, () => {
    electron.start();
    console.log(`Example app listening at http://localhost:${port}`)
})

