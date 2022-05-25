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

        //get all tools
        //https://morning-ocean-16366.herokuapp.com/tools
        app.get('/tools', async (req, res) => {
            const result = await toolsCollection.find({}).limit(4).toArray()
            res.send(result)
        })
        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await toolsCollection.findOne(filter)
            res.send(result)
        })
        app.get('/singleOrder', async (req, res) => {
            const id = req.query.id
            const filter = { _id: ObjectId(id) }
            const requestedOrder = await orderCollection.findOne(filter)
            res.send(requestedOrder)
        })

        app.patch('/updateSignleOrder', async (req, res) => {
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

        app.post('/addProducts', async (req, res) => {
            const products = req.body
            const result = await toolsCollection.insertOne(products)
            res.send(result)
        })

        // app.put('/tools/:id', async (req, res) => {
        //     const id = req.params.id
        //     const data = req.body
        //     const filter = { _id: ObjectId(id) }
        //     const updateDoc = {
        //         $set: {
        //             available: data.available,
        //         },
        //     }
        //     const result = await toolsCollection.updateOne(filter, updateDoc)
        //     res.send(result)
        // })

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
        app.patch('/updateProfile', async (req, res) => {
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

        app.get('/updateProfile', async (req, res) => {
            const email = req.query.email
            const result = await profileCollection.findOne({ email })
            res.send(result)
        })
        app.get('/profile/:email', async (req, res) => {
            const email = req.params.email
            const result = await toolsCollection.find({ email }).toArray()
            res.send(result)
        })

        app.post('/purchaseProduct', async (req, res) => {
            const orderedItem = req.body
            const result = await orderCollection.insertOne(orderedItem)
            res.send(result)
        })
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
