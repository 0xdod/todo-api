const { ObjectID } = require("mongodb");
const jwt = require("jsonwebtoken");

const { Todo } = require("../../models/todo");
const { User } = require("../../models/user");

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [
  {
    _id: userOneId,
    email: "andrew@example.com",
    password: "userOnePass",
    tokens: [
      {
        access: "auth",
        token: jwt.sign({ _id: userOneId, access: "auth" }, "abcde").toString(),
      },
    ],
  },
  {
    _id: userTwoId,
    email: "jen@example.com",
    password: "userTwoPass",
    tokens: [
      {
        access: "auth",
        token: jwt.sign({ _id: userTwoId, access: "auth" }, "abcde").toString(),
      },
    ],
  },
];

const fakeTodos = [
  {
    _id: new ObjectID(),
    text: "Fake todo 1",
    _creator: userOneId,
  },
  {
    _id: new ObjectID(),
    text: "Fake todo 2",
    isCompleted: true,
    completedAt: 1000,
    _creator: userTwoId,
  },
];

function populateTodos(done) {
  Todo.deleteMany({})
    .then(() => {
      return Todo.insertMany(fakeTodos);
    })
    .then(() => done());
}

const populateUsers = (done) => {
  User.deleteMany({})
    .then(() => {
      var userOne = new User(users[0]).save();
      var userTwo = new User(users[1]).save();

      return Promise.all([userOne, userTwo]);
    })
    .then(() => done());
};

module.exports = {
  populateTodos,
  fakeTodos,
  users,
  populateUsers,
};
