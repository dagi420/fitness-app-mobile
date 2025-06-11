require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const multer = require('multer'); // For handling file uploads
const path = require('path'); // For working with file paths
const fs = require('fs'); // For file system operations
// const { OpenAI } = require('openai'); // Comment out or remove OpenAI/DeepSeek client
const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require('@google/genai'); // Corrected import based on module inspection

// Import mock data
const {
    mockWorkoutsData,
    mockIndividualExercisesData,
    createMockDietPlan,
    allMockExercisesForAI
} = require('./mockData');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
let db;

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, 'public/uploads/progress_photos');
if (!fs.existsSync(path.join(__dirname, 'public'))){
    fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
}
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: fieldname-timestamp.extension
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Multer upload instance with file filter for images
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images based on mimetype
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      req.fileValidationError = 'Only image files are allowed!';
      cb(null, false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// Serve static files from the 'public' directory
// This will make files in public/uploads/progress_photos accessible via URLs like /uploads/progress_photos/filename.jpg
app.use('/public', express.static(path.join(__dirname, 'public')));

MongoClient.connect(mongoUri)
  .then(client => {
    console.log('Connected successfully to MongoDB');
    db = client.db(dbName);
  })
  .catch(error => {
    console.error('Could not connect to MongoDB', error);
    process.exit(1); // Exit if DB connection fails
  });

// Initialize Google GenAI client - Commenting out top-level initialization for diagnostic
// const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// --- JWT Verification Middleware ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        // console.error('JWT verification error:', err.message);
        return res.status(403).json({ success: false, message: 'Forbidden: Invalid or expired token.' });
      }
      req.user = decoded; // Add decoded payload to request object (e.g., req.user.id)
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized: No token provided or invalid format.' });
  }
};

// --- Routes ---

// Test Route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Fitness App API!' });
});

// Registration Route: POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }

  try {
    const { fullName, email, password } = req.body;

    // Basic validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    // Check if user already exists
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user object based on our schema
    const newUser = {
      _id: new ObjectId(),
      authId: null, // Will be null for direct email/password registration for now
      email: email.toLowerCase(),
      fullName: fullName, // Storing as provided, or you could split into firstName/lastName
      hashedPassword: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: { // Initialize with some defaults or leave empty
        // dateOfBirth: null,
        // gender: null,
        // ... other profile fields from your schema
      },
      // appSettings: {},
      // currentWorkoutPlanId: null,
      // currentDietPlanId: null
    };

    const result = await usersCollection.insertOne(newUser);

    // Respond (don't send back the password hash)
    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      userId: result.insertedId,
      // You might generate and send a JWT token here in a real app
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Login Route: POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Login successful
    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id.toString() }, // Payload: user's ID
      process.env.JWT_SECRET,        // Secret key from .env
      { expiresIn: '1d' }             // Token expiration (e.g., 1 day)
    );

    const userForClient = { ...user };
    delete userForClient.hashedPassword; // IMPORTANT: Never send the hash to the client

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: token, // Send the token to the client
      user: userForClient,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// PUT /api/user/profile/onboard - To update user profile with onboarding data
app.put('/api/user/profile/onboard', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }

  try {
    // 1. Authenticate the user (e.g., via JWT token in Authorization header)
    // For simplicity, we're currently relying on the client sending the token,
    // and authService.ts includes it. A real app would verify this token.
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) {
    //   return res.status(401).json({ success: false, message: 'No token provided, authorization denied.' });
    // }
    // Verify token and get userId from it... (implementation depends on your JWT strategy)

    // For now, we'll assume client sends userId directly, or we get it from a verified token.
    // The client-side authService is sending userId in the body.
    const { userId, ...profileDataFromClient } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const usersCollection = db.collection('users');

    // Construct the fields to update in the user's profile
    // We only update fields that are actually provided in profileDataFromClient
    const fieldsToUpdate = {};
    if (profileDataFromClient.age !== undefined) fieldsToUpdate['profile.age'] = profileDataFromClient.age;
    if (profileDataFromClient.gender !== undefined) fieldsToUpdate['profile.gender'] = profileDataFromClient.gender;
    if (profileDataFromClient.height !== undefined) fieldsToUpdate['profile.height'] = profileDataFromClient.height;
    if (profileDataFromClient.weight !== undefined) fieldsToUpdate['profile.weight'] = profileDataFromClient.weight;
    if (profileDataFromClient.workoutGoals !== undefined) fieldsToUpdate['profile.workoutGoals'] = profileDataFromClient.workoutGoals;
    if (profileDataFromClient.activityLevel !== undefined) fieldsToUpdate['profile.activityLevel'] = profileDataFromClient.activityLevel;
    if (profileDataFromClient.healthConditions !== undefined) fieldsToUpdate['profile.healthConditions'] = profileDataFromClient.healthConditions;
    if (profileDataFromClient.dietaryRestrictions !== undefined) fieldsToUpdate['profile.dietaryRestrictions'] = profileDataFromClient.dietaryRestrictions;
    // Add other fields from OnboardingProfileData as needed

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ success: false, message: 'No profile data provided to update.' });
    }
    
    fieldsToUpdate['updatedAt'] = new Date(); // Also update the main updatedAt timestamp

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) }, // Filter by user ID
      { $set: fieldsToUpdate }       // Set the new profile fields
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (result.modifiedCount === 0) {
      // This might happen if the data sent is the same as what's already in the DB
      // Or if user was found but profile not updated for some reason (less likely with $set if data is different)
      // For now, we'll fetch the user to ensure client gets the latest state.
    }

    // Fetch the updated user document to send back
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!updatedUser) { // Should not happen if update was successful
        return res.status(404).json({ success: false, message: 'User not found after update.' });
    }
    
    const userForClient = { ...updatedUser };
    delete userForClient.hashedPassword;


    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: userForClient,
    });

  } catch (error) {
    console.error('Update profile error:', error);
    // Check if error is due to invalid ObjectId format
    if (error.message && error.message.toLowerCase().includes('objectid')) {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.'});
    }
    res.status(500).json({ success: false, message: 'Server error during profile update.' });
  }
});

