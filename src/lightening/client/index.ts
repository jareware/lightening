var pre = document.querySelector('pre');
var url = location.protocol.replace(/^http/, 'ws') + '//' + location.hostname + ':' + 8081;
var socket = new WebSocket(url);
socket.onopen = function(evt) {
  console.log('WebSocket opened', evt);
};
socket.onclose = function(evt) {
  console.log('WebSocket closed', evt);
};
socket.onerror = function(evt) {
  console.log('WebSocket error', evt);
};
socket.onmessage = function(evt) {
  console.log('WebSocket message', evt);
  if (pre) pre.innerText = evt.data;
};
