const TheatreAdminApplication = require('../models/TheatreAdminApplication');
const Theatre = require('../models/Theatre');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.submit = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    theatreName,
    theatreAddress,
    theatreCity,
  } = req.body;

  const requiredText = [name, email, password, phone, theatreName, theatreAddress, theatreCity];
  if (requiredText.some((value) => typeof value !== 'string' || !value.trim())) {
    throw new AppError('Complete all account and theatre details', 400);
  }
  if (!/^[+]?[\d\s()-]{7,20}$/.test(phone.trim())) {
    throw new AppError('Enter a valid mobile number', 400);
  }

  const applicant = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    role: 'user',
  });

  let application;
  try {
    application = await TheatreAdminApplication.create({
      applicant: applicant._id,
      phone,
      theatreName,
      theatreAddress,
      theatreCity,
    });
  } catch (error) {
    await User.deleteOne({ _id: applicant._id });
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Application submitted. You can manage your theatre after a super admin approves it.',
    application,
  });
});

exports.list = asyncHandler(async (req, res) => {
  const applications = await TheatreAdminApplication.find()
    .populate('applicant', 'name email')
    .populate('reviewedBy', 'name email')
    .populate('theatre', 'name city')
    .sort({ createdAt: -1 });
  res.json({ success: true, applications });
});

exports.approve = asyncHandler(async (req, res) => {
  const application = await TheatreAdminApplication.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'approving', reviewedBy: req.user._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!application) {
    if (!(await TheatreAdminApplication.exists({ _id: req.params.id }))) {
      throw new AppError('Theatre admin application not found', 404);
    }
    throw new AppError('This application has already been reviewed', 409);
  }

  const applicant = await User.findById(application.applicant);
  if (!applicant) {
    await TheatreAdminApplication.updateOne(
      { _id: application._id, status: 'approving' },
      { $set: { status: 'pending' }, $unset: { reviewedBy: 1, reviewedAt: 1 } }
    );
    throw new AppError('Applicant account not found', 404);
  }
  if (applicant.role !== 'user') {
    await TheatreAdminApplication.updateOne(
      { _id: application._id, status: 'approving' },
      { $set: { status: 'pending' }, $unset: { reviewedBy: 1, reviewedAt: 1 } }
    );
    throw new AppError('Applicant account is not eligible for approval', 409);
  }

  let theatre;
  try {
    theatre = await Theatre.create({
      name: application.theatreName,
      address: application.theatreAddress,
      city: application.theatreCity,
      admin: applicant._id,
    });
    applicant.role = 'theatreAdmin';
    await applicant.save();
    application.theatre = theatre._id;
    application.status = 'approved';
    await application.save();
  } catch (error) {
    if (applicant.role === 'theatreAdmin') {
      await User.updateOne({ _id: applicant._id, role: 'theatreAdmin' }, { $set: { role: 'user' } });
    }
    if (theatre) await Theatre.deleteOne({ _id: theatre._id });
    await TheatreAdminApplication.updateOne(
      { _id: application._id, status: 'approving' },
      { $set: { status: 'pending' }, $unset: { reviewedBy: 1, reviewedAt: 1, theatre: 1 } }
    );
    throw error;
  }

  res.json({ success: true, application, theatre });
});

exports.reject = asyncHandler(async (req, res) => {
  const application = await TheatreAdminApplication.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!application) {
    if (!(await TheatreAdminApplication.exists({ _id: req.params.id }))) {
      throw new AppError('Theatre admin application not found', 404);
    }
    throw new AppError('This application has already been reviewed', 409);
  }
  res.json({ success: true, application });
});