// GET /api/workouts - Fetch all workouts
app.get('/api/workouts', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const workoutsCollection = db.collection('workouts'); // Assuming you have a 'workouts' collection
    
    // For now, let's add some mock workout data if the collection is empty for testing purposes
    // In a real scenario, this data comes from your ERP/admin panel.
    let workouts = await workoutsCollection.find({}).toArray();
    if (workouts.length === 0) {
        console.log('No workouts found in DB, inserting mock data...');
        await workoutsCollection.insertMany(mockWorkoutsData);
        workouts = await workoutsCollection.find({}).toArray(); // Re-fetch after inserting
    }

    res.status(200).json({
      success: true,
      workouts: workouts,
    });

  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ success: false, message: 'Server error fetching workouts.' });
  }
});

// GET /api/workouts/:id - Fetch a single workout by its ID
app.get('/api/workouts/:id', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const workoutId = req.params.id;
    if (!ObjectId.isValid(workoutId)) {
        return res.status(400).json({ success: false, message: 'Invalid workout ID format.' });
    }

    const workoutsCollection = db.collection('workouts');
    const workout = await workoutsCollection.findOne({ _id: new ObjectId(workoutId) });

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found.' });
    }

    res.status(200).json({
      success: true,
      workout: workout,
    });

  } catch (error) {
    console.error('Error fetching single workout:', error);
    res.status(500).json({ success: false, message: 'Server error fetching workout.' });
  }
});

// GET /api/exercises - Fetch all individual exercises
app.get('/api/exercises', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const exercisesCollection = db.collection('exercises'); 
    
    let exercises = await exercisesCollection.find({}).toArray();
    if (exercises.length === 0) {
        console.log('No individual exercises found in DB, inserting mock data...');
        await exercisesCollection.insertMany(mockIndividualExercisesData);
        exercises = await exercisesCollection.find({}).toArray(); 
    }

    res.status(200).json({
      success: true,
      exercises: exercises,
    });

  } catch (error) {
    console.error('Error fetching individual exercises:', error);
    res.status(500).json({ success: false, message: 'Server error fetching exercises.' });
  }
});

// POST /api/user/workout-plans - Create a new custom workout plan for a user
app.post('/api/user/workout-plans', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const { userId, planName, exercises } = req.body;

    // Basic validation
    if (!userId || !planName || !exercises) {
      return res.status(400).json({ success: false, message: 'User ID, plan name, and exercises are required.' });
    }
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ success: false, message: 'Exercises must be a non-empty array.' });
    }
    if (typeof planName !== 'string' || planName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Plan name must be a non-empty string.' });
    }

    // Ensure user exists (optional, but good practice)
    const usersCollection = db.collection('users');
    const userExists = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userWorkoutPlansCollection = db.collection('userWorkoutPlans');
    
    const newPlan = {
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      planName: planName.trim(),
      exercises: exercises, // These are PlannedExercise objects from the client
      createdAt: new Date(),
      updatedAt: new Date(),
      isAIgenerated: false, // Mark as manually created
    };

    const result = await userWorkoutPlansCollection.insertOne(newPlan);

    res.status(201).json({
      success: true,
      message: 'Workout plan saved successfully!',
      planId: result.insertedId,
      plan: newPlan // Send back the created plan
    });

  } catch (error) {
    console.error('Error saving workout plan:', error);
    if (error.message && error.message.toLowerCase().includes('objectid')) {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.'});
    }
    res.status(500).json({ success: false, message: 'Server error saving workout plan.' });
  }
});

// GET /api/user/workout-plans?userId=:userId - Fetch all workout plans for a specific user
app.get('/api/user/workout-plans', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const { userId } = req.query; // Get userId from query parameters

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required as a query parameter.' });
    }

    // Validate ObjectId format for userId
    if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.' });
    }

    const userWorkoutPlansCollection = db.collection('userWorkoutPlans');
    const userPlans = await userWorkoutPlansCollection.find({ userId: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      plans: userPlans,
    });

  } catch (error) {
    console.error('Error fetching user workout plans:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user workout plans.' });
  }
});

// GET /api/user/diet-plans?userId=:userId - Fetch all diet plans for a specific user
app.get('/api/user/diet-plans', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const { userId } = req.query; // Get userId from query parameters

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required as a query parameter.' });
    }

    // Validate ObjectId format for userId
    if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.' });
    }

    const userDietPlansCollection = db.collection('userDietPlans');
    let userPlans = await userDietPlansCollection.find({ userId: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();

    // --- Mock Data if no plans exist (for development) ---
    if (userPlans.length === 0) {
      console.log(`No diet plans found for user ${userId}, inserting mock diet plan...`);
      const mockDietPlan = createMockDietPlan(userId);
      await userDietPlansCollection.insertOne(mockDietPlan);
      userPlans = [mockDietPlan]; // Return the newly inserted mock plan
    }
    // --- End Mock Data ---

    res.status(200).json({
      success: true,
      plans: userPlans,
    });

  } catch (error) {
    console.error('Error fetching user diet plans:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user diet plans.' });
  }
});

