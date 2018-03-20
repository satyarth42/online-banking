var mongoose = require('mongoose');
var schema = mongoose.Schema;
var trans_schema = new schema({
    "account_no":{
        type:String,
        required:true,
    },
    "receiver":{
        type:String,
        required:true,
    },
    "amount":{
        type:Number,
        required:true
    },
    "datetime":{
        type:Date,
    }
},{collection:'transactions'});

module.exports = mongoose.model('transactions',trans_schema);