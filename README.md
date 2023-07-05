# URL shortner

Tiny web server used for shortening URLs that comes with a cli tool for submitting URLs that need to be shortened.
It supports in-memory storage and Redis.

## Installation
1. Clone the repository `git clone https://github.com/3dprogramin/url-shortner`
2. Install dependencies `cd url-shortner ; npm i`
3. Setup environment variables such as `TOKEN`
4. Run the server `cd bin ; node server.js`

## Submit

Run `node cli.js YOUR_TOKEN https://google.com`

Optionally, you can specify the id for the shortening `node cli.js YOUR_TOKEN https://google.com sushi`

The cli will return the shortened URL or an error.

## Configuration

The web server accepts the following environment variables as configuration:
- `TOKEN` - used for validation of requests **(required)**
- `PORT` - port on which the web server will run, default: `3000` (optional)
- `ID_LENGTH` - length of the id for generating the shortened URLs, default: `3` (optional)
- `STORAGE` - which type of storage to use, supported: `redis` or `memory`, default: `memory` (optional)

The cli tool accepts only one environment variable:
- `SERVER_ENDPOINT` - point this to the URL that's server by the webserver, default: `http://localhost:3000` (optional)
