const mongoose = require("mongoose");
const validator = require('validator')
const bcrypt=require('bcryptjs');
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique:true,
        required: true,
        trim: true,
        lowercase: true,
        validate(val) {
            if (!validator.isEmail(val)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(val) {
            if (val.toLowerCase().includes('password')) {
                throw new Error("password can't contain password")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(val) {
            if (val < 0)
                throw new Error("age must bepositive number")
        }
    },

    tokens:[{
        token: {
            type:String,
            required:true
        }
    }],

    avatar: {
        type: Buffer
    }
},
{
    timestamps:true
});

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

//private data handling toJSON inbuilt method
userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject;
}

//this is for specific user
userSchema.methods.generateAuthToken = async function(){
     const user = this
     const token = jwt.sign({ _id: user._id.toString() },process.env.JWT_SECRET)

     user.tokens = user.tokens.concat({token})
     await user.save()
     
     return token 
}


//this is for all User collection
userSchema.statics.findByCredentials = async (email,password) =>{
       
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to log in')
    }

    const isMatch = await bcrypt.compare(password,user.password)

    if(!isMatch){
        throw new Error('Unable to log in')
    }
   
    return user
}


//hash plain text password before saving
userSchema.pre('save',async function(next){
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
        console.log(user.password+"bjhbjkbkjhj")
    }

    next()
})


//Delete user's task when user is delete
userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({owner:user._id})
    next()
})
const User = mongoose.model('User', userSchema)

module.exports = User