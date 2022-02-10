const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 7050;


//Middle Ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mvbo5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('sigma_central');
        const commonityCollection = database.collection('commonity');
        const userCollection = database.collection('users');
        // const userReview = database.collection('user_review');
        // const userOrder = database.collection('user_order');

        // Get Service API
        app.get('/commonity', async (req, res) => {
            const cursor = commonityCollection.find({});
            const commonity = await cursor.toArray();
            res.send(commonity);
        });
        
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Sigma Central Hospital Server Running');
});

app.listen(port, () => {
    console.log("Example App Port", port)
});