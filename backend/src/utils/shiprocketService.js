const axios = require('axios');

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiry = null;

// Authenticate and get cached token (valid for 24 hours)
async function getToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password || email === 'dummy' || password === 'dummy') {
    // Graceful fallback to mock token in local dev if credentials are not configured
    console.log('[Shiprocket] Using mock token (credentials missing or dummy)');
    return 'mock_shiprocket_token_12345';
  }

  // Check cache
  if (cachedToken && tokenExpiry && tokenExpiry > Date.now()) {
    return cachedToken;
  }

  try {
    const { data } = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email,
      password
    });
    cachedToken = data.token;
    // Set expiry to 23 hours from now (standard token expires in 24 hours)
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
    console.log('[Shiprocket] Token fetched and cached successfully');
    return cachedToken;
  } catch (error) {
    console.error('[Shiprocket Auth Error]', error.response?.data || error.message);
    // Return mock token for local testing if API fails
    return 'mock_shiprocket_token_12345';
  }
}

// Create shipment adhoc order
async function createShipment(orderData) {
  const token = await getToken();
  
  if (token === 'mock_shiprocket_token_12345') {
    console.log('[Shiprocket] Simulating Create Shipment (Mock)');
    const randomOrderId = Math.floor(100000 + Math.random() * 900000);
    const randomShipmentId = Math.floor(100000 + Math.random() * 900000);
    return {
      order_id: randomOrderId,
      shipment_id: randomShipmentId,
      status: 'NEW',
      is_mock: true
    };
  }

  try {
    const { data } = await axios.post(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, orderData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  } catch (error) {
    console.error('[Shiprocket Create Shipment Error]', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create shipment in Shiprocket');
  }
}

// Request Courier assignment and generate AWB code
async function generateAWB(shipmentId) {
  const token = await getToken();

  if (token === 'mock_shiprocket_token_12345') {
    console.log('[Shiprocket] Simulating Generate AWB (Mock)');
    const randomAwb = `SR${Math.floor(100000000 + Math.random() * 900000000)}`;
    return {
      response: {
        data: {
          awb_code: randomAwb,
          courier_name: 'Delhivery',
          shipment_id: shipmentId
        }
      },
      is_mock: true
    };
  }

  try {
    const { data } = await axios.post(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
      shipment_id: shipmentId
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  } catch (error) {
    console.error('[Shiprocket Generate AWB Error]', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to generate AWB/assign courier in Shiprocket');
  }
}

// Print Shipping Label PDF
async function generateLabel(shipmentId) {
  const token = await getToken();

  if (token === 'mock_shiprocket_token_12345') {
    console.log('[Shiprocket] Simulating Generate Label (Mock)');
    return {
      label_created: 1,
      label_url: 'https://shiprocket.co/mock-label.pdf',
      is_mock: true
    };
  }

  try {
    const { data } = await axios.post(`${SHIPROCKET_BASE_URL}/courier/generate/label`, {
      shipment_id: [shipmentId]
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  } catch (error) {
    console.error('[Shiprocket Label Generation Error]', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to generate shipping label in Shiprocket');
  }
}

// Fetch live AWB tracking info
async function trackAWB(awbCode) {
  const token = await getToken();

  if (token === 'mock_shiprocket_token_12345' || awbCode.startsWith('SR')) {
    console.log('[Shiprocket] Simulating Track AWB (Mock)');
    return {
      tracking_data: {
        track_status: 1,
        shipment_track_activities: [
          { activity: 'Order placed', location: 'Vendor Hub', date: new Date().toISOString() }
        ],
        track_url: `https://shiprocket.co/track/${awbCode}`,
        current_status: 'In Transit'
      },
      is_mock: true
    };
  }

  try {
    const { data } = await axios.get(`${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  } catch (error) {
    console.error('[Shiprocket Track AWB Error]', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch tracking data from Shiprocket');
  }
}

// Create reverse pickup (return shipment)
async function createReturnShipment(returnData) {
  const token = await getToken();

  if (token === 'mock_shiprocket_token_12345') {
    console.log('[Shiprocket] Simulating Create Return Shipment (Mock)');
    const randomReturnAwb = `RET${Math.floor(100000 + Math.random() * 900000)}`;
    const randomReturnOrderId = Math.floor(100000 + Math.random() * 900000);
    return {
      order_id: randomReturnOrderId,
      shipment_id: Math.floor(100000 + Math.random() * 900000),
      awb_code: randomReturnAwb,
      courier_name: 'Delhivery Reverse',
      is_mock: true
    };
  }

  try {
    const { data } = await axios.post(`${SHIPROCKET_BASE_URL}/orders/create/return`, returnData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  } catch (error) {
    console.error('[Shiprocket Return Shipment Error]', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create return shipment in Shiprocket');
  }
}

module.exports = {
  createShipment,
  generateAWB,
  generateLabel,
  trackAWB,
  createReturnShipment
};
