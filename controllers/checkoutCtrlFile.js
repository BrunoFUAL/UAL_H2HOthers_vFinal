const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { productList } = require('../products.js')
const path = require('path');
const { AsyncResource } = require('async_hooks');
const Email = require('../utils/email.js');

exports.checkoutCtrlFunction = async (req, res) => {
    try {
      const productsFromFrontend = req.body.products;
      // console.log(productList);
  
      function productsToBuy() {
        let products = [];
        
        productList.forEach( singleProductList => {
          productsFromFrontend.forEach(singleProductFrontend => {
            if( singleProductList.tag === singleProductFrontend.tag ) {
              products.push({
                name: singleProductList.name,
                description: singleProductList.description,
                images: [singleProductList.image],
                amount: singleProductList.price * 100,
                currency: 'eur',
                quantity: singleProductFrontend.inCart
              })
            }
          })
        })
  
        return products
      }
  
      console.log(productsToBuy())

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/cart`,
        shipping_address_collection: {
          allowed_countries: ['US', 'GB', 'PT']
        },
        line_items: productsToBuy()
      });
      
  
      res.status(200).json({
        status: "success",
        session: session
      })
    } catch (error) {
      console.log(error);
    }
  }

exports.cartSuccessFunction = async (req,res) => {
    res.render(path.join(__dirname, '../public/views/thankyouPage.hbs'));
}

exports.finishOrder = async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(
        req.params.id, {
            expand: ['line_items']
        })
  
    console.log("My payment was: ");
    console.log(session);
  
    if(session.payment_status === "paid") {
        console.log(session.line_items)
      const purchasedProducts = session.line_items.data.map(product => (
        {
          productName: product.description,
          price: product.amount_subtotal / 100,
          quantity: product.quantity
      }
      ))


       //send an e-mail 
       await new Email({
        name: session.shipping.name,
        email: session.customer_details.email
      }, purchasedProducts, session.amount_total).sendThankYou();


      return res.status(200).json({
        success: true
      })
    }
  
    res.status(200).json({
      success: false
    })
  }
