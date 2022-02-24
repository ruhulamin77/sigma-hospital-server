const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 7050;
const fileUpload = require('express-fileupload');


//Middle Ware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mvbo5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('sigma_central');
        const commonityCollection = database.collection('commonity');
        const userCollection = database.collection('users');
        const doctorCollection = database.collection('doctors');
        const medicineCollection = database.collection('medicine');
        // const userOrder = database.collection('user_order');

        // Get Service API
        app.get('/commonity', async (req, res) => {
            const cursor = commonityCollection.find({});
            const commonity = await cursor.toArray();
            res.send(commonity);
        });
        // post doctor api
        app.post('/addDoctor', async (req, res) => {
            const { name, experience, birthday, gender, phone, speciality, email, twitter, facebook, linkedin, address, eduLine1, eduLine2, eduLine3, awardFirst, awardSecond, awardThird } = req.body;
            const image = req.files.image.data;
            const encodedImg = image.toString('base64');
            const imageBuffer = Buffer.from(encodedImg, 'base64');
            const doctorInfo = {
                name, experience, birthday, gender, phone, speciality, email, twitter, facebook, linkedin, address, eduLine1, eduLine2, eduLine3, awardFirst, awardSecond, awardThird,
                photo: imageBuffer
            }
            const result = await doctorCollection.insertOne(doctorInfo);
            res.send(result);
        })

        // get all doctor 
        app.get('/doctors', async (req, res) => {
            const doctor = doctorCollection.find({});
            const result = await doctor.toArray();
            res.send(result);
        });
        // Medicine Api
        app.get('/medicine', async (req, res) => {
            const medicine = medicineCollection.find({});
            const result = await medicine.toArray();
            res.send(result);
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
    console.log("Sigma Central Hospital Server Port", port)
});