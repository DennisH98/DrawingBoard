const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const app= express();

const {check,validationResult} =require('express-validator');
const expressSession = require('express-session');

const server = require('http').createServer(app);
const io = require('socket.io').listen(server);


const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(expressSession({secret:'cake',saveUninitialized:false,resave:false}))

//var yourName;

io.on('connection', (socket) => {
  console.log('Client connected');
  //lobbies query?
  //pool.query("update lobbies set currentplayers = currentplayers + 1 where lobbyid = $1");
  //var list =[];
  var lobbyCode;
  var myName;
  var gameRoom;
  socket.on('roomUpdate',function(data){
    pool.query("update lobbies set currentplayers = currentplayers + 1 where lobbyid = $1",[data.roomID]);
    lobbyCode =data.roomID
  })
  
  socket.on('room', function(data) {
    gameRoom = data.room
    socket.join(data.room);
  });

  socket.on('draw',function(data){
    //io.sockets.emit('draw',data);//remeber to add to rooms not all sockets
    io.in(gameRoom).emit('draw',data);
  })

  socket.on('font',function(data){
    //io.sockets.emit('font',data);
    io.in(gameRoom).emit('font',data);
  })

  socket.on('size',function(data){
    //io.sockets.emit('size',data);
    io.in(gameRoom).emit('size',data);
  })

  socket.on('erase',function(data){
    //io.sockets.emit('erase',data);
    io.in(gameRoom).emit('erase',data);
  })

  socket.on('eraseall',function(data){
    //io.sockets.emit('eraseall',data);
    io.in(gameRoom).emit('eraseall',data);
  })

  socket.on('chat',function(data){
    //io.sockets.emit('chat',data);
    io.in(gameRoom).emit('chat',data);
  })

  socket.on('userList',function(data){
    //data.list.push(yourName);
    myName = data.userListName;
    //io.sockets.emit('userList',data);
    io.in(gameRoom).emit('userList',data);
  })

  socket.on('sendList',function(data){
    //io.sockets.emit('sendList',data);
    io.in(gameRoom).emit('sendList',data);
  })

  socket.on('start',function(){
    //io.sockets.emit('start');
    io.in(gameRoom).emit('start');
  })

  socket.on('word',function(data){
    io.in(gameRoom).emit('word',data);
  })

  socket.on('disconnect', function () {
    console.log("client disconnected");
    pool.query("update lobbies set currentplayers = currentplayers - 1 where lobbyid = $1",[lobbyCode]);
    //io.sockets.emit('removePlayer',{rName: myName});
    io.in(gameRoom).emit('removePlayer',{rName: myName});
    //delete if currentplayers =0
    
    pool.query("select * from lobbies where lobbyid = $1",[lobbyCode],function(error,results){
      
      if( (results.rows[0].currentplayers) == 0){
        pool.query("delete from lobbies where lobbyid = $1",[lobbyCode]);
      }
      
    })

    

 });
  

});



//create table users (username varchar(50) PRIMARY KEY, password varchar(50)); database table
//create table admin (adminname varchar(50) PRIMARY KEY, password varchar(50)); admin 12345
// create table lobbies (lobbyId serial, lobbyName varchar(50), maxPlayers int, currentPlayers int, createdBy varchar(50));

//Login Post

app.post('/lobbies', function(req, res){
  
  pool.query("select * from users where username=$1 and password=$2",[req.body.uname,req.body.password], function(error,results){
      if(results.rowCount==0){
        req.session.login =true;
        res.redirect('/');
      }else{
        req.session.user = req.body.uname;
        pool.query("select * from lobbies",function(error,result){
          
          res.render('pages/lobbies',{user: req.session.user, lobbyResults: result.rows});
      
        })
      }
  });

 
})


app.get('/lobbies/:id', function(req, res){

  //update player count in database
  //delete when player count equals 0
  //check socket leaves and enters?
  var id = req.params.id;
  
  //yourName=req.session.user;

  pool.query("select * from lobbies where lobbyId=$1",[id],function(error,results){
    res.render('pages/gameRoom',{lId:results.rows[0].lobbyid, lName: results.rows[0].lobbyname,user:req.session.user});
  })
 //{roomId:id}
  
  //Use to seperate game rooms and load lobby id
 
})


//Sign-up Post

app.post('/signup',function(req,res){
    

    if (req.body.newPassword==req.body.confirmPassword){

      
      pool.query("insert into users (username, password) values ($1,$2)",[req.body.newName,req.body.newPassword], function(error,results){
          if (error){
            console.log("doesn't work");
            req.session.uexist = true;
            req.session.success =false;
            req.session.insert =false;
            res.redirect('/');
          }else{
            console.log("it worked");
            req.session.success =false;
            req.session.insert =true; 
            req.session.uexist = false;
            res.redirect('/');
          }
         
      });
      
      
    }else{
      req.session.success =true; 
      req.session.insert =false;
      req.session.uexist = false;
      res.redirect('/');
    }
     
    
})

/*
app.post('/signup',[
  check('newPassword','password is invalid').isLength({min:5})
], function(req,res){
  
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    res.end();
  }
  
  pool.query("insert into users (username, password) values ($1,$2)",[req.body.newName,req.body.newPassword], function(error,results){
    res.redirect('back');
  });
  
})
*/

//Logout Post: Redirect Home

app.post('/logout', function(req,res){

  res.redirect('/');
})

//Goes to adminLogin

app.post('/admin', function(req,res){

  res.render('pages/adminLogin',{adminLogin: false});
})

//Login for adminView

app.post('/adminPage', function(req,res){

  pool.query("select * from admin where adminname=$1 and password=$2",[req.body.adminName,req.body.adminPassword], function(error,results){
      if(results.rowCount==0){
        req.session.adminLogin =true;
        res.render('pages/adminLogin',{adminLogin: req.session.adminLogin});
      }else{
        
        pool.query("select username from users",function(error,result){
          req.session.AdminUser = req.body.adminName;
             
          res.render('pages/adminView',{AdminUser: req.session.AdminUser, userResults: result.rows}); 
      })

      }
  });

})

//Create new lobby insert Post

app.post('/createLobby',function(req,res){

  pool.query("insert into lobbies (lobbyName,maxPlayers,currentPlayers,createdBy) values($1,$2,0,$3)",[req.body.lobbyName,req.body.maxPlayers,req.session.user],function(error,results){
    
    pool.query("select lobbyid from lobbies order by lobbyid desc limit 1",function(error,result){

      var lobId = result.rows[0].lobbyid;
      res.redirect('lobbies/'+lobId);
    })
    
  });
  
 
})


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
 
app.get('/', function (req, res){

  res.render('pages/index', {success: req.session.success, insert: req.session.insert, uexist: req.session.uexist, login:req.session.login});
  //req.session.success = false;
  //req.session.insert = false;
  
  req.session.destroy(); //works for now

})

server.listen(PORT, () => console.log(`Listening on ${ PORT }`))


