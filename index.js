const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require("mongodb").ObjectId;
const SSLCommerzPayment = require('sslcommerz')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretPass = 'SfrgiefeGefgMewtA'
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');


const app = express();
const port = process.env.PORT || 7050;
const fileUpload = require('express-fileupload');

//Middle Ware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mvbo5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// SSLCommerz payment
// const SSLCommerzPayment = require('sslcommerz')

async function run() {
    try {
        await client.connect();
        const database = client.db('sigma_central');
        const commonityCollection = database.collection('commonity');
        const userCollection = database.collection('users');
        const adminCollection = database.collection('admin_panel');
        const patientsCollection = database.collection('patients');
        const doctorCollection = database.collection('doctors');
        const medicineCollection = database.collection('medicine');
        const prescriptionCollection = database.collection('prescription');
        // const userOrder = database.collection('user_order');
        
        // Create collection
        const orderCollection = client.db("paymentssl").collection("orders");

        //SSLCommerz Payment initialization Api
        app.post('/init', async (req, res) => {
            const data = {
            total_amount: req.body.total_amount,
            currency: 'BDT',
            tran_id: uuidv4(),
            success_url: 'http://localhost:7050/success',
            fail_url: 'http://localhost:7050/fail',
            cancel_url: 'http://localhost:7050/cancel',
            ipn_url: 'http://localhost:7050/ipn',
            paymentStatus: 'pending',
            shipping_method: 'Courier',
            product_name: req.body.product_name,
            product_category: 'Electronic',
            product_profile: req.body.product_profile,
            cus_name: req.body.cus_name,
            cus_email: req.body.cus_email,
            cus_add1: 'Dhaka',
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: '01711111111',
            cus_fax: '01711111111',
            ship_name: 'Customer Name',
            ship_add1: 'Dhaka',
            ship_add2: 'Dhaka',
            ship_city: 'Dhaka',
            ship_state: 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
            multi_card_name: 'mastercard',
            value_a: 'ref001_A',
            value_b: 'ref002_B',
            value_c: 'ref003_C',
            value_d: 'ref004_D'
         };

        // Insert order info
        const result = await orderCollection.insertOne(data);

        const sslcommer = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWORD,false) //true for live default false for sandbox
        sslcommer.init(data).then(data => {
        //process the response that got from sslcommerz 
        //https://developer.sslcommerz.com/doc/v4/#returned-parameters
        // console.log(data);
        const info = { ...productInfo, ...data }
            // console.log(info.GatewayPageURL);
        if (info.GatewayPageURL) {
            res.json(info.GatewayPageURL)
        }
        else {
            return res.status(200).json({
                message: "SSL session was not successful"
            })
        }
    });
})

    app.post("/success", async (req, res) => {

     const result = await orderCollection.updateOne({ tran_id: req.body.tran_id }, {
            $set: {
                val_id: req.body.val_id
            }
        })

        res.redirect(`http://localhost:3000/success/${req.body.tran_id}`)

    })
    app.post("/fail", async (req, res) => {
        const result = await orderCollection.deleteOne({ tran_id: req.body.tran_id })

     res.redirect(`http://localhost:3000/home`)
    })
    app.post("/cancel", async (req, res) => {
        const result = await orderCollection.deleteOne({ tran_id: req.body.tran_id })

        res.redirect(`http://localhost:3000/home`)
    })

    app.post("/ipn", (req, res) => {
        console.log(req.body)
        res.send(req.body);
    })

    app.post('/validate', async (req, res) => {
        const result = await orderCollection.findOne({
            tran_id: req.body.tran_id
        })

        if (result.val_id === req.body.val_id) {
            const update = await orderCollection.updateOne({ tran_id: req.body.tran_id }, {
                $set: {
                    paymentStatus: 'Payment Complete'
                }
            })
            console.log(update);
            res.send(update.modifiedCount > 0)

        }
        else {
            res.send("Payment didn't Complete")
        }

    })

    app.get('/orders/:tran_id', async (req, res) => {
        const id = req.params.tran_id;
        const result = await orderCollection.findOne({ tran_id: id })
     res.json(result)
    })


        // Get Service API
        app.get('/commonity', async (req, res) => {
            const cursor = commonityCollection.find({});
            const commonity = await cursor.toArray();
            res.send(commonity);
        });
        /*======================================================
                        Doctors Section Starts
        ========================================================*/
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

        // delete a single doctor
        app.delete('/doctors/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await doctorCollection.deleteOne(query);
            res.send(result);
        })

        // update doctor api
        app.put('/updateDoctor/:id', async (req, res) => {
            console.log("body", req.body);
            console.log("files", req.files);
            const id = req.params.id;
            const { name, experience, birthday, gender, phone, speciality, email, twitter, linkedin, facebook, address, eduLine1, eduLine2, eduLine3, awardFirst, awardSecond, awardThird, title, description, day, time, shift, skill1, skill2, skill3, percent1, percent2, percent3, moto } = req.body;

            const image = req.files.image.data;
            const encodedImg = image.toString('base64');
            const imageBuffer = Buffer.from(encodedImg, 'base64');

            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateFile = {
                $set: {

                    name: name,
                    experience: experience,
                    birthday: birthday,
                    gender: gender,
                    phone: phone,
                    speciality: speciality,
                    email: email,
                    twitter: twitter,
                    linkedin: linkedin,
                    facebook: facebook,
                    address: address,
                    eduLine1: eduLine1,
                    eduLine2: eduLine2,
                    eduLine3: eduLine3,
                    awardFirst: awardFirst,
                    awardSecond: awardSecond,
                    awardThird: awardThird,
                    title: title,
                    description: description,
                    day: day,
                    time: time,
                    shift: shift,
                    skill1: skill1,
                    skill2: skill2,
                    skill3: skill3,
                    percent1: percent1,
                    percent2: percent2,
                    percent3: percent3,
                    moto: moto,
                    photo: imageBuffer

                },
            };
            const result = await doctorCollection.updateOne(filter, updateFile, options)
            res.send(result);
        })
        /*======================================================
                        Doctors Section Ends
        ========================================================*/
        /*======================================================
                        Medicine Section Starts
        ========================================================*/
        // post medicine api
        app.post('/medicine', async (req, res) => {
            const medicine = req.body;
            const result = await medicineCollection.insertOne(medicine);
            res.send(result);
        })

        // Medicine Api
        app.get('/medicine', async (req, res) => {
            const medicine = medicineCollection.find({});
            const result = await medicine.toArray();
            res.send(result);
        });

        // post prescription api
        app.post('/prescription', async (req, res) => {
            const prescription = req.body;
            const result = await prescriptionCollection.insertOne(prescription);
            res.send(result);
        })

        // get all prescription data
        app.get('/prescription', async (req, res) => {
            const allprescription = prescriptionCollection.find({});
            const result = await allprescription.toArray();
            res.send(result);
        })
        /*======================================================
                        Medicine Section Ends
        ========================================================*/
        /*======================================================
                        Admin Panel Section Starts
        ========================================================*/
        // Doctor Account Created By Admin
        app.post('/adminSign', async (req, res) => {
            const { adminName, avatar, email, passWord, role } = req.body;
            if (!email || !passWord || !adminName || !role)
            {
                return res.status(422).json({ error: "All Input Fields Are Reqired" })
            }
            const adminPanel = await adminCollection.findOne({ email: email })
            if (adminPanel)
            {
                return res.status(422).json({ error: "This Admin Panel Member Already Exists" })
            }
            const securePassWord = await bcrypt.hash(passWord, 12)
            await new Admin({
                adminName: adminName,
                email: email,
                passWord: securePassWord,
                photoURL: avatar,
                role: role,
            }).save()
            res.status(200).json({ message: "Hay Admin! New Admin Panel Member Successfully Added! Please Login" })
        });
        // Doctor login Api
        app.post('/adminlogin', async (req, res) => {
            const { email, passWord } = req.body;
                if (!email || !passWord) {
                    return res.status(422).json({error: "All Input Fields Are Reqired"})
                }
            const doctor = await adminCollection.findOne({ role: "doctor" })
                if (!doctor) {
                   return res.status(422).json({error: "Sorry! This Doctor Doesn't Exists."})
                }
            const match = await bcrypt.compare(passWord, doctor.passWord)
                if (match) {
                    const role = jwt.sign({ role: user.role }, secretPass)
                    return res.status(201).json({role})
                } else {
                    return res.status(401).json({error: "Email Or Password is Invalid."})
                }
        })
        // Login Require
        const requireLogin = (req, res, next) => {
            const { authorization } = req.headers
            if (!authorization) {
                return res.status(401).json({ error: "Sorry! You must be logged in" })
            }
            const { role } = jwt.verify(authorization, secretPass)
            req.user = role
            next()
        };

        /*======================================================
                        Admin Panel Section Ends
        ========================================================*/
        /*======================================================
                        User Section Starts
        ========================================================*/
        // Get patients From Database
        app.get('/patients', async (req, res) => {
            const cursor = patientsCollection.find({});
            const patients = await cursor.toArray();
            res.send(patients);
        });

        // Get Users From Database
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });
        // Create Users By Email PassWord [Firebase]
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            console.log(result);
            res.json(result)
        });
        // Create And Update Users by Google Login [Firebase]
        app.put('/users', async (req, res) => {
            const user = req.body;
            const find = { email: user.email };
            const option = { upsert: true };
            const updateDoc = { $set: user }
            const result = await userCollection.updateOne(find, updateDoc, option);
            res.json(result)
        });
        /*======================================================
                        Users Section Ends
        ========================================================*/
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