// POST /api/user/diet-plans - Create a new diet plan for a user
app.post('/api/user/diet-plans', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const { userId, planName, meals } = req.body;

    // Basic validation
    if (!userId || !planName || !meals) {
      return res.status(400).json({ success: false, message: 'User ID, plan name, and meals are required.' });
    }
    if (!Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({ success: false, message: 'Meals must be a non-empty array.' });
    }
    if (typeof planName !== 'string' || planName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Plan name must be a non-empty string.' });
    }

    // Ensure user exists (optional, but good practice)
    const usersCollection = db.collection('users');
    const userExists = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userDietPlansCollection = db.collection('userDietPlans');
    
    const newPlan = {
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      planName: planName.trim(),
      meals: meals, // These are Meal objects from the client
      createdAt: new Date(),
      updatedAt: new Date(),
      isAIGenerated: false, // Mark as manually created
    };

    const result = await userDietPlansCollection.insertOne(newPlan);

    res.status(201).json({
      success: true,
      message: 'Diet plan saved successfully!',
      planId: result.insertedId,
      plan: newPlan // Send back the created plan
    });

  } catch (error) {
    console.error('Error saving diet plan:', error);
    if (error.message && error.message.toLowerCase().includes('objectid')) {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.'});
    }
    res.status(500).json({ success: false, message: 'Server error saving diet plan.', error: error.message });
  }
});

// POST /api/ai/generate-diet-plan - Generate a diet plan using AI
app.post('/api/ai/generate-diet-plan', verifyToken, async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }

  try {
    // DIAGNOSTIC: Inspect the GoogleGenAI constructor and the instance it creates
    console.log("[AI Diet] typeof GoogleGenAI (from require):", typeof GoogleGenAI);
    console.log("[AI Diet] GoogleGenAI constructor function itself:", GoogleGenAI.toString().substring(0, 200) + "..."); // Log first 200 chars

    console.log("[AI Diet] Initializing GoogleGenAI client inside route handler...");
    const localGenAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    console.log("[AI Diet] localGenAI initialized.");

    console.log("[AI Diet] typeof localGenAI after new:", typeof localGenAI);
    // Attempt to list keys of the instance. If it's not a proper object, this might fail or be empty.
    try {
      console.log("[AI Diet] Keys of localGenAI instance:", Object.keys(localGenAI));
    } catch (keysError) {
      console.error("[AI Diet] Error getting keys of localGenAI:", keysError);
    }
    console.log("[AI Diet] localGenAI instance direct log:", localGenAI);

    const userIdFromToken = req.user.id;
    const { config } = req.body; // AIPlanConfigData from client

    if (!userIdFromToken || !ObjectId.isValid(userIdFromToken)) {
      return res.status(400).json({ success: false, message: 'Valid User ID not found in token.' });
    }
    if (!config || typeof config.goal !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid AI configuration data is required.' });
    }

    const actualUserId = new ObjectId(userIdFromToken);

    // 1. Fetch user's profile data
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: actualUserId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userProfile = user.profile || {};
    const userName = user.fullName || 'User';

    console.log(`[AI Diet] Generating plan for ${userName} (ID: ${actualUserId.toHexString()}) with Google Gemini`);
    console.log(`[AI Diet] Received AI Config:`, JSON.stringify(config, null, 2));
    console.log(`[AI Diet] User Profile Data:`, JSON.stringify(userProfile, null, 2));

    // 2. Construct a detailed prompt for Gemini
    // The prompt structure remains largely the same, as we're asking for JSON output.
    let prompt = `
You are a helpful AI assistant specialized in creating personalized diet plans.
Generate a comprehensive 1-day diet plan for a user with the following details:
Name: ${userName}
Goal: ${config.goal}
Approximate Age: ${userProfile.age || 'Not provided'}
Gender: ${userProfile.gender || 'Not provided'}
Height: ${userProfile.height ? userProfile.height + ' cm' : 'Not provided'}
Weight: ${userProfile.weight ? userProfile.weight + ' kg' : 'Not provided'}
Activity Level: ${userProfile.activityLevel || 'Not provided'}
Dietary Preferences/Restrictions: ${config.foodPreferences || (userProfile.dietaryRestrictions && userProfile.dietaryRestrictions.join(', ')) || 'None specified'}
Supplements: ${config.supplements || 'None specified'}
Other Notes: ${config.otherNotes || 'None'}
Health Conditions: ${(userProfile.healthConditions && userProfile.healthConditions.join(', ')) || 'None specified'}

The diet plan should:
- Be named appropriately based on the user's goal (e.g., "Weight Loss Kickstart Plan", "Muscle Gain Fuel Plan").
- Include a brief description.
- Specify an estimated daily caloric target (integer) and macronutrient targets (protein, carbs, fat in grams - integers).
- Be structured into 3-5 meals (e.g., Breakfast, Lunch, Dinner, Snacks).
- For each meal:
    - Provide a mealName (e.g., "Morning Energizer", "Post-Workout Refuel").
    - Optionally, a timeSuggestion (e.g., "08:00").
    - List 1-3 foodItems.
    - For each foodItem:
        - Specify foodName (e.g., "Grilled Chicken Breast", "Brown Rice", "Mixed Berries").
        - Specify quantity (e.g., "150g", "1 cup cooked", "1/2 cup").
        - Estimate calories (integer).
        - Estimate macronutrients: proteinGr, carbsGr, fatGr (all integers).

Please return the entire diet plan as a single JSON object matching the following structure. Do NOT include any explanatory text, markdown formatting (like \\\`\\\`\\\`json), or anything else before or after the JSON object.
The response should be ONLY the JSON object itself.

Example JSON Structure:
{
  "planName": "string",
  "description": "string",
  "dailyCaloricTarget": integer,
  "macronutrientTargets": { "proteinGr": integer, "carbsGr": integer, "fatGr": integer },
  "meals": [
    {
      "mealName": "string",
      "timeSuggestion": "string" (optional),
      "foodItems": [
        {
          "foodName": "string",
          "quantity": "string",
          "calories": integer,
          "macronutrients": { "proteinGr": integer, "carbsGr": integer, "fatGr": integer }
        }
      ]
    }
  ]
}

Ensure all text values are appropriate and helpful for a diet plan.
Calculate calorie and macronutrient totals for each food item and for the overall daily targets.
The sum of calories from foodItems in all meals should roughly match the dailyCaloricTarget.
The sum of macronutrients from foodItems should roughly match the daily macronutrientTargets.
`;

    console.log("[AI Diet] Sending prompt to Google Gemini API...");

    // 3. Call Google Gemini API
    console.log("[AI Diet] Inspecting localGenAI object before calling getGenerativeModel:");
    console.log("[AI Diet] typeof localGenAI (before getGenerativeModel call):", typeof localGenAI);
    console.log("[AI Diet] localGenAI has getGenerativeModel property:", localGenAI && localGenAI.hasOwnProperty('getGenerativeModel'));
    console.log("[AI Diet] typeof localGenAI.getGenerativeModel:", localGenAI && typeof localGenAI.getGenerativeModel);
    
    const model = localGenAI.getGenerativeModel({ // Use localGenAI for this test
        model: "gemini-1.5-flash-latest", // Or "gemini-pro" or other suitable model
        // generationConfig: { responseMimeType: "application/json" } // To enforce JSON output
    });
    
    // Optional: Add safety settings if needed
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings,
        generationConfig: { // Enforce JSON output
            responseMimeType: "application/json",
        },
    });

    const generationResponse = result.response;
    
    if (!generationResponse || !generationResponse.candidates || generationResponse.candidates.length === 0) {
      console.error('[AI Diet] Google Gemini API response content is empty or invalid.', generationResponse);
      const blockReason = generationResponse?.promptFeedback?.blockReason;
      const safetyRatings = generationResponse?.promptFeedback?.safetyRatings;
      let message = 'Google Gemini API failed to generate a plan (empty or invalid response).';
      if (blockReason) {
        message += ` Block Reason: ${blockReason}.`;
      }
      if (safetyRatings) {
        message += ` Safety Ratings: ${JSON.stringify(safetyRatings)}.`;
      }
      return res.status(500).json({ success: false, message });
    }

    // Extract the text which should be JSON
    const aiResponseText = generationResponse.candidates[0].content.parts[0].text;

    console.log('[AI Diet] Received raw response text from Google Gemini API:', aiResponseText);

    // 4. Parse the AI's response (expecting JSON)
    let parsedPlan;
    try {
        // Since we requested "application/json", the response text should be directly parsable.
        parsedPlan = JSON.parse(aiResponseText);
    } catch (parseError) {
      console.error('[AI Diet] Error parsing JSON response from Google Gemini API:', parseError);
      console.error('[AI Diet] Google Gemini Raw Response Text that failed parsing:', aiResponseText);
      return res.status(500).json({ success: false, message: 'Google Gemini API generated a plan, but it was not in the expected JSON format. Please try again.', rawResponse: aiResponseText });
    }

    // 5. Validate and structure the plan for DB insertion (same as before)
    if (!parsedPlan.planName || !parsedPlan.meals || !Array.isArray(parsedPlan.meals)) {
      console.error('[AI Diet] Parsed AI plan is missing required fields or has incorrect structure.');
      return res.status(500).json({ success: false, message: 'Google Gemini API generated a plan, but it is incomplete or structured incorrectly.', parsedPlan });
    }
    
    const finalPlan = {
      _id: new ObjectId(),
      userId: actualUserId,
      planName: parsedPlan.planName,
      description: parsedPlan.description || '',
      dailyCaloricTarget: parsedPlan.dailyCaloricTarget || 0,
      macronutrientTargets: parsedPlan.macronutrientTargets || { proteinGr: 0, carbsGr: 0, fatGr: 0 },
      meals: parsedPlan.meals.map(meal => ({
        _id: new ObjectId(),
        mealName: meal.mealName,
        timeSuggestion: meal.timeSuggestion,
        foodItems: meal.foodItems.map(item => ({
          _id: new ObjectId(),
          foodName: item.foodName,
          quantity: item.quantity,
          calories: item.calories || 0,
          macronutrients: item.macronutrients || { proteinGr: 0, carbsGr: 0, fatGr: 0 }
        }))
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      isAIGenerated: true,
    };

    // 6. Save the AI-generated plan to the database
    const userDietPlansCollection = db.collection('userDietPlans');
    const dbResult = await userDietPlansCollection.insertOne(finalPlan);

    console.log(`[AI Diet] Successfully inserted AI plan ${dbResult.insertedId} for user ${actualUserId.toHexString()} using Google Gemini.`);

    res.status(201).json({
      success: true,
      message: 'AI diet plan generated and saved successfully using Google Gemini!',
      plan: finalPlan
    });

  } catch (error) {
    console.error('[AI Diet] Error generating AI diet plan with Google Gemini:', error);
    // Handle specific Google GenAI errors if possible, otherwise generic
    // The error object from @google/genai might have different properties
    let errorMessage = 'Server error during AI diet plan generation with Google Gemini.';
    if (error.message) {
        errorMessage += ` Details: ${error.message}`;
    }
     // If the error object has a more specific message or details, use them
    if (error.status && error.statusText) { // Common for API errors
        errorMessage = `Google Gemini API Error: ${error.status} ${error.statusText}. ${error.message || ''}`;
    } else if (error.message) {
        errorMessage = `Google Gemini Error: ${error.message}`;
    }

    res.status(500).json({ success: false, message: errorMessage, errorDetails: error.toString() });
  }
});

