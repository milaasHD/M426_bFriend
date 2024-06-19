const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const mariadb = require('mariadb');
const session = require('express-session')

app.use(session({
    secret: 'keyboard cat',            // Secret string used to sign the session ID cookie
    resave: false,                     // Do not save the session back to the store if it hasn't been modified
    saveUninitialized: true,           // Save new sessions even if they are uninitialized
    cookie: { secure: true }           // Only send the cookie over HTTPS connections
}))

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'bFriend_DB',
    port: 3307
});

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.post('/status', async (req, res) => {
    const { accountId, paymentConfirmation } = req.body;

    try {
        const conn = await pool.getConnection();
        const [user] = await conn.query("SELECT * FROM Account WHERE Account_ID = ?", [accountId]);

        if (!user) {
            conn.release();
            return res.status(404).json({ error: 'User not found' });
        }

        if (!paymentConfirmation) {
            conn.release();
            return res.status(400).json({ error: 'Payment not confirmed' });
        }

        await conn.commit();

        conn.release();

        res.status(200).json({ message: 'User status changed successfully', user });
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    }
});

app.put('/account/payment', async (req, res) => {
    const { accountId, paymentData } = req.body;

    if (!accountId || !paymentData || !paymentData.cardHolder || !paymentData.cardNumber || !paymentData.securityCode || !paymentData.expiryDate) {
        return res.status(400).json({ error: 'Invalid payment data' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // Retrieve Card_ID from Account_ID
        const [accountCardInfo] = await conn.query("SELECT Card_ID FROM Account_Card_Info WHERE Account_ID = ?", [accountId]);
        if (!accountCardInfo) {
            return res.status(404).json({ error: 'Card information not found for the given account ID' });
        }

        const cardId = accountCardInfo.Card_ID;

        // Update card info
        await conn.query("UPDATE Card_Info SET Card_Holder = ?, Card_Number = ?, Security_Code = ?, Card_ExpiryDate = ? WHERE Card_ID = ?",
            [paymentData.cardHolder, paymentData.cardNumber, paymentData.securityCode, paymentData.expiryDate, cardId]);

        await conn.commit();

        res.status(200).json({ message: 'Payment data updated successfully' });
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }
});

app.get('/account/:id', async (req, res) => {
    const accountId = req.params.id;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT * FROM Account WHERE Account_ID = ?", [accountId]);
        console.log(result);
        res.status(200).json(result);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        try {
            if (conn) await conn.release();
        } catch (releaseErr) {
            console.error('Error releasing connection:', releaseErr);
        }
    }
});

app.get('/account/:id', async (req, res) => {
    const accountId = req.params.id;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT * FROM Account WHERE Account_ID = ?", [accountId]);

        if (result.length === 0) {
            res.status(404).json({ error: 'No account found with the provided ID' });
            return;
        }

        res.status(200).json(result);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        try {
            if (conn) await conn.release();
        } catch (releaseErr) {
            console.error('Error releasing connection:', releaseErr);
        }
    }
});

app.delete('/account', async (req, res) => {
    const accountId = req.body
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM Account WHERE Account_ID = ?", [accountId]);
        console.log(result);
        res.sendStatus(204)
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }
});


app.get('/accounts', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT * FROM account;");
        console.log(result);
        res.json(result);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }
});

app.get('/account/interests/:id', async (req, res) => {
    const accountId = req.params.id;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT * FROM Account_Interests WHERE Account_ID = ?", [accountId]);
        console.log(result);
        res.status(200).json(result)
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }
})

app.delete('/account/interests/:id/:interest_id', async (req, res) => {
    const account_id = req.params.id;
    const interest_id = req.params.interest_id;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM Account_Interests WHERE Account_ID = ? AND Interests_ID = ?", [account_id, interest_id]);
        res.sendStatus(204);  // No content response
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }
});

app.get('/interests', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT * FROM Interests;");
        res.status(200).json(result);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }
});

app.get('/interest/:id', async (req, res) => {
    const interest_id = req.params.id;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT * FROM Interests WHERE Interests_ID = ?", [interest_id]);
        console.log(result);
        res.status(200).json(result);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        try {
            if (conn) await conn.release();
        } catch (releaseErr) {
            console.error('Error releasing connection:', releaseErr);
        }
    }
});

app.delete('/interest/:id', async (req, res) => {
    const interest_id = req.params.id;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM Interests WHERE Interests_ID = ?", [interest_id]);
        res.sendStatus(204)
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }
});


app.get('/login', async (req, res) => {
    let username = req.query.username;
    let password = req.query.password;

    let conn;
    let result;
    try {
        conn = await pool.getConnection();
        result = await conn.query("SELECT * FROM account;");
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }

    // Find the customer based on username
    let customer = result.find((customer) => customer.Username === username);
    console.log('Found customer:', customer);

    if (customer) {
        if (password === customer.Password) {
            req.session.authorition = true
            return res.status(200).send(customer);
        } else {
            return res.status(401).send('Incorrect password');
        }
    } else {
        console.log(`Customer with username ${username} not found.`);
        return res.sendStatus(404);
    }
});


app.post('/register', async (req, res) => {
    let newData = req.body;

    let conn;
    let result;
    try {
        conn = await pool.getConnection();
        result = await conn.query("SELECT * FROM account;");
        let customer = result.find((customer) => customer.Username === newData.Username);
        if (customer === undefined) {
            const sql = "INSERT INTO Account (Username, `Name`, Lastname, `Description`, Subscription_ID, `Password`, Admin_Rights, Mode_ID) VALUES (?,?,?,?,?,?,?,?);"
            const values = [newData.Username, newData.Name, newData.Lastname, newData.Description, newData.Subscription_ID, newData.Password, newData.Admin_Rights, newData.Mode_ID]
            await conn.query(sql, values);
        }
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).send(err.message);
    } finally {
        if (conn) await conn.release();
    }
    res.send().status(200)
});

app.patch('/account/:id', async (req, res) => {
    const id = req.params.id;
    const replacer = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const [user] = await conn.query("SELECT * FROM Account WHERE Account_ID = ?", [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const keys = Object.keys(replacer);
        const values = Object.values(replacer);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const sql = `UPDATE Account SET ${setClause} WHERE Account_ID = ?`;
        values.push(id);

        await conn.query(sql, values);
        const [updatedUser] = await conn.query("SELECT * FROM Account WHERE Account_ID = ?", [id]);
        res.json(updatedUser);

    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (conn) await conn.release();
    }
});


module.exports = pool;
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
