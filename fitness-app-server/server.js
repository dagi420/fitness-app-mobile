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
    // Accept images only
    if (!file.originalname.match(/\\.(jpg|jpeg|png|gif)$/i)) {
        req.fileValidationError = 'Only image files (jpg, jpeg, png, gif) are allowed!';
        return cb(null, false); // Reject file
    }
    cb(null, true); // Accept file
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

        // Define some detailed mock exercises to be reused in workouts
        const mockSquat = {
            _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f01"), // Fixed ObjectId for consistency if referenced elsewhere
            name: 'Barbell Squat',
            description: 'A compound exercise that works multiple muscle groups in the lower body and core.',
            muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
            equipment: 'Barbell, Squat Rack',
            difficulty: 'Intermediate',
            type: 'Strength',
            category: 'Lower Body',
            instructions: [
                'Stand with your feet shoulder-width apart, barbell on upper back.',
                'Keep chest up, back straight, lower hips as if sitting.',
                'Descend until thighs are parallel to floor.',
                'Push through heels to return to start.'
            ],
            imageUrl: 'https://via.placeholder.com/300x200.png?text=Barbell+Squat',
            videoUrl: 'https://www.youtube.com/watch?v=placeholder_squat_video'
        };

        const mockPushup = {
            _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f02"),
            name: 'Push-up',
            description: 'A classic bodyweight exercise for upper body strength.',
            muscleGroups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
            equipment: 'None (Bodyweight)',
            difficulty: 'Beginner',
            type: 'Strength',
            category: 'Upper Body',
            instructions: [
                'High plank position, hands slightly wider than shoulders.',
                'Lower body until chest nearly touches floor.',
                'Push back to start, core engaged.'
            ],
            imageUrl: 'https://via.placeholder.com/300x200.png?text=Push-up',
            videoUrl: 'https://www.youtube.com/watch?v=placeholder_pushup_video'
        };
        
        const mockPlank = {
            _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f03"),
            name: 'Plank',
            description: 'Isometric core exercise.',
            muscleGroups: ['Core', 'Abdominals'],
            equipment: 'None (Bodyweight)',
            difficulty: 'Beginner',
            type: 'Core',
            category: 'Core',
            instructions: [
                'Prop on forearms and toes, body straight.',
                'Engage core, hold position.'
            ],
            imageUrl: 'https://via.placeholder.com/300x200.png?text=Plank'
            // No video for plank
        };

        const mockWorkouts = [
            { 
                _id: new ObjectId(), 
                name: 'Full Body Blast', 
                description: 'A comprehensive workout targeting all major muscle groups.', 
                type: 'Full Body', 
                difficulty: 'Intermediate', 
                durationEstimateMinutes: 60,
                exercises: [ // Now using full ExerciseDetail objects
                    { ...mockSquat, sets: 3, reps: '8-12', order: 1 }, // Added sets, reps, order
                    { ...mockPushup, sets: 3, reps: 'As many as possible', order: 2 },
                    // Example: Adding another exercise inline for variety
                    { 
                        _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f04"),
                        name: 'Dumbbell Rows', 
                        description: 'Builds back strength.',
                        muscleGroups: ['Back', 'Biceps'],
                        equipment: 'Dumbbells, Bench',
                        difficulty: 'Intermediate',
                        type: 'Strength',
                        category: 'Upper Body',
                        instructions: ['Lean on bench, pull dumbbell to chest.'],
                        imageUrl: 'https://via.placeholder.com/300x200.png?text=DB+Rows',
                        sets: 3, reps: '10-15', order: 3 
                    }
                ]
            },
            { 
                _id: new ObjectId(), 
                name: 'Upper Body Strength', 
                description: 'Focus on building strength in your chest, back, shoulders, and arms.', 
                type: 'Upper Body', 
                difficulty: 'Beginner', 
                durationEstimateMinutes: 45,
                exercises: [
                    { 
                        _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f05"),
                        name: 'Bench Press', 
                        description: 'Primary chest builder.',
                        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
                        equipment: 'Barbell, Bench',
                        difficulty: 'Intermediate',
                        type: 'Strength',
                        category: 'Upper Body',
                        instructions: ['Lie on bench, lower bar to chest, press up.'],
                        imageUrl: 'https://via.placeholder.com/300x200.png?text=Bench+Press',
                        videoUrl: 'https://www.youtube.com/watch?v=placeholder_bench_video',
                        sets: 3, reps: '5-8', order: 1 
                    },
                    { ...mockPushup, sets: 3, reps: '10-15', order: 2 }, // Reusing push-up
                    { 
                        _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f06"),
                        name: 'Overhead Press', 
                        description: 'Builds shoulder strength.',
                        muscleGroups: ['Shoulders', 'Triceps'],
                        equipment: 'Barbell or Dumbbells',
                        difficulty: 'Intermediate',
                        type: 'Strength',
                        category: 'Upper Body',
                        instructions: ['Press weight overhead from shoulders.'],
                        imageUrl: 'https://via.placeholder.com/300x200.png?text=Overhead+Press',
                        sets: 3, reps: '8-12', order: 3 
                    }
                ]
            },
             { 
                _id: new ObjectId(), 
                name: 'Cardio Core Burner', 
                description: 'High-intensity cardio mixed with core-strengthening exercises.', 
                type: 'Cardio & Core', 
                difficulty: 'Advanced', 
                durationEstimateMinutes: 30,
                exercises: [
                    { 
                        _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f07"),
                        name: 'Burpees', 
                        description: 'Full body explosive exercise.',
                        muscleGroups: ['Full Body', 'Cardio'],
                        equipment: 'None (Bodyweight)',
                        difficulty: 'Advanced',
                        type: 'Cardio',
                        category: 'Cardio',
                        instructions: ['Squat, kick feet back, push-up, jump feet in, jump up.'],
                        imageUrl: 'https://via.placeholder.com/300x200.png?text=Burpees',
                        videoUrl: 'https://www.youtube.com/watch?v=placeholder_burpee_video',
                        sets: 4, reps: '15', order: 1 
                    },
                    { ...mockPlank, sets: 4, durationSeconds: 60, order: 2 }, // Using duration for plank
                    { 
                        _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f08"),
                        name: 'Mountain Climbers', 
                        description: 'Cardio and core.',
                        muscleGroups: ['Core', 'Cardio', 'Shoulders'],
                        equipment: 'None (Bodyweight)',
                        difficulty: 'Intermediate',
                        type: 'Cardio',
                        category: 'Cardio',
                        instructions: ['Plank position, alternate bringing knees to chest.'],
                        imageUrl: 'https://via.placeholder.com/300x200.png?text=Mountain+Climbers',
                        sets: 4, durationSeconds: 30, order: 3 // Using duration
                    }
                ]
            }
        ];
        await workoutsCollection.insertMany(mockWorkouts);
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
        const mockExercises = [
            {
                _id: new ObjectId(), 
                name: 'Barbell Squat',
                description: 'A compound exercise that works multiple muscle groups in the lower body and core. Focus on maintaining good form, keeping your back straight and squatting to at least parallel.',
                muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
                equipment: 'Barbell, Squat Rack',
                difficulty: 'Intermediate',
                type: 'Strength',
                category: 'Lower Body',
                instructions: [
                    'Stand with your feet shoulder-width apart, with the barbell resting on your upper back.',
                    'Keeping your chest up and back straight, lower your hips as if sitting in a chair.',
                    'Descend until your thighs are at least parallel to the floor.',
                    'Push through your heels to return to the starting position.'
                ],
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Barbell+Squat',
                videoUrl: 'https://www.youtube.com/watch?v=placeholder_squat_video' 
            },
            {
                _id: new ObjectId(), 
                name: 'Push-up', 
                description: 'A classic bodyweight exercise that builds upper body strength. Keep your body in a straight line from head to heels.',
                muscleGroups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
                equipment: 'None (Bodyweight)',
                difficulty: 'Beginner',
                type: 'Strength',
                category: 'Upper Body',
                instructions: [
                    'Start in a high plank position with your hands slightly wider than your shoulders.',
                    'Lower your body until your chest nearly touches the floor.',
                    'Push back up to the starting position, keeping your core engaged.'
                ],
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Push-up',
                videoUrl: 'https://www.youtube.com/watch?v=placeholder_pushup_video'
            },
            {
                _id: new ObjectId(), 
                name: 'Plank', 
                description: 'An isometric core strength exercise that involves maintaining a position similar to a push-up for the maximum possible time.',
                muscleGroups: ['Core', 'Abdominals', 'Obliques'],
                equipment: 'None (Bodyweight)',
                difficulty: 'Beginner',
                type: 'Core',
                category: 'Core',
                instructions: [
                    'Lie face down and prop yourself up on your forearms and toes, keeping your body in a straight line.',
                    'Engage your core and hold the position for the desired duration.'
                ],
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Plank'
            },
            {
                _id: new ObjectId(), 
                name: 'Dumbbell Bench Press', 
                description: 'A variation of the bench press using dumbbells, allowing for a greater range of motion and individual arm work.',
                muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
                equipment: 'Dumbbells, Bench',
                difficulty: 'Intermediate',
                type: 'Strength',
                category: 'Upper Body',
                instructions: [
                    'Lie on a bench with a dumbbell in each hand at chest level.',
                    'Push the dumbbells up until your arms are fully extended.',
                    'Lower the dumbbells slowly back to the starting position.'
                ],
                imageUrl: 'https://via.placeholder.com/300x200.png?text=DB+Bench+Press',
                videoUrl: 'https://www.youtube.com/watch?v=placeholder_db_bench_video'
            },
            {
                _id: new ObjectId(), 
                name: 'Running (Treadmill)', 
                description: 'A popular cardiovascular exercise that can be adjusted for various intensity levels.',
                muscleGroups: ['Legs', 'Cardiovascular System'],
                equipment: 'Treadmill',
                difficulty: 'Beginner',
                type: 'Cardio',
                category: 'Cardio',
                instructions: [
                    'Set the treadmill to your desired speed and incline.',
                    'Run or jog, maintaining good posture.',
                    'Cool down with a walk afterwards.'
                ],
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Treadmill+Running'
            }
        ];
        await exercisesCollection.insertMany(mockExercises);
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
      const mockPlanId = new ObjectId();
      const mockMealId1 = new ObjectId();
      const mockMealId2 = new ObjectId();
      const mockFoodId1 = new ObjectId();
      const mockFoodId2 = new ObjectId();
      const mockFoodId3 = new ObjectId();

      const mockDietPlan = {
        _id: mockPlanId,
        userId: new ObjectId(userId),
        planName: 'Balanced Lifestyle Diet (Mock)',
        description: 'A sample diet plan focusing on balanced macronutrients for a healthy lifestyle.',
        dailyCaloricTarget: 2200,
        macronutrientTargets: { proteinGr: 150, carbsGr: 250, fatGr: 70 },
        meals: [
          {
            _id: mockMealId1,
            mealName: 'Breakfast',
            timeSuggestion: '08:00',
            foodItems: [
              {
                _id: mockFoodId1,
                foodName: 'Oatmeal',
                quantity: '1 cup cooked',
                calories: 300,
                macronutrients: { proteinGr: 10, carbsGr: 55, fatGr: 5 }
              },
              {
                _id: mockFoodId2,
                foodName: 'Berries',
                quantity: '1/2 cup',
                calories: 40,
                macronutrients: { proteinGr: 1, carbsGr: 10, fatGr: 0 }
              }
            ]
          },
          {
            _id: mockMealId2,
            mealName: 'Lunch',
            timeSuggestion: '13:00',
            foodItems: [
              {
                _id: mockFoodId3,
                foodName: 'Grilled Chicken Salad',
                quantity: 'Large bowl',
                calories: 550,
                macronutrients: { proteinGr: 50, carbsGr: 30, fatGr: 25 }
              }
            ]
          }
          // Add more mock meals (Snack, Dinner) if desired
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIGenerated: false,
      };
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
    console.log("[AI Workout] Generated Prompt (for future AI use):\\n", workoutPrompt);

    // --- Expanded Mock Exercise Pool ---
    const allMockExercises = [
      // Bodyweight - Beginner
      { _id: new ObjectId(), name: 'Jumping Jacks', description: 'A full-body cardiovascular exercise that involves jumping to a position with the legs spread wide and the hands touching overhead, and then returning to a position with the feet together and the arms at the sides.', type: 'Cardio', category: 'Cardio', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Full Body', 'Cardio'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Bodyweight Squats', description: 'A fundamental lower body exercise that strengthens the quadriceps, glutes, and hamstrings. Focus on keeping your chest up and back straight.', type: 'Strength', category: 'Lower Body', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Quadriceps', 'Glutes'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Wall Push-ups', description: 'An introductory upper body exercise that targets the chest, shoulders, and triceps, performed by pushing against a wall.', type: 'Strength', category: 'Upper Body', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Knee Push-ups', description: 'A modified push-up performed on the knees, making it easier to build upper body strength before progressing to standard push-ups.', type: 'Strength', category: 'Upper Body', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Plank (from knees)', description: 'A core-strengthening exercise performed by holding a push-up like position on forearms and knees, engaging the abdominal muscles.', type: 'Core', category: 'Core', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Core', 'Abs'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Bird Dog', description: 'A core stability exercise that involves extending one arm and the opposite leg simultaneously while keeping the torso stable. Improves balance and coordination.', type: 'Core', category: 'Core', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Core', 'Back'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Glute Bridges', description: 'An exercise that targets the glutes and hamstrings by lifting the hips off the floor from a supine position.', type: 'Strength', category: 'Lower Body', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Glutes', 'Hamstrings'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Lunges (alternating)', description: 'A lower body exercise that works the quadriceps, glutes, and hamstrings by stepping forward and lowering the hips until both knees are bent at a 90-degree angle.', type: 'Strength', category: 'Lower Body', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Quadriceps', 'Glutes'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Crunches', description: 'A classic abdominal exercise that targets the upper abs by curling the shoulders towards the pelvis.', type: 'Core', category: 'Core', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Abs'], videoUrl: 'placeholder_url' },


      // Bodyweight - Intermediate
      { _id: new ObjectId(), name: 'Standard Push-ups', description: 'A calisthenic exercise performed by raising and lowering the body using the arms. Strengthens chest, shoulders, and triceps.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Full Plank', description: 'An isometric core strength exercise that involves maintaining a position similar to a push-up for the maximum possible time, engaging abs, back, and shoulders.', type: 'Core', category: 'Core', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Core', 'Abs'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Burpees (no push-up)', description: 'A full-body exercise used in strength training and as an aerobic exercise. This version omits the push-up component for reduced difficulty.', type: 'Cardio', category: 'Full Body', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Full Body', 'Cardio'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Jump Squats', description: 'An explosive lower-body exercise that combines a squat with a vertical jump, building power and strength in the legs.', type: 'Strength', category: 'Plyometrics', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Quadriceps', 'Glutes', 'Calves'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Mountain Climbers', description: 'A dynamic, full-body exercise that mimics the motion of climbing. It builds cardio endurance, core strength, and agility.', type: 'Cardio', category: 'Core', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Core', 'Cardio', 'Shoulders'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Tricep Dips (using chair/bench)', description: 'An effective exercise for targeting the triceps, performed by lowering and raising the body using a chair or bench for support.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight', 'Chair/Bench'], targetMuscleGroups: ['Triceps', 'Chest'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Walking Lunges', description: 'A variation of the static lunge where you step forward into a lunge with one leg, then bring the back foot forward to meet it, and repeat with the other leg, moving across the floor.', type: 'Strength', category: 'Lower Body', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Leg Raises', description: 'A core exercise that targets the lower abdominal muscles by lying flat and raising the legs towards the ceiling.', type: 'Core', category: 'Core', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Lower Abs', 'Hip Flexors'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Russian Twists (bodyweight)', description: 'A core exercise that targets the obliques by sitting with knees bent and torso leaned back, then twisting the torso from side to side.', type: 'Core', category: 'Core', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Obliques', 'Abs'], videoUrl: 'placeholder_url' },


      // Bodyweight - Advanced
      { _id: new ObjectId(), name: 'Full Burpees (with push-up)', description: 'A challenging full-body exercise combining a squat, push-up, and jump. Excellent for cardiovascular fitness and strength.', type: 'Cardio', category: 'Full Body', difficulty: 'Advanced', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Full Body', 'Cardio', 'Strength'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Pistol Squats (assisted or full)', description: 'A single-leg squat that requires significant strength, balance, and mobility. Can be done assisted or unassisted.', type: 'Strength', category: 'Lower Body', difficulty: 'Advanced', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Quadriceps', 'Glutes', 'Balance'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Pull-ups (if bar available)', description: 'An upper-body compound pulling exercise where the body is suspended by the arms, gripping a bar, and pulled up.', type: 'Strength', category: 'Upper Body', difficulty: 'Advanced', equipmentNeeded: ['Pull-up Bar', 'Bodyweight'], targetMuscleGroups: ['Back', 'Biceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Handstand Push-ups (against wall)', description: 'An advanced push-up variation performed in a handstand position, typically against a wall for support. Targets shoulders and triceps.', type: 'Strength', category: 'Upper Body', difficulty: 'Advanced', equipmentNeeded: ['Bodyweight', 'Wall'], targetMuscleGroups: ['Shoulders', 'Triceps'], videoUrl: 'placeholder_url' },

      // Dumbbells - Beginner
      { _id: new ObjectId(), name: 'Dumbbell Goblet Squat', description: 'A squat variation where a single dumbbell is held vertically against the chest. Excellent for teaching squat form and engaging the core.', type: 'Strength', category: 'Lower Body', difficulty: 'Beginner', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Quadriceps', 'Glutes'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Rows (two arm)', description: 'A back-strengthening exercise performed by pulling dumbbells towards the chest while hinged at the hips. Targets lats and biceps.', type: 'Strength', category: 'Upper Body', difficulty: 'Beginner', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Back', 'Biceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Bench Press (floor or bench)', description: 'A chest exercise using dumbbells, which allows for a greater range of motion compared to a barbell. Can be done on a bench or the floor.', type: 'Strength', category: 'Upper Body', difficulty: 'Beginner', equipmentNeeded: ['Dumbbells', 'Bench (optional)'], targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Bicep Curls', description: 'An isolation exercise for the biceps, performed by curling dumbbells up towards the shoulders.', type: 'Strength', category: 'Upper Body', difficulty: 'Beginner', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Biceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Overhead Press (seated/standing)', description: 'A shoulder exercise performed by pressing dumbbells overhead. Can be done seated for more stability or standing for core engagement.', type: 'Strength', category: 'Upper Body', difficulty: 'Beginner', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Shoulders', 'Triceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Lunges', description: 'Lunges performed while holding dumbbells, adding resistance to this effective lower body exercise for quads, glutes, and hamstrings.', type: 'Strength', category: 'Lower Body', difficulty: 'Beginner', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Romanian Deadlifts (RDLs)', description: 'A hinge movement targeting the hamstrings and glutes, performed by lowering dumbbells towards the floor while keeping legs relatively straight and back flat.', type: 'Strength', category: 'Lower Body', difficulty: 'Beginner', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Hamstrings', 'Glutes', 'Lower Back'], videoUrl: 'placeholder_url' },

      // Dumbbells - Intermediate
      { _id: new ObjectId(), name: 'Dumbbell Bulgarian Split Squats', description: 'A challenging single-leg squat variation with the rear foot elevated on a bench. Builds strength and stability in the quads and glutes.', type: 'Strength', category: 'Lower Body', difficulty: 'Intermediate', equipmentNeeded: ['Dumbbells', 'Bench'], targetMuscleGroups: ['Quadriceps', 'Glutes'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Renegade Rows', description: 'A compound exercise combining a plank with a dumbbell row, challenging core stability, back, and arm strength.', type: 'Strength', category: 'Full Body', difficulty: 'Intermediate', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Back', 'Core', 'Biceps', 'Shoulders'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Flyes', description: 'An isolation exercise for the chest, performed by extending dumbbells out to the sides and then bringing them together over the chest.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Dumbbells', 'Bench'], targetMuscleGroups: ['Chest', 'Shoulders'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Hammer Curls', description: 'A bicep curl variation with a neutral grip (palms facing each other), which also targets the brachialis and forearm muscles.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Biceps', 'Forearms'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Lateral Raises', description: 'A shoulder exercise that isolates the lateral (side) deltoids by raising dumbbells out to the sides.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Dumbbells'], targetMuscleGroups: ['Shoulders'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Dumbbell Step-ups', description: 'A lower body exercise where you step onto an elevated surface (bench or box) while holding dumbbells. Targets quads and glutes.', type: 'Strength', category: 'Lower Body', difficulty: 'Intermediate', equipmentNeeded: ['Dumbbells', 'Bench/Box'], targetMuscleGroups: ['Quadriceps', 'Glutes'], videoUrl: 'placeholder_url' },

      // Barbell - Intermediate (assuming user has access if they list barbell)
      { _id: new ObjectId(), name: 'Barbell Back Squat', description: 'A fundamental compound exercise for lower body strength, involving squatting with a barbell resting across the upper back.', type: 'Strength', category: 'Lower Body', difficulty: 'Intermediate', equipmentNeeded: ['Barbell', 'Squat Rack'], targetMuscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Barbell Bench Press', description: 'A core upper body strength exercise where a barbell is lowered to the chest and then pressed back up. Targets chest, shoulders, and triceps.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Barbell', 'Bench', 'Rack'], targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Barbell Deadlift', description: 'A full-body strength exercise where a loaded barbell is lifted off the ground to the hips, then lowered back. Engages posterior chain, back, and legs.', type: 'Strength', category: 'Full Body', difficulty: 'Intermediate', equipmentNeeded: ['Barbell'], targetMuscleGroups: ['Full Body', 'Posterior Chain', 'Back', 'Legs'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Barbell Overhead Press (Strict)', description: 'An upper body pressing movement where a barbell is pressed strictly overhead from the shoulders. Builds shoulder and tricep strength.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Barbell', 'Rack'], targetMuscleGroups: ['Shoulders', 'Triceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Barbell Rows (Pendlay/Bent-over)', description: 'A back exercise performed by pulling a barbell towards the torso while bent over. Targets lats, rhomboids, and biceps.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Barbell'], targetMuscleGroups: ['Back', 'Biceps', 'Lats'], videoUrl: 'placeholder_url' },

      // Kettlebell - Intermediate
      { _id: new ObjectId(), name: 'Kettlebell Swings (Russian)', description: 'A dynamic, hip-hinge movement that builds explosive power in the glutes, hamstrings, and core. The kettlebell is swung to chest height.', type: 'Strength', category: 'Full Body', difficulty: 'Intermediate', equipmentNeeded: ['Kettlebell'], targetMuscleGroups: ['Glutes', 'Hamstrings', 'Core', 'Back'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Kettlebell Goblet Squat', description: 'A squat variation holding a kettlebell by the horns at chest level. Promotes good squat mechanics and core engagement.', type: 'Strength', category: 'Lower Body', difficulty: 'Intermediate', equipmentNeeded: ['Kettlebell'], targetMuscleGroups: ['Quadriceps', 'Glutes'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Kettlebell Turkish Get-up', description: 'A complex, full-body exercise that involves transitioning from lying on the floor to standing, all while holding a kettlebell overhead. Builds stability and strength.', type: 'Strength', category: 'Full Body', difficulty: 'Advanced', equipmentNeeded: ['Kettlebell'], targetMuscleGroups: ['Full Body', 'Core', 'Shoulders'], videoUrl: 'placeholder_url' },

      // Resistance Bands - Beginner/Intermediate
      { _id: new ObjectId(), name: 'Resistance Band Pull-Aparts', description: 'An exercise for upper back and shoulder health, performed by pulling a resistance band apart in front of the chest.', type: 'Strength', category: 'Upper Body', difficulty: 'Beginner', equipmentNeeded: ['Resistance Band'], targetMuscleGroups: ['Upper Back', 'Shoulders'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Resistance Band Glute Bridges', description: 'Glute bridges with a resistance band around the thighs to increase glute activation.', type: 'Strength', category: 'Lower Body', difficulty: 'Beginner', equipmentNeeded: ['Resistance Band'], targetMuscleGroups: ['Glutes'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Resistance Band Bicep Curls', description: 'Bicep curls using a resistance band for tension. Good for arm strength and muscle tone.', type: 'Strength', category: 'Upper Body', difficulty: 'Beginner', equipmentNeeded: ['Resistance Band'], targetMuscleGroups: ['Biceps'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Resistance Band Squats', description: 'Squats performed with a resistance band, typically looped under the feet and over the shoulders or held, to add resistance throughout the movement.', type: 'Strength', category: 'Lower Body', difficulty: 'Intermediate', equipmentNeeded: ['Resistance Band'], targetMuscleGroups: ['Quadriceps', 'Glutes'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Resistance Band Rows', description: 'A back exercise using a resistance band, mimicking cable rows. Anchor the band and pull towards your torso.', type: 'Strength', category: 'Upper Body', difficulty: 'Intermediate', equipmentNeeded: ['Resistance Band'], targetMuscleGroups: ['Back', 'Biceps'], videoUrl: 'placeholder_url' },
      
      // Flexibility/Mobility - All Levels (can be adjusted)
      { _id: new ObjectId(), name: 'Cat-Cow Stretch', description: 'A gentle yoga pose that involves moving the spine from a rounded (cat) to an arched (cow) position. Improves spinal flexibility and relieves tension.', type: 'Flexibility', category: 'Mobility', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Spine', 'Core'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Downward-Facing Dog', description: 'A common yoga pose that stretches the hamstrings, calves, shoulders, and back, while also building upper body strength.', type: 'Flexibility', category: 'Mobility', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Hamstrings', 'Calves', 'Shoulders', 'Back'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Pigeon Stretch', description: 'A hip-opening stretch that targets the hip flexors and glutes. Effective for improving hip mobility.', type: 'Flexibility', category: 'Mobility', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Hips', 'Glutes'], videoUrl: 'placeholder_url' },
      { _id: new ObjectId(), name: 'Thoracic Spine Windmills', description: 'A mobility exercise to improve rotation in the thoracic (mid-upper) spine. Often done lying on one side.', type: 'Flexibility', category: 'Mobility', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Thoracic Spine', 'Shoulders'], videoUrl: 'placeholder_url' },
    ];

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

    // Construct URLs for the uploaded photos (relative to what client will request)
    // Server serves /public, so URLs should be /uploads/progress_photos/filename.jpg from client perspective
    const photoUrls = files.map(file => `/uploads/progress_photos/${file.filename}`);

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

