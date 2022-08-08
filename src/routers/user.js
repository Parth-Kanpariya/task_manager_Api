const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../model/user')


//post req for user
router.post('/users', async(req, resp) => {

    const user = new User(req.body)


    try {
       await user.save()
       const token = await user.generateAuthToken()
        resp.status(201).send({ user , token })

    } catch (e) {
        resp.status(400).send(e)
    }
})

//login user
router.post('/user/login',async (req,resp)=>{
        try{

            const user = await User.findByCredentials(req.body.email,req.body.password)
            const token = await user.generateAuthToken()
            resp.send({ user, token })

        }catch(e){
            resp.status(400).send()

        }
})

//read data from databse
router.get('/users/me',auth, async(req, resp) => {

   resp.status(201).send(req.user)


})

//log out from user
router.post('/users/logout',auth , async(req, resp) =>{
    try{
        req.user.tokens = req.user.tokens.filter((token) =>{
            return token.token !== req.token
        })

        await req.user.save()
        resp.send()
    }catch(e){
        resp.status(500).send()
    }
})

//log out from all user
router.post('/users/logoutAll', auth, async(req, resp)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        resp.send()
    }catch(e){
        resp.status(500).send()
    }
})

    //update the data by id
router.patch('/users/me',auth, async(req, resp) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return resp.status(400).send({ err: 'Invalid updates!' })
    }


    try {

        updates.forEach((update)=>req.user[update] = req.body[update])

        await req.user.save()

        resp.status(201).send(req.user)

    } catch (e) {
        resp.status(400).send(e)
    }
})

//delete data from user
router.delete('/users/me',auth, async(req, resp) => {
    try {
       
        await req.user.remove()
        resp.status(201).send(req.user)

    } catch (e) {
        resp.status(500).send(e)
    }
})

//upload images to the server
const upload = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png )$/)){
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('upload'),async (req, resp) =>{
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    resp.status(201).send()
},(error, req, resp, next)=>{ 
    resp.status(201).send({error: error.message})
})

//delete user profile
router.delete('/users/me/avatar', auth, async(req, resp) => {
    req.user.avatar = undefined
    await req.user.save()
    resp.status(201).send()
})

//server/get the user avatar
router.get('/users/:id/avatar',  async(req, resp) => {
     try{
         const user = await User.findById(req.params.id)

         if(!user || !user.avatar)
         {
            throw new Error()
         }
         resp.set('Content-Type', 'image/png')
         resp.send(user.avatar)
     }catch(e){
        resp.status(404).send()
     }
})


module.exports = router