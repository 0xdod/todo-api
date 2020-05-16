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

describe("GET /todos", () => {
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

describe("GET /todos/:id", function () {
  let id = fakeTodos[0]._id.toHexString();
  let { text } = fakeTodos[0];
  it("should return a single todo", (done) => {
    request(app)
      .get(`/todos/${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
      })
      .end(done);
  });

  it("should return 404 if todo not found", (done) => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .expect(404)
      .end(done);
  });

  it("should return 404 for invalid ID", (done) => {
    request(app).get("/todos/1234567").expect(404).end(done);
  });
});

describe("DELETE /todos/:id", function () {
  let id = fakeTodos[0]._id.toHexString();
  let { text } = fakeTodos[0];
  it("should delete a single todo", (done) => {
    request(app)
      .delete(`/todos/${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end(done);
  });

  it("should return 404 if there's no todo to delete", (done) => {
    request(app)
      .delete(`/todos/${new ObjectID().toHexString()}`)
      .expect(404)
      .end(done);
  });

  it("should return 404 for invalid ID", (done) => {
    request(app).delete("/todos/1234567").expect(404).end(done);
  });
});
