const chalk = require('chalk')

const express = require('express')

const path = require('path')

const http = require('http')

const socketio = require('socket.io')

const initRouter = require('./routers/init')

const { generateMessage, generateLocationMessage } = require('./utils/messages')

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()

const server = http.createServer(app)

const port = process.env.PORT

const io = socketio(server)


const publicPath = path.join(__dirname, '../public')

const viewsPath = path.join(__dirname, '../templates/views')

const partialsPath = path.join(__dirname, '../templates/partials')

// app.set('views', viewsPath)

// Set public path
app.use(express.static(publicPath))


// Sets Json Response
app.use(express.json())


// Imports Init routers
app.use(initRouter)


io.on('connection', (socket) => {

  socket.on('join', ({ username, room }, callback) => {

    const { error, user } = addUser({ id: socket.id, username, room })

    if (error) { return callback(error) }

    if (user.room) {

      socket.join(user.room)

      socket.emit('message', generateMessage('Admin', "Welcome"))

      socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))

      io.to(user.room).emit('roomData', {

        room: user.room,

        users: getUsersInRoom(user.room)

      })

    }

    callback()

  })

  socket.on('client-send-msg', (message, callback) => {

    const user = getUser(socket.id)

    if (user.room) {

      io.to(user.room).emit('message', generateMessage(user.username, message))

    }

    callback('Ok')

  })

  socket.on('sendLocation', (coords, callback) => {

    const user = getUser(socket.id)

    if (user.room) {

      io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))

    }

    callback()

  })

  socket.on('disconnect', x => {

    const user = removeUser(socket.id)

    if (user.room) {

      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))

      io.to(user.room).emit('roomData', {

        room: user.room,

        users: getUsersInRoom(user.room)

      })

    }

  })

})


// Listening Server 
server.listen(port, () => {

  console.log(chalk.yellow('\n\nInitializing Server...'));

  console.log(`Server is starting on port ${port}`);

})