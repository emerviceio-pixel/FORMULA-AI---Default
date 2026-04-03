// server/services/paystackService.js
const axios = require('axios');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseUrl = 'https://api.paystack.co';
    this.headers = {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Initialize transaction
  async initializeTransaction(data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        data,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Paystack initialization failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Verify transaction
  async verifyTransaction(reference) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Paystack verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create customer (optional but recommended)
  async createCustomer(email, firstName, lastName, phone) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customer`,
        { email, first_name: firstName, last_name: lastName, phone },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      // Customer might already exist, that's okay
      if (error.response?.data?.message?.includes('Duplicate')) {
        return { status: true, message: 'Customer exists' };
      }
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }
}

module.exports = new PaystackService();