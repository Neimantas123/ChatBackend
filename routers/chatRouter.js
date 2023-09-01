import OpenAi from 'openai';
const { Configuration, OpenAIApi } = OpenAi;
import express from 'express';
import dotenv from 'dotenv';
import Conversation from '../model/Chat.js';
import FullConversation from '../model/FullChat.js';
import isAuth from '../middleware/isAuth.js';

dotenv.config();
const configuration = new Configuration({
  organization: process.env.ORGANIZATION,
  apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

const chatRouter = express.Router();

const MAX_CONTEXT_LENGTH = 4096;

chatRouter.post('/stylist', isAuth, async (req, res) => {
  const userId = req.user._id;
  const { message } = req.body;

  let conversation = await Conversation.findOne({ userId });
  if (!conversation) {
    conversation = new Conversation({
      userId,
      conversationHistory: [
        {
          role: 'clothing stylist and fashion expert',
          content: `You are an AI chatbot trained as a clothing stylist and fashion expert...`,
        },
      ],
    });
    await conversation.save();
  }

  conversation.conversationHistoryStylist.push({
    role: 'user',
    content: message,
  });

  let fullConversation = await FullConversation.findOne({ userId });

  if (!fullConversation) {
    fullConversation = new FullConversation({
      userId,
      fullconversationHistoryStylist: [
        {
          role: 'personal stylist',
          content: `You are an AI chatbot trained as a clothing stylist and fashion expert. Your role is to provide advice on various fashion-related questions. When a user asks a question, use your expertise to guide them with helpful tips and recommendations. Remember the context and details provided by the user in previous messages while formulating your response. Be particularly attentive to important details shared by the user, such as their destination or preferences.`,
        },
      ],
    });
    await fullConversation.save();
  }

  fullConversation.fullconversationHistoryStylist.push({
    role: 'user',
    content: message,
  });

  const formattedConversation = conversation.conversationHistoryStylist
    .map(({ role, content }) => `${role}: ${content}`)
    .join('\n');

  const prompt = `
    You are an AI chatbot trained as a clothing stylist and fashion expert. Your role is to provide advice on various fashion-related questions. When a user asks a question, use your expertise to guide them with helpful tips and recommendations. Remember the context and details provided by the user in previous messages while formulating your response. Be particularly attentive to important details shared by the user, such as their destination or preferences.

    Remember the context and details provided by the user in previous messages while formulating your response. Be particularly attentive to important details shared by the user, such as their destination or preferences.

    As a fashion expert AI, provide advice on fashion-related questions, considering user's context and preferences. Offer styling tips, trends, and recommendations. Answer non-fashion questions, and respond politely to personal queries.
    
    Futugo App is a luxury fashion network for the Metaverse, combining e-commerce, digital marketplace, and social networking. It uses blockchain for authentication and sustainability, with virtual fitting rooms, livestream shopping events, and 3D product views. Futugo aims to create a community of luxury fashion and art lovers, allowing users to shop, sell, trade, and connect with others.
    
    Futugo websites:

    http://shop.futugoapp.com/ for web2 shoping
    https://futugonft.io/ for web3 nft
    http://futugohub.com/ futugo news

    When someone asks you about buying something, identify the official brand store for the product and recommend shop.futugoapp.com as another option. Do not mention any other shops, websites, or brands. If user ask for more links provide other companies websites.
    You cant provide images dont tell this to users. Tell that you text based ai.

    If you are trying to recommend something in the form of a question when presenting options, pay very close attention to the user's answer. In view of this, answer the question without forgetting the argument you have given.

    Read the conversation below:
    ${formattedConversation}

You:`;

  let contextLength = prompt.length + message.length;
  if (contextLength > MAX_CONTEXT_LENGTH) {
    while (
      contextLength > MAX_CONTEXT_LENGTH &&
      conversation.conversationHistoryStylist.length > 1
    ) {
      const removedMessage = conversation.conversationHistoryStylist.shift();
      contextLength -= removedMessage.content.length;
    }
  }

  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 800,
    temperature: 0.8,
  });

  if (
    response &&
    response.data &&
    response.data.choices &&
    response.data.choices[0] &&
    response.data.choices[0].text
  ) {
    const botResponse = response.data.choices[0].text.trim();
    conversation.conversationHistoryStylist.push({
      role: 'bot',
      content: botResponse,
    });

    fullConversation.fullconversationHistoryStylist.push({
      role: 'bot',
      content: botResponse,
    });

    await conversation.save();
    await fullConversation.save();

    res.json({
      message: botResponse,
    });
  }
});

