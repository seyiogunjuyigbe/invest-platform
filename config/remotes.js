const dev = process.env.NODE_ENV === 'development';
const { PORT, NODE_ENV, MONGO_URL } = process.env;
module.exports = {
  dev,
  PORT,
  NODE_ENV,
  MONGO_URL,
};
