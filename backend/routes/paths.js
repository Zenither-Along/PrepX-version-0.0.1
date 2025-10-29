const express = require('express');
const db = require('../db');
const router = express.Router();

// @route   GET api/paths
// @desc    Get all paths for a user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                id, 
                title, 
                is_major as "isMajor", 
                columns_data as columns, 
                created_at as "createdAt"
            FROM learning_paths WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST api/paths
// @desc    Create a new path
// @access  Private
router.post('/', async (req, res) => {
    const { title, columns, isMajor } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO learning_paths (user_id, title, columns_data, is_major, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id, title, is_major as "isMajor", columns_data as columns, created_at as "createdAt"`,
            [req.user.id, title, JSON.stringify(columns), !!isMajor]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT api/paths/:id
// @desc    Update a path
// @access  Private
router.put('/:id', async (req, res) => {
    const { title, columns } = req.body;
    try {
        const result = await db.query(
            `UPDATE learning_paths
             SET title = $1, columns_data = $2, updated_at = NOW()
             WHERE id = $3 AND user_id = $4
             RETURNING id, title, is_major as "isMajor", columns_data as columns, created_at as "createdAt"`,
            [title, JSON.stringify(columns), req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Path not found or user not authorized' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE api/paths/:id
// @desc    Delete a path
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM learning_paths WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Path not found or user not authorized' });
        }
        res.json({ msg: 'Path deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST api/paths/:id/set-major
// @desc    Set a path as the major path
// @access  Private
router.post('/:id/set-major', async (req, res) => {
    try {
        // This should be done in a transaction to ensure atomicity
        await db.query('BEGIN');
        // First, unset any existing major path for the user
        await db.query(
            'UPDATE learning_paths SET is_major = false WHERE user_id = $1 AND is_major = true',
            [req.user.id]
        );
        // Then, set the new major path
        const result = await db.query(
            'UPDATE learning_paths SET is_major = true WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        await db.query('COMMIT');
        
        if (result.rowCount === 0) {
            await db.query('ROLLBACK'); // Rollback if the target path wasn't found
            return res.status(404).json({ msg: 'Path not found or user not authorized' });
        }
        
        res.json({ msg: 'Major path updated successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;