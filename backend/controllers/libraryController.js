const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const mongoose = require('mongoose');
const { getNextNumber } = require('../services/sequenceService');

const tenantFilter = (req) => ({
  tenantId: req.user.tenantId,
  schoolId: req.user.schoolId
});

exports.getBooks = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = { ...tenantFilter(req), isActive: true };
    if (category) filter.category = category;
    if (status === 'available') filter.available = { $gt: 0 };

    let query = Book.find(filter);
    if (search) query = query.find({ $text: { $search: search } });

    const books = await query.sort({ title: 1 }).lean();
    res.status(200).json({ success: true, count: books.length, data: books });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBook = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, ...tenantFilter(req) }).lean();
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const data = { ...req.body, ...tenantFilter(req), createdBy: req.user._id };
    if (!data.barcode) {
      data.barcode = await getNextNumber({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        entityType: 'book'
      });
    }
    data.available = data.quantity || 1;
    const book = await Book.create(data);
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const current = await Book.findOne({ _id: req.params.id, ...tenantFilter(req) });
    if (!current) return res.status(404).json({ success: false, error: 'Book not found' });

    const update = { ...req.body, updatedBy: req.user._id };
    if (update.quantity !== undefined) {
      const issued = (current.quantity || 0) - (current.available || 0);
      update.available = Math.max(0, update.quantity - issued);
    }

    const book = await Book.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, update, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    await Book.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Book deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getIssues = async (req, res) => {
  try {
    const { status, overdue } = req.query;
    const filter = { ...tenantFilter(req) };
    if (status) filter.status = status;
    if (overdue === 'true') {
      filter.status = 'issued';
      filter.dueDate = { $lt: new Date() };
    }

    const issues = await BookIssue.find(filter)
      .populate('bookId', 'title barcode')
      .populate('studentId', 'name studentDetails.admissionNo')
      .populate('staffId', 'name')
      .sort({ issueDate: -1 });

    res.status(200).json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.issueBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookId, studentId, staffId, dueDate, notes } = req.body;
    const book = await Book.findOne({ _id: bookId, ...tenantFilter(req) }).session(session);
    if (!book || book.available < 1) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Book not available' });
    }

    const issueNumber = await getNextNumber({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      entityType: 'libraryIssue'
    });

    const issue = await BookIssue.create([{
      ...tenantFilter(req),
      issueNumber,
      bookId,
      studentId,
      staffId,
      dueDate,
      notes,
      issuedBy: req.user._id,
      createdBy: req.user._id
    }], { session });

    book.available -= 1;
    await book.save({ session });

    await session.commitTransaction();
    res.status(201).json({ success: true, data: issue[0] });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

exports.returnBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { fineAmount = 0 } = req.body;
    const issue = await BookIssue.findOne({ _id: req.params.id, ...tenantFilter(req) }).session(session);
    if (!issue) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Issue record not found' });
    }

    issue.status = 'returned';
    issue.returnDate = new Date();
    issue.fineAmount = fineAmount;
    issue.receivedBy = req.user._id;
    issue.updatedBy = req.user._id;
    await issue.save({ session });

    const book = await Book.findOne({ _id: issue.bookId, ...tenantFilter(req) }).session(session);
    if (book) {
      book.available = Math.min(book.quantity, (book.available || 0) + 1);
      await book.save({ session });
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Book.distinct('category', tenantFilter(req));
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
