var mongoose = require('mongoose');
var moment = require('moment');
var Schema = mongoose.Schema;

var userSchema = mongoose.Schema({
    email: {type: String, unique: true}, // 유저 메일
    password: {type: String}, // 유저 비밀번호
    gender : {type : String},
    nickname : {type: String},
    introduce : {type: String},
    profileimage : {type: String}
});

var commentSchema = new Schema({
    contents: String,
    authorauthid: String,
    authorusernickname: String,
    comment_date: {type: String, default: moment().format('YYYY-MM-DD hh:mm:ss')}
});

var dataSchema = mongoose.Schema({
    userauthid: {type: String}, // 유저 메일
    usernickname: {type: String},
    profileimage: {type: String},
    message : {type: String},
    comments : [commentSchema],
    location : {
        type : {
            type: String,
            default: 'Point'
        },
        coordinates: [Number]
    }
});

dataSchema.index({ location : '2dsphere'});

var User = mongoose.model("User", userSchema);
var Data = mongoose.model("Data", dataSchema);
var Comment = mongoose.model("Comment", commentSchema);

exports.User = User;
exports.Data = Data;
exports.Comment = Comment;