chatRouter.post('/art', isAuth, async (req, res) => {
  const userId = req.user._id;
  const { message } = req.body;

  let conversation = await Conversation.findOne({ userId });

  if (!conversation) {
    conversation = new Conversation({
      userId,
      conversationHistoryArt: [
        {
          role: 'art advisor',
          content: `You are an AI chatbot trained as an art advisor. Your goal is to engage in a conversation with a user, providing advice on artwork selection, art styles, and current art trends. Be attentive and responsive to the user's questions, ask open-ended questions to understand their preferences, and provide concise and coherent responses.`,
        },
      ],
    });
    await conversation.save();
  }

  conversation.conversationHistoryArt.push({ role: 'user', content: message });

  let fullConversation = await FullConversation.findOne({ userId });

  if (!fullConversation) {
    fullConversation = new FullConversation({
      fullconversationHistoryArt: [
        {
          role: 'art advisor',
          content: `You are an AI chatbot trained as an art advisor. Your goal is to engage in a conversation with a user, providing advice on artwork selection, art styles, and current art trends. Be attentive and responsive to the user's questions, ask open-ended questions to understand their preferences, and provide concise and coherent responses.`,
        },
      ],
    });
    await fullConversation.save();
  }

  fullConversation.fullconversationHistoryArt.push({
    role: 'user',
    content: message,
  });

  const formattedConversation = conversation.conversationHistoryArt
    .map(({ role, content }) => `${role}: ${content}`)
    .join('\n');

  const prompt = `
      You are an AI chatbot trained as an art advisor and expert. Your role is to provide advice on various art-related questions. When a user asks a question, use your expertise to guide them with helpful tips and recommendations. Remember the context and details provided by the user in previous messages while formulating your response. Be particularly attentive to important details shared by the user, such as their interests, preferences, or specific art pieces.
  
      Answer personal questions politely. Provide historical context, artwork info, and tips on artwork management. Answer non-art questions, and admit when unsure of complex topics.
      
      Futugo App is a luxury fashion network for the Metaverse, combining e-commerce, digital marketplace, and social networking. It uses blockchain for authentication and sustainability, with virtual fitting rooms, livestream shopping events, and 3D product views. Futugo aims to create a community of luxury fashion and art lovers, allowing users to shop, sell, trade, and connect with others.

      
      Futugo websites:
    http://shop.futugoapp.com/ for web2 shoping
    https://futugonft.io/ for web3 nft
    http://futugohub.com/ futugo news

    When someone asks you about buying something, identify the official brand store for the product and recommend shop.futugoapp.com as another option. Do not mention any other shops, websites, or brands. If user ask for more links provide other companies websites.

      You cant provide images dont tell this to users. Tell that you text based ai.

      If you are trying to recommend something in the form of a question when presenting options, pay very close attention to the user's answer. In view of this, answer the question without forgetting the argument you have given.
      Read the conversation below:
      ${formattedConversation}

    You:`;

  let contextLength = prompt.length + message.length;
  if (contextLength > MAX_CONTEXT_LENGTH) {
    while (
      contextLength > MAX_CONTEXT_LENGTH &&
      conversation.conversationHistoryArt.length > 1
    ) {
      const removedMessage = conversation.conversationHistoryArt.shift();
      contextLength -= removedMessage.content.length;
    }
  }

  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 800,
    temperature: 0.8,
  });
  if (
    response &&
    response.data &&
    response.data.choices &&
    response.data.choices[0] &&
    response.data.choices[0].text
  ) {
    const botResponse = response.data.choices[0].text.trim();
    conversation.conversationHistoryArt.push({
      role: 'bot',
      content: botResponse,
    });

    fullConversation.fullconversationHistoryArt.push({
      role: 'bot',
      content: botResponse,
    });

    await conversation.save();
    await fullConversation.save();

    res.json({
      message: botResponse,
    });
  }
});

