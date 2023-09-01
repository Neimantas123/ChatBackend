import express from 'express';
import User from '../model/User.js';
import bcrypt from 'bcrypt';
import expressAsyncHandler from 'express-async-handler';
import Mailgun from 'mailgun-js';
import jwt from 'jsonwebtoken';

const userRouter = express.Router();

userRouter.post(
  '/login',
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: '30d',
        });

        res.send({
          _id: user._id,
          email: user.email,
          token,
          message: 'You have logged in',
        });
        return;
      }
    }
    res.status(401).send({ message: 'Invalid email or password' });
  })
);

userRouter.post(
  '/register',
  expressAsyncHandler(async (req, res) => {
    try {
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(req.body.password, salt);

      const newUser = new User({
        email: req.body.email,
        password: hash,
      });
      const user = await newUser.save();
      res.send({
        _id: user._id,
        email: user.email,
      });
    } catch (err) {
      console.log(err);
    }
  })
);

userRouter.post(
  '/google-login',
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });
      res.send({
        _id: user._id,
        email: user.email,
        token,
      });
    } else {
      try {
        const newUser = new User({
          email: req.body.email,
        });
        const user = await newUser.save();

        // Create a token for the new user
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: '30d',
        });

        res.send({
          _id: user._id,
          email: user.email,
          token,
        });
      } catch (err) {
        console.log(err);
        res.status(400).send({
          message: 'Failed to create a new user.',
        });
      }
    }
  })
);

userRouter.put('/name', async (req, res) => {
  const { email, userName } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    user.name = userName;
    await user.save();
    res.send({ message: 'Name added' });
    return;
  } else {
    res.status(404).send({ message: 'User not found' });
  }
});

userRouter.post('/find-name', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  res.send(user);
  console.log(user);
});

userRouter.get('/check-email/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const data = await User.findOne({ email });
    res.send({ exists: data !== null });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal server error');
  }
});

userRouter.put(
  '/resetpassword',
  expressAsyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      user.password = bcrypt.hashSync(newPassword, 8);
      await user.save();

      res.send({ message: 'Password updated successfully' });
      return;
    }
    res.status(404).send({ message: 'User not found' });
  })
);

userRouter.post(
  '/send-reset-code',
  expressAsyncHandler(async (req, res) => {
    console.log('Received request body:', req.body);
    const email = req.body.email;
    console.log('Email:', email);

    try {
      const user = await User.findOne({ email });
      console.log('User:', user);

      if (user) {
        const code = generateVerificationCode();
        user.resetCode = code;
        await user.save(); // Save the generated code in the user's document
        sendEmail(email, code);
        res.send({ success: true, message: 'Reset code sent' });
        console.log(
          'Status Code: 200. Response Body: { success: true, message: "Reset code sent" }'
        );
      } else {
        res.status(400).send({ success: false, message: 'Email not found' });
        console.log(
          'Status Code: 400. Response Body: { success: false, message: "Email not found" }'
        );
      }
    } catch (error) {
      console.error('Error in /send-reset-code:', error);
      res
        .status(500)
        .send({ success: false, message: 'Internal server error' });
      console.log(
        'Status Code: 500. Response Body: { success: false, message: "Internal server error" }'
      );
    }
  })
);

userRouter.post(
  '/verify-reset-code',
  expressAsyncHandler(async (req, res) => {
    const { email, code } = req.body;
    console.log('Submitted email:', email);

    try {
      const user = await User.findOne({ email });

      if (!user) {
        res.status(404).send({ success: false, message: 'User not found' });
        return;
      }

      console.log('User reset code:', user.resetCode);
      console.log('Submitted code:', code);
      console.log('User reset code type:', typeof user.resetCode);
      console.log('Submitted code type:', typeof code);

      if (user.resetCode.toString() === code.toString()) {
        res.send({ success: true, message: 'Code verified' });
      } else {
        res
          .status(400)
          .send({ success: false, message: 'Invalid verification code' });
      }
    } catch (error) {
      console.error('Error in /verify-reset-code:', error);
      res
        .status(500)
        .send({ success: false, message: 'Internal server error' });
    }
  })
);

function generateVerificationCode() {
  return Math.floor(1000 + Math.random() * 9000);
}

function sendEmail(email, code) {
  const mailgun = Mailgun({
    apiKey: '1337ec5c77ade2048b4822716099b21c-b36d2969-139a7adc',
    domain: 'sandboxd9714d42dcdc44a1b3ccfaaf65b43a54.mailgun.org',
  });

  const data = {
    from: 'Futugo <no-reply@futugo.com>',
    to: email,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}`,
  };

  mailgun.messages().send(data, (error, body) => {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent:', body);
    }
  });
}

export default userRouter;
