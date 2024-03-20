const { MongoClient } = require('mongodb');

const url = 'mongodb://mongo:27017'; 
const dbName = 'myApp'; 

let db;

const connectDB = async () => {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  await client.connect();
  console.log('Connected successfully to MongoDB');
  db = client.db(dbName);
};

const getDB = () => {
  if (!db) {
    throw Error('DB not initialized');
  }
  return db;
};

module.exports = { connectDB, getDB };
