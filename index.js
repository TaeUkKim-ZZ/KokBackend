var express = require('express');

var router = express.Router();
var db = require('./mongo');
var crypto = require('crypto'); //Node.js 에서 제공하는 암호화 모듈
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI); // connect to our database

var dba = mongoose.connection;

var app = express();

//회원가입
app.get("/user/signup", function(req, res) {
  //console.log(req.query.email);
  db.User.find({
    email: req.query.email
  }, function(err, docs) {
    if (err) throw err;
    console.log(docs);
    if (docs.length == 0) {
      var newUser = new db.User({
        email: req.query.email,
        password: req.query.password, //클리이언트에서 암호화해서 보내자....
        gender: req.query.gender,
        nickname: req.query.nickname,
        introduce: req.query.introduce
      });

      console.log('User Register : \n' + newUser);
      newUser.save(function(err) {
        if (err) {
          throw err;
        } else res.send(newUser);
      });
    } else res.sendStatus(409);
  });
});

//로그인
app.get("/user/signin", function(req, res) {
  db.User.findOne({
    email: req.query.email,
    password: req.query.password
  }, function(err, docs) {
    if (err) throw err;
    if (docs == null) {
      res.sendStatus(409)
    } else {
      console.log(docs);
      res.send(docs) //Json response
    }
    //로그인 한 동안에는 DB접근 ID만 저장해두자.... 자동로그인도 마찬가지고.....
    //그러니깐 여기는 이메일과 비번을 넣으면 유저의 고유 auth 값을 반환하는거지 ㅇㅇ....
  });
});

app.get("/getuserinfo", function(req, res) {
  db.User.findOne({
    _id: req.query.useruid
  }, function(err, docs) {
    if (err) throw err;

    if (docs == null) {
      res.sendStatus(409)
    } else {
      console.log(docs);
      res.send(docs) //Json response
    }
  });
});

//콕 추가.
app.get("/addpick", function(req, res) {
  //클라이언트로 부터 ID, 위도, 경도, 메시지를 받아서 저장한다.
  const location = {
    type: 'Point',
    coordinates: [req.query.longitude, req.query.latitude]
  };

  var newkok = new db.Data();
  newkok.userauthid = req.query.userauthid;
  newkok.message = req.query.message;
  newkok.location = location;

  newkok.save(function(err) {
    if (err) {
      console.log(err);
    } else {
      res.send(newkok);
      console.log(newkok)
    }
  });
});

app.get("/deletepick", function(req, res) {
  db.User.remove({
    _id: req.query.deleteuseruid
  }, function() {
    // removed.
    // 잘 작동하는것 같다.
  });
});

//콕에 댓글 추가.
app.get("/addcomment", function(req, res) {
  //Userauthid, longitude, longitude를 받아서 댓글 추가.
  db.Data.findOne({
    _id: req.query.userauthid
  }, function(err, comment) {
    if (err) return res.status(500);
    else console.log(comment);

    comment.comments.push({
      contents: req.query.contents,
      authorauthid: req.query.authorauthid,
      deleted: false
    });

    comment.save(function(err) {
      if (err) res.status(500);
      else res.send(comment);
    });
  });
});

app.get("/deletecomment", function(req, res) {
  //Userauthid, longitude, longitude를 받아서 댓글 추가.
  db.Data.findOne({
    _id: req.query.userauthid
  }, function(err, comment) {
    if (err) return res.status(500);
    else console.log(comment);

    //comment.comments.pull({authorauthid: req.query.authorauthid, contents : req.query.contents});
    //comment.comments.deleted = true;

    //comment.comments.findOneAndUpdate()
    comment.comments.pull({
      _id: req.query.idofcomment
    });

    comment.save(function(err) {
      if (err) res.status(500);
      else res.send(comment);
    });
  });
});

//주변의 콕 찾아서 제시
app.get("/getpicknearby", function(req, res) {
  var coords = [req.query.longitude, req.query.latitude];
  //클라이언트로 부터 ID, 위도, 경도를 받아 가까운것에 있는것들을 json 형태로 반환.
  db.Data.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coords
        },
        $maxDistance: 5000
      }
    }
  }, function(err, docs) {
    res.send(docs);
  });
});

//자신의 콕 불러오기
app.get("/getpickmy", function(req, res) {
  //클라이언트로 부터 ID를 받아서 모든 메시지를 반환한다.
  db.Data.find({
    userauthid: req.query.userauthid
  }, function(err, docs) {
    if (err) throw err;
    console.log(docs);
    res.send(docs);
  });
});

//자신의 콕 제거하기
app.get("/deletepickmy", function(req, res) {
  //고유 ID를 받아서 제거한다.
  db.User.remove({
    _id: req.query.deleteuseruid
  }, function() {
    // removed.
    // 잘 작동하는것 같다.
  });
});

var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('Pick Server running on port 3000!')
})

dba.on('error', console.error.bind(console, 'connection error:'));

dba.once('open', function(callback) {
  console.log("mongo DB connected...")
});
