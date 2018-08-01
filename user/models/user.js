var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');
var mongooseHidden = require('mongoose-hidden')();
var timestamps = require('mongoose-timestamp');
var paginate = require('mongoose-paginate');
var schema = new mongoose.Schema({
    name : {
        type : String
    },
    email : {
        type : String,
        required : true,
        index : {
            unique : true
        }
    },
    password: {
        type: String,
        required: true,
        select: true
    },
    scope : [{
        type : Number
    }]
},{usePushEach: true});
schema.plugin(paginate);
schema.plugin(timestamps);
schema.plugin(mongooseHidden,{ hidden: {_id:false, password: true,scope:true,isActive:true,createdAt:true,updatedAt:true} });
schema.pre('save', function(next) {
    var user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
    // generate a salt
    bcrypt.genSalt(10, function(err, salt) {
        if (err) return next(err);
        // hash the password along with our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});
schema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        console.log(isMatch);
        if (err) return cb(err);
        cb(null, isMatch);
    });
};
module.exports = mongoose.model('user', schema);

