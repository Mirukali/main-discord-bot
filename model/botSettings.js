const mongodb = require('mongodb');
const { MONGO_HOST, MONGO_USERNAME, MONGO_PASSWORD, MONGO_PORT, NODE_ENV } = process.env;

const mongoUrl = `mongodb://${encodeURIComponent(MONGO_USERNAME)}:${encodeURIComponent(MONGO_PASSWORD)}@${encodeURIComponent(MONGO_HOST)}:${encodeURIComponent(MONGO_PORT)}/?authMechanism=DEFAULT&authSource=admin`;

let db;
async function connectDB() {
  const dbClient = await mongodb.MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  if (NODE_ENV === 'development') {
    db = dbClient.db('beta');
  } else {
    db = dbClient.db('bot');
  }

  return db;
}

module.exports = db;
