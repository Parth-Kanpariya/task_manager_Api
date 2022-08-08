const express = require('express');
//npm run dev ==starting nodemon
//require mongoose to connect with db
require('./db/mongoose')

//import router
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')




const app = express()
const port = process.env.PORT 


const multer = require('multer')
const upload = multer({
    dest: 'images'
})

app.post('/upload',upload.single('upload'),(req, resp) =>{
    resp.status(201).send()
})

//for sending and getting json data
app.use(express.json())

app.use(userRouter)
app.use(taskRouter)




app.listen(port, () => {
    console.log('Server is set up on ' + port)
})

