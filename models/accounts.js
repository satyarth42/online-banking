var mongoose = require('mongoose');
var schema = mongoose.Schema;
var accountSchema = new schema({
    "username":{
        type:String,
        required:true,
        ref:'users'
    },
    "account_no":{
        type:String,
        required:true,
        unique:true
    },
    "balance":{
        type:Number,
        required:true
    },
    "cheques":{
        type:String,
    }
},{collection:'accounts'});

module.exports = mongoose.model('accounts',accountSchema);