// POST /api/ai/generate-workout-plan - Generate a workout plan (currently MOCK)
app.post('/api/ai/generate-workout-plan', verifyToken, async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }

  try {
    const userIdFromToken = req.user.id;
    const { config } = req.body; // AIWorkoutConfigData from client

    if (!userIdFromToken || !ObjectId.isValid(userIdFromToken)) {
      return res.status(400).json({ success: false, message: 'Valid User ID not found in token.' });
    }
    // Basic validation for AIWorkoutConfigData
    if (!config ||
        typeof config.fitnessGoal !== 'string' ||
        typeof config.fitnessLevel !== 'string' ||
        // typeof config.gender !== 'string' || // Gender can be optional or 'Prefer not to say'
        typeof config.workoutTypePreferences !== 'string' ||
        !Array.isArray(config.availableEquipment) || // Changed to array
        typeof config.timePerSession !== 'number' || config.timePerSession <= 0 ||
        typeof config.workoutsPerWeek !== 'number' || config.workoutsPerWeek <= 0
    ) {
      return res.status(400).json({ success: false, message: 'Valid AI workout configuration data is required. Check all fields, especially availableEquipment as an array.' });
    }

    const actualUserId = new ObjectId(userIdFromToken);

    // 1. Fetch user's profile data
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: actualUserId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userProfile = user.profile || {};
    const userName = user.fullName || 'User';

    console.log(`[AI Workout] Generating MOCK plan for ${userName} (ID: ${actualUserId.toHexString()})`);
    console.log(`[AI Workout] Received AI Config:`, JSON.stringify(config, null, 2));
    console.log(`[AI Workout] User Profile Data:`, JSON.stringify(userProfile, null, 2));

    // 2. Construct a detailed prompt for AI (Placeholder for now)
    let workoutPrompt = `
      Generate a workout plan with the following details:
      User: ${userName}
      Fitness Goal: ${config.fitnessGoal}
      Fitness Level: ${config.fitnessLevel}
      Gender: ${config.gender || 'Not specified'}
      Preferred Workout Types: ${config.workoutTypePreferences}
      Available Equipment: ${config.availableEquipment.join(', ')}
      Time Per Session: ${config.timePerSession} minutes
      Workouts Per Week: ${config.workoutsPerWeek}
      Target Muscle Groups: ${(config.targetMuscleGroups && config.targetMuscleGroups.join(', ')) || 'Overall'}
      Other Notes: ${config.otherNotes || 'None'}
      User Age: ${userProfile.age || 'N/A'}, Height: ${userProfile.height || 'N/A'} cm, Weight: ${userProfile.weight || 'N/A'} kg

      The plan should be structured as a JSON object with fields:
      planName (string), description (string), exercises (array).
      Each exercise in the array should have:
      _id (ObjectId string), name (string), type (string, e.g., 'Strength'),
      targetMuscleGroups (string[]), equipment (string or string[]), description (string),
      sets (string or number), reps (string), durationSeconds (number, optional), order (number).
      Ensure exercises are appropriate for the user's level and equipment.
      Provide 3-6 exercises per plan.
    `;
    console.log("[AI Workout] Generated Prompt (for future AI use):\n", workoutPrompt);

    // --- Expanded Mock Exercise Pool ---
    const allMockExercises = allMockExercisesForAI; // Use from imported mockData.js

    // --- Dynamic Exercise Selection Logic ---
    let selectedExercises = [];
    const userEquipment = config.availableEquipment.map(e => e.toLowerCase()); // e.g., ['bodyweight', 'dumbbells']
    const userFitnessLevel = config.fitnessLevel; // 'Beginner', 'Intermediate', 'Advanced'
    const userTargetMuscles = (config.targetMuscleGroups || []).map(m => m.toLowerCase()); // e.g., ['chest', 'legs']
    const userWorkoutType = config.workoutTypePreferences.toLowerCase(); // e.g., 'full body', 'upper body'

    // Helper to check if exercise equipment is available
    const hasEquipmentFor = (exercise) => {
        if (exercise.equipmentNeeded.includes('Bodyweight') && userEquipment.includes('bodyweight')) return true;
        return exercise.equipmentNeeded.some(eq => userEquipment.includes(eq.toLowerCase().replace(/[\/\s]/g, ''))); // Handles "Pull-up Bar", "Chair/Bench" etc.
    };
    
    // Filter by fitness level and available equipment first
    let eligibleExercises = allMockExercises.filter(ex => {
        const levelMatch = ex.difficulty === userFitnessLevel || 
                           (userFitnessLevel === 'Intermediate' && ex.difficulty === 'Beginner') ||
                           (userFitnessLevel === 'Advanced' && (ex.difficulty === 'Intermediate' || ex.difficulty === 'Beginner'));
        
        const equipmentMatch = hasEquipmentFor(ex);
        return levelMatch && equipmentMatch;
    });

    // Further filter by workout type preference (simple matching)
    if (userWorkoutType.includes('full body')) {
        // Already broadly filtered, try to ensure variety later
    } else if (userWorkoutType.includes('upper body')) {
        eligibleExercises = eligibleExercises.filter(ex => 
            ex.targetMuscleGroups.some(mg => ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'lats'].includes(mg.toLowerCase()))
        );
    } else if (userWorkoutType.includes('lower body')) {
        eligibleExercises = eligibleExercises.filter(ex => 
            ex.targetMuscleGroups.some(mg => ['quadriceps', 'glutes', 'hamstrings', 'calves'].includes(mg.toLowerCase()))
        );
    } else if (userWorkoutType.includes('core')) {
        eligibleExercises = eligibleExercises.filter(ex => 
            ex.targetMuscleGroups.some(mg => ['core', 'abs', 'obliques'].includes(mg.toLowerCase()))
        );
    } else if (userWorkoutType.includes('cardio')) {
        eligibleExercises = eligibleExercises.filter(ex => ex.type === 'Cardio' || ex.targetMuscleGroups.includes('Cardio'));
    }

    // Prioritize by target muscle groups if specified
    if (userTargetMuscles.length > 0) {
        const targeted = eligibleExercises.filter(ex => 
            userTargetMuscles.some(um => ex.targetMuscleGroups.map(em => em.toLowerCase()).includes(um))
        );
        if (targeted.length >= 3) { // Ensure we have enough targeted exercises
             eligibleExercises = targeted; // Prioritize these
        }
    }
    
    // Shuffle eligible exercises to get variety
    eligibleExercises.sort(() => 0.5 - Math.random());

    // Select 3-5 exercises
    const numExercisesToSelect = Math.max(3, Math.min(5, eligibleExercises.length));
    selectedExercises = eligibleExercises.slice(0, numExercisesToSelect);

    // If not enough exercises found, add some general bodyweight ones as fallback
    if (selectedExercises.length < 3 && eligibleExercises.length === 0) { // if filter gave 0 results
        console.warn("[AI Workout] No specific exercises match criteria, falling back to general bodyweight.");
        let fallbackExercises = allMockExercises.filter(ex => 
            ex.equipmentNeeded.includes('Bodyweight') && 
            (ex.difficulty === userFitnessLevel || (userFitnessLevel === 'Intermediate' && ex.difficulty === 'Beginner'))
        ).sort(() => 0.5 - Math.random());
        selectedExercises = fallbackExercises.slice(0, Math.max(3, Math.min(5, fallbackExercises.length)));
    } else if (selectedExercises.length < 3) { // if filter gave <3 results
         console.warn(`[AI Workout] Only ${selectedExercises.length} specific exercises found, trying to add more general ones.`);
         let additionalNeeded = 3 - selectedExercises.length;
         let generalFallbacks = allMockExercises.filter(ex => 
            ex.equipmentNeeded.includes('Bodyweight') && 
            !selectedExercises.find(se => se._id.equals(ex._id)) && // not already selected
            (ex.difficulty === userFitnessLevel || (userFitnessLevel === 'Intermediate' && ex.difficulty === 'Beginner'))
         ).sort(() => 0.5 - Math.random()).slice(0, additionalNeeded);
         selectedExercises.push(...generalFallbacks);
    }


    // If still no exercises, return an error (should be rare with the large pool)
    if (selectedExercises.length === 0) {
        return res.status(400).json({ success: false, message: "Could not generate a workout plan with the selected criteria. Try broadening your preferences." });
    }

    // Dynamically set sets/reps/duration
    const finalMockExercises = selectedExercises.map((ex, index) => {
        let sets = 3;
        let reps = '10-12';
        let durationSeconds;

        if (ex.type === 'Core' || ex.name.toLowerCase().includes('plank')) {
            reps = undefined; // Core exercises often duration-based
            if (userFitnessLevel === 'Beginner') durationSeconds = 30;
            else if (userFitnessLevel === 'Intermediate') durationSeconds = 45;
            else durationSeconds = 60;
        } else if (ex.type === 'Cardio' && !ex.name.toLowerCase().includes('jump')) { // For non-explosive cardio
             sets = 1; // Often one continuous set for time
             reps = undefined;
             if (userFitnessLevel === 'Beginner') durationSeconds = 120; // 2 mins
             else if (userFitnessLevel === 'Intermediate') durationSeconds = 180; // 3 mins
             else durationSeconds = 300; // 5 mins (per cardio exercise in a circuit)
        } else { // Strength
            if (config.fitnessGoal === 'Strength Building') {
                sets = userFitnessLevel === 'Advanced' ? 5 : 4;
                reps = '5-8';
            } else if (config.fitnessGoal === 'Muscle Gain (Hypertrophy)') {
                sets = userFitnessLevel === 'Advanced' ? 4 : 3;
                reps = '8-12';
            } else if (config.fitnessGoal === 'Endurance') {
                sets = 3;
                reps = '15-20';
            } else { // General fitness / Weight Loss
                sets = 3;
                reps = userFitnessLevel === 'Beginner' ? '8-10' : '10-15';
            }
        }
        
        // For AMRAP (As Many Reps As Possible)
        if (ex.name.toLowerCase().includes('push-up') && config.fitnessGoal !== 'Strength Building') {
            reps = 'AMRAP';
        }


        return {
            _id: ex._id, // Use the ObjectId from the mock pool
            exerciseId: ex._id.toString(), // Keep as string for client-side PlannedExercise compatibility
            name: ex.name,
            type: ex.type,
            targetMuscleGroups: ex.targetMuscleGroups,
            equipment: ex.equipmentNeeded.join(', '), // Convert array to string for schema
            description: `Mock description for ${ex.name}. Level: ${ex.difficulty}. Equipment: ${ex.equipmentNeeded.join(', ')}.`,
            videoUrl: ex.videoUrl,
            sets: sets.toString(), // Ensure sets is a string as per some client expectations
            reps: reps,
            durationSeconds: durationSeconds,
            order: index + 1,
            // We might want to add 'instructions' here if the mock pool contains them
        };
    });


    // 3. MOCK AI Response - Create a plausible UserWorkoutPlan object
    const mockPlanName = `AI ${config.fitnessGoal} Plan (${config.fitnessLevel})`;
    const planDescription = `An AI-generated mock workout plan for ${config.fitnessGoal}, tailored for a ${config.fitnessLevel} fitness level. Uses equipment: ${config.availableEquipment.join(', ')}. Workout Type: ${config.workoutTypePreferences}.`;


    const finalPlan = {
      _id: new ObjectId(),
      userId: actualUserId,
      planName: mockPlanName,
      description: planDescription,
      exercises: finalMockExercises,
      createdAt: new Date(),
      updatedAt: new Date(),
      isAIGenerated: true,
    };

    // 4. Save the AI-generated (mock) plan to the database
    const userWorkoutPlansCollection = db.collection('userWorkoutPlans');
    const dbResult = await userWorkoutPlansCollection.insertOne(finalPlan);

    console.log(`[AI Workout] Successfully inserted MOCK AI workout plan ${dbResult.insertedId} for user ${actualUserId.toHexString()}.`);

    res.status(201).json({
      success: true,
      message: 'AI workout plan generated and saved successfully (MOCK DATA)!',
      plan: finalPlan
    });

  } catch (error) {
    console.error('[AI Workout] Error generating AI workout plan:', error);
    res.status(500).json({ success: false, message: 'Server error during AI workout plan generation.', errorDetails: error.toString() });
  }
});

