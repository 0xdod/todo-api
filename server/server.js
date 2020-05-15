const express = require("express");
const bodyParser = require("body-parser");

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

app.listen(3000, () => console.log("App running on port 3000"));

module.exports = { app };
