import api from "../axiosConfig";

export const fetchPickerHomeData = async () => {
  try {
    const response = await api.get('picker/home/');
    return response.data.results.data;
  } catch (error) {
    console.error('❌ [Home API] Error:', error);
    throw error;
  }
};



export const fetchOrders = async (status = '', search = '') => {
  try {
    console.log('parmas is', status, search);
    
    // Correctly structured endpoint with query params
    const response = await api.get(`picker/orders/`, {
      params: { status, search },
    });
    return response.data.results.data;
  } catch (error) {
    console.error('❌ [Orders API] Error:', error);
    throw error;
  }
};


// Fetch specific order details by ID
export const fetchOrderDetails = async (orderId: string) => {
  try {
    const response = await api.get(`picker/orders/${orderId}/`);
    return response.data.results.data;
  } catch (error) {
    console.error('❌ [Order Details API] Error:', error);
    throw error;
  }
};

// Patch picked quantity
export const updatePickedQuantity = async (orderId: string, itemId: string, qty: number) => {
  try {
    const response = await api.patch(`picker/orders/${orderId}/items/${itemId}/pick/`, {
      picked_qty: qty,
    });
    return response.data.results.data;
  } catch (error) {
    console.error('❌ [Pick Item API] Error:', error);
    throw error;
  }
};

// Generate Invoice for the order
export const generateOrderInvoice = async (orderId: string) => {
  try {
    console.log('order id is', orderId)
    const response = await api.post(`picker/orders/${orderId}/generate-invoice/`);
    return response.data;
  } catch (error) {
    console.error('❌ [Generate Invoice API] Error:', error);
    throw error;
  }
};

export const fetchInvoices = async () => {
  try {
    const response = await api.get('picker/invoices/')
    console.log('resp is fetch invoice', response);
    
    return response.data.results.data;
  } catch (error) {
    console.error('❌ [Invoices API] Error:', error);
    throw error;
  }
};

// Note: For download, we usually construct the full URL with the token
export const getDownloadUrl = (invoiceId: string) => {
  return `https://api.horecahub.ae/logistics/api/picker/invoices/${invoiceId}/download/`;
};


// Fetch Drivers
export const fetchDrivers = async (search = '') => {
  const response = await api.get(`employees/drivers/`, { params: { search } });
  // console.log('response is. drivers', response);
  return response.data.results.data; 
};

// Add these to your homeApi.ts
export const fetchVehicles = async () => {
  const response = await api.get(`picker/vehicle-list/`);
  // Following your pattern of response.data.results.data
  return response.data.results.data;
};

export const assignDispatch = async (invoiceId, deliveryAgentId, vehicleId) => {
  console.log('dispatch is', invoiceId, deliveryAgentId, vehicleId);
  
  const response = await api.post(`picker/invoices/${invoiceId}/assign-dispatch/`, {
    delivery_agent_id: deliveryAgentId,
    vehicle_id: vehicleId,
  });
  return response.data;
};

// Fetch Stock List
export const fetchStockList = async (
  page = 1,
  pageSize = 10,
  category?: string,
) => {
  let url = `picker/products-variant-stocks/?page=${page}&page_size=${pageSize}`;

  if (category && category !== 'All') {
    url += `&category=${encodeURIComponent(category)}`;
  }

  const response = await api.get(url);

  return response.data.results.data;
};

// Fetch Categories
export const fetchCategories = async () => {
  const response = await api.get('picker/products/categories/');
  return response.data.results.data.categories;
};

/**
 * Scans a SKU for a specific order
 * URL: picker/orders/{{order_id}}/scan/
 */
export const scanSKU = async (orderId: string, sku: string) => {
  try {
    const response = await api.post(`picker/orders/${orderId}/scan/`, {
      sku: sku,
    });

    // Extracting the nested data based on your response structure
    const { found, item } = response.data.results.data;

    if (!found) {
      throw new Error("SKU not found in this order");
    }

    return item; 
    // This returns the object containing id, product_name, picked_qty, etc.
  } catch (error) {
    throw error;
  }
};


export const fetchDeliveredOrders = async () => {
  try {
    const response = await api.get('picker/returns/delivered-orders/');
    return response.data.results.data;
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
    throw error;
  }
};

export const fetchReturnItems = async (orderId) => {
  const response = await api.get(`picker/returns/${orderId}/items/`);
  console.log('respons eis', response)
  return response.data.results.data;
};

export const collectReturnItems = async (orderId, payload) => {
  console.log('payloed is',payload, orderId)
  const response = await api.post(`picker/returns/${orderId}/collect/`, payload);
  return response.data.results.data;
};

/**
 * Fetches the list of active returns and reverse logistics items
 * Endpoint: picker/returns/active-returns/
 */
export const fetchActiveReturns = async () => {
  try {
    const response = await api.get(`picker/returns/active-returns/`);
    
    // Returns the array: [{ id, rma_number, order_number, customer_name, ... }]
    return response.data.results.data;
  } catch (error) {
    console.error("Error fetching active returns:", error);
    throw error;
  }
};

/**
 * Submits the collection data for a return order
 * POST picker/returns/:orderId/collect
 */
export const collectReturnOrder = async (orderId, payload) => {
  console.log('payloed is',payload, orderId)
  const response = await api.post(`picker/returns/${orderId}/collect/`, payload);
  return response.data;
};