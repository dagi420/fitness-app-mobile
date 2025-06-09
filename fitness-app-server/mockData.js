const { ObjectId } = require('mongodb');

// Mock Exercises (reusable building blocks)
const mockSquat = {
    _id: new ObjectId("60f1c7d0e8b7a83a4c8e0f01"),
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
    videoUrl: 'https://youtu.be/EbOPpWi4L8s?si=wEUm7miwBmCdUBdN'
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
    videoUrl: 'https://youtu.be/EbOPpWi4L8s?si=wEUm7miwBmCdUBdN'
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
};

const mockDumbbellRows = {
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
};

const mockBenchPress = {
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
};

const mockOverheadPress = {
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
};

const mockBurpees = {
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
};

const mockMountainClimbers = {
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
};


// Mock Workouts Data (for /api/workouts)
const mockWorkoutsData = [
    {
        _id: new ObjectId(),
        name: 'Full Body Blast',
        description: 'A comprehensive workout targeting all major muscle groups.',
        type: 'Full Body',
        difficulty: 'Intermediate',
        durationEstimateMinutes: 60,
        exercises: [
            { ...mockSquat, sets: 3, reps: '8-12', order: 1 },
            { ...mockPushup, sets: 3, reps: 'As many as possible', order: 2 },
            { ...mockDumbbellRows, sets: 3, reps: '10-15', order: 3 }
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
            { ...mockBenchPress, sets: 3, reps: '5-8', order: 1 },
            { ...mockPushup, sets: 3, reps: '10-15', order: 2 },
            { ...mockOverheadPress, sets: 3, reps: '8-12', order: 3 }
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
            { ...mockBurpees, sets: 4, reps: '15', order: 1 },
            { ...mockPlank, sets: 4, durationSeconds: 60, order: 2 },
            { ...mockMountainClimbers, sets: 4, durationSeconds: 30, order: 3 }
        ]
    }
];

// Mock Individual Exercises Data (for /api/exercises)
const mockIndividualExercisesData = [
    {
        _id: new ObjectId(), // Different from the mockSquat in workouts to show it as standalone
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

// Mock Diet Plan Data (for /api/user/diet-plans)
const createMockDietPlan = (userId) => ({
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    planName: 'Balanced Lifestyle Diet (Mock)',
    description: 'A sample diet plan focusing on balanced macronutrients for a healthy lifestyle.',
    dailyCaloricTarget: 2200,
    macronutrientTargets: { proteinGr: 150, carbsGr: 250, fatGr: 70 },
    meals: [
      {
        _id: new ObjectId(),
        mealName: 'Breakfast',
        timeSuggestion: '08:00',
        foodItems: [
          {
            _id: new ObjectId(),
            foodName: 'Oatmeal',
            quantity: '1 cup cooked',
            calories: 300,
            macronutrients: { proteinGr: 10, carbsGr: 55, fatGr: 5 }
          },
          {
            _id: new ObjectId(),
            foodName: 'Berries',
            quantity: '1/2 cup',
            calories: 40,
            macronutrients: { proteinGr: 1, carbsGr: 10, fatGr: 0 }
          }
        ]
      },
      {
        _id: new ObjectId(),
        mealName: 'Lunch',
        timeSuggestion: '13:00',
        foodItems: [
          {
            _id: new ObjectId(),
            foodName: 'Grilled Chicken Salad',
            quantity: 'Large bowl',
            calories: 550,
            macronutrients: { proteinGr: 50, carbsGr: 30, fatGr: 25 }
          }
        ]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isAIGenerated: false,
});


// Mock Exercise Pool for AI Workout Generation (for /api/ai/generate-workout-plan)
const allMockExercisesForAI = [
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
    // Barbell - Intermediate
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
    // Flexibility/Mobility - All Levels
    { _id: new ObjectId(), name: 'Cat-Cow Stretch', description: 'A gentle yoga pose that involves moving the spine from a rounded (cat) to an arched (cow) position. Improves spinal flexibility and relieves tension.', type: 'Flexibility', category: 'Mobility', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Spine', 'Core'], videoUrl: 'placeholder_url' },
    { _id: new ObjectId(), name: 'Downward-Facing Dog', description: 'A common yoga pose that stretches the hamstrings, calves, shoulders, and back, while also building upper body strength.', type: 'Flexibility', category: 'Mobility', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Hamstrings', 'Calves', 'Shoulders', 'Back'], videoUrl: 'placeholder_url' },
    { _id: new ObjectId(), name: 'Pigeon Stretch', description: 'A hip-opening stretch that targets the hip flexors and glutes. Effective for improving hip mobility.', type: 'Flexibility', category: 'Mobility', difficulty: 'Intermediate', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Hips', 'Glutes'], videoUrl: 'placeholder_url' },
    { _id: new ObjectId(), name: 'Thoracic Spine Windmills', description: 'A mobility exercise to improve rotation in the thoracic (mid-upper) spine. Often done lying on one side.', type: 'Flexibility', category: 'Mobility', difficulty: 'Beginner', equipmentNeeded: ['Bodyweight'], targetMuscleGroups: ['Thoracic Spine', 'Shoulders'], videoUrl: 'placeholder_url' },
];


module.exports = {
    mockWorkoutsData,
    mockIndividualExercisesData,
    createMockDietPlan,
    allMockExercisesForAI,
    // Individual mock exercises if they need to be imported directly by server.js for any reason
    // (though they are already incorporated into mockWorkoutsData)
    mockSquat,
    mockPushup,
    mockPlank,
    mockDumbbellRows,
    mockBenchPress,
    mockOverheadPress,
    mockBurpees,
    mockMountainClimbers
}; 