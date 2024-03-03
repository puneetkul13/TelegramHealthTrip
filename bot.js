const token = '6900819057:AAH3ita5vqwtRP7rZh9_yF--qdztAGJ4qgw';
let TelegramBot = require('node-telegram-bot-api');
let bot = new TelegramBot(token, { polling: true });
const axios = require('axios');
// Matches "/echo [whatever]"
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/BOT', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
// const {MessageFrequency, ApiKey} = require('./bot');
const {MessageFrequency, ApiKey} = require('./app');
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});
const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true
  },
  name: String,
  city: String,
  country: String,
  isDeleted: {
    type: Boolean,
    default: false
  },
});
const User = mongoose.model('User', userSchema);
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  console.log(userId)
  const existingUser = await User.findOne({ userId });
  if (existingUser && existingUser.isDeleted) {
    await bot.sendMessage(userId, 'This user is blocked from the system');
    return;
  }
  if (!existingUser) {
    // If not registered, ask for user information
    await bot.sendMessage(userId, 'Welcome! Please provide your name:');
  } else {
    // If already registered, you can handle this case accordingly
    await bot.sendMessage(userId, 'You are already registered.');
  }
});

bot.on('text', async (msg) => {

  const userId = msg.from.id;
  const text = msg.text;
  console.log(text, " text")
  if (text === '/start') {
    return;
  }
  const existingUser = await User.findOne({ userId });
  if (existingUser && existingUser.isDeleted) {
    await bot.sendMessage(userId, 'This user is blocked from the system');
    return;
  }
  if (existingUser) {
    // Handle responses for registered users if needed
    // For example, you can implement logic based on the received text
    if (!existingUser.city) {
      await User.updateOne({ userId }, { city: text })
      await bot.sendMessage(userId, 'Thanks! Now, please provide your country:');
      return
    }
    if (!existingUser.country) {
      await User.updateOne({ userId }, { country: text })
      await bot.sendMessage(userId, 'Thanks! Now, you are registered')
      return
    }

  }

  // Handle responses for new users
  if (!existingUser) {
    const newUser = new User({ userId, name: text });
    await newUser.save();
    await bot.sendMessage(userId, 'Thanks! Now, please provide your city:');
    return
  }
  return;
});

setInterval(async () => {
  const users = await User.find();

  users.forEach(async (user) => {
    try {
      if(user.isDeleted){
        await bot.sendMessage(user.userId, "This user is blocked from the system");
      }
      else{
      console.log(ApiKey)
      let ApiKeys = await ApiKey.find()
      ApiKeys = ApiKeys[0]
      const apiUrl = 'http://api.weatherapi.com/v1/current.json';
      const apiKey = ApiKeys.key;
      
      const requestData = {
        locations: [
          {
            q: user.city,
            custom_id: 'any-internal-id',
          }
        ],
      };
      let weatherResponse
      await axios.post(`${apiUrl}?key=${apiKey}&q=bulk`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          weatherResponse = response.data.bulk[0].query.current.temp_c
          console.log('Response:', response.data);
        })
        .catch(error => {
          console.error('Error:', error.response ? error.response.data : error.message);
        });
      console.log(weatherResponse)
      const message = `Good morning, ${user.name}! Weather update for ${user.city}, ${user.country}: Temperature is ${weatherResponse}°C.`;
      await bot.sendMessage(user.userId, message);}
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
    }
  });
}, 24*60*60*1000);

module.exports = User;