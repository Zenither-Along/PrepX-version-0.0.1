const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password || password.length < 6 || username.length < 3) {
        return res.status(400).json({ msg: 'Please enter a username of at least 3 characters and a password of at least 6 characters.' });
    }

    try {
        let user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length > 0) {
            return res.status(400).json({ msg: 'This username is already taken. Please choose another one.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, passwordHash]
        );

        const payload = { user: { id: newUser.rows[0].id } };

        if (!process.env.JWT_SECRET) {
            console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
            return res.status(500).json({ msg: 'Server configuration error: JWT secret not set.' });
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) {
                    console.error('JWT Signing Error:', err);
                    return res.status(500).json({ msg: 'Server error during token creation.' });
                }
                res.status(201).json({ token, user: newUser.rows[0] });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error during registration.' });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ msg: 'Please provide username and password.' });
    }

    try {
        let user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Incorrect username or password. Please check your credentials and try again.' });
        }
        
        const foundUser = user.rows[0];
        const isMatch = await bcrypt.compare(password, foundUser.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect username or password. Please check your credentials and try again.' });
        }

        const payload = { user: { id: foundUser.id } };
        
        if (!process.env.JWT_SECRET) {
            console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
            return res.status(500).json({ msg: 'Server configuration error: JWT secret not set.' });
        }
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) {
                    console.error('JWT Signing Error:', err);
                    return res.status(500).json({ msg: 'Server error during token creation.' });
                }
                res.json({ token, user: { id: foundUser.id, username: foundUser.username } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error during login.' });
    }
});

// @route   GET api/auth
// @desc    Get logged in user from token
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await db.query('SELECT id, username FROM users WHERE id = $1', [req.user.id]);
        if(user.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;