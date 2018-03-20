var mongoose = require('mongoose');
var schema = mongoose.Schema;
var addr_req = new schema({
    "username":{
        type:String,
        required:true,
        unique:true
    },
    "address":{
        type:String,
        required:true,
    }
},{collection:'addr_req'});

module.exports = mongoose.model('addr_req',addr_req);