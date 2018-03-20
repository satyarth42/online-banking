var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var crypto = require('crypto');
var use = require('../models/users');
var account = require('../models/accounts');
var flash = require('connect-flash');
router.get('/', function(req, res, next) {
    res.render('dmnpnl');
    console.log(req.session);
});

router.post('/auth',function (req,res,next) {
    const secret = 'nightcrawler';
    var hash = crypto.createHmac('sha256', secret)
        .update(req.body.password)
        .digest('hex');
    if(hash=='f7451226d85a47bbcb2c9726d7967beebd8855c6b1aca72aaf3ef0de7a90bff2'){
        res.redirect('/admin/control');
    }
    else{
        res.render('dmnpnl');
    }
    console.log(req.session);
});

router.post('/adduser',function(req,res,next){
    var username = req.body.username;
    var password = req.body.password;
    var trans_password = req.body.trans_password;
    var address = req.body.address;

    use.find({username:username},function (err,docs) {
        if(docs.length>0){
            req.flash('error_msg','User already exists');
            res.redirect('/admin/control');
        }
        else{
            var user = new use({
                "username":username,
                "password":bcrypt.hashSync(password,10),
                "trans_password":bcrypt.hashSync(trans_password,10),
                "address":address
            });
            user.save(function(err,updated){
                if(err) console.log(err);
                req.flash('success','User added');
                res.redirect('/admin/control');
            });
        }
        console.log(req.session);
    });
});

router.post('/addaccount',function(req,res,next){
    var username = req.body.username;
    var account_no = req.body.account;

    use.find({username:username},function (err,docs) {
        if(docs.length>0){
            var new_account = new account({
                "username":username,
                "account_no":account_no,
                "balance":0.0,
                "cheques":"None"
            });
            account.find({account_no:account_no},function (err,data) {
                if(data.length>0){
                    req.flash('error_msg',"Account no. already exists");
                    res.redirect('/admin/control');
                }
                else{
                    new_account.save(function (err,updated) {
                        if(err) console.log(err);
                        req.flash("account","New Account created");
                        res.redirect('/admin/control');
                    });
                }
            });
        }
        else{
            req.flash('error_msg','User does not exists');
            res.redirect('/admin/control');
        }
    });
});

router.get('/control',function(req,res,next){
    res.render('control',{error_msg:req.flash('error_msg'),success:req.flash('success'),account:req.flash('account')});
});

module.exports = router;
