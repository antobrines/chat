/*
 * server.js
 *
 */
let ent = require('ent');

let express = require('express')();
let http = require('http').createServer(express);
let fs = require('fs').promises;
let registeredSockets = {};
let acceptMessagesBy = {};

/*
 * Binds a socket server to the current HTTP server
 *
 */
let socketServer = require('socket.io')(http);

socketServer.on('connection', function (socket) {
  console.log('A new user is connected...');
   /*
   * Registers an event listener
   *
   * - The first parameter is the event name
   * - The second parameter is a callback function that processes
   *   the message content.
   */
  socket.on('hello', (content) => {
    console.log(content + ' says hello!');

    // Pushes an event to all the connected clients
    socketServer.emit('notification', content + ' says hello!');

    // Pushes an event to the client related to the socket object
    socket.emit('hello', 'Hi ' + content + ', wassup mate?');
  });

  socket.on('>signin',  (content)=> {
    if (isAvailable(content)){
      registeredSockets[content] = socket;
      acceptMessagesBy[getNicknameBy(socket)] = getAllNickname();
      socket.emit('<connected',ent.encode(content));
      console.log(acceptMessagesBy);
      socketServer.emit('<notification', ent.encode(content+' joined the discussion'));
      for (let key in registeredSockets){
        registeredSockets[key].emit('<users',getAutorisation(key));
      }
    }
    else
      socket.emit('<error','the nickname '+ent.encode(content)+' is already used.');
  });
  
  socket.on('>message',  (content)=> {
    for (let key in acceptMessagesBy[getNicknameBy(socket)]){
      registeredSockets[acceptMessagesBy[getNicknameBy(socket)][key]].emit('<message', {sender : getNicknameBy(socket),text : ent.encode(content)});
      }
    });

  socket.on('>private',  ({recipient, text})=> {
    if (!isAvailable(recipient)) {
      let sender = getNicknameBy(socket);
      var index = acceptMessagesBy[getNicknameBy(socket)].indexOf(recipient[0]);
      if (index !== -1)
        {
        registeredSockets[recipient].emit('<private', {sender : sender,text : ent.encode(text)});
        socket.emit('<private', {sender : sender,text : ent.encode(text)});
        }
      }
    });

  socket.on('>private-image',  ({recipient, image})=> {
    if (!isAvailable(recipient)) {
      let sender = getNicknameBy(socket);
      var index = acceptMessagesBy[getNicknameBy(socket)].indexOf(recipient[0]);
      if (index !== -1)
        {
          console.log(image);
        registeredSockets[recipient].emit('<private-image', {sender : sender,image : image});
        socket.emit('<private-image', {sender : sender, image : image});
        }
      }
    });
  
  socket.on('>image', (dataURL)=> {
    for (let key in acceptMessagesBy[getNicknameBy(socket)]){
      registeredSockets[acceptMessagesBy[getNicknameBy(socket)][key]].emit('<image', {sender : getNicknameBy(socket),image : dataURL});
      }
    });

  socket.on('>accept', (nickname)=> {
    acceptMessagesBy[getNicknameBy(socket)].push(nickname);
    console.log(acceptMessagesBy[getNicknameBy(socket)]);
  });

  socket.on('>block', (nickname)=> {
    var index = acceptMessagesBy[getNicknameBy(socket)].indexOf(nickname);
    if (index !== -1)
      acceptMessagesBy[getNicknameBy(socket)].splice(index,1);
    console.log(acceptMessagesBy[getNicknameBy(socket)]);
  });

  socket.on('disconnect', ()=>{
    if (!isAvailable(getNicknameBy(socket))){
      var pseudo = getNicknameBy(socket);
      socketServer.emit('<notification', ent.encode(pseudo+' left the discussion'));
      delete registeredSockets[pseudo];
      for (let key in registeredSockets){
        registeredSockets[key].emit('<users',getAutorisation(key));
      }
    }
  });
});


express.get('/', (request, response) => {
  fs.readFile('./index.html')
    .then((content) => {
      // Writes response header
      response.writeHead(200, { 'Content-Type': 'text/html' });
      // Writes response content
      response.end(content);
    })
    .catch((error) => {
      // Returns 404 error: page not found
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Page not found.');
    });
});

express.get('/client.js', (request, response) => {
  fs.readFile('./client.js')
    .then((content) => {
      // Writes response header
      response.writeHead(200, { 'Content-Type': 'application/javascript' });
      // Writes response content
      response.end(content);
    })
    .catch((error) => {
      // Returns 404 error: page not found
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Page not found.');
    });
});


function isAvailable(nickname){
  let retour = true;
  for (let key in registeredSockets){
    if(key==nickname)
    {
      retour = false;
    }
  }
  return retour;
} 

function getNicknameBy(socket){
  for (let key in registeredSockets){
    if(registeredSockets[key]==socket)
    {
      return key;
    }
  }
}

function getAllNickname(){
  let rlist = new Array();
  for (let key in registeredSockets){
    rlist.push(key);
  }
  return rlist;
}

function getAutorisation(name){
  var nicknames = getAllNickname();
  var autorisation = new Array();
  for(let i=0; i<nicknames.length; i++){
    autorisation.push({name : nicknames[i], accept : acceptMessagesBy[nicknames[i]].includes(name)});
  }
  return autorisation;
}

/*
function getAllAutorisation(){
  var nicknames = getAllNickname();
  var allAutorisation = new Array();
  for(let i=0; i<nicknames.length; i++){
    allAutorisation.push({name:nicknames[i], autorisation: getAutorisation(nicknames[i])});
  }
  return allAutorisation;
}
*/

// Server listens on port 8080
http.listen(8080);
