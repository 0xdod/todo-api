const expect = require("expect");
const request = require("supertest");
const { ObjectID } = require("mongodb");

const { app } = require("../server");
const { Todo } = require("../models/todo");
const {
  fakeTodos,
  populateTodos,
  users,
  populateUsers,
} = require("./seed/seed");

beforeEach(populateTodos);
beforeEach(populateUsers);

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
  let _id = fakeTodos[0]._id.toHexString();
  let { text } = fakeTodos[0];
  it("should remove a single todo", (done) => {
    request(app)
      .delete(`/todos/${_id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(_id);
      })
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById({ _id })
          .then((todo) => {
            expect(todo).toBeFalsy();
            done();
          })
          .catch((err) => done(err));
      });
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

describe("PATCH /todos/:id", () => {
  it("should update todo", (done) => {
    let _id = fakeTodos[0]._id.toHexString();
    request(app)
      .patch(`/todos/${_id}`)
      .send({
        text: "I was completed",
        isCompleted: true,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe("I was completed");
        expect(res.body.todo.isCompleted).toBe(true);
        expect(res.body.todo.completedAt).toBeA("number");
      })
      .end((err, res) => {
        Todo.findById({ _id })
          .then((todo) => {
            expect(todo.text).toBe("I was completed");
            expect(todo.isCompleted).toBe(true);
            expect(todo.completedAt).toBeTruthy();
            done();
          })
          .catch((err) => done(err));
      });
  });

  it("should clear completedAt when todo is not completed", (done) => {
    let _id = fakeTodos[1]._id.toHexString();
    request(app)
      .patch(`/todos/${_id}`)
      .send({
        text: "I was uncompleted",
        isCompleted: false,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.isCompleted).toBe(false);
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end((err, res) => {
        Todo.findById({ _id })
          .then((todo) => {
            expect(todo.isCompleted).toBe(false);
            expect(todo.completedAt).toBeFalsy();
            done();
          })
          .catch((err) => done(err));
      });
  });
});

describe("GET /users/me", () => {
  it("should return user if authenticated", (done) => {
    request(app)
      .get("/users/me")
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.user._id).toBe(users[0]._id.toHexString());
        expect(res.body.user.email).toBe(users[0].email);
      })
      .end(done);
  });

  it("should return 401 if not authenticated", (done) => {
    request(app)
      .get("/users/me")
      .expect(401)
      .expect((res) => {
        expect(res.body.user).toBeFalsy();
      })
      .end(done);
  });
});
