const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

//middleware
app.use(cors())
app.use(express.json())

// verify JWT token
const verifyJWT = (req, res, next) => {
    const clientToken = req.headers.authorization
    const requrestedUserEmail = req.query.email

    if (!clientToken) {
        return res
            .status(401)
            .send({ success: false, message: 'Unauthorized Access' })
    }

    const token = clientToken.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res
                .status(403)
                .send({ success: false, message: 'Forbidden Access' })
        }
        if (requrestedUserEmail !== decoded.email) {
            return res
                .status(401)
                .send({ success: false, message: 'Unauthorized Access' })
        }
        req.decoded = decoded

        next()
    })
}
//verify admin
const verifyAdmin = async (req, res, next) => {
    const requestedUserEmail = req.query.email

    const filter = { email: requestedUserEmail }
    const result = await profileCollection.findOne(filter)

    if (result?.role !== 'admin') {
        return res
            .status(401)
            .send({ success: false, message: 'Unauthorized Access' })
    }
    next()
}

//Main Api
//https://morning-ocean-16366.herokuapp.com/

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tdvbv.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
})

//Collections
const toolsCollection = client.db('tools-maker').collection('tools')
const profileCollection = client.db('tools-maker').collection('profile')
const reviewsCollection = client.db('tools-maker').collection('reviews')
const orderCollection = client.db('tools-maker').collection('orders')

async function run() {
    try {
        await client.connect()

        //get 4 tools
        //https://morning-ocean-16366.herokuapp.com/tools
        app.get('/tools', async (req, res) => {
            const result = await toolsCollection.find({}).limit(6).toArray()
            res.send(result)
        })

        // get all products
        app.get('/allTools', async (req, res) => {
            const result = await toolsCollection.find({}).toArray()
            res.send(result)
        })

        // delete one product
        app.delete(
            '/deleteOneProduct',
            verifyJWT,
            verifyAdmin,
            async (req, res) => {
                const id = req.query.id
                const filter = { _id: ObjectId(id) }
                const result = await toolsCollection.deleteOne(filter)
                res.send(result)
            }
        )

        //admin
        app.get('/isAdmin', async (req, res) => {
            const email = req.query.email
            const user = await profileCollection.findOne({ email })
            if (user?.role === 'admin') {
                return res.json({ isAdmin: true })
            }
            res.json({ isAdmin: false })
        })

        app.post('/getToken', (req, res) => {
            const email = req.body.email
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN)
            res.send({ accessToken: token })
        })
        //
        app.patch(
            '/updateDeliveryStatus',
            verifyJWT,
            verifyAdmin,
            async (req, res) => {
                const id = req.body.id
                const filter = { _id: ObjectId(id) }
                const updatedDoc = {
                    $set: {
                        deliveryStatus: true,
                    },
                }
                const result = await orderCollection.updateOne(
                    filter,
                    updatedDoc
                )
                res.send(result)
            }
        )
        app.get('/tools/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await toolsCollection.findOne(filter)
            res.send(result)
        })
        //
        app.get('/singleOrder', verifyJWT, async (req, res) => {
            const id = req.query.id
            const filter = { _id: ObjectId(id) }
            const requestedOrder = await orderCollection.findOne(filter)
            res.send(requestedOrder)
        })
        app.get('/allOrders', async (req, res) => {
            const result = await orderCollection.find({}).toArray()
            res.send(result)
        })

        // get users orders
        //
        app.get('/UsersOrders', verifyJWT, async (req, res) => {
            const email = req.query.email
            const orders = await orderCollection.find({ user: email }).toArray()
            res.send(orders)
        })
        //
        app.patch('/updateSignleOrder', verifyJWT, async (req, res) => {
            const transactionId = req.body.transactionId
            const id = req.query.id
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId,
                },
            }
            const result = await orderCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.post('/addProducts', verifyJWT, verifyAdmin, async (req, res) => {
            const products = req.body
            const result = await toolsCollection.insertOne(products)
            res.send(result)
        })
        app.delete(
            '/deleteOneOrder',
            verifyJWT,

            async (req, res) => {
                const id = req.query.id
                const filter = { _id: ObjectId(id) }
                const result = await orderCollection.deleteOne(filter)
                res.send(result)
            }
        )

        //get all reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find({}).toArray()
            res.send(result)
        })
        //post reviews
        app.post('/reviews', async (req, res) => {
            const data = req.body
            const result = await reviewsCollection.insertOne(data)
            res.send(result)
        })
        //
        app.put('/profile', async (req, res) => {
            const user = req.body
            const { email } = user
            const filter = { email }
            const option = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await profileCollection.updateOne(
                filter,
                updateDoc,
                option
            )
            res.send(result)
        })
        //
        app.patch('/updateProfile', verifyJWT, async (req, res) => {
            const email = req.query.email
            const { phone, education, image } = req.body
            const filter = { email }
            const updateDoc = {
                $set: {
                    education,
                    phone,
                    image,
                },
            }
            const result = await profileCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        //
        app.get('/getProfile', verifyJWT, async (req, res) => {
            const email = req.query.email
            const user = await profileCollection.findOne({ email })
            res.send(user)
        })

        app.get('/profile/:email', async (req, res) => {
            const email = req.params.email
            const result = await toolsCollection.find({ email }).toArray()
            res.send(result)
        })
        //
        app.get('/profile', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email
            const result = await profileCollection.find({}).toArray()
            res.send(result)
        })
        //
        app.patch('/makeAdmin', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.body.id
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: 'admin',
                },
            }
            const result = await profileCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        // delete user
        //
        app.delete(
            '/deleteOneUser',
            verifyJWT,
            verifyAdmin,
            async (req, res) => {
                const id = req.query.id
                const filter = { _id: ObjectId(id) }
                const result = await profileCollection.deleteOne(filter)
                res.send(result)
            }
        )
        //
        app.post('/purchaseProduct', verifyJWT, async (req, res) => {
            const orderedItem = req.body
            const result = await orderCollection.insertOne(orderedItem)
            res.send(result)
        })
        //purchaseProduct
        app.get('/purchaseProduct', async (req, res) => {
            const user = req.query.user
            const filter = { user }
            const result = await orderCollection.find(filter).toArray()
            res.send(result)
        })

        //payment
        app.post('/create-payment-intent', async (req, res) => {
            if (!req.body.price || !process.env.STRIPE_SECRET_KEY) {
                return
            }
            const price = parseFloat(req.body.price) * 100

            const paymentIntent = await stripe.paymentIntents.create({
                amount: price,
                currency: 'usd',
            })

            res.send({
                clientSecret: paymentIntent.client_secret,
            })
        })
    } finally {
        //
    }
}
run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`server running on port ${port}`)
})
