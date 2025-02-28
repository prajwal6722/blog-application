const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const Post = require('./models/post');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/blogDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Home route - Display all posts
app.get('/', async (req, res) => {
    const posts = await Post.find({});
    res.render('home', { posts: posts });
});

// Route to display the form for creating a new post
app.get('/compose', (req, res) => {
    res.render('compose');
});

// Route to handle the creation of a new post
app.post('/compose', async (req, res) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content
    });
    await post.save();
    res.redirect('/');
});

// Route to display a single post
app.get('/posts/:postId', async (req, res) => {
    const post = await Post.findById(req.params.postId);
    res.render('post', { post: post });
});

// Route to display the form for editing a post
app.get('/edit/:postId', async (req, res) => {
    const post = await Post.findById(req.params.postId);
    res.render('edit', { post: post });
});

// Route to handle the update of a post
app.post('/edit/:postId', async (req, res) => {
    await Post.findByIdAndUpdate(req.params.postId, {
        title: req.body.title,
        content: req.body.content
    });
    res.redirect('/');
});

// Route to handle the deletion of a post
app.post('/delete/:postId', async (req, res) => {
    await Post.findByIdAndDelete(req.params.postId);
    res.redirect('/');
});

const PORT = 8012;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});