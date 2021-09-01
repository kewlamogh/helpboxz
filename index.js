const express = require('express');
const Database = require("@replit/database")
const db = new Database();
var cookieParser = require('cookie-parser');
const app = express();
let ejs = require("ejs");

app.set('view engine', 'ejs');
app.use(cookieParser());

function deleteAllInDatabase() {
  db.list().then(keys => {
    for (let i of keys) {
      db.delete(i).then(() => {});
    }
  });
}


app.get("/ask", (req, res) => {
  let cookie = req.cookies["userinfo"];
  if (cookie == null) {
    res.redirect('/login')
    return;
  }
  res.sendFile(__dirname+"/views/ask.html");
});

app.get("/askthequestion", (req, res) => {
  db.get("internal/messages").then(value => {
    let curr = value;
    let cookie = req.cookies["userinfo"];
    if (cookie == null) {
      res.redirect('/login')
      return;
    }
    curr[req.query["title"]] = {tags: ["#idk"], full_question: req.query["Question"], answers: [], selectedAnswer:null, askedBy: cookie.username};
    console.log(cookie.username)
    db.set("internal/messages", curr).then(() => {});
    res.redirect("/")
  });
});

app.get("/markascorrect/:question/:answer", (req, res) => {
  db.get("internal/messages").then(value => {
    let curr = value;
    let cookie = req.cookies["userinfo"];
    let oof = curr[req.params["question"]]
    if (cookie == null) {
      res.redirect('/login')
      return;
    }
    oof.selectedAnswer = req.params["answer"];
    curr[req.params["question"]] = oof; 
    db.set("internal/messages", curr).then(() => {});
    res.redirect("/questions/"+req.params["question"])
  });
});

app.get("/answer", (req, res) => {
  db.get("internal/messages").then(value => {
    let curr = value;
    let oof = curr[req.query["title"]];
    oof.answers.push(req.query["answer"] + " | answer from "+req.query["who"]);
    curr[req.query["title"]] = oof;
    let cookie = req.cookies["userinfo"];
    if (cookie == null) {
      res.redirect('/login')
      return;
    }
    db.set("internal/messages", curr).then(() => {});
    res.redirect("/")
  });
});


app.get("/questions/:question", (req, res) => {
  let cookie = req.cookies["userinfo"];
    if (cookie == null) {
      res.redirect('/login')
      return;
    }
  
  db.get("internal/messages").then(value => {
    cookie["msgs"] = value[req.params["question"]];
    cookie["t"] = req.params["question"];
    console.log(cookie);
    cookie["answers"] = cookie["msgs"].answers
    res.render("question", cookie);
  });
})

db.get("internal/messages").then(value => {
  console.log(value);
});

function isvalid(req) {
  let c = req.cookies["userinfo"];
  return c != null && c != undefined
}

app.get('/', (req, res) => {
  let userInfo = req.cookies["userinfo"];
  if (userInfo == null || userInfo == undefined) {
    res.redirect("/login")
  } else{  
    let edited = req.cookies["userinfo"];
    db.get("internal/messages").then(value => {
      edited["msgs"] = value;
      res.cookie("userinfo", edited);
      res.render("home", edited);
    });
  }
});

app.get('/processLogin', (req, res) => {
  let data = req.query;
  db.get(data["username"]).then(value => {
    if (value == undefined || value == null) {
      res.redirect("/signup")
    }
    if (value.password == data["password"]) {
      let edited = value;
      db.get("internal/messages").then(ve => {
        edited["msgs"] = ve;
        res.cookie("userinfo", edited);
        res.redirect("/");
      });
    } else {
      res.redirect("/signup")
    }
  });
});


app.get('/processSignup', (req, res) => {
  let data = req.query;
  db.get(data["username"]).then(value => {
    if (value == undefined || value == null) {
      db.set(data["username"], {"password": data["password"], "username": data["username"], "projects": []}).then(() => {});
      res.redirect("/login")
    }
  });
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname+"/views/login.html")
})

app.get("/signup", (req, res) => {
  res.sendFile(__dirname+"/views/signup.html")
})

app.listen(3000, () => {
  console.log('server started');
});