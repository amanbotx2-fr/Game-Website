const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const chessRoutes = require('./routes/chess');

app.use(cors());
app.use(express.json());

app.use('/chess', chessRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gamehub-backend' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
