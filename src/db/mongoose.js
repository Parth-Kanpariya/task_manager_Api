const mongoose = require("mongoose");


//here new model means new table (collection) in databse


mongoose.connect(process.env.MONGODB_URL, {

    useUnifiedTopology: true

})