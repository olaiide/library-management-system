const redis = require("redis");

const client = redis.createClient();

client.on("error", (err) => console.log("Redis Client Error", err));
const connectRedis = async () => {
  try {
    await client.connect();
    console.log("Connected to Redis");
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = { client, connectRedis };
