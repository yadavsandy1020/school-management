/**
 * Standard API response helpers.
 * All controller responses should use these helpers to ensure a consistent
 * envelope across the entire API.
 */

const success = (res, data = null, message = null, extras = {}) => {
  const payload = { success: true };
  if (data !== null && data !== undefined) payload.data = data;
  if (message) payload.message = message;
  return res.status(extras.status || 200).json({ ...payload, ...extras });
};

const paginated = (res, data, pagination, extras = {}) => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
    ...extras,
  });
};

const error = (res, statusCode = 500, message = 'Server Error', details = null) => {
  const payload = { success: false, error: message };
  if (details !== null && details !== undefined) payload.details = details;
  return res.status(statusCode).json(payload);
};

module.exports = { success, paginated, error };
