var socket = io();

function setup() {
    var can = createCanvas(885, 400);
    can.parent('board');
    background(0);
  }
 var font = "#"+ $("#color_value").val();
 var userList =[]; 
 var name=$("#uName").text();
 var roomid =$('#roomid').text();
 var wordList =["Pencil","Apple","House","Tree","Fish","Sun","Flower","Boat","Fire","Axe","Diamond","Bear",
"Watermelon",];
 var hiddenWord;
 var pts=0;
 //word list example, could use a database? 
 
function draw() {
    
  stroke(font);
  
    
  if (mouseIsPressed === true) {
      
      socket.emit('draw',{mX:mouseX,mY:mouseY,pmX:pmouseX,pmY:pmouseY});
      socket.on('draw',function(data){
        line(data.mX, data.mY, data.pmX, data.pmY);//pass in id too
      })
        
       // line(mouseX, mouseY, pmouseX, pmouseY);
    }
      
}  

socket.emit('room',{room: roomid});


$("#chatbtn").click(function(){
  
  var chatval = $("#chatName").val();
  
  //var name=$("#uName").text();
  socket.emit('chat',{chat: chatval, chatName:name});

  $("#chatName").val("")

  
})

socket.on('chat',function(data){
  if(hiddenWord.toLowerCase() == data.chat.toLowerCase()){
    $("#innerchat").append("<p>"+data.chatName +": Guessed the word!</p>")
    pts=pts + 5
    $("#pts").text("Points: "+pts);
  }else{
    $("#innerchat").append("<p>"+data.chatName +": "+ data.chat +"</p>")
  }
  //Add points

  $("#chat").scrollTop(10000000);
});


$('#color_value').change(function(){


  font= "#"+ $("#color_value").val()

  socket.emit('font',{color:font});
  
  //stroke(font);
});


$('#color').click(function(){
  font= "#"+ $("#color_value").val()
  socket.emit('font',{color:font});
  //socket.on('font',function(data){
    //font= data.color;
    //stroke(data.color);
  //})

  //stroke(font);
});

socket.on('font',function(data){
  font= data.color;
  stroke(data.color);
})

$("#size1").click(function(){
  socket.emit('size',{size:1});
  strokeWeight(1);
})

$("#size2").click(function(){
  socket.emit('size',{size:5})
  strokeWeight(5);
})

$("#size3").click(function(){
  socket.emit('size',{size:15})
  strokeWeight(15);
})

socket.on('size',function(data){
  strokeWeight(data.size);
})

$("#eraser").click(function(){
  socket.emit('erase',{ecolor:0,esize:20})
  font=0;
  //stroke(0);
  strokeWeight(20);
})

socket.on('erase',function(data){
  font = data.ecolor
  stroke(data.ecolor);
  strokeWeight(data.esize);
})

$("#eraserAll").click(function(){
  socket.emit('eraseall',{back:0,ecolorall: "#"+ $("#color_value").val()}) 
  clear();
  background(0);
  // color="red";
  stroke("#"+ $("#color_value").val());

  })

socket.on('eraseall',function(data){
  clear();
  background(data.back);
  stroke(data.ecolorall);
})


socket.emit('userList',{ userListName: name});
//socket.emit('userList',{ list:userList});
  
socket.on('userList',function(data){
  userList.push(data.userListName);
  

  /*
  $.each(data.list,function(key,value){
    userList.push(value);
  })
  */

  /*
  $("#userlist").empty();

  $.each(userList,function(key,value){
    $("#userlist").append("<p>"+value+"</p>");
  })
*/

  
})



setInterval(function () {$("#refresh").click();}, 1000);

$("#refresh").click(function(){
  socket.emit('sendList',{sendList:userList});
})


socket.on('sendList',function(data){
  $.each(data.sendList,function(key,value){
    if($.inArray(value,userList) !== -1){
     // console.log("It is in the Array");
    }else{
      userList.push(value);
      userList.sort();
      
    }
    //userList.push(value);
  })

  $("#userlist").empty();

  $.each(userList,function(key,value){
    $("#userlist").append("<div class='alert alert-primary'>"+value+"</div>");
  })
 
})

socket.emit('roomUpdate',{roomID: roomid})

socket.on('removePlayer',function(data){

  userList.splice($.inArray(data.rName,userList),1);
})

$("#startbtn").click(function(){
  socket.emit('start');
})

socket.on('start',function(){
  


 var i = 0;
 var turns = userList.length;
 var rounds =0;
 var maxRounds = turns* 2;
 function game() {
     if(userList[i]==name){

      clear();
      background(0);
     
      var guessWord = wordList[Math.floor(Math.random()*wordList.length)];
      $(".guessHeader").text("You are the Drawer, Draw: "+ guessWord);
      socket.emit('word',{Guess:guessWord});
      loop();
      setTimeout(function(){
        $(".guessHeader").text("Times up");
      },30000)

     }else{
      clear();
      background(0);

      $(".guessHeader").text("You are the Guesser");
      //var hiddenWord;
      socket.on('word',function(data){
        hiddenWord=data.Guess;
      });
      noLoop();
      setTimeout(function(){
        $(".guessHeader").text("The word was: "+hiddenWord);
      },30000)
     }

     var countdown = 30;
     setInterval(function(){
       if(countdown ==0){
       
       }else{
        countdown--;
        $("#countdown").text(countdown);
       }
     
     },1000)
     i++;
     rounds++;
     if( i < turns ){
         setTimeout( game, 35000 );   
     }else if(i ==turns){
          if(rounds == maxRounds){
           setTimeout(function(){
            $(".guessHeader").text("The game is finished!");
           },35000) 
          }else{
            i =0;
            setTimeout(game,35000);
          }
          
     }
 }

  game();

})
//keep running 
/*
  if(userList.length>=2){

    turns =0;
  
    $.each(userList,function(key,value){
      if(value == name){
        
        $(".guessHeader").text("You are the Drawer")
        var timer =0;
  
        while(timer<30){
          console.log(timer);
          setInterval(function () {timer++;}, 1000);
        } 
      }
    })
  
  }
*/



/* timer
var timer =0;
 function myfunc(){
  console.log(timer);
  timer++;
 }

setInterval(myfunc,1000);
*/

/*
$('#aButton').click(function(){
    socket.emit('testing',{val: roomid});
})
*/
//get id 
//var roomid =$('#roomdata').text();
//$('#test').append('<button>A '+ roomid+' </button>');


//socket.emit('room',{value: roomid});

/*
socket.on('testing',function(){
    $('#test').append('<button>A created button </button>');
})
*/
