const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let user = new Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  },
});

let User = mongoose.model("User", user);
module.export = { User };
