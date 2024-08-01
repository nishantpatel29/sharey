const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')

let Users = new mongoose.Schema({
    files: [{
        filename: {
            type: String,
            require: true
        },
        url: {
            type: String,
            require: true
        }
    }],
})
Users.plugin(passportLocalMongoose);
module.exports = mongoose.model('sharey', Users);
