# Welcome
Atlas is an E-Commerce Backend API that provides services for:

- User Accounts
- Contents (think of it as a mini CMS)
- Products
- Collections (group of Products, Contents, Users)
- Carts
- Checkouts
- Orders

It was built with the [Yoonic E-Commerce Storefront](https://github.com/yoonic/nicistore) application in mind and you can check it out live powering [NICI Store](https://nicistore.com)!

> Why build plugins when you can build your own e-commerce platform?

## Requirements

- Node.js + NPM
- [Rethinkdb](http://rethinkdb.com/)
- [Yoonic Storefront](https://github.com/yoonic/nicistore) (optional)

## Installation
In order to setup, run and start hacking the app locally you just have to:

1. Clone this repository
2. `npm install`
3. Start rethinkdb server and, in a browser, navigate to http://localhost:8080/#tables (RethinkDB admin)
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

At this point, you should be have your local deploy of Atlas running on http://localhost:8000 and can point your local deploy of Storefront to it.

### Admin Account
In order to access Storefront's Admin and perform certain API calls, an Administrator account is required.

1. Create an account (either via the API or Storefront)
2. In a browser, navigate to http://localhost:8080/#dataexplorer
3. Run the following query `r.db('atlas').table('Users').filter({email: '{YOUR_USER_EMAIL}'}).update({status: 'active', scope: ['admin']});` (don't forget to replace `{YOUR_USER_EMAIL}` with the email address of the account you created)

## Contacts
Comments, suggestions, doubts, flames, /dev/random > http://twitter.com/andreftavares
