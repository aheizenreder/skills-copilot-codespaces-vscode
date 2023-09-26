// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { randomBytes } = require('crypto');
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Store comments
const commentsByPostId = {};

// Get all comments for a post
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create a comment for a post
app.post('/posts/:id/comments', async (req, res) => {
  // Generate random id
  const commentId = randomBytes(4).toString('hex');
  // Get the content of the comment from the request body
  const { content } = req.body;
  // Get the post id from the request params
  const postId = req.params.id;

  // Get the comments for the post id or empty array
  const comments = commentsByPostId[postId] || [];

  // Push the new comment to the array
  comments.push({ id: commentId, content, status: 'pending' });

  // Store the comments for that post id
  commentsByPostId[postId] = comments;

  // Emit an event to the event bus
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId,
      status: 'pending',
    },
  });

  // Send the comments
  res.status(201).send(comments);
});

// Handle events from the event bus
app.post('/events', async (req, res) => {
  console.log('Event received', req.body.type);

  // Get the type and data from the request body
  const { type, data } = req.body;

  // Check if the event type is CommentModerated
  if (type === 'CommentModerated') {
    // Get the comment id, post id, content and status from the event data
    const { id, postId, content, status } = data;

    // Get the comments for the post id
    const comments = commentsByPostId[postId];

    // Get the comment that was moderated
    const comment = comments.find((comment) => {
      return comment.id === id;
    });

    // Set