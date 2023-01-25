const express = require('express')
const session = require('express-session')
const Twitter = require('twitter')
const passport = require('passport')
const TwitterStrategy = require('passport-twitter').Strategy
const app = express()

// Use the express-session middleware to enable session support
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: true
}))

passport.use(new TwitterStrategy({
        consumerKey: 'your_consumer_key',
        consumerSecret: 'your_consumer_secret',
        callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, cb) {
        // Save the user's access token and secret to the session
        req.session.access_token_key = token;
        req.session.access_token_secret = tokenSecret;
        // Save the user's profile information to your database here
        // ...
        return cb(null, profile);
    }
));

app.use(passport.initialize());

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        failureRedirect: '/login'
    }),
    function(req, res) {
        // Successful authentication, redirect to the family tree page.
        res.redirect('/family-tree');
    });

app.get('/family-tree', (req, res) => {
    const {
        username
    } = req.user.username; // Assumes user has already logged in with their Twitter account
    // Initialize the Twitter module with the user's access token and secret from the session
    const client = new Twitter({
        consumer_key: 'your_consumer_key',
        consumer_secret: 'your_consumer_secret',
        access_token_key: req.session.access_token_key,
        access_token_secret: req.session.access_token_secret
    })

    // Get top 2 accounts with the most likes from the user
    client.get('favorites/list', {
        screen_name: username
    }, (error, data) => {
        if (error) {
            res.send(error)
        } else {
            const parents = data.slice(0, 2) // Get the first 2 accounts in the list

            // Get most interacted account
            client.get('friends/list', {
                screen_name: username
            }, (error, data) => {
                if (error) {
                    res.send(error)
                } else {
                    const spouse = data[0] // Assumes the first account in the list is the most interacted with

                    // Get two recent replies
                    client.get('search/tweets', {
                        q: `to:${username}`,
                        count: 2
                    }, (error, data) => {
                        if (error) {
                            res.send(error)
                        } else {
                            const children = data.statuses // Get the two most recent tweets that are replies
                            // Generate the family tree image using the parent, spouse, and children data
                            // ...

                            res.send(familyTreeImage)
                        }
                    })
                }
            })
        }
    })
})

app.listen(3000, () => {
    console.log('Server listening on port 3000')
})