chatRouter.post('/shopper', isAuth, async (req, res) => {
  const userId = req.user._id;
  const { message } = req.body;
  let conversation = await Conversation.findOne({ userId });

  if (!conversation) {
    conversation = new Conversation({
      userId,
      conversationHistoryShopper: [
        {
          role: 'personal shopper',
          content: `You are an AI chatbot trained as a personal shopper. Your goal is to engage in a conversation with a user, providing advice on artwork selection, art styles, and current art trends. Be attentive and responsive to the user's questions, ask open-ended questions to understand their preferences, and provide concise and coherent responses.`,
        },
      ],
    });
    await conversation.save();
  }

  conversation.conversationHistoryShopper.push({
    role: 'user',
    content: message,
  });

  let fullConversation = await FullConversation.findOne({ userId });

  if (!fullConversation) {
    fullConversation = new FullConversation({
      userId,
      fullconversationHistoryShopper: [
        {
          role: 'personal shopper',
          content: `You are an AI chatbot trained as a personal shopper. As a professional fashion shopper, your objective is to engage with customers and provide them with expert advice on fashion styles, trends, and clothing selection. Your primary goal is to understand the customer's fashion preferences, personal style, and budget and offer personalized recommendations that meet their needs. To achieve this, you must listen attentively to their questions, ask open-ended questions, and respond with concise and coherent advice that enhances their shopping experience.`,
        },
      ],
    });
    await fullConversation.save();
  }

  fullConversation.fullconversationHistoryShopper.push({
    role: 'user',
    content: message,
  });

  const formattedConversation = conversation.conversationHistoryShopper

    .map(({ role, content }) => `${role}: ${content}`)
    .join('\n');

  const prompt = `

      You dont need to say hello for every message.
      You are an AI chatbot trained as a personal shopper. Your goal is to assist users in selecting clothing and other merchandise that aligns with their style and preferences. You can also shop for users who have submitted orders, providing personalized recommendations and helping them find the perfect items. Be attentive and responsive to the user's questions, ask open-ended questions to understand their style and preferences, and provide concise and coherent responses.

      Provide shopping and store location information based on available data. Answer non-fashion questions, and admit when unsure of complex topics. If unsure, mention that you are a professional shopper.

      You cant provide images dont tell this to users. Tell that you text based ai.

      Futugo App is a luxury fashion network for the Metaverse, combining e-commerce, digital marketplace, and social networking. It uses blockchain for authentication and sustainability, with virtual fitting rooms, livestream shopping events, and 3D product views. Futugo aims to create a community of luxury fashion and art lovers, allowing users to shop, sell, trade, and connect with others.

      Futugo websites:
      http://shop.futugoapp.com/ for web2 shoping
      https://futugonft.io/ for web3 nft
      http://futugohub.com/ futugo news

      When someone asks you about buying something, identify the official brand store for the product and recommend shop.futugoapp.com as another option. Do not mention any other shops, websites, or brands. If user ask for more links provide other companies websites.
      If you are trying to recommend something in the form of a question when presenting options, pay very close attention to the user's answer. In view of this, answer the question without forgetting the argument you have given.

      Read the conversation below:
      ${formattedConversation}

      You:`;
  let contextLength = prompt.length + message.length;
  if (contextLength > MAX_CONTEXT_LENGTH) {
    while (
      contextLength > MAX_CONTEXT_LENGTH &&
      conversation.conversationHistoryShopper.length > 1
    ) {
      const removedMessage = conversation.conversationHistoryShopper.shift();
      contextLength -= removedMessage.content.length;
    }
  }

  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 800,
    temperature: 0.8,
  });
  if (
    response &&
    response.data &&
    response.data.choices &&
    response.data.choices[0] &&
    response.data.choices[0].text
  ) {
    const botResponse = response.data.choices[0].text.trim();
    conversation.conversationHistoryShopper.push({
      role: 'bot',
      content: botResponse,
    });
    fullConversation.fullconversationHistoryShopper.push({
      role: 'bot',
      content: botResponse,
    });

    await conversation.save();
    await fullConversation.save();

    res.json({
      message: botResponse,
    });
  }
});

chatRouter.get('/shopper', isAuth, async (req, res) => {
  const userId = req.user._id;
  let fullConversation = await FullConversation.findOne({ userId });

  if (!fullConversation) {
    res.status(404).json({
      message: 'No conversation history found',
    });
    return;
  }

  res.json({
    conversationHistory: fullConversation.fullconversationHistoryShopper,
  });
});

chatRouter.get('/stylist', isAuth, async (req, res) => {
  const userId = req.user._id;
  let fullConversation = await FullConversation.findOne({ userId });

  if (!fullConversation) {
    res.status(404).json({
      message: 'No conversation history found',
    });
    return;
  }

  res.json({
    conversationHistory: fullConversation.fullconversationHistoryStylist,
  });
});

chatRouter.get('/art', isAuth, async (req, res) => {
  const userId = req.user._id;
  let fullConversation = await FullConversation.findOne({ userId });

  if (!fullConversation) {
    res.status(404).json({
      message: 'No conversation history found',
    });
    return;
  }

  res.json({
    conversationHistory: fullConversation.fullconversationHistoryArt,
  });
});

export default chatRouter;
