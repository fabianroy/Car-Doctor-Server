const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3000;
const env = require('dotenv').config();

// middle wire

const corsOptions = {
    origin: ['http://localhost:5173', 'https://car-doctor-fcd38.web.app', 'https://car-doctor-fcd38.firebaseapp.com'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const logger = async (req, res, next) => {
    console.log('Request received', req.host, req.originalUrl);
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('Token:', token);
    
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized Access! No token provided.' });
    }
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(401).send({ message: 'Unauthorized Access! Invalid token.' });
        }
        
        console.log('Decoded Token:', decoded);
        req.user = decoded;
        next();
    });
};

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.he28ix7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const serviceCollection = client.db("CarDoctor").collection("services");
        const bookCollection = client.db("CarDoctor").collection("bookings");
        const userCollection = client.db("CarDoctor").collection("users");

        // auth related api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true, // http://localhost:5173/login
                    sameSite: 'none',
                })
                .send({ success: true });
        })

        // log out related api

        app.post('/logout', logger, async (req, res) => {
            const user = req.body;
            console.log('logging out:', user)
            res.clearCookie('token', {maxAge:0}).send({success: true})
        });

        // Services
        app.get('/services', logger, async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const options = {
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            }

            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        });

        // Bookings

        app.get('/bookings', logger, verifyToken, async (req, res) => {
            // console.log('token', req.cookies.token);

            if(req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'Forbidden! You are not allowed to access this resource.' });
            }

            let query = {}
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await bookCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/bookings', async (req, res) => {
            const order = req.body;
            const result = await bookCollection.insertOne(order);
            res.json(result);
        });

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                }
            }
            const result = await bookCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookCollection.deleteOne(query);
            res.json(result);
        });

        // users 

        app.get('/users', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.findOne(query);
            res.send(result);
        });


        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.json(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});