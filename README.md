# Welcome
Atlas is an E-Commerce RESTful API.

Pair it with [Yoonic E-Commerce Storefront](https://github.com/yoonic/nicistore) and you'll have your own e-commerce website running on NodeJS!

You can check out a live example at the [NICI Store](https://nicistore.com/en)

![Swagger API Documentation](http://i.imgur.com/WENl84g.png "Swagger API Documentation")

## Features
Overall, Atlas provides services for:
- User Accounts
- Contents
  - Homepage Banners
  - Articles
  - Content common to all Product Pages
  - ... <-- Whatever you wish :)
- Products
- Collections
  - Products
  - Contents
  - Customers
  - ... <-- Your own segmentation engine!
- Carts
- Checkouts
- Orders

## Batteries Included
- [Mailgun](https://mailgun.com) for transactional emails
- [Switch Payments](https://switchpayments.com) for payments

Storefront has a few more tricks up its sleeve ;)

## Requirements

- [Node.js](https://nodejs.org) (v4.x LTS) + NPM 
- [Rethinkdb](http://rethinkdb.com/)

### Optional
- [Yoonic Storefront](https://github.com/yoonic/nicistore) 

## Installation
You can install it locally or use the [Docker](https://www.docker.com/) setup.

### Locally
1. Clone this repository
`git clone https://github.com/yoonic/atlas.git`
2. Install the dependencies
`cd atlas && npm install`
3. Install and Start [Rethinkdb](https://www.rethinkdb.com/) server 
- Navigate to `http://localhost:8080/#tables` (RethinkDB admin)
- Create a database named `atlas`
- In that database, create the following tables:
  - `Carts`
  - `Checkouts`
  - `Collections`
  - `Contents`
  - `Orders`
  - `Products`
  - `Users`
4. Create a JWT secret key (e.g. using `openssl rand -base64 32`) and either:
  - Setup the env variable `JWT_KEY`
  - Add it to the configuration file at `config/development` in `app.jwtKey`
5. Run it!
`npm run dev`

At this point, you should be have your local deploy of Atlas running on `http://localhost:8000` 

### Docker
1. Download and install [Docker](https://docs.docker.com/engine/installation/)
2. Clone this repository
`git clone https://github.com/yoonic/atlas.git`
3. Change directory to Atlas
`cd atlas`
4. Create a JWT secret key (e.g. using `openssl rand -base64 32`) and either:
  - Setup the env variable `JWT_KEY`
  - Add it to the configuration file at `config/development` in `app.jwtKey`
5. Change the *NODE_ENV* variable in *.env* to either *prod* or *dev*
6. Run Docker Compose
`docker-compose up -d`
7. Check Kitematic to see the status of your containers, it should be running on `http://localhost:8000` 

**Note:** Docker will save content to the docker/data folder.
## Usage
After deploying and running Atlas locally, you can access the [Swagger](https://openapis.org/) API Documentation by browsing to `localhost:8000/docs`.

### Admin Account
In order to access Storefront's Admin and perform certain API calls, an Administrator account is required.

1. Create an account (either via the API or Storefront)
2. In a browser, navigate to `http://localhost:8080/#dataexplorer`
3. Run the following query `r.db('atlas').table('Users').filter({email: '{YOUR_USER_EMAIL}'}).update({status: 'active', scope: ['admin']});` (don't forget to replace `{YOUR_USER_EMAIL}` with the email address of the account you created)

## Contacts
Comments, suggestions, doubts, flames, /dev/random, etc...
- Email **andre [at] yoonic.net**
- Twitter [@andreftavares](http://twitter.com/andreftavares)
