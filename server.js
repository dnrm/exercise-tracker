const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const bodyParser = require('body-parser')
const querystring = require('querystring')

mongoose.connect(process.env.MONGODB, {useNewUrlParser: true, useUnifiedTopology: true});


const userSchema = Schema({
  "username": String
}, {
  versionKey: false
}, {
  collection: 'users'
});
const User = mongoose.model('user', userSchema);

const exerciseSchema = Schema({
  "username": String,
  "description": String,
  "duration": Number,
  "date": String
}, {
  versionKey: false
}, {
  collection: 'users'
});
const Exercise = mongoose.model('exercise', exerciseSchema);


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  const user = new User({
    "username": req.body.username
  });
  user.save()
    .then(success => {
      res.send(success);
    })
    .catch(error => console.log(error));
});

app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err, success) => {
    if (err) return console.log(err);
    res.json(success);
  })
})

app.post('/api/exercise/add', (req, res) => {
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = new Date().toDateString();

  if (req.body.date) {
    date = new Date(req.body.date).toDateString();
  }

  User.findById(userId, (err, success) => {
    if (err) return console.log(err);
    if (success) {
      const doc = {
        username: success.username,
        date: date,
        duration: parseInt(duration),
        description: description,
      }
      Exercise.create(doc, (err, success) => {
        if (err) return console.log(err);
        const succ = {
          username: success.username,
          date: date,
          duration: parseInt(duration),
          _id: userId,
          description: description,
        }
        res.send(succ);
      });
    } else {
      res.send({
        message: "unable to add document"
      })
    }
  });
});

app.get('/api/exercise/log', (req, res) => {
  console.log(req.query)
  User.findById(req.query.userId, (err, success) => {
    if (err) return console.log(err);
    let username = success.username;
    let from = req.query.from ? new Date(req.query.from).toDateString() : new Date("1970-01-01").toDateString();
    let to = req.query.to ? new Date(req.query.to).toDateString() : new Date().toDateString();
    console.log(from , to)
    let limit = req.query.limit || 1000;

    if (limit == undefined) {
      limit = 1000;
    }

    if (from && to) {
      console.log("with from and to")
      Exercise.find({ username: username, date: { $gte: from, $lte: to }})
      .limit(limit + 1)
      .exec((err, doc) => {
        const response = {
          _id: req.query.userId,
          username,
          from,
          to,
          count: doc.length || 0,
          log: doc || []
        }
        console.log(response);
        res.send(response);
      });
    }
  });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// Sample UID: 5feb7987846c22014e663d75