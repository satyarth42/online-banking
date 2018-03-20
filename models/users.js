var mongoose = require('mongoose');
var schema = mongoose.Schema;
var userSchema = new schema({
    "username":{
        type:String,
        unique:true,
        required:true
    },
    "password":{
        type:String,
        required:true
    },
    "trans_password":{
        type:String,
        required:true
    },
    "address":{
        type:String,
    }
},{collection:'users'});

module.exports = mongoose.model('users',userSchema);