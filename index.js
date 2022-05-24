const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

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

async function run() {
    try {
        await client.connect()
        const toolsCollection = client.db('tools-maker').collection('tools')
        const profileCollection = client.db('tools-maker').collection('profile')
        const reviewsCollection = client.db('tools-maker').collection('reviews')

        //get all tools
        //https://morning-ocean-16366.herokuapp.com/tools
        app.get('/tools', async (req, res) => {
            const result = await toolsCollection.find({}).limit(4).toArray()
            res.send(result)
        })
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

        app.post('/profile', async (req, res) => {
            const data = req.body
            const result = await profileCollection.insertOne(data)
            res.send(result)
        })

        app.get('/profile/:email', async (req, res) => {
            const email = req.params.email
            const result = await toolsCollection.find({ email }).toArray()
            console.log(result)
            res.send(result)
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
