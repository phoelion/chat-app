const socket = io();

//Elements
const messageForm = document.querySelector('#message-form');
const messageFormInput = messageForm.querySelector('input');
const messageFormButton = messageForm.querySelector('button');
const sendLocation = document.querySelector('#send-location');
const messages = document.querySelector('#messages');
const sidebar = document.querySelector('#sidebar');
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  //new message
  const newMessage = messages.lastElementChild;

  //Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = messages.offsetHeight;

  //height of messages container
  const containerHeight = messages.scrollHeight;

  //how far hav i scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('hh:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('location', (location) => {
  console.log(location);
  const html = Mustache.render(locationTemplate, {
    username: location.username,
    location: location.text,
    createdAt: moment(location.createdAt).format('hh:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  sidebar.innerHTML = html;
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = e.target.elements.message.value;

  socket.emit('sendMessage', message, (message) => {
    console.log('it delivered', message);
    messageFormButton.removeAttribute('disabled');
    messageFormInput.value = '';
    messageFormInput.focus();
  });
});

sendLocation.addEventListener('click', (e) => {
  e.target.setAttribute('disabled', 'disabled');
  if (!navigator.geolocation) return alert('go away');
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    socket.emit('sendLocation', { latitude, longitude }, () => {
      console.log('location sent successfully');
    });
    e.target.removeAttribute('disabled');
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
