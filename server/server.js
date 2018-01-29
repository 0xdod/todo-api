require("./config");
const express = require("express");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");
const _ = require("lodash");

const { mongoose } = require("./db/mongoose");
const { User } = require("./models/user");
const { Todo } = require("./models/todo");
const { authenticate } = require("./middleware/authenticate");

let app = express();
let port = process.env.PORT;

app.use(bodyParser.json());

//Todos section
app.post("/todos", authenticate, (req, res) => {
  let todo = new Todo({
    text: req.body.text,
    _creator: req.user._id,
  });

  todo.save().then(
    (doc) => res.send(doc),
    (err) => res.status(400).send()
  );
});

app.get("/todos", authenticate, (req, res) => {
  Todo.find({ _creator: req.user._id })
    .then((todos) => {
      res.send({ todos });
    })
    .catch((err) => res.status(404).send());
});

app.get("/todos/:id", authenticate, (req, res) => {
  let _id = req.params.id;
  if (!ObjectID.isValid(_id)) {
    return res.status(404).send();
  }
  Todo.findOne({
    _id,
    _creator: req.user._id,
  })
    .then((todo) => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    })
    .catch((e) => res.status(404).send());
});

app.patch("/todos/:id", authenticate, (req, res) => {
  let _id = req.params.id;
  let body = _.pick(req.body, ["text", "isCompleted"]);
  if (!ObjectID.isValid(_id)) {
    return res.status(404).send();
  }
  if (_.isBoolean(body.isCompleted) && body.isCompleted) {
    body.completedAt = new Date().getTime();
  } else {
    body.completedAt = null;
    body.isCompleted = false;
  }
  Todo.findOneAndUpdate(
    { _id, _creator: req.user._id },
    { $set: body },
    { new: true }
  )
    .then((todo) => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    })
    .catch((e) => res.status(404).send());
});

app.delete("/todos/:id", authenticate, (req, res) => {
  let _id = req.params.id;
  if (!ObjectID.isValid(_id)) {
    return res.status(404).send();
  }
  Todo.findOneAndRemove({ _id, _creator: req.user._id })
    .then((todo) => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    })
    .catch((e) => res.status(400).send());
});

//Users section
app.post("/users", (req, res) => {
  let body = _.pick(req.body, ["email", "password"]);
  body.email = body.email.toLowerCase();
  let user = new User(body);

  user
    .save()
    .then(() => user.generateAuthToken())
    .then((token) => res.header("x-auth", token).send(user))
    .catch((err) => res.status(400).send());
});

app.post("/users/login", (req, res) => {
  let body = _.pick(req.body, ["email", "password"]);
  body.email = body.email.toLowerCase();
  User.findByCredentials(body.email, body.password)
    .then((user) => {
      return user
        .generateAuthToken()
        .then((token) => res.header("x-auth", token).send(user));
    })
    .catch((e) => res.status(400).send());
});

app.get("/users/me", authenticate, (req, res) => {
  res.send({ user: req.user });
});

app.delete("/users/me/token", authenticate, (req, res) => {
  req.user
    .removeToken(req.token)
    .then(() => {
      res.status(200).send();
    })
    .catch((e) => res.status(400).send());
});

app.listen(port, () => console.log(`App running on port ${port}`));

module.exports = { app };