// --- Progress Log Schemas and Models (Conceptual - Mongoose would handle this) ---
// For a non-Mongoose setup, you'd just structure your objects like this.
// interface ProgressMeasurement {
//   chestCm?: number;
//   waistCm?: number;
//   hipsCm?: number;
//   leftArmCm?: number;
//   rightArmCm?: number;
//   leftThighCm?: number;
//   rightThighCm?: number;
//   notes?: string;
// }
// interface ProgressLog {
//   _id: ObjectId;
//   userId: ObjectId;
//   date: Date; // Stored as ISO string, converted to Date object
//   weightKg: number;
//   bodyFatPercentage?: number;
//   measurements?: ProgressMeasurement;
//   createdAt: Date;
//   updatedAt: Date;
// }

// --- Progress Log API Endpoints ---

// POST /api/progress - Add a new progress log
app.post('/api/progress', verifyToken, async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const userIdFromToken = req.user.id; // Get userId from verified token
    const { date, weightKg, bodyFatPercentage, measurements } = req.body;

    if (!userIdFromToken || !ObjectId.isValid(userIdFromToken)) {
      return res.status(400).json({ success: false, message: 'Valid User ID not found in token.' });
    }
    if (!date || !weightKg) {
      return res.status(400).json({ success: false, message: 'Date and Weight (kg) are required.' });
    }
    if (typeof weightKg !== 'number' || weightKg <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid weight. Must be a positive number.' });
    }
    if (bodyFatPercentage !== undefined && (typeof bodyFatPercentage !== 'number' || bodyFatPercentage < 0 || bodyFatPercentage > 100)) {
        return res.status(400).json({ success: false, message: 'Invalid body fat percentage.' });
    }
    // Add more validation for measurements if needed

    const progressLogsCollection = db.collection('progressLogs');
    
    const newLog = {
      _id: new ObjectId(),
      userId: new ObjectId(userIdFromToken),
      date: new Date(date), // Ensure date is stored as a Date object
      weightKg: parseFloat(weightKg),
      ...(bodyFatPercentage !== undefined && { bodyFatPercentage: parseFloat(bodyFatPercentage) }),
      ...(measurements && { measurements: measurements }), // measurements should be an object
      photoUrls: [], // Initialize with an empty array for photos
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await progressLogsCollection.insertOne(newLog);

    res.status(201).json({
      success: true,
      message: 'Progress log added successfully!',
      logId: result.insertedId,
      log: newLog
    });

  } catch (error) {
    console.error('Error adding progress log:', error);
    if (error.message && error.message.toLowerCase().includes('objectid')) {
        return res.status(400).json({ success: false, message: 'Invalid User ID format in token processing.'});
    }
    res.status(500).json({ success: false, message: 'Server error adding progress log.', errorDetails: error.toString() });
  }
});

