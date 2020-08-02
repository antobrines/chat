let socketClient = io();
/*
 * Emits an event to the server
 *
 * - The first parameter is the event name.
 * - The second parameter is the message content: it can be a number,
 *   a string or an object.
 */
socketClient.emit('hello', 'Olivier');


/*
 * Registers event listeners
 *
 * - The first parameter is the event name
 * - The second parameter is a callback function that processes
 *   the message content.
 */
socketClient.on('notification', (content) => {
  console.log(content);
});

socketClient.on('hello', (content) => {
  console.log(content);
});


let signin = document.querySelector('[name="signin"]');
signin.addEventListener("submit",(event)=> {
    let name = document.getElementsByName("nickname")[0].value;
    socketClient.emit('>signin', name);
    event.preventDefault();
});

let send = document.querySelector('[name="send"]');
send.addEventListener("submit",(event)=> {
  //let name = document.getElementsByName("nickname")[0].value;
  socketClient.emit('>message', document.getElementsByName("message")[0].value);
  document.getElementsByName("message")[0].value = '';
  event.preventDefault();
});

socketClient.on('<connected', (content) => {
  document.getElementsByName("signin")[0].classList.add("hidden");
  document.getElementsByName("send")[0].classList.remove("hidden");
  document.getElementsByClassName("toast")[0].classList.add("hidden");
  document.getElementsByName("send")[0].getElementsByTagName('span')[0].innerHTML=content;
});

socketClient.on('<message', ({sender,text}) => {
  var date = new Date();
  var options = { day: '2-digit', month : '2-digit', year : '2-digit', hour : '2-digit', minute : '2-digit', second : '2-digit' };

  date = date.toLocaleDateString('fr-FR', options);
  document.getElementById("display").classList.remove("hidden");
  document.getElementById("display").innerHTML="<span id = 'sender'>"+sender+"</span><span id ='date'> "+date+"</span><br>"+"<span id = 'text'>"+text+"</span><br><br>"+document.getElementById("display").innerHTML;
});

socketClient.on('<image', ({sender,image}) => {
  var date = new Date();
  var options = { day: '2-digit', month : '2-digit', year : '2-digit', hour : '2-digit', minute : '2-digit', second : '2-digit' };

  date = date.toLocaleDateString('fr-FR', options);
  document.getElementById("display").classList.remove("hidden");
  document.getElementById("display").innerHTML="<span id = 'sender'>"+sender+"</span><span id ='date'> "+date+"</span><br>"+"<div id ='sizeImage'><img src='"+image+"' class='img-responsive'></div><br><br>"+document.getElementById("display").innerHTML;
});

socketClient.on('<private', ({sender,text}) => {
  var date = new Date();
  var options = { day: '2-digit', month : '2-digit', year : '2-digit', hour : '2-digit', minute : '2-digit', second : '2-digit' };

  date = date.toLocaleDateString('fr-FR', options);
  document.getElementById("display").classList.remove("hidden");
  document.getElementById("display").innerHTML="<span id = 'privateSender'>"+sender+"</span><span id ='date'> "+date+"</span><br>"+"<span id = 'text'>"+text+"</span><br><br>"+document.getElementById("display").innerHTML;
});

socketClient.on('<private-image', ({sender,image}) => {
  var date = new Date();
  var options = { day: '2-digit', month : '2-digit', year : '2-digit', hour : '2-digit', minute : '2-digit', second : '2-digit' };

  date = date.toLocaleDateString('fr-FR', options);
  document.getElementById("display").classList.remove("hidden");
  document.getElementById("display").innerHTML="<span id = 'privateSender'>"+sender+"</span><span id ='date'> "+date+"</span><br>"+"<div id ='sizeImage'><img src='"+image+"' class='img-responsive'></div><br><br>"+document.getElementById("display").innerHTML;
});

socketClient.on('<notification', (content) => {
  document.getElementById("display").innerHTML=content+"<br>"+document.getElementById("display").innerHTML;

});

socketClient.on('<error', (content) => {
  var newContent = document.createTextNode(content);
  document.getElementsByClassName("toast")[0].classList.remove("hidden");
  document.getElementsByClassName("toast")[0].appendChild(newContent);
});

socketClient.on('<users', (content) => {
  document.getElementsByName("theadUsers")[0].innerHTML = content.length + " users connected";
  document.getElementsByName("tbodyUsers")[0].innerHTML = "";
  for(let i=0; i<content.length; i++){
    document.getElementsByName("tbodyUsers")[0].innerHTML += "<td><div class='form-group'><label class='form-switch'><input type='checkbox' " + (content[i].accept? "checked" : "") + "><i class='form-icon'></i></label><span id = '"+i+"' name= 'usersList'>"+content[i].name+"</span></div></td>";
    if(!content[i].accept)
    {
      document.getElementById(i).classList.add("grey");
    }
    let toggle = document.querySelectorAll('[type="checkbox"]');
    for (let k=0; k<toggle.length; k++){
      toggle[k].addEventListener("change",(event)=> {
        let block = (event.target.checked? ">accept" : ">block");
        socketClient.emit(block, content[i].name);
      });
    }

    let users = document.querySelectorAll('[name="usersList"]');
    for (let j=0; j<users.length; j++){
      users[j].addEventListener("click",(event)=> {
        document.getElementById("modal").classList.add("active");
        document.getElementsByClassName("modal-title h5")[0].innerHTML = "Private message to " + users[j].innerHTML;
        document.getElementById("userSender").innerHTML = document.getElementsByName("nickname")[0].value;
      });
    }
  }
});

let close = document.querySelectorAll('.close');
close[0].addEventListener("click",(event)=> {
    document.getElementById("modal").classList.remove("active");
});
close[1].addEventListener("click",(event)=> {
  document.getElementById("modal").classList.remove("active");
});

let private = document.querySelector('[name="private"]');
private.addEventListener("submit",(event)=> {
  socketClient.emit('>private', {recipient: document.getElementById("recipient").innerHTML.split(" ").splice(-1), text : document.getElementsByName("privateMessage")[0].value});
  document.getElementsByName("privateMessage")[0].value = '';
  event.preventDefault();
});

let file = document.querySelectorAll('[type="file"]');
file[0].addEventListener("change",(event)=> {
    var reader = new FileReader();
    var input = event.target;
    reader.onload = function(){
      var dataURL = reader.result;
      socketClient.emit(">image", dataURL);
    };
    reader.readAsDataURL(input.files[0]);
    event.preventDefault();
});
file[1].addEventListener("change",(event)=> {
  var reader = new FileReader();
  var input = event.target;
  reader.onload = function(){
    var dataURL = reader.result;
    socketClient.emit(">private-image", {recipient: document.getElementById("recipient").innerHTML.split(" ").splice(-1), image : dataURL});
  };
  reader.readAsDataURL(input.files[0]);
  event.preventDefault();
});