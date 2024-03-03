const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
mongoose.connect('mongodb://localhost/BOT', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const User = require('./bot');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});
const apiKeySchema = new mongoose.Schema({
    key: String,
    description: String,
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

app.get('/manageApiKeys', async (req, res) => {
    const apiKeys = await ApiKey.find();
    res.json({ data: apiKeys, status: 200 })
});

app.post('/addApiKey', async (req, res) => {
    const { key, description } = req.body;
    let apikey = await ApiKey.create({ key, description });
    res.json({ data: apikey, status: 200 })
});

const messageFrequencySchema = new mongoose.Schema({
    userId: Number,
    frequencyLimit: Number,
});
const MessageFrequency = mongoose.model('MessageFrequency', messageFrequencySchema);
app.get('/manageMessageFrequency', async (req, res) => {
    const messageFrequencies = await MessageFrequency.find();
    res.json({ data: messageFrequencies, status: 200 })
});

app.post('/setMessageFrequency', async (req, res) => {
    let { userId, frequencyLimit } = req.body;
    userId = parseInt(userId)
    const user = await User.findOne({userId})
    if(!user || user.isDeleted){
        return res.json({ data: "No user with the given id found", status: 200 })
    }
    const existingRecord = await MessageFrequency.findOne({ userId });
    
    if (existingRecord) {
        await MessageFrequency.updateOne({ userId }, { frequencyLimit });
    } else {
        await MessageFrequency.create({ userId, frequencyLimit });
    }
    const existingRecord1 = await MessageFrequency.findOne({ userId });
    res.json({ data: existingRecord1, status: 200 })
});

app.post('/blockUser', async (req, res) => {
    let { userId } = req.body;
    userId = parseInt(userId)
    const user = await User.findOne({userId})
    if(!user){
        return res.json({ data: "No user with the given id found", status: 200 })
    }
    const res1 =await User.updateOne({ userId }, { isDeleted:true });
    
    res.json({ data: res1, status: 200 })
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
module.exports = {ApiKey, MessageFrequency}

