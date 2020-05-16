const expect = require("expect");
const request = require("supertest");
const { ObjectID } = require("mongodb");

const { app } = require("../server");
const { Todo } = require("../models/todo");

const fakeTodos = [
  {
    _id: new ObjectID(),
    text: "Fake todo 1",
  },
  {
    _id: new ObjectID(),
    text: "Fake todo 2",
  },
];

beforeEach((done) => {
  Todo.deleteMany({})
    .then(() => {
      return Todo.insertMany(fakeTodos);
    })
    .then(() => done());
});

describe("POST /todos", () => {
  it("should create new todo", (done) => {
    let text = "This is a test todo text";
    request(app)
      .post("/todos")
      .send({ text })
      .expect(200)
      .expect((res) => expect(res.body.text).toBe(text))
      .end((err, res) => {
        if (err) return done(err);
        Todo.find({ text })
          .then((todos) => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch((err) => done(err));
      });
  });

  it("should not create new todo on bad request", (done) => {
    request(app)
      .post("/todos")
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        Todo.find()
          .then((todos) => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch((err) => done(err));
      });
  });
});

describe("GET /todo", () => {
  it("should get all todos", (done) => {
    request(app)
      .get("/todos")
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe("GET /todo/:id", function () {
  let id = fakeTodos[0]._id.toHexString();
  let { text } = fakeTodos[0];

  it("should return a single todo", (done) => {
    request(app)
      .get(`todo${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.text).toBe(text);
      })
      .end(done);
  });
});
