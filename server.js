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
  User.findById(req.query.userId, (err, success) => {
    if (err) return console.log(err);
    let username = success.username;
    let from = req.query.from;
    let to = req.query.to;
    let limit = req.query.limit || 1000;

    if (limit == undefined) {
      limit = 1000;
    }

      Exercise.find({ username: username }, (err, doc) => {

        if (from) {
          let dateFrom = new Date(from).getTime();
          doc = doc.filter(item => {
            let docDate = new Date(item.date).getTime();
            console.log(`${docDate} >= ${dateFrom} is greater than: ${docDate >= dateFrom}`);
            return docDate >= dateFrom
          });
        }

        if (to) {
          let dateTo = new Date(to).getTime();
          doc = doc.filter(item => {
            let docDate = new Date(item.date).getTime();
            console.log(`${docDate} <= ${dateTo} is less or equal than: ${docDate >= dateTo}`);
            return docDate <= dateTo
          });
        }

        if (limit) {
          doc = doc.slice(0, limit);
        }

        const response = {
          "_id": success["_id"],
          username,
          count: doc.length,
          log: doc
        }

        res.send(response);
    });
  });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// Sample UID: 5feb7987846c22014e663d75