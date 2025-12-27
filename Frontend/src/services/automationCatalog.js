
import { request } from '@/utils/api';

// Lấy danh sách event types
export const getEventTypes = (params = {}) =>
  request('/automation-event/event-types', {
    method: 'GET',
    params,
  });

// Lấy chi tiết 1 event type
export const getEventType = (eventType) =>
  request(`/automation-event/event-types/${eventType}`, {
    method: 'GET',
  });

// Tạo event type mới
export const createEventType = (payload) =>
  request('/automation-event/event-types', {
    method: 'POST',
    body: payload,
  });

// Cập nhật event type
export const updateEventType = (eventType, payload) =>
  request(`/automation/catalog/event-types/${eventType}`, {
    method: 'PATCH',
    body: payload,
  });

// Bật / tắt event type
export const setEventTypeActive = (eventType, is_active) =>
  request(`/automation-event/event-types/${eventType}/active`, {
    method: 'PATCH',
    body: { is_active },
  });

// Xóa event type
export const deleteEventType = (eventType) =>
  request(`/automation-event/event-types/${eventType}`, {
    method: 'DELETE',
  });

// Lấy danh sách action types
export const getActionTypes = (params = {}) =>
  request('/automation-event/action-types', {
    method: 'GET',
    params,
  });

// Lấy chi tiết 1 action type
export const getActionType = (actionType) =>
  request(`/automation-event/action-types/${actionType}`, {
    method: 'GET',
  });

// Tạo action type mới
export const createActionType = (payload) =>
  request('/automation-event/action-types', {
    method: 'POST',
    body: payload,
  });

// Cập nhật action type
export const updateActionType = (actionType, payload) =>
  request(`/automation-event/action-types/${actionType}`, {
    method: 'PATCH',
    body: payload,
  });

// Bật / tắt action type
export const setActionTypeActive = (actionType, is_active) =>
  request(`/automation-event/action-types/${actionType}/active`, {
    method: 'PATCH',
    body: { is_active },
  });

// Xóa action type
export const deleteActionType = (actionType) =>
  request(`/automation-event/action-types/${actionType}`, {
    method: 'DELETE',
  });
