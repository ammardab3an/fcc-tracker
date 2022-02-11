const router = require('express').Router();
const dpController = require('./dp-controller');

router.get('/', (req, res) => {
    res.type("txt").send("hi from the api side");
});

router.route('/users')
    .get((req, res) => {
        dpController.queryUsers((err, data) => {
            if(err){
                console.log(err.message);
                res.status(500).type("txt").send("error: ", err.message);
            }
            else{
                res.json(data);
            }
        })
    })
    .post((req, res) => {
        console.log("new user:\n", req.body);
        dpController.createUser(req.body.username, (err, data) => {
            if(err){
                console.log("error: ", err.message);
                res.status(500).type("txt").send(err.message);
            }
            else{
                console.log("response:\n", data);
                res.json(data);
            }
        })
    });

router.post('/users/:id/exercises', (req, res) => {
    console.log("new exercise:\n", req.body);
    dpController.createExercise(req.params.id, req.body, (err, data) => {
        if(err){
            console.log("error: ", err.message);
            return res.status(500).type("txt").send(err.message);
        }
        else{
            console.log("response:\n", data);
            res.json({
                "_id": data.userId,
                "username": data.username,
                "description": data.description,
                "duration": data.duration,
                "date": new Date(data.date).toDateString(),
            });
        }
    });
});

router.get('/users/:id/logs', (req, res) => {
    dpController.queryUser(req.params.id, req.query, (err, data) => {
        if(err){
            console.log("error: ", err.message);
            return res.status(500).type("txt").send(err.message);
        }
        else{
            console.log("response:\n", data);
            res.json({
                "_id": data._id,
                "username": data.username,
                "count": data.exercises.length,
                "log": data.exercises.map(entry => ({
                    "description" : entry.description,
                    "duration": entry.duration,
                    "date": new Date(entry.date).toDateString(),
                })),
            });
        }
    });
});

module.exports = router;