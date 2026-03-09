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

// Assign Driver and Vehicle to an Invoice
export const assignDispatch = async (
  invoiceId: string, 
  driverId: string, 
  // vehicleNumber: string
) => {
  try {
    const response = await api.post(
      `picker/invoices/${invoiceId}/assign-dispatch/`,
      {
        delivery_agent_id: driverId,
        // vehicle_number: vehicleNumber,
      },
    );
    console.log('response is ', response);
    
    return response.data;
  } catch (error) {
    console.error('❌ [Assign Dispatch API] Error:', error);
    throw error;
  }
};

// Fetch Drivers
export const fetchDrivers = async (search = '') => {
  const response = await api.get(`employees/drivers/`, { params: { search } });
  console.log('response is. drivers', response);
  return response.data.results.data; 
};

// Fetch Vehicles
export const fetchVehicles = async () => {
  const response = await api.get(`employees/vehicle-types/`);
  
  return response.data.results.data;
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
    const response = await api.post(`/picker/orders/${orderId}/scan/`, {
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