require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 5500;

const app = express();
const api = require('./api/index');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => { 
    console.log(`${req.method} - ${req.url} : ${req.ip}`);
    next();
});

app.use('/api', api);

app.use('/public', express.static(__dirname + '/frontend/public', ));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/frontend/index.html');
});

app.use((req, res) => {
    res.status(404).type("txt").send("404 Not Found");
});

app.listen(PORT, () => {
    console.log("Node is listening on port " + PORT + " ...");
});