const PricingSlab = require('../models/PricingSlab');

const getSlabs = async (plan = 'default') => {
  return await PricingSlab.find({ plan, isActive: true }).sort({ order: 1, minStudents: 1 });
};

const findSlabForStudents = async (studentCount, plan = 'default') => {
  const slabs = await getSlabs(plan);
  return slabs.find(s => studentCount >= s.minStudents && studentCount <= s.maxStudents) || null;
};

const calculatePrice = async (studentCount, billingCycle, plan = 'default') => {
  const slab = await findSlabForStudents(studentCount, plan);

  if (!slab) {
    return {
      studentCount,
      billingCycle,
      basePrice: 0,
      discount: 0,
      finalPrice: 0,
      slab: null,
      error: 'No pricing slab found for this student count'
    };
  }

  let basePrice = 0;
  switch (billingCycle) {
    case 'monthly':
      basePrice = slab.monthlyPrice;
      break;
    case 'quarterly':
      basePrice = slab.quarterlyPrice;
      break;
    case 'half_yearly':
      basePrice = slab.halfYearlyPrice;
      break;
    case 'yearly':
      basePrice = slab.yearlyPrice;
      break;
    case 'enterprise':
      basePrice = slab.enterprisePrice || slab.yearlyPrice;
      break;
    default:
      basePrice = slab.monthlyPrice;
  }

  const discountAmount = slab.discountAmount || 0;
  const discountPercentValue = slab.discountPercent || 0;
  const percentDiscount = (basePrice * discountPercentValue) / 100;
  const totalDiscount = discountAmount + percentDiscount;
  const finalPrice = Math.max(0, basePrice - totalDiscount);

  return {
    studentCount,
    billingCycle,
    basePrice,
    discount: totalDiscount,
    finalPrice,
    slab: {
      id: slab._id,
      minStudents: slab.minStudents,
      maxStudents: slab.maxStudents
    }
  };
};

const createSlab = async (data, userId) => {
  return await PricingSlab.create({
    ...data,
    createdBy: userId,
    updatedBy: userId
  });
};

const updateSlab = async (id, data, userId) => {
  return await PricingSlab.findByIdAndUpdate(
    id,
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );
};

const deleteSlab = async (id) => {
  return await PricingSlab.findByIdAndUpdate(id, { isActive: false }, { new: true });
};

module.exports = {
  getSlabs,
  findSlabForStudents,
  calculatePrice,
  createSlab,
  updateSlab,
  deleteSlab
};
