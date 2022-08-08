const express = require('express')
const router = new express.Router()
const Task = require('../model/task')
const auth = require('../middleware/auth')

//post request for task
router.post('/task',auth, async(req, resp) => {
    const task = new Task({
        ...req.body,
        owner:req.user._id
    })

    try {
        await task.save()
        resp.status(201).send(task)
    } catch (e) {
        resp.status(404).send(e)
    }


})

//read from task
//GET /tasks?completed=false
//GET /tasks?limit=10&skip=20
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async(req, resp) => {
    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        // await req.user.populate({
        //     path:'tasks',
        //     match,
        //     option:{
        //        limit:parseInt(req.query.limit),
        //        skip:parseInt(req.query.skip)
        //     },
        //    sort
        // }).execPopulate()
        // resp.status(201).send(req.user.tasks)
        const tasks = await Task.find({owner:req.user._id,completed: match.completed})
        resp.status(201).send(tasks)
    } catch (err) {
        resp.status(500).send()
    }
})


//read specific task
router.get('/task/:id',auth, async(req, resp) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        if (!task) {
            return resp.status(404).send()
        }
        resp.status(201).send(task)
    } catch (err) {
        resp.status(500).send()

    }
})

//update the data by id
router.patch('/task/:id',auth, async(req, resp) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return resp.status(400).send({ err: 'Invalid updates!' })
    }


    try {
        const task = await Task.findOne({_id:req.params.id, owner: req.user._id})

        if (!task) {
            return resp.status(404).send()
        }

        updates.forEach((update)=>task[update] = req.body[update])
         
        await task.save()
        resp.status(201).send(task)

    } catch (e) {
        resp.status(400).send()
    }
})

//delete data from user
router.delete('/tasks/:id',auth, async(req, resp) => {
    try {
        const task = await Task.findOneAndDelete({_id : req.params.id , owner: req.user._id})

        if (!task) {
            return resp.status(404).send()
        }
        resp.status(201).send(task)

    } catch (e) {
        resp.status(500).send(e)
    }
})

module.exports = router