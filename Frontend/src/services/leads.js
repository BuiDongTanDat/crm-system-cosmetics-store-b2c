import { request } from '@/utils/api';

export const createLead = (payload) =>
    request("/leads", {
        method: "POST",
        body: payload,        // request() sẽ tự stringify + set header JSON
    });
export const getPipelineSummary = () =>
    request(
        '/leads/pipeline/summary', {
        method: 'GET'
    });
export const getPipelineColumns = () =>
    request(
        '/leads/pipeline/columns', {
        method: 'GET',
    });
export const updateLeadStatus = (Id, status) =>
    request(
        `/leads/pipeline/${Id}/status`, {   
        method: 'PATCH',
        body: { status },
    });
export const getPipelineMetrics = () =>
    request(
        `/leads/pipeline/metrics`, {
        method: 'GET',
    });
export const getAllleads = () =>
    request(
        `/leads`, {
        method: 'GET',
    });
export const getQualifiedLeads = () =>
    request(`/leads/qualified`, {
        method: 'GET',
    });
    
export const getRecommendedProducts = async (leadId) => {
  try {
    // TODO: Replace with real API call when backend is ready
    // const response = await apiClient.get(`/leads/${leadId}/recommended-products`);
    // return response.data;
    
    // Mock data for testing UI
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [
            {
              product_id: 'prod_001',
              name: 'Laptop Dell XPS 13',
              price_current: 25000000,
              price_original: 28000000,
              discount_percent: 10,
              confidence_score: 0.89,
              reason: 'Khách hàng đã xem sản phẩm tương tự'
            },
            {
              product_id: 'prod_002',
              name: 'Chuột Logitech MX Master 3',
              price_current: 2500000,
              price_original: 3000000,
              discount_percent: 15,
              confidence_score: 0.75,
              reason: 'Thường mua kèm với laptop'
            },
            {
              product_id: 'prod_003',
              name: 'Bàn phím cơ Keychron K2',
              price_current: 1800000,
              price_original: 2200000,
              discount_percent: 18,
              confidence_score: 0.68,
              reason: 'Sản phẩm phổ biến trong phân khúc'
            }
          ]
        });
      }, 500);
    });
  } catch (error) {
    console.error('Error fetching recommended products:', error);
    throw error;
  }
};

export const trackProductInterest = (payload) =>
    request("/leads/interest", {
        method: "POST",
        body: payload,
    });

export const createLeadFromInterest = (payload) =>
    request("/leads/from-interest", {
        method: "POST",
        body: payload,
    });


export const getLeadDetailsById = (id) =>
    request(`/leads/detail/${id}`, {
        method: "GET",
    });

export const updateLead = (id, payload) =>
    request(`/leads/${id}`, {
        method: "PATCH",
        body: payload,
    });