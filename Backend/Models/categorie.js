const mongoose = require('mongoose');

const categoriesSchema = new mongoose.Schema({
    category_name: {
        type: String,
        required: true,
        unique: true
    },
    active: {
        type: Boolean,
        required: true
    }
}, 
{ timestamps: true });


module.exports = mongoose.model("Categories", categoriesSchema);
