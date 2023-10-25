const User = require("../Models/Users");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { sendNotificationEmail } = require("../Middlewares/emailSender");
const validateUserInput = require("../Middlewares/verificationMiddleware");
const generatePassword = require("generate-password");
const passwordOptions = {
  length: 12,
  numbers: true,
  symbols: true,
  uppercase: true,
  excludeSimilarCharacters: true,
};
// Generate Token and Refresh Token
const generateToken = (user) => {
  return jwt.sign(
    {
      user,
      // : {
      //   userName: user.userName,
      //   email: user.email,
      //   role: user.role,
      // },
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );
};

const generateRefreshToken = (user, expiresIn) => {
  return jwt.sign({ user }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn,
  });
};

// User registration
const userRegister = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    role,
    userName,
    password = generatePassword.generate(passwordOptions),
  } = req.body;

  const savedPassword = password;

  const validationResult = validateUserInput(req, res);
  if (firstName || lastName || email || userName) {
    res.status(400).json({ message: "All fields are required" });
  }
  if (validationResult) {
    res.status(400).json(validationResult);
  }

  try {
    // Check if the user already exists based on the provided email or userName
    const existingUser = await User.findOne({
      $or: [{ email }, { user_name: userName }],
    });

    if (existingUser) {
      // User already exists, return a 400 Bad Request response
      return res.status(400).json({ error: "User already exists" });
    }

    // User doesn't exist, proceed with registration
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: "Registration failed" });
      } else {
        bcrypt.hash(password, salt, async (err, hash) => {
          if (err) {
            console.log(err);
            res.status(500).json({ error: "Registration failed" });
          } else {
            const newUser = await User.create({
              id: uuidv4(),
              first_name: firstName,
              last_name: lastName,
              email: email,
              role: role,
              user_name: userName,
              password: hash,
            });
            console.log(newUser);
            await sendNotificationEmail(newUser, savedPassword);
            res.status(201).json({ message: "User registered successfully" });
          }
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};

// User authentication
const userLogin = async (req, res) => {
  const { userName, password } = req.body;
  try {
    // Searching for the user in the database
    const user = await User.findOne({ user_name: userName });
    //.select('-password');

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
    }

    // Compare hashed passwords using bcrypt.compare
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Wrong password!" });
    }

    // Update the last_login field with the current date and time
    user.last_login = new Date();
    await user.save();

    // Generate a JWT token
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user, '7h');

    res.status(200).json([
      { message: "logged in successfully" },
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: "1h",
        refresh_Token: refreshToken
      },
    ]);
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

//Get all the users list
const getAllUsers = async (req, res) => {
  const { page, sort } = req.query;
  const elementsPerPage = 4;
  const sortOrder = sort === "DESC" ? -1 : "ASC" === 1;
  const skip = (page - 1) * elementsPerPage;
  const usersList = await User.find()
    .sort({ creation_date: sortOrder })
    .skip(skip)
    .limit(elementsPerPage);
  console.log(usersList);
  res.status(200).json(usersList);
};

//Get user by id
const uuidv4Pattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
const getUserById = async (req, res) => {
  const id = req.params.id;

  if (uuidv4Pattern.test(id)) {
    try {
      const user = await User.findOne({ id: id }).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching the user" });
    }
  } else {
    res.status(400).json({ message: "Invalid id" });
  }
};

const searchUser = async (req, res) => {
  try {
    const { query, page, sort } = req.query;

    // Display settings
    const elementsPerPage = 4;
    const sortOrder = sort === "DESC" ? -1 : 1; // Corrected the sort order values
    const skip = (page - 1) * elementsPerPage;

    // Finding all users that have an occurrence of the query in their usernames, first names, or last names
    const regex = new RegExp(query, "i");
    const queryCriteria = {
      $or: [{ user_name: regex }, { first_name: regex }, { last_name: regex }],
    };

    // Assuming you have a User model defined, you should use async/await for database operations
    const searchedUsers = await User.find(queryCriteria)
      .skip(skip)
      .limit(elementsPerPage)
      .sort({ creation_date: sortOrder }); // Sorting should be applied here

    res.status(200).json(searchedUsers); // Corrected variable name
  } catch (err) {
    res.status(500).json({ message: "An error has occurred" });
  }
};

//Update a user by Id
const updateUser = async (req, res) => {
  const id = req.params.id;
  const { newFirstName, newLastName, newEmail, newRole, newIsActive } =
    req.body;

  try {
    const updateFields = {}; // Create an object to store the fields to update

    // Fields that you want to update
    const fieldsToUpdate = [
      "first_name",
      "last_name",
      "email",
      "role",
      "active",
    ];

    for (const field of fieldsToUpdate) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }

    const userToUpdate = await User.findOneAndUpdate({ id: id }, updateFields);
    // Handle the case where the user with the specified ID was not found.
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the user." });
  }
};

// Find a user and delete
const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const userToDelete = await User.findOneAndDelete({ id: id });
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the user." });
  }
};

module.exports = {
  userRegister: userRegister,
  userLogin: userLogin,
  getAllUsers: getAllUsers,
  getUserById: getUserById,
  searchUser: searchUser,
  updateUser: updateUser,
  deleteUser: deleteUser,
};
