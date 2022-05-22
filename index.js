const express = require('express')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const cors = require('cors')

//Main Api
//https://morning-ocean-16366.herokuapp.com/
app.use(express.json())
app.use(cors())

const { MongoClient, ServerApiVersion } = require('mongodb')
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
        app.get('/tools', async (req, res) => {
            const result = await toolsCollection.find({}).toArray()
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
    console.log(`Example app listening on port ${port}`)
})