// GET /api/progress/user/:userId - Get all progress logs for a user
// Note: :userId in path is a bit redundant if always using token's userId.
// Kept for now if you want to allow admins to fetch for others, but verifyToken protects it.
app.get('/api/progress/user/:userId', verifyToken, async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const userIdFromToken = req.user.id;
    const requestedUserId = req.params.userId;

    if (!ObjectId.isValid(requestedUserId) || !ObjectId.isValid(userIdFromToken)) {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.' });
    }
    
    // Security check: Ensure the token user matches the requested user ID
    // Or, if you have admin roles, you could allow admins to fetch any user's data.
    // For now, strict check: user can only fetch their own logs.
    if (userIdFromToken !== requestedUserId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only fetch your own progress logs.' });
    }

    const progressLogsCollection = db.collection('progressLogs');
    const logs = await progressLogsCollection.find({ userId: new ObjectId(requestedUserId) }).sort({ date: -1 }).toArray(); // Sort by date descending

    res.status(200).json({
      success: true,
      logs: logs,
    });

  } catch (error) {
    console.error('Error fetching user progress logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching progress logs.', errorDetails: error.toString() });
  }
});

// PUT /api/progress/:logId - Update an existing progress log
app.put('/api/progress/:logId', verifyToken, async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const userIdFromToken = req.user.id;
    const logIdToUpdate = req.params.logId;
    const { date, weightKg, bodyFatPercentage, measurements } = req.body;

    if (!ObjectId.isValid(logIdToUpdate) || !ObjectId.isValid(userIdFromToken)) {
      return res.status(400).json({ success: false, message: 'Invalid Log ID or User ID format.' });
    }

    // Validation for inputs
    if (!date && weightKg === undefined && bodyFatPercentage === undefined && measurements === undefined) {
        return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }
    if (weightKg !== undefined && (typeof weightKg !== 'number' || weightKg <= 0)) {
        return res.status(400).json({ success: false, message: 'Invalid weight. Must be a positive number.' });
    }
     if (bodyFatPercentage !== undefined && (typeof bodyFatPercentage !== 'number' || bodyFatPercentage < 0 || bodyFatPercentage > 100)) {
        return res.status(400).json({ success: false, message: 'Invalid body fat percentage.' });
    }

    const progressLogsCollection = db.collection('progressLogs');
    
    // First, ensure the log exists and belongs to the user making the request
    const existingLog = await progressLogsCollection.findOne({ 
        _id: new ObjectId(logIdToUpdate), 
        userId: new ObjectId(userIdFromToken) 
    });

    if (!existingLog) {
      return res.status(404).json({ success: false, message: 'Progress log not found or you do not have permission to update it.' });
    }

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (weightKg !== undefined) updateData.weightKg = parseFloat(weightKg);
    if (bodyFatPercentage !== undefined) updateData.bodyFatPercentage = parseFloat(bodyFatPercentage);
    else if (bodyFatPercentage === null) updateData.bodyFatPercentage = null; // Allow clearing it
    if (measurements) updateData.measurements = measurements; // Overwrites all measurements
    else if (measurements === null) updateData.measurements = null; // Allow clearing all measurements
    
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1 && updateData.updatedAt) { // Only updatedAt
         return res.status(400).json({ success: false, message: 'No actual data fields provided for update.' });
    }


    const result = await progressLogsCollection.updateOne(
      { _id: new ObjectId(logIdToUpdate), userId: new ObjectId(userIdFromToken) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      // This case should ideally be caught by the findOne check above, but as a fallback.
      return res.status(404).json({ success: false, message: 'Progress log not found or permission denied.' });
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      // Data was the same as existing, or no actual change applied.
      // Fetch the current log to return.
       const currentLog = await progressLogsCollection.findOne({ _id: new ObjectId(logIdToUpdate) });
       return res.status(200).json({ success: true, message: 'No changes applied, data was identical.', log: currentLog });
    }
    
    const updatedLog = await progressLogsCollection.findOne({ _id: new ObjectId(logIdToUpdate) });

    res.status(200).json({
      success: true,
      message: 'Progress log updated successfully!',
      log: updatedLog
    });

  } catch (error) {
    console.error('Error updating progress log:', error);
    res.status(500).json({ success: false, message: 'Server error updating progress log.', errorDetails: error.toString() });
  }
});

