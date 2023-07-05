const axios = require('axios')

const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT || 'http://localhost:3000'

async function main () {
    try {
        // check for arguments
        if (process.argv.length < 4) {
            return console.log('Error: arguments are missing, usage: node cli.js {TOKEN} http://example.com [id]')
        }

        // set the headers object of the request, with token
        const headers = {
            token: process.argv[2]
        }
        // create request body object
        const data = {
            url: process.argv[3]
        }
        // if id was given, append to request body object
        if (process.argv.length > 4) {
            data.id = process.argv[4]
        }

        // make request to API for submitting the URL
        const response = await axios.post(SERVER_ENDPOINT, data, {headers})
        console.log(`${SERVER_ENDPOINT}/${response.data.id}`)
    } catch (err) {
        let error = err.message
        // if error is from axios, get the response body
        if (err.response && err.response.data.error) {
            error = err.response.data.error
        }
        console.log(`Error: ${error}`)
    }
}

main()
