require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
let db;

MongoClient.connect(mongoUri)
  .then(client => {
    console.log('Connected successfully to MongoDB');
    db = client.db(dbName);
  })
  .catch(error => {
    console.error('Could not connect to MongoDB', error);
    process.exit(1); // Exit if DB connection fails
  });

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
    // In a real app, you'd generate a JWT token here and send it back
    // For now, just send user info (excluding password)
    const userForClient = { ...user };
    delete userForClient.hashedPassword; // IMPORTANT: Never send the hash to the client

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: userForClient,
      token: '15a79114a402df571616fad89eecb70f89c2fa4a969584f2c2e66f37a636a21da1c0f8c193b1c399b74d753d7056ea580937b530325d00582c62eda3b3a1cc815d355281ea1177e92ad69adcd76e7b55ba934b89c570966ac53b480a774f35345c79db3abb0c2ccec155fc859b45f5b02ee4d27a69d570729f77b19a4a0d87f1abafb36d6fd8aa2f508adfb6185de77827a26e94963f742c44d62633229978ec47b6347b4ba7f81a39689b17f31ce8975f45f0b496b12e809367b81de9c47066d2988fda807c29d6e0d0ba2f4f8dad9a172996fcad9c4181d15655a8cbd7d650adbdbccb2d525d238a1caa1d1528e9871a2a4bfabc7bb321fa1c5bafba271d24d221c4013ffb194b8045f73040a1437b4ea685c7b008eb7391815e72a6a3244639efdb14c30d007cf8de52a3bb30f91299ded181364ec9c65a4b52212af60007ba2a2ef88dad47074738b5adf8a72b6118f122c8d6acf3ab7fb627f06a9bc2ffabe0f243b2800c54c0fb0251ebb8aabbfab71fced0f56351f79606107f146dbe78164f8c910e68780eecebda0b0bdb895957274985f162d8d5127119f3cc47842d8f403c7951b47b61c56fb3941e64bca68ae6c80dbe953e9510849154f9e9df2944562a5f6bd345ac2bbd5a2f97936f31ceaeb3946a3579b94a63639e996287' // Example for future
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
        const mockWorkouts = [
            { 
                _id: new ObjectId(), 
                name: 'Full Body Blast', 
                description: 'A comprehensive workout targeting all major muscle groups.', 
                type: 'Full Body', 
                difficulty: 'Intermediate', 
                durationEstimateMinutes: 60,
                exercises: [ // Simplified exercise list for now
                    { exerciseName: 'Squats', sets: 3, reps: '8-12' },
                    { exerciseName: 'Push-ups', sets: 3, reps: 'As many as possible' },
                    { exerciseName: 'Rows', sets: 3, reps: '10-15' }
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
                    { exerciseName: 'Bench Press', sets: 3, reps: '5-8' },
                    { exerciseName: 'Pull-ups/Lat Pulldowns', sets: 3, reps: '5-10' },
                    { exerciseName: 'Overhead Press', sets: 3, reps: '8-12' }
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
                    { exerciseName: 'Burpees', sets: 4, reps: '15' },
                    { exerciseName: 'Plank', sets: 4, reps: '60 seconds' },
                    { exerciseName: 'Mountain Climbers', sets: 4, reps: '30 seconds' }
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
                exerciseName: 'Barbell Squat', 
                type: 'Strength', 
                difficulty: 'Intermediate',
                targetMuscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
                equipmentNeeded: ['Barbell', 'Squat Rack'],
                description: 'A compound exercise that works multiple muscle groups in the lower body and core. Focus on maintaining good form, keeping your back straight and squatting to at least parallel.',
                // videoUrl: 'https://example.com/squat_video',
                // imageUrl: 'https://example.com/squat_image.jpg'
            },
            {
                _id: new ObjectId(), 
                exerciseName: 'Push-up', 
                type: 'Strength', 
                difficulty: 'Beginner',
                targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
                equipmentNeeded: ['None (Bodyweight)'],
                description: 'A classic bodyweight exercise that builds upper body strength. Keep your body in a straight line from head to heels.',
            },
            {
                _id: new ObjectId(), 
                exerciseName: 'Plank', 
                type: 'Core', 
                difficulty: 'Beginner',
                targetMuscleGroups: ['Core', 'Abdominals', 'Obliques'],
                equipmentNeeded: ['None (Bodyweight)'],
                description: 'An isometric core strength exercise that involves maintaining a position similar to a push-up for the maximum possible time.',
            },
            {
                _id: new ObjectId(), 
                exerciseName: 'Dumbbell Bench Press', 
                type: 'Strength', 
                difficulty: 'Intermediate',
                targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'],
                equipmentNeeded: ['Dumbbells', 'Bench'],
                description: 'A variation of the bench press using dumbbells, allowing for a greater range of motion and individual arm work.',
            },
            {
                _id: new ObjectId(), 
                exerciseName: 'Running (Treadmill)', 
                type: 'Cardio', 
                difficulty: 'Beginner',
                targetMuscleGroups: ['Legs', 'Cardiovascular System'],
                equipmentNeeded: ['Treadmill'],
                description: 'A popular cardiovascular exercise that can be adjusted for various intensity levels.',
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

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

