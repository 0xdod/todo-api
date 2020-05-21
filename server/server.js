require("./config");
const express = require("express");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");
const _ = require("lodash");

const { mongoose } = require("./db/mongoose");
const { User } = require("./models/user");
const { Todo } = require("./models/todo");

let app = express();
let port = process.env.PORT;

app.use(bodyParser.json());

//Todos section
app.post("/todos", (req, res) => {
  let todo = new Todo({
    text: req.body.text,
  });

  todo.save().then(
    (doc) => res.send(doc),
    (err) => res.status(400).send(err)
  );
});

app.get("/todos", (req, res) => {
  Todo.find()
    .then((todos) => {
      console.log("getting todos...");
      res.send({ todos });
    })
    .catch((err) => res.send(err));
});

app.get("/todos/:id", (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send("Invalid ID");
  }
  Todo.findById(id)
    .then((todo) => {
      if (!todo) {
        return res.status(404).send("No todo saved");
      }
      res.send({ todo });
    })
    .catch((e) => res.status(404).send(e.message));
});

app.patch("/todos/:id", (req, res) => {
  let id = req.params.id;
  let body = _.pick(req.body, ["text", "isCompleted"]);
  if (!ObjectID.isValid(id)) {
    return res.status(404).send("Invalid ID");
  }
  if (_.isBoolean(body.isCompleted) && body.isCompleted) {
    body.completedAt = new Date().getTime();
  } else {
    body.completedAt = null;
    body.isCompleted = false;
  }

  Todo.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then((todo) => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    })
    .catch((e) => res.status(404).send());
});

app.delete("/todos/:id", (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send("Invalid ID");
  }
  Todo.findByIdAndRemove(id)
    .then((todo) => {
      if (!todo) {
        return res.status(404).send("No todo found");
      }
      res.send({ todo });
    })
    .catch((e) => res.status(400).send(e.message));
});

//Users section
app.post("/users", (req, res) => {
  let body = _.pick(req.body, ["email", "password"]);
  let user = new User(body);

  user
    .save()
    .then((doc) => res.send(doc))
    .catch((err) => res.status(400).send(err));
});

app.listen(port, () => console.log(`App running on port ${port}`));

module.exports = { app };
