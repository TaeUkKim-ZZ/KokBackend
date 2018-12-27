var express = require('express');

var FCM = require('fcm-node');
var serverKey = 'AAAAtDlN4oM:APA91bHvMeNJciSPG30omwpo9a-Dm9-ieUTtIvzt0KGjU3cJ0laBiMhnXgWeuCsYefZfU1Mur9rjzsa3G1T7eD7EgR4j_eqCBBOIut3jwBAwcnZh-m0RJPhzCJZahLNfasYJ2i62Mr5c';


var router = express.Router();
var db = require('./mongo');
const crypto = require('crypto'); //Node.js 에서 제공하는 암호화 모듈
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const methodOverride = require('method-override');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI); // connect to our database

var dba = mongoose.connection;
var app = express();
const multer = require('multer');
const Grid = require('gridfs-stream');
const path = require('path');
const GridFsStorage = require('multer-gridfs-storage');

var bodyParser = require('body-parser')

let gfs;

const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        //파일 이름을 유저 고유 authid로 하는 방법 없을까?
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({
  storage
});

app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

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
        introduce: req.query.introduce,
        firebasetoken: req.query.firebasetoken,
        profileimage: 'default'
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

app.get("/edituserinfo", function(req, res) {
  db.User.findOne({
    email: req.query.useremail
  }, function(err, docs) {
    if (err) throw err;

    //유저 수정 내용 반영.....
    if (req.query.password != "") {
      docs.password = req.query.password;
    } 
    if (req.query.nickname != "") {
      docs.nickname = req.query.nickname;
    }
    if (req.query.gender != "") {
      docs.gender = req.query.gender;
    }
    if (req.query.introduce != "") {
      docs.introduce = req.query.introduce;
    }

    docs.save(function(err) {
      if (err) {
        throw err;
      } else res.send(docs);
    });

    if (docs == null) {
      res.sendStatus(409)
    } else {
      console.log(docs);
      //res.send(docs) //Json response
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
  newkok.usernickname = req.query.usernickname;
  newkok.profileimage = req.query.profileimage;
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
  }, function() {});
});

app.get("/getcomments", function(req, res) {
  //Userauthid, longitude, longitude를 받아서 댓글 추가.//글 고유번호
  /*db.Data.aggregate(
    [{ "$unwind": "$comments"}, { "$sort": { "comments.comment_date": 1}}, {"$group": {"_id": "$_id", "comments": {"$push": "$comments"}}}]);*/

  /*db.Data.aggregate([{ $match: { _id: req.query.userauthid }}, { $unwind: "$comments" }, { $sort: { "comments.comment_date": 1 }}, { $group: { _id: "$_id", comments: { "$push": "$comments" }}}], function(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(result);
  });*/

  /*db.Data.update(
    { _id : req.query.userauthid},
    {
      $push: {
        comments: {
          $sort: {comment_date : -1}
        }
      }
    });*/

  db.Data.findOne({
    _id: req.query.userauthid
  }, function(err, comment) {
    if (err) return res.status(500);
    else console.log(comment);

    if (comment != null) res.send(comment);
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
      authorusernickname: req.query.authorusernickname
    });

    comment.save(function(err) {
      if (err) res.status(500);
      else res.send(comment);
    });

    db.User.findOne({
      _id: comment.userauthid
    }, function(err, comment2) {
      if (err) return res.status(500);
      else {
        console.log(comment2);
        var client_token = comment2.firebasetoken;

        var push_data = {
          // 수신대상
          to: client_token,
          // App이 실행중이지 않을 때 상태바 알림으로 등록할 내용
          notification: {
            title: "Hello Node",
            body: "Node로 발송하는 Push 메시지 입니다.",
            sound: "default",
            click_action: "FCM_PLUGIN_ACTIVITY",
            icon: "fcm_push_icon"
          },
          // 메시지 중요도
          priority: "high",
          // App 패키지 이름
          restricted_package_name: "neolabs.kok",
          // App에게 전달할 데이터
          data: {
            title: 'Kok에서 알립니다!',
            content: comment2.nickname + '님이 댓글을 달았습니다. 확인을 하여주세요.'
          }
        };

        /** 아래는 푸시메시지 발송절차 */
        var fcm = new FCM(serverKey);

        fcm.send(push_data, function(err, response) {
          if (err) {
            console.error('Push메시지 발송에 실패했습니다.');
            console.error(err);
            return;
          }

          console.log('Push메시지가 발송되었습니다.');
          console.log(response);
        });
      }
    });
  });
});

app.get("/modifyfirebasetoken", function(req, res) {
  db.User.findOne({
    email:req.query.useremail
  }, function(err, user) {
    if(err) return res.Status(500);
    else {
      user.firebasetoken = req.query.firebasetoken;
      console.log(req.query.firebasetoken);

      user.save(function(err) {
        if (err) {
          throw err;
        } else res.send(user);
      });

      if (user == null) {
        res.sendStatus(409)
      } else {
        console.log(user);
        //res.send(docs) //Json response
      }
    }
  });
});

app.get("/deletecomment", function(req, res) {
  //Userauthid, longitude, longitude를 받아서 댓글 추가.
  var newId = new mongoose.mongo.ObjectId(req.query.idofcomment);
  db.Data.findOneAndUpdate({
    _id: req.query.userauthid
  }, {
    $pull: {
      comments: {
        _id: newId
      }
    }
  }, function(err, comment) {
    if (err) return res.status(500);
    else {
      console.log(comment);
      res.send(comment)
    }
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
        $maxDistance: 1000
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
  db.Data.remove({
    _id: req.query.deleteuseruid
  }, function() {});
});

//이미지 파일(프로필 파일)을 POST로 보내면 DB에 등록하고 JSON으로 뿌려진 파일명을 가지고 와서 저장한다.
app.post('/uploadprofileimage', upload.single('file'), function(req, res) {
  console.log(req.file);
  res.json(req.file);

  db.User.findOne({
    _id: req.query.userauthid
  }, function(err, docs) {
    if (err) throw err;
    if (docs == null) {
      res.sendStatus(409)
    } else {
      console.log(docs);
      //res.send(docs) //Json response
    }

    docs.profileimage = req.file.filename;
    docs.save();
  });
});

app.get('/files', function(req, res) {
  gfs.files.find().toArray(function(err, files) {
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    return res.json(files);
  });
});

app.get('/images/:filename', function(req, res) {
  gfs.files.findOne({
    filename: req.params.filename
  }, function(err, file) {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      })
    }

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'image/jpg' || file.contentType === 'multipart/form-data') {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

app.get('/files/:filename', function(req, res) {
  gfs.files.findOne({
    filename: req.params.filename
  }, function(err, file) {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      })
    }

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'image/jpg' || file.contentType === 'multipart/form-data') {} else {
      res.status(404).json({
        err: 'Not an image'
      });
    }

    return res.json(file);
  });
});

var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('Pick Server running on port 3000!')
})

dba.on('error', console.error.bind(console, 'connection error:'));

dba.once('open', function(callback) {
  console.log("mongo DB connected...")
  gfs = Grid(dba.db, mongoose.mongo);
  gfs.collection('uploads');
});
