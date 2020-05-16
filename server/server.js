const express = require("express");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");

const { mongoose } = require("./db/mongoose");
const { User } = require("./models/user");
const { Todo } = require("./models/todo");

let app = express();

app.use(bodyParser.json());

app.post("/todos", (req, res) => {
  let todo = new Todo({
    text: req.body.text,
  });

  todo.save().then(
    (doc) => {
      console.log("New todo saved");
      res.send(doc);
    },
    (err) => {
      console.log("Error saving new todo");
      res.status(400).send(err);
    }
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

app.listen(3000, () => console.log("App running on port 3000"));

module.exports = { app };
