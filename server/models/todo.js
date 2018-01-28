const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let todo = new Schema({
  text: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Number,
    default: null,
  },
});

let Todo = mongoose.model("Todo", todo);

module.exports = { Todo };
