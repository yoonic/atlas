# Welcome
Atlas is an E-Commerce Backend (RESTful) API.

It was built with the [Yoonic E-Commerce Storefront](https://github.com/yoonic/nicistore) application in mind and you can check it out live powering [NICI Store](https://nicistore.com/en)!

> Why write plugins when you can build your own e-commerce platform?

![Swagger API Documentation](/screenshots/SwaggerDocs.png?raw=true "Swagger API Documentation")

### API Resources
After deploying and running Atlas locally, you can access the [Swagger](https://openapis.org/) API Documentation by browsing to `localhost:8000/docs`.

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

### Batteries Included
- [Mailgun](https://mailgun.com) for transactional emails
- [Switch Payments](https://switchpayments.com) for payments

Storefront has a few more tricks up its sleeve ;)

## Requirements

- Node.js + NPM (v4.x LTS)
- [Rethinkdb](http://rethinkdb.com/)
- [Yoonic Storefront](https://github.com/yoonic/nicistore) (optional)

## Installation
In order to setup, run and start hacking the app locally you just have to:

1. Clone this repository
2. `npm install`
3. Start rethinkdb server and, in a browser, navigate to `http://localhost:8080/#tables` (RethinkDB admin)
4. Create a database named `atlas`
5. In that database, create the following tables:
  - `Carts`
  - `Checkouts`
  - `Collections`
  - `Contents`
  - `Orders`
  - `Products`
  - `Users`
7. Create a JWT secret key (e.g. using `openssl rand -base64 32`) and either:
  - Setup the env variable `JWT_KEY`
  - Add it to the configuration file at `config/development` in `app.jwtKey`
6. In the directory of the Atlas clone, run `npm run dev`

At this point, you should be have your local deploy of Atlas running on `http://localhost:8000` and can point your local deploy of Storefront to it.

### Admin Account
In order to access Storefront's Admin and perform certain API calls, an Administrator account is required.

1. Create an account (either via the API or Storefront)
2. In a browser, navigate to `http://localhost:8080/#dataexplorer`
3. Run the following query `r.db('atlas').table('Users').filter({email: '{YOUR_USER_EMAIL}'}).update({status: 'active', scope: ['admin']});` (don't forget to replace `{YOUR_USER_EMAIL}` with the email address of the account you created)

## Contacts
Comments, suggestions, doubts, flames, /dev/random, etc...
- Email **andre [at] yoonic.net**
- Twitter [@andreftavares](http://twitter.com/andreftavares)
