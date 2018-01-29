const expect = require("expect");
const request = require("supertest");
const { ObjectID } = require("mongodb");

const { app } = require("../server");
const { Todo } = require("../models/todo");
const { User } = require("../models/user");
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
      .set("x-auth", users[0].tokens[0].token)
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
      .set("x-auth", users[0].tokens[0].token)
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
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe("GET /todos/:id", function () {
  let { text } = fakeTodos[0];
  it("should return a single todo", (done) => {
    request(app)
      .get(`/todos/${fakeTodos[0]._id.toHexString()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
      })
      .end(done);
  });
  it("should not return a todo for another user", (done) => {
    request(app)
      .get(`/todos/${fakeTodos[1]._id.toHexString()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it("should return 404 if todo not found", (done) => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
  it("should return 404 for invalid ID", (done) => {
    request(app)
      .get("/todos/1234567")
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe("DELETE /todos/:id", function () {
  it("should remove a single todo", (done) => {
    request(app)
      .delete(`/todos/${fakeTodos[0]._id.toHexString()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(fakeTodos[0]._id.toHexString());
      })
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(fakeTodos[0]._id.toHexString())
          .then((todo) => {
            expect(todo).toBeFalsy();
            done();
          })
          .catch((err) => done(err));
      });
  });
  it("should not remove a todo for another user", (done) => {
    request(app)
      .delete(`/todos/${fakeTodos[0]._id.toHexString()}`)
      .set("x-auth", users[1].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(fakeTodos[0]._id.toHexString())
          .then((todo) => {
            expect(todo).toBeTruthy();
            done();
          })
          .catch((err) => done(err));
      });
  });
  it("should return 404 if there's no todo to delete", (done) => {
    request(app)
      .delete(`/todos/${new ObjectID().toHexString()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
  it("should return 404 for invalid ID", (done) => {
    request(app)
      .delete("/todos/1234567")
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe("PATCH /todos/:id", () => {
  it("should update todo", (done) => {
    let _id = fakeTodos[0]._id.toHexString();
    request(app)
      .patch(`/todos/${_id}`)
      .set("x-auth", users[0].tokens[0].token)
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

  it("should not update another's todo", (done) => {
    let _id = fakeTodos[0]._id.toHexString();
    request(app)
      .patch(`/todos/${_id}`)
      .set("x-auth", users[1].tokens[0].token)
      .send({
        text: "I was completed",
        isCompleted: true,
      })
      .expect(404)
      .end((err, res) => {
        Todo.findById({ _id })
          .then((todo) => {
            expect(todo.text).not.toBe("I was completed");
            expect(todo.isCompleted).not.toBe(true);
            expect(todo.completedAt).not.toBeTruthy();
            done();
          })
          .catch((err) => done(err));
      });
  });

  it("should clear completedAt when todo is not completed", (done) => {
    let _id = fakeTodos[1]._id.toHexString();
    request(app)
      .patch(`/todos/${_id}`)
      .set("x-auth", users[1].tokens[0].token)
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

describe("POST /users", () => {
  it("should create a valid user", (done) => {
    let email = "example@example.com";
    let password = "Hellobaby!";

    request(app)
      .post("/users")
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        expect(res.headers["x-auth"]).toBeTruthy();
        expect(res.body.email).toBe(email);
        expect(res.body._id).toBeTruthy();
      })
      .end(done);
  });
  it("should not create a user for invalid user details", (done) => {
    request(app)
      .post("/users")
      .send({ email: "hello baby", password: "123" })
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
  it("should not create a user if email already exists", (done) => {
    request(app)
      .post("/users")
      .send({ email: users[0].email, password: "baybeeee" })
      .expect(400)
      .end(done);
  });
});

describe("POST /users/login", () => {
  it("should login user and return auth token", (done) => {
    request(app)
      .post("/users/login")
      .send({
        email: users[1].email,
        password: users[1].password,
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers["x-auth"]).toBeTruthy();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id)
          .then((user) => {
            expect(user.tokens[1]).toMatchObject({
              access: "auth",
              token: res.headers["x-auth"],
            });
            done();
          })
          .catch((e) => done(e));
      });
  });

  it("should reject invalid login", (done) => {
    request(app)
      .post("/users/login")
      .send({
        email: users[1].email,
        password: users[1].password + "1",
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers["x-auth"]).toBeFalsy();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id)
          .then((user) => {
            expect(user.tokens.length).toBe(1);
            done();
          })
          .catch((e) => done(e));
      });
  });
});

describe("DELETE /users/me/token", () => {
  it("should remove token object from tokens array", (done) => {
    request(app)
      .delete("/users/me/token")
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.findById(users[0]._id)
          .then((user) => {
            expect(user.tokens).toHaveLength(0);
            done();
          })
          .catch((e) => done(e));
      });
  });
});
