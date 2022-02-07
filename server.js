require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5500;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    username: String,
    exercises: [String],
});

const exerciseSchema = new mongoose.Schema({
    userId: String,
    description: String,
    duration: Number,
    date: Number,
});

const userModel = mongoose.model('users', userSchema);
const exerciseModel = mongoose.model('exercises', exerciseSchema);

// ................................................................

const createUser = (username, done) => {

    const entry = new userModel({
        "username": username,
    });

    entry.save(done);
};

const createExercise = (userId, exerciseData, done) => {

    userModel.findById(userId, (err, usr) => {

        if(err){
            return done(err, null);
        }
        if(!usr){
            return done("user not found", null);
        }

        const entry = new exerciseModel({
            "userId" : userId,
            "description": exerciseData.description,
            "duration": exerciseData.duration,
            "date": exerciseData.date ? Date.parse(exerciseData.date) : Date.now(),
        });
        
        entry.save((err, exerciseData) => {

            if(err){
                return done(err, null);
            }

            usr.exercises.push(exerciseData._id);

            usr.save((err, usrData) => {

                if(err){
                    done("exercise saved, but an error happened when updating the user entry.", exerciseData);
                }
                else{
                    done(null, {"username": usrData.username, ...exerciseData._doc})
                }
            });
        });
    })
};

const queryUser = (userId, userQuery, done) => {

    userModel.findById(userId, (err, usr) => {

        if(err){
            return done(err, null);
        }
        if(!usr){
            return done("user not found", null);
        }

        let query = exerciseModel.find({"userId": usr._id}).sort({"date": 1});

        if(userQuery.from){
            query.where("date").gte(Date.parse(userQuery.from));
        }
        if(userQuery.to){
            query.where("date").lte(Date.parse(userQuery.to));
        }
        if(userQuery.limit){
            query.limit(userQuery.limit);
        }

        query.exec((err, data) => {
            
            if(err){
                done(err, null);
            }

            done(null, {"username": usr.username, "data": data});
        });
    });
};

const queryUsers = (done) => {
    userModel.find().sort({"username": 1}).select('_id username').exec(done);
};

// ................................................................

const app = express();
const api = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

api.get('/', (req, res) => {
    res.send("hi from the api side");
});

api.get('/users', (req, res) => {
    queryUsers((err, data) => {
        if(err){
            console.log(err);
            res.send(err);
        }
        else{
            res.json(data);
        }
    });
});

api.post('/users', (req, res) => {
    
    console.log("new user:");
    console.log(req.body);

    createUser(req.body.username, (err, data) => {
        
        if(err){
            console.log(err);
            return res.send(err);
        }

        console.log("response:");
        console.log(data);

        return res.json({
            _id: data._id,
            username: data.username,
        });
    });
});

api.post('/users/:id/exercises', (req, res) => {
    
    console.log("new exercise:");
    console.log(req.body);

    createExercise(req.params.id, req.body, (err, data) => {

        if(err){
            console.log(err);
            return res.send(err);
        }
        
        console.log("response:");
        console.log(data);

        res.json({
            "_id": data.userId,
            "username": data.username,
            "description": data.description,
            "duration": data.duration,
            "date": new Date(data.date).toDateString(),
        });
    });
});

api.get('/users/:id/logs', (req, res) => {

    queryUser(req.params.id, req.query, (err, data) => {

        if(err){
            console.log(err);
            return res.send(err);
        }

        res.json({
            _id: data.userId,
            username: data.username,
            count: data.data.length,
            log: data.data.map(entry => ({
                description: entry.description,
                duration: entry.duration,
                date: new Date(entry.date).toDateString(),
            })),
        });
    });
});

// ................................................................

app.use(cors());

app.use((req, res, next) => { 
    console.log(`${req.method} - ${req.url} : ${req.ip}`);
    next();
});

app.use('/api', api);
app.use('/public', express.static(__dirname + '/public', ));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.use((req, res) => {
    res.status(404).type("txt").send("404 Not Found");
});

app.listen(PORT, () => {
    console.log("Node is listening on port " + PORT + " ...");
});