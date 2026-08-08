const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { checkInMemoryMode } = require('../config/db');

// Real bcrypt hashes for pre-seeded demo accounts
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
const citizenPasswordHash = bcrypt.hashSync('user123', 10);

// In-memory user store for demo mode fallback
let memoryUsers = [
  {
    _id: 'user_admin_1',
    name: 'Officer Rajesh Sharma',
    email: 'admin@gov.in',
    passwordHash: adminPasswordHash,
    role: 'Admin',
    income: 600000,
    occupation: 'Government Service',
    age: 42,
    gender: 'Male',
    state: 'All India',
    district: 'Central'
  },
  {
    _id: 'user_citizen_1',
    name: 'Ananya Verma',
    email: 'ananya@citizen.in',
    passwordHash: citizenPasswordHash,
    role: 'Citizen',
    income: 240000,
    occupation: 'Student / Farmer',
    age: 22,
    gender: 'Female',
    category: 'OBC',
    education: 'Undergraduate',
    state: 'Maharashtra',
    district: 'Pune'
  }
];

// Auto-seed default accounts into MongoDB if database mode is active
const seedInitialUsers = async () => {
  if (checkInMemoryMode()) return;
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const citizenHash = await bcrypt.hash('user123', 10);

    const adminExists = await User.findOne({ email: 'admin@gov.in' });
    if (!adminExists) {
      await User.create({
        name: 'Officer Rajesh Sharma',
        email: 'admin@gov.in',
        password: adminHash,
        role: 'Admin',
        income: 600000,
        occupation: 'Government Service',
        age: 42,
        gender: 'Male',
        state: 'All India',
        district: 'Central'
      });
    } else {
      adminExists.password = adminHash;
      adminExists.role = 'Admin';
      await adminExists.save();
    }

    const citizenExists = await User.findOne({ email: 'ananya@citizen.in' });
    if (!citizenExists) {
      await User.create({
        name: 'Ananya Verma',
        email: 'ananya@citizen.in',
        password: citizenHash,
        role: 'Citizen',
        income: 240000,
        occupation: 'Student / Farmer',
        age: 22,
        gender: 'Female',
        category: 'OBC',
        education: 'Undergraduate',
        state: 'Maharashtra',
        district: 'Pune'
      });
    } else {
      citizenExists.password = citizenHash;
      citizenExists.role = 'Citizen';
      await citizenExists.save();
    }
    console.log('[MongoDB Seed] Demo accounts synced with valid bcrypt hashes.');
  } catch (err) {
    console.warn('[MongoDB Seed Error]:', err.message);
  }
};

// Trigger seed when controller is loaded
setTimeout(() => {
  seedInitialUsers();
}, 1000);

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, aadhaar, income, occupation, age, gender, category, education, state, district, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter all required fields' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (!checkInMemoryMode()) {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const newUser = await User.create({
        name,
        email: normalizedEmail,
        password: passwordHash,
        aadhaar: aadhaar || '',
        income: Number(income) || 250000,
        occupation: occupation || 'General',
        age: Number(age) || 25,
        gender: gender || 'All',
        category: category || 'General',
        education: education || 'Graduate',
        state: state || 'All India',
        district: district || 'Central',
        role: role || 'Citizen'
      });

      const token = generateToken(newUser);
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          income: newUser.income,
          occupation: newUser.occupation,
          age: newUser.age,
          gender: newUser.gender,
          category: newUser.category,
          education: newUser.education,
          state: newUser.state
        }
      });
    }

    // In-memory fallback
    const exists = memoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const memUser = {
      _id: 'user_' + Date.now(),
      name,
      email: normalizedEmail,
      passwordHash,
      role: role || 'Citizen',
      income: Number(income) || 250000,
      occupation: occupation || 'General',
      age: Number(age) || 25,
      gender: gender || 'Female',
      category: category || 'General',
      education: education || 'Graduate',
      state: state || 'All India',
      district: district || 'Central'
    };
    memoryUsers.push(memUser);

    const token = generateToken(memUser);
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: memUser._id,
        name: memUser.name,
        email: memUser.email,
        role: memUser.role,
        income: memUser.income,
        occupation: memUser.occupation,
        age: memUser.age,
        gender: memUser.gender,
        category: memUser.category,
        education: memUser.education,
        state: memUser.state
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!checkInMemoryMode()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          income: user.income,
          occupation: user.occupation,
          age: user.age,
          gender: user.gender,
          category: user.category,
          education: user.education,
          state: user.state
        }
      });
    }

    // In-memory mode login check
    const memUser = memoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!memUser) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, memUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(memUser);
    return res.json({
      success: true,
      token,
      user: {
        id: memUser._id,
        name: memUser.name,
        email: memUser.email,
        role: memUser.role,
        income: memUser.income,
        occupation: memUser.occupation,
        age: memUser.age,
        gender: memUser.gender,
        category: memUser.category,
        education: memUser.education,
        state: memUser.state
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server authentication error' });
  }
};

const getProfile = async (req, res) => {
  try {
    if (!checkInMemoryMode()) {
      const user = await User.findById(req.user.id).select('-password');
      if (user) {
        return res.json({ success: true, user });
      }
    }

    const memUser = memoryUsers.find(u => u._id === req.user.id);
    if (!memUser) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const { passwordHash, ...userWithoutPassword } = memUser;
    return res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

module.exports = { registerUser, loginUser, getProfile, seedInitialUsers, memoryUsers };
