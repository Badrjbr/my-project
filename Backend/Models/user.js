const mongoose = require("mongoose");



const usersSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, default: 'admin' },
  user_name: {type: String},
  password: {
    type: String,
    required: true,
    
  },
  creation_date: { type: Date, default: Date.now },
  last_login: { type: Date, default: null },
  last_update: { type: Date, default: null },
  active: { type: Boolean, default: false }

});

const Users = mongoose.model("Users", usersSchema);
module.exports = Users;
