const socket = io()

const $messageForm = document.querySelector('#message-form')

const $messageFormInput = $messageForm.querySelector('input')

const $messageFormButton = $messageForm.querySelector('button')

const $sendLocationButton = document.querySelector('#send-location')

const $messages = document.querySelector('#messages')


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML

const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


// Search
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}


// Sockets
socket.on('message', (message) => {

  const html = Mustache.render(messageTemplate, {

    message: message.message,

    username: message.username,

    createdAt: moment(message.createdAt).format('h:mm a')

  })

  $messages.insertAdjacentHTML('beforeend', html)

  autoscroll()

})

socket.on('locationMessage', (message) => {

  const html = Mustache.render(locationMessageTemplate, {

    url: message.url,

    username: message.username,

    createdAt: moment(message.createdAt).format('h:mm a')

  })

  $messages.insertAdjacentHTML('beforeend', html)

  autoscroll()

})

socket.on('roomData', ({ room, users }) => {

  const html = Mustache.render(sidebarTemplate, {

    room,

    users

  })

  document.querySelector('#sidebar').innerHTML = html

})


// Form
$messageForm.addEventListener('submit', e => {

  e.preventDefault()

  const message = $messageFormInput.value

  if (message.length == 0) { return 'bat' }

  $messageFormButton.setAttribute('disabled', 'disabled')

  socket.emit('client-send-msg', message, x => {

    $messageFormButton.removeAttribute('disabled')

    $messageFormInput.value = ''

    $messageFormInput.focus()

    console.log('Delivered!!', x);

  })

})

// Location
$sendLocationButton.addEventListener('click', e => {

  if (!navigator.geolocation) {

    return alert('Geolocation is not supported by your browser.')

  }

  $sendLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {

    socket.emit('sendLocation', {

      latitude: position.coords.latitude,

      longitude: position.coords.longitude

    }, () => {

      $sendLocationButton.removeAttribute('disabled')

      console.log('Location shared!')

    })

  })

})

socket.emit('join', { username, room }, error => {

  if (error) {

    alert(error)

    location.href = '/'

  }

})
