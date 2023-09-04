import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routers/userRouter.js';
import chatRouter from './routers/chatRouter.js';

const port = 4000;

// enable cors
app.use(cors());
const app = express();
dotenv.config();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

mongoose.set('strictQuery', true);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log('connecte to db ');
  })
  .catch((error) => {
    console.log(error.message);
  });

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.use('/', chatRouter);
app.use('/', userRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ success: false, message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`listening to ${port}`);
});
