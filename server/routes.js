const express = require('express')
const products = require('./products.json')
const validateCartItems =
  require('use-shopping-cart/utilities').validateCartItems
const stripe = require('stripe')(process.env.STRIPE_API_SECRET)

module.exports = function getRoutes() {
  const router = express.Router()
  router.get('/products', getProducts)
  router.get('/products/:productId', getProduct)
  router.post('/checkout-session', createCheckoutSession)
  router.get('/checkout-session/:sessionId', getCheckoutSession)

  return router
}
async function getCheckoutSession(req, res) {
  const { sessionId } = req.params
  try {
    if (!sessionId.startsWith('cs_')) {
      throw new Error('Not valid session')
    }
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    res.status(200).json(checkoutSession)
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

function getProducts(req, res) {
  res.status(200).json({ products })
}

function getProduct(req, res) {
  const { productId } = req.params
  const product = products.find((product) => product.id === productId)
  try {
    if (!product) {
      throw new Error(`Product Not Found with id: ${productId} `)
    }
    res.status(200).json({ product })
  } catch (err) {
    res.status(404).send({ statusCode: 404, message: err.message })
  }
}

async function createCheckoutSession(req, res) {
  try {
    const cartItems = req.body
    // console.log(cartItems, products)
    const line_items = validateCartItems(products, cartItems)
    // console.log(line_items)
    const origin =
      process.env.NODE_ENV === 'production'
        ? process.env.PRODUCTION_URL
        : process.env.DeVELOPMENT_URL

    const params = {
      submit_type: 'pay',
      payment_method_types: ['card'],
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      line_items,
      success_url: `${origin}/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: origin,
      mode: 'payment',
    }

    const checkoutSession = await stripe.checkout.sessions.create(params)
    console.log(checkoutSession)
    res.status(200).json(checkoutSession)
  } catch (err) {
    console.log(err)
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}