// DELETE /api/progress/:logId - Delete a progress log
app.delete('/api/progress/:logId', verifyToken, async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  try {
    const userIdFromToken = req.user.id;
    const logIdToDelete = req.params.logId;

    if (!ObjectId.isValid(logIdToDelete) || !ObjectId.isValid(userIdFromToken)) {
      return res.status(400).json({ success: false, message: 'Invalid Log ID or User ID format.' });
    }

    const progressLogsCollection = db.collection('progressLogs');
    
    // First, find the log to get photoUrls for deletion from filesystem
    const logToDeleteDoc = await progressLogsCollection.findOne({
        _id: new ObjectId(logIdToDelete), 
        userId: new ObjectId(userIdFromToken)
    });

    if (!logToDeleteDoc) {
      return res.status(404).json({ success: false, message: 'Progress log not found or you do not have permission to delete it.' });
    }

    // Delete the log entry from DB
    const result = await progressLogsCollection.deleteOne({ 
        _id: new ObjectId(logIdToDelete), 
        // userId: new ObjectId(userIdFromToken) // Already confirmed ownership with findOne
    });

    if (result.deletedCount === 0) {
      // This shouldn't happen if findOne found it, but as a safeguard
      return res.status(404).json({ success: false, message: 'Progress log not found during delete operation or permission denied.' });
    }

    // If log had photos, delete them from the filesystem
    if (logToDeleteDoc.photoUrls && logToDeleteDoc.photoUrls.length > 0) {
      logToDeleteDoc.photoUrls.forEach(url => {
        try {
          // Client-facing URL is like /uploads/progress_photos/filename.jpg
          // Server path needs to be relative to __dirname, e.g., public/uploads/progress_photos/filename.jpg
          const filename = path.basename(url); 
          const filePath = path.join(uploadDir, filename); // uploadDir is already absolute path to public/uploads/progress_photos
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted photo: ${filePath}`);
          } else {
            console.warn(`Photo not found for deletion: ${filePath}`);
          }
        } catch (fileError) {
          console.error(`Error deleting photo file ${url}:`, fileError);
          // Continue even if a file deletion fails, the DB entry is already gone.
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progress log and associated photos deleted successfully.'
    });

  } catch (error) {
    console.error('Error deleting progress log:', error);
    res.status(500).json({ success: false, message: 'Server error deleting progress log.', errorDetails: error.toString() });
  }
});

// NEW ENDPOINT: POST /api/progress/:logId/photos - Upload photos for a specific progress log
app.post('/api/progress/:logId/photos', verifyToken, upload.array('progressPhotos', 5), async (req, res) => { // Allows up to 5 photos
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }
  if (req.fileValidationError) {
    return res.status(400).json({ success: false, message: req.fileValidationError });
  }

  try {
    const userIdFromToken = req.user.id;
    const logId = req.params.logId;

    if (!ObjectId.isValid(logId) || !ObjectId.isValid(userIdFromToken)) {
      return res.status(400).json({ success: false, message: 'Invalid Log ID or User ID format.' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No photo files were uploaded.' });
    }

    const progressLogsCollection = db.collection('progressLogs');

    // Check if the log exists and belongs to the user
    const logEntry = await progressLogsCollection.findOne({
      _id: new ObjectId(logId),
      userId: new ObjectId(userIdFromToken)
    });

    if (!logEntry) {
      // If log not found, delete uploaded files to prevent orphans
      if (files && Array.isArray(files)) {
        files.forEach(file => {
            try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } 
            catch (e) { console.error("Error deleting orphaned file during upload: ", e); }
        });
      }
      return res.status(404).json({ success: false, message: 'Progress log not found or permission denied.' });
    }

    // Construct URLs for the uploaded photos.
    // Server serves the 'public' folder, so URLs should start with /public
    const photoUrls = files.map(file => `/public/uploads/progress_photos/${file.filename}`);

    // Update the log entry with the new photo URLs
    const result = await progressLogsCollection.updateOne(
      { _id: new ObjectId(logId) },
      { $push: { photoUrls: { $each: photoUrls } }, $set: { updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      // This might happen if $push didn't add anything, though unlikely here if files were processed
      // For safety, clean up files if update didn't modify
      if (files && Array.isArray(files)) {
        files.forEach(file => {
            try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }
            catch (e) { console.error("Error deleting file after failed DB update: ", e); }
        });
      }
      return res.status(500).json({ success: false, message: 'Failed to update progress log with photo URLs.' });
    }
    
    const updatedLog = await progressLogsCollection.findOne({ _id: new ObjectId(logId) });

    res.status(200).json({
      success: true,
      message: 'Photos uploaded and linked to progress log successfully!',
      log: updatedLog
    });

  } catch (error) {
    console.error('Error uploading progress photos:', error);
    // If an error occurs after files are uploaded, attempt to delete them
    if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => {
            try {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (cleanupError) {
                console.error('Error cleaning up uploaded file:', cleanupError);
            }
        });
    }
    res.status(500).json({ success: false, message: 'Server error uploading photos.', errorDetails: error.toString() });
  }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

