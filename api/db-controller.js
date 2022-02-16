const mongoose = require('mongoose');
const {userModel, exerciseModel} = require('./db-models');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const createUser = (username, done) => {
    const entry = new userModel({
        "username": username,
    });
    entry.save(done);
};

const createExercise = (userId, exerciseData, done) => {

    userModel.findById(userId, (err, usr) => {

        if(err) return done(err);
        if(!usr) return done(new Error("user not found"));

        if(exerciseData.date){
            exerciseData.date = Date.parse(exerciseData.date);
        }
        
        const entry = new exerciseModel({
            "userId" : userId,
            "description": exerciseData.description,
            "duration": exerciseData.duration,
            "date": exerciseData.date,
        });
        
        entry.save((err, exerciseData) => {

            if(err) return done(err);
            usr.exercises.push(exerciseData._id);

            usr.save((err, usrData) => {
                if(err)
                    done(new Error("exercise saved, but an error happened when updating the user entry."), exerciseData);
                else
                    done(null, {"username": usrData.username, ...exerciseData._doc})
            });
        });
    })
};

const queryUser = (userId, userQuery, done) => {

    userModel.findById(userId, (err, usr) => {

        if(err) return done(err);
        if(!usr) return done(new Error("user not found"));

        if(!userQuery.from && !userQuery.to && !userQuery.limit){
            return userModel.findById(userId).populate('exercises').exec(done);
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
            if(err) return done(err);
            done(null, {
                "_id": usr._id,
                "username": usr.username,
                "exercises": data,
            });
        });
    });
};

const queryUsers = (done) => {
    userModel.find().sort({"username": 1}).select('_id username').exec(done);
};

module.exports = {
    "createUser" : createUser,
    "createExercise": createExercise,
    "queryUser": queryUser,
    "queryUsers": queryUsers,
};
