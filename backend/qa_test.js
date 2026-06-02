const API_URL = 'http://localhost:5050/api/v1';

async function runTests() {
  console.log("Starting QA Test Suite...");
  
  let userToken = '';
  let adminToken = '';
  
  // 1. Setup / Auth
  try {
      const adminLoginRaw = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: 'admin@clothingweb.com', password: 'Admin@1234' })
    });
    const adminLoginTxt = await adminLoginRaw.text();
    let adminLoginRes = {};
    try { adminLoginRes = JSON.parse(adminLoginTxt); } catch (e) { console.log('Login failed parsing:', adminLoginTxt); }
    
    if(!adminLoginRes.token) {
       console.log('Failed to login admin. Attempting to register...');
       const adminResRaw = await fetch(`${API_URL}/auth/register`, {
         method: 'POST', headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ name: 'Admin QA', email: 'admin@clothingweb.com', password: 'Admin@1234', role: 'admin' })
       });
       const aData = await adminResRaw.json();
       adminToken = aData.token;
    } else {
       adminToken = adminLoginRes.token;
    }
    console.log(adminToken ? '✅ Admin authenticated' : '❌ Admin auth failed');

    const userLoginRaw = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
    });
    const userLoginTxt = await userLoginRaw.text();
    let userLoginRes = {};
    try { userLoginRes = JSON.parse(userLoginTxt); } catch (e) { console.log('User login failed parsing:', userLoginTxt); }
    
    if(!userLoginRes.token) {
       const userRes = await fetch(`${API_URL}/auth/register`, {
         method: 'POST', headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ name: 'User QA', email: 'user@example.com', password: 'password123', role: 'user' })
       });
       const uData = await userRes.json();
       userToken = uData.token;
    } else {
       userToken = userLoginRes.token;
    }
    console.log(userToken ? '✅ User authenticated' : '❌ User auth failed');
    
  } catch(err) {
    console.error("Auth failed", err);
    return;
  }

  // 2. Product Creation (Admin)
  let productId;
  try {
    const productPayload = {
      name: 'QA Test Product GST Inclusive',
      description: 'A product to test GST',
      brand: 'Mason',
      gender: 'women',
      type: 'dress',
      originalPrice: 1000,
      discount: 10, // 10% discount -> 900
      taxConfig: {
        isInclusive: true,
        cgstPercent: 6,
        sgstPercent: 6,
        additionalCharges: 0
      },
      images: ['http://example.com/image.jpg'],
      variants: [{ size: 'M', color: 'Red', colorHex: '#ff0000', stock: 100, sku: 'QA-M-RED' }]
    };

    const prodRes = await fetch(`${API_URL}/products`, {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`},
      body: JSON.stringify(productPayload)
    });
    const prodData = await prodRes.json();
    if (prodData.success) {
      productId = prodData.product._id;
      console.log('✅ Product created successfully', productId);
    } else {
      console.error('❌ Product creation failed', prodData);
    }
  } catch(e) { console.error('Product failed', e); }

  // 3. Add to Cart (User)
  let cartData = null;
  try {
     const cartRes = await fetch(`${API_URL}/cart`, {
       method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`},
       body: JSON.stringify({ productId, quantity: 1, variantSize: 'M', variantColor: 'Red' })
     });
     cartData = await cartRes.json();
     if(cartData.success) {
       console.log('✅ Added to cart');
       
       // Verify GST values in cart
       const cartItem = cartData.cart.items.find(i => (i.product._id || i.product).toString() === productId);
       if (cartItem && cartItem.cgstPercent === 6 && cartItem.sgstPercent === 6) {
           console.log('✅ Cart correctly holds GST values');
       } else {
           console.error('❌ Cart GST values missing or incorrect', cartItem);
       }
     } else {
       console.error('❌ Add to cart failed', cartData);
     }
  } catch (e) { console.error('Cart failed', e); }

  // 4. Create Order (User)
  let orderId;
  try {
     const orderItems = cartData.cart.items.map(item => ({
        product: (item.product._id || item.product).toString(),
        name: item.product.name,
        variantSize: item.variantSize,
        variantColor: item.variantColor,
        quantity: item.quantity,
        price: item.price,
        cgstPercent: item.cgstPercent,
        sgstPercent: item.sgstPercent,
     }));
     
     const orderRes = await fetch(`${API_URL}/orders`, {
       method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`},
       body: JSON.stringify({ 
         items: orderItems,
         shippingAddress: { fullName: 'Test', line1: '123 Test St', city: 'Testville', state: 'TS', pincode: '123456', phone: '9999999999' },
         paymentMethod: 'cod', // Use COD to bypass Razorpay flow for now and immediately confirm order
         customerNotes: 'Please deliver fast',
         totalAmount: 900
       })
     });
     const orderData = await orderRes.json();
     if(orderData.success) {
       orderId = orderData.order._id;
       console.log('✅ Order created', orderId);
       
       // Verify Order item GST
       const item = orderData.order.items[0];
       if (item.cgstPercent === 6 && item.sgstPercent === 6) {
           console.log('✅ Order correctly snapshotted GST values');
       } else {
           console.error('❌ Order missing GST snapshots', item);
       }
     } else {
       console.error('❌ Order creation failed', orderData);
     }
  } catch (e) { console.error('Order failed', e); }
  
  // 5. Admin Update Order Status to Shipped
  try {
      const shipRes = await fetch(`${API_URL}/orders/${orderId}/status`, {
          method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`},
          body: JSON.stringify({ status: 'shipped', note: 'Dispatching now' })
      });
      const shipData = await shipRes.json();
      if(shipData.success) {
          console.log('✅ Admin updated status to shipped');
      } else {
          console.error('❌ Admin status update failed', shipData);
      }
      
      const trackRes = await fetch(`${API_URL}/orders/${orderId}/tracking`, {
          method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`},
          body: JSON.stringify({ trackingUrl: 'http://tracking.example.com/123' })
      });
      const trackData = await trackRes.json();
      if(trackData.success) {
          console.log('✅ Admin added tracking link');
      } else {
          console.error('❌ Admin tracking update failed', trackData);
      }
  } catch(e) { console.error('Admin flow failed', e); }

  // 6. Admin Update Order to Delivered
  try {
      const delRes = await fetch(`${API_URL}/orders/${orderId}/status`, {
          method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`},
          body: JSON.stringify({ status: 'delivered', note: 'Delivered successfully' })
      });
      const delData = await delRes.json();
      if(delData.success) {
          console.log('✅ Admin updated status to delivered');
      } else {
          console.error('❌ Admin delivery status failed', delData);
      }
  } catch(e) { console.error('Delivery failed', e); }
  
  // 7. Test User fetching Invoices
  try {
      const myOrdersRes = await fetch(`${API_URL}/orders/my`, {
          method: 'GET', headers: {'Authorization': `Bearer ${userToken}`}
      });
      const myOrdersData = await myOrdersRes.json();
      if(myOrdersData.success) {
          const deliveredOrders = myOrdersData.orders.filter(o => o.statusHistory?.some(h => h.status === 'delivered'));
          if (deliveredOrders.length > 0) {
              console.log('✅ User correctly sees delivered orders for Invoices');
          } else {
              console.error('❌ User does not see delivered orders');
          }
      } else {
          console.error('❌ User orders fetch failed', myOrdersData);
      }
  } catch(e) { console.error('Invoice check failed', e); }

  console.log("✅ QA Script Execution Complete");
}

runTests();
