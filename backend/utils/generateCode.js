function generateCode(prefix, tenantId, schoolId) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const schoolShort = schoolId ? schoolId.toString().slice(-4) : 'XXXX';
  const tenant = String(tenantId || 'XXX').toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${tenant}-${schoolShort}-${date}-${random}`;
}

module.exports = { generateCode };
