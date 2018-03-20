var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var passport = require('passport'),
    LocalStrategy   = require('passport-local').Strategy;
var flash = require('connect-flash');
var mongoose = require('mongoose');
var use = require('../models/users');
var account = require('../models/accounts');
var transactions = require('../models/transactions');
var addr_req = require('../models/addr_req');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Online Banking' });
});

router.post('/login', passport.authenticate('userLogin', {
    successRedirect:'/dashboard',
    failureRedirect:'/',
    failureFlash:true,
    successFlash:true
}));

passport.use('userLogin',new LocalStrategy(
    function(username, password, done) {
        use.findOne({ username :username },
            function(err,user) {
                if (err)
                    return done(err);
                if (!user){
                    return done(null, false, { message:'Incorrect Username/Password'});
                }
                if (!isValidPassword(user, password)){
                    return done(null, false, { message:'Incorrect Username/Password'});
                }
                return done(null, user,{message:'You have Logged In successfully'});
            }
        );

    })
);

var isValidPassword = function(user,password){
    return bcrypt.compareSync(password,user.password);
};

passport.serializeUser(function(user, done) {
    var sessionUser = {_id:user._id,username:user.username};
    done(null, sessionUser);
});

passport.deserializeUser(function(id, done) {
    use.findById(id, function(err, user) {
        done(err, user);
    });
});

router.get('/dashboard',function (req,res,next) {
    if(req.session.passport && req.session.passport.user){
        account.find({username:req.session.passport.user.username},function (err,docs) {
            addr_req.findOne({username:req.session.passport.user.username},function (err,data) {
                var msg;
                if(data){
                    msg = "Address request pending for approval";
                }
                else{
                    msg="";
                }
                res.render('dashboard',{success:req.flash('success'),accounts:docs,session:req.session,msg:msg});
            });
        });
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/logout',function (req,res,next) {
    req.session.destroy();
    res.redirect('/');
});

router.get('/dashboard/:account',function (req,res,next) {
    var acc = req.params.account;
    account.find({account_no:acc},function (err,data) {
        if(err) console.log(err);
        transactions.find({$or:[{account_no:acc},{receiver:acc}]}).sort({datetime:-1}).exec(function(err,txns){
            res.render('account_info',{acnt:data[0],error_msg:req.flash('error_msg'),success_msg:req.flash('success_msg'),txns:txns});
        });
    });
});

router.get('/settings',function (req,res,next) {
    res.render('settings',{session:req.session,error_msg:req.flash('error_msg')});
});

router.post('/password',function (req,res,next) {
    var curr = req.body.curr;
    var new_pass = req.body.new_pass;
    var conf_pass = req.body.conf_pass;
    if(new_pass!=conf_pass){
        req.flash('error_msg',"The new passwords do not match");
        res.redirect('/settings');
    }
    else{
        var uname = req.session.passport.user.username;
        use.findOne({username:uname},function (err,doc) {
            if(bcrypt.compareSync(curr,doc.password)){
                doc.password=bcrypt.hashSync(new_pass,10);
                doc.save();
                req.flash('success',"Login Password Updated Successfully");
                res.redirect('/dashboard');
            }
            else{
                req.flash('error_msg','Password could not be updated');
                res.redirect('/settings');
            }
        });
    }
});

router.post('/password_transaction',function (req,res,next) {
    var curr = req.body.curr_trans;
    var new_pass = req.body.new_trans;
    var conf_pass = req.body.conf_trans;
    if(new_pass!=conf_pass){
        req.flash('error_msg',"The new passwords do not match");
        res.redirect('/settings');
    }
    else{
        var uname = req.session.passport.user.username;
        use.findOne({username:uname},function (err,doc) {
            if(bcrypt.compareSync(curr,doc.trans_password)){
                doc.trans_password=bcrypt.hashSync(new_pass,10);
                doc.save();
                req.flash('success',"Transaction Password Updated Successfully");
                res.redirect('/dashboard');
            }
            else{
                req.flash('error_msg','Password could not be updated');
                res.redirect('/settings');
            }
        });
    }
});

router.post('/transactions',function (req,res,next) {
    var n = req.body.txn_no;
    console.log(n);
    var username=req.session.passport.user.username;
    account.find({username:username},function (err,accounts) {
        var account_nos=[];
        accounts.forEach(function (item,index) {
            account_nos.push(item.account_no);
        });
        console.log(account_nos);
        transactions.find({
            $or:[
                {account_no:{$in:account_nos}},
                {receiver:{$in:account_nos}}
            ]
        }).sort({datetime:-1}).limit(parseInt(n)).exec(function (err,data) {
            console.log(data);
            if(err) console.log(err);
            res.render('transactions',{data:data});
        });
    });
});

router.post('/transfer',function (req,res,next) {
    var username = req.body.username;
    var sender = req.body.sender;
    var recipient = req.body.recipient;
    var amount = req.body.amount;
    var pass = req.body.trans_password;
    var d = new Date();

    use.findOne({username:username},function (err,user) {
        if(bcrypt.compareSync(pass,user.trans_password)){
            account.findOne({account_no:recipient},function (err,acc) {
                if(acc){
                    account.findOne({account_no:sender},function (err,send) {
                        if(send.balance>=amount){
                            send.balance = parseInt(send.balance)-parseInt(amount);
                            acc.balance = parseInt(acc.balance)+parseInt(amount);
                            send.save();
                            acc.save();

                            var txn = new transactions({
                                "account_no":sender,
                                "receiver":recipient,
                                "amount":amount,
                                "datetime":d
                            });

                            txn.save(function (err,updated) {
                                if(err) console.log(err);
                            });

                            req.flash('success_msg','Amount transferred successfully');
                            res.redirect('/dashboard/'+sender);
                        }
                        else{
                            req.flash('error_msg',"Insufficient funds");
                            res.redirect('/dashboard/'+sender);
                        }
                    });
                }
                else{
                    req.flash('error_msg',"Account doesn't exists");
                    res.redirect('/dashboard/'+sender);
                }
            });
        }
        else{
            req.flash('error_msg',"Incorrect Password");
            res.redirect('/dashboard/'+sender);
        }
    });

});

router.post('/request',function (req,res,next) {
    var cheque = req.body.cheque;
    var acc = req.body.account;
    account.findOne({account_no:acc},function (err,doc) {
        if(doc){
            if(cheque==0)
                doc.cheques="None";
            else if(cheque==1)
                doc.cheques="New Chequebook";
            else if(cheque==2)
                doc.cheques="Stop cheques";
            else
                doc.cheques="Stop cheques and issue New Chequebook";
            doc.save();
        }
        res.redirect('/dashboard/'+acc);
    });
});

router.post('/address',function (req,res,next) {
    var uname = req.session.passport.user.username;
    var address = req.body.address;
    addr_req.findOne({username:uname},function (err,doc) {
        if(err) console.log(err);
        if(doc){
            doc.address=address;
            doc.save();
        }
        else{
            var doc = new addr_req({
                "username":uname,
                "address":address
            });
            doc.save(function (err,updated) {
                if(err) console.log(err);
            });
        }
        res.redirect('/dashboard');
    });
});

module.exports = router;
