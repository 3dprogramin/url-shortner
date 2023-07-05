const Koa = require('koa')
const app = new Koa()
const bodyParser = require("koa-bodyparser")
const { createClient } = require('redis')
const redisClient = createClient()
const NodeCache = require( "node-cache" );
const cache = new NodeCache();
const randomString = require("randomstring")

// setup environment variables
const TOKEN = process.env.TOKEN
if (!TOKEN) {
    throw Error('environment variable TOKEN is missing')
}
const PORT = process.env.PORT || 3000
let ID_LENGTH = process.env.ID_LENGTH
if (ID_LENGTH) {
    ID_LENGTH = parseInt(ID_LENGTH)
    if (isNaN(ID_LENGTH)) throw Error('environment variable ID_LENGTH is not a number')
} else {
    ID_LENGTH = 3
}
const STORAGE = process.env.STORAGE === 'redis' ? 'redis' : 'memory'

/**
 * Enable body parser middleware
 */
app.use(bodyParser())

/**
 * Error handler
 */
app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        console.log(`Error: ${err.message}`)
        err.status = err.statusCode || err.status || 500
        ctx.body = {status: 'error', error: err.message}
    } finally {
        console.log(`${ctx.request.method} ${ctx.request.originalUrl} - ${ctx.response.status}`)
    }
})

/**
 * Routing
 */
app.use(async (ctx) => {
    if (ctx.method === 'GET') {
        await retrieve(ctx)
    } else if (ctx.method === 'POST') {
        await submit(ctx)
    } else {
        ctx.status = 400
        throw Error(`invalid HTTP method: ${ctx.method}`)
    }
})

/**
 * Submit a new URL into the storage
 * @param ctx
 * @returns {Promise<void>}
 */
async function submit (ctx) {
    // validate token
    const token = ctx.get('token')
    if (token !== TOKEN) {
        ctx.status = 403
        ctx.body = {error: 'access denied, token is missing'}
        return
    }
    // get and check the url
    const url = ctx.request.body.url
    if (!url) {
        ctx.status = 400
        throw Error('url is missing')
    }
    // check if id was given
    let id = ctx.request.body.id
    if (id) {
        // check if it exists in storage
        const data = await retrieveStorage(id)
        if (data) {
            ctx.status = 400
            throw Error('given id already exists')
        }
        await submitStorage(id, url)
        // respond to request
        ctx.body = {status: 'success', url, id}
        return
    }

    // generate a random id for it
    id = randomString.generate(ID_LENGTH)

    // make sure id does not exist in storage, retry if it exists for a few times
    let exists = true
    for(let i = 0; i < 5; i++) {
        const data = await retrieveStorage(id)
        if (!data) {
            exists = false
            break
        }
        id = randomString.generate(ID_LENGTH)
    }
    // if it still exists, throw error
    if (exists) {
        ctx.status = 400
        throw Error('id generation exhausted')
    }
    await submitStorage(id, url)
    // respond to request
    ctx.body = {status: 'success', url, id}
}

/**
 * Submit to storage, in-memory or redis
 * @returns {Promise<void>}
 */
async function submitStorage (id, url) {
    if (STORAGE === 'redis') {
        await redisClient.set(id, url)
    } else {
        cache.set(id, url)
    }
}

/**
 * Retrieve a URL from storage using id
 * @param ctx
 * @returns {Promise<void>}
 */
async function retrieve (ctx) {
    const id = ctx.originalUrl.replace('/', '')
    const url = await retrieveStorage(id)
    if (!url) {
        ctx.status = 400
        throw Error ('url with given id does not exist')
    }
    // we have a url with given id, redirect to it
    ctx.redirect(url)
}

/**
 * Retrieve from storage, in-memory or redis
 * @param id
 * @returns {Promise<void>}
 */
async function retrieveStorage (id) {
    if (STORAGE === 'redis') {
        return redisClient.get(id)
    } else {
        return cache.get(id)
    }
}

async function main () {
    if (STORAGE === 'redis') {
        await redisClient.connect()
        console.log('[+] Redis DB connected')
    } else {
        console.log('[+] In-memory storage')
    }
    await app.listen(PORT)
    console.log(`[+] HTTP server running on http://127.0.0.1:${PORT}`)
}

main()
