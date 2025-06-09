const { ObjectId } = require('mongodb');

// Exercise Categories Enum (for organization)
const ExerciseCategories = {
    UPPER_BODY: 'Upper Body',
    LOWER_BODY: 'Lower Body',
    CORE: 'Core',
    CARDIO: 'Cardio',
    FULL_BODY: 'Full Body',
    FLEXIBILITY: 'Flexibility',
    PLYOMETRICS: 'Plyometrics',
    OLYMPIC: 'Olympic Lifts'
};

// Exercise Types Enum
const ExerciseTypes = {
    STRENGTH: 'Strength',
    CARDIO: 'Cardio',
    HIIT: 'HIIT',
    ENDURANCE: 'Endurance',
    POWER: 'Power',
    FLEXIBILITY: 'Flexibility',
    BALANCE: 'Balance',
    MOBILITY: 'Mobility'
};

// Equipment Types Enum
const EquipmentTypes = {
    BODYWEIGHT: 'Bodyweight',
    DUMBBELLS: 'Dumbbells',
    BARBELL: 'Barbell',
    KETTLEBELL: 'Kettlebell',
    RESISTANCE_BANDS: 'Resistance Bands',
    MACHINE: 'Machine',
    CABLE: 'Cable',
    BENCH: 'Bench',
    SQUAT_RACK: 'Squat Rack',
    PULL_UP_BAR: 'Pull-up Bar',
    YOGA_MAT: 'Yoga Mat',
    FOAM_ROLLER: 'Foam Roller',
    MEDICINE_BALL: 'Medicine Ball',
    BOSU_BALL: 'BOSU Ball',
    TRX: 'TRX/Suspension Trainer'
};

// Difficulty Levels Enum
const DifficultyLevels = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced'
};

// Muscle Groups Enum
const MuscleGroups = {
    // Upper Body
    CHEST: 'Chest',
    SHOULDERS: 'Shoulders',
    TRICEPS: 'Triceps',
    BICEPS: 'Biceps',
    FOREARMS: 'Forearms',
    UPPER_BACK: 'Upper Back',
    LATS: 'Lats',
    TRAPS: 'Traps',
    
    // Lower Body
    QUADRICEPS: 'Quadriceps',
    HAMSTRINGS: 'Hamstrings',
    GLUTES: 'Glutes',
    CALVES: 'Calves',
    HIP_FLEXORS: 'Hip Flexors',
    
    // Core
    ABS: 'Abs',
    OBLIQUES: 'Obliques',
    LOWER_BACK: 'Lower Back',
    
    // Full Body
    FULL_BODY: 'Full Body',
    CARDIO: 'Cardiovascular System'
};

// Force Vectors (for exercise biomechanics)
const ForceVectors = {
    PUSH: 'Push',
    PULL: 'Pull',
    SQUAT: 'Squat',
    HINGE: 'Hinge',
    LUNGE: 'Lunge',
    ROTATION: 'Rotation',
    CARRY: 'Carry',
    ISOMETRIC: 'Isometric'
};

// Movement Patterns
const MovementPatterns = {
    HORIZONTAL_PUSH: 'Horizontal Push',
    HORIZONTAL_PULL: 'Horizontal Pull',
    VERTICAL_PUSH: 'Vertical Push',
    VERTICAL_PULL: 'Vertical Pull',
    HIP_DOMINANT: 'Hip Dominant',
    KNEE_DOMINANT: 'Knee Dominant',
    CORE_STABILITY: 'Core Stability',
    LOCOMOTION: 'Locomotion'
};

// Create a comprehensive exercise database
const createExerciseDatabase = () => {
    // Helper function to create exercise IDs consistently
    const createExerciseId = (index) => new ObjectId(`60f1c7d0e8b7a83a4c8e${index.toString().padStart(4, '0')}`);

    return [
        // === UPPER BODY EXERCISES ===
        {
            _id: createExerciseId(1),
            name: 'Push-up',
            description: 'A fundamental upper body exercise that strengthens the chest, shoulders, and triceps while engaging the core.',
            longDescription: `The push-up is one of the most effective and versatile bodyweight exercises. It primarily targets the chest muscles (pectoralis major and minor) while also engaging the anterior deltoids, triceps, and core muscles for stabilization. Regular practice improves upper body strength, core stability, and muscular endurance.

Key benefits include:
- Builds upper body strength and muscular endurance
- Improves core stability and shoulder girdle function
- Can be modified for different fitness levels
- Requires no equipment
- Can be performed anywhere

Common variations include:
- Incline push-ups (easier)
- Decline push-ups (harder)
- Diamond push-ups (more triceps focus)
- Wide-grip push-ups (more chest focus)
- Plyometric push-ups (for power development)`,
            category: ExerciseCategories.UPPER_BODY,
            type: ExerciseTypes.STRENGTH,
            equipment: [EquipmentTypes.BODYWEIGHT],
            difficulty: DifficultyLevels.BEGINNER,
            muscleGroups: {
                primary: [MuscleGroups.CHEST, MuscleGroups.SHOULDERS, MuscleGroups.TRICEPS],
                secondary: [MuscleGroups.ABS, MuscleGroups.UPPER_BACK]
            },
            forceVector: ForceVectors.PUSH,
            movementPattern: MovementPatterns.HORIZONTAL_PUSH,
            mechanics: 'Compound',
            instructions: [
                'Start in a high plank position with hands slightly wider than shoulders',
                'Keep your body in a straight line from head to heels',
                'Lower your body by bending your elbows, keeping them close to your body',
                'Lower until your chest nearly touches the ground',
                'Push back up to the starting position while maintaining body alignment',
                'Repeat for the desired number of repetitions'
            ],
            tips: [
                'Keep your core engaged throughout the movement',
                'Don\'t let your hips sag or pike up',
                'Breathe steadily - exhale on the push up, inhale on the way down',
                'For beginners, start with knee push-ups to build strength'
            ],
            commonMistakes: [
                'Sagging or piking at the hips',
                'Flaring elbows out too wide',
                'Not maintaining a neutral spine',
                'Incomplete range of motion',
                'Holding breath during execution'
            ],
            modifications: {
                easier: [
                    'Wall push-ups',
                    'Incline push-ups',
                    'Knee push-ups'
                ],
                harder: [
                    'Decline push-ups',
                    'Diamond push-ups',
                    'One-arm push-ups',
                    'Clapping push-ups'
                ]
            },
            recommendedSets: {
                beginner: '3 sets of 5-10 reps',
                intermediate: '3-4 sets of 12-15 reps',
                advanced: '4-5 sets of 20+ reps'
            },
            mediaUrls: {
                image: 'https://example.com/exercises/pushup.jpg',
                video: 'https://example.com/exercises/pushup.mp4',
                thumbnail: 'https://example.com/exercises/pushup-thumb.jpg',
                gif: 'https://example.com/exercises/pushup.gif'
            },
            metadata: {
                averageCaloriesBurn: 7, // per minute
                recommendedRestPeriod: '60-90 seconds',
                recommendedTempoInSeconds: {
                    eccentric: 2,  // lowering phase
                    isometricBottom: 1,  // pause at bottom
                    concentric: 1,  // pushing up phase
                    isometricTop: 0  // pause at top
                }
            }
        },

        // === LOWER BODY EXERCISES ===
        {
            _id: createExerciseId(2),
            name: 'Barbell Back Squat',
            description: 'A fundamental compound exercise that primarily targets the lower body muscles while engaging the core and back.',
            longDescription: `The barbell back squat is often called the "king of exercises" due to its effectiveness in building overall strength and muscle mass. It's a compound movement that primarily targets the quadriceps, hamstrings, and glutes while engaging numerous stabilizing muscles throughout the body.

Key benefits include:
- Builds lower body strength and muscle mass
- Improves core stability and balance
- Increases bone density
- Enhances athletic performance
- Boosts hormonal response

The exercise involves placing a barbell across your upper back and performing a squatting movement while maintaining proper form and alignment.`,
            category: ExerciseCategories.LOWER_BODY,
            type: ExerciseTypes.STRENGTH,
            equipment: [EquipmentTypes.BARBELL, EquipmentTypes.SQUAT_RACK],
            difficulty: DifficultyLevels.INTERMEDIATE,
            muscleGroups: {
                primary: [MuscleGroups.QUADRICEPS, MuscleGroups.GLUTES, MuscleGroups.HAMSTRINGS],
                secondary: [MuscleGroups.LOWER_BACK, MuscleGroups.ABS, MuscleGroups.CALVES]
            },
            forceVector: ForceVectors.SQUAT,
            movementPattern: MovementPatterns.KNEE_DOMINANT,
            mechanics: 'Compound',
        instructions: [
                'Position the barbell on the rack at approximately shoulder height',
                'Step under the bar and position it across your upper back (not on your neck)',
                'Grip the bar wider than shoulder-width',
                'Unrack the bar and step back, feet shoulder-width apart',
                'Keeping your chest up and core tight, bend your knees and hips to lower into a squat',
                'Continue until your thighs are parallel to the ground or slightly below',
                'Drive through your heels to stand back up',
                'Repeat for the desired number of repetitions'
            ],
            tips: [
                'Keep your chest up and core engaged throughout the movement',
                'Track your knees in line with your toes',
                'Maintain a neutral spine position',
                'Breathe in as you lower, out as you rise',
                'Drive through your heels'
            ],
            commonMistakes: [
                'Rounding the back',
                'Knees caving inward',
                'Rising onto toes',
                'Not reaching proper depth',
                'Looking up too high'
            ],
            modifications: {
                easier: [
                    'Bodyweight squats',
                    'Goblet squats',
                    'Box squats'
                ],
                harder: [
                    'Pause squats',
                    'Front squats',
                    'Overhead squats'
                ]
            },
            recommendedSets: {
                beginner: '3 sets of 8-10 reps with light weight',
                intermediate: '4 sets of 6-8 reps with moderate weight',
                advanced: '5 sets of 3-5 reps with heavy weight'
            },
            mediaUrls: {
                image: 'https://example.com/exercises/back-squat.jpg',
                video: 'https://example.com/exercises/back-squat.mp4',
                thumbnail: 'https://example.com/exercises/back-squat-thumb.jpg',
                gif: 'https://example.com/exercises/back-squat.gif'
            },
            metadata: {
                averageCaloriesBurn: 10, // per minute
                recommendedRestPeriod: '2-3 minutes',
                recommendedTempoInSeconds: {
                    eccentric: 3,
                    isometricBottom: 1,
                    concentric: 2,
                    isometricTop: 1
                }
            }
        },

        // Add more exercises following the same comprehensive structure...
        // This is just a start with two detailed examples
    ];
};

// Create the mock exercises database
const mockExercisesDatabase = createExerciseDatabase();

const mockWorkoutsData = [
  {
    _id: '1',
    name: 'Full Body Power',
    description: 'A comprehensive full-body workout focusing on compound movements',
    type: 'Strength',
    difficulty: 'Intermediate',
    durationEstimateMinutes: 60,
    exercises: [
      {
        _id: 'ex1',
        name: 'Barbell Squat',
        description: 'Classic compound movement for lower body strength',
        muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
        equipment: 'Barbell',
        difficulty: 'Intermediate',
        type: 'Strength',
        sets: '4',
        reps: '8-10',
        videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8'
      },
      {
        _id: 'ex2',
        name: 'Bench Press',
        description: 'Primary chest development exercise',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        equipment: 'Barbell, Bench',
        difficulty: 'Intermediate',
        type: 'Strength',
        sets: '4',
        reps: '8-12',
        videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
      },
      {
        _id: 'ex3',
        name: 'Deadlift',
        description: 'Compound movement for total body strength',
        muscleGroups: ['Back', 'Glutes', 'Hamstrings'],
        equipment: 'Barbell',
        difficulty: 'Intermediate',
        type: 'Strength',
        sets: '3',
        reps: '6-8',
        videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q'
      }
    ]
  },
  {
    _id: '2',
    name: 'HIIT Cardio Blast',
    description: 'High-intensity interval training for maximum calorie burn',
    type: 'Cardio',
    difficulty: 'Advanced',
    durationEstimateMinutes: 30,
    exercises: [
      {
        _id: 'ex4',
        name: 'Burpees',
        description: 'Full body explosive movement',
        muscleGroups: ['Full Body', 'Cardio'],
        equipment: 'None',
        difficulty: 'Advanced',
        type: 'Cardio',
        sets: '4',
        reps: '45 seconds',
        videoUrl: 'https://www.youtube.com/watch?v=TU8QYVW0gDU'
      },
      {
        _id: 'ex5',
        name: 'Mountain Climbers',
        description: 'Dynamic core and cardio exercise',
        muscleGroups: ['Core', 'Cardio'],
        equipment: 'None',
        difficulty: 'Intermediate',
        type: 'Cardio',
        sets: '4',
        reps: '30 seconds',
        videoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM'
      },
      {
        _id: 'ex6',
        name: 'Jump Rope',
        description: 'Classic cardio exercise',
        muscleGroups: ['Cardio', 'Calves'],
        equipment: 'Jump Rope',
        difficulty: 'Intermediate',
        type: 'Cardio',
        sets: '4',
        reps: '60 seconds',
        videoUrl: 'https://www.youtube.com/watch?v=FJmRQ5iTXKE'
      }
    ]
  },
  {
    _id: '3',
    name: 'Core Crusher',
    description: 'Intensive core workout targeting all abdominal muscles',
    type: 'Strength',
    difficulty: 'Beginner',
    durationEstimateMinutes: 20,
    exercises: [
      {
        _id: 'ex7',
        name: 'Plank',
        description: 'Static core hold for stability',
        muscleGroups: ['Core', 'Shoulders'],
        equipment: 'None',
        difficulty: 'Beginner',
        type: 'Core',
        sets: '3',
        reps: '45 seconds',
        videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c'
      },
      {
        _id: 'ex8',
        name: 'Russian Twists',
        description: 'Rotational movement for obliques',
        muscleGroups: ['Core', 'Obliques'],
        equipment: 'Dumbbell (Optional)',
        difficulty: 'Beginner',
        type: 'Core',
        sets: '3',
        reps: '20 each side',
        videoUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI'
      },
      {
        _id: 'ex9',
        name: 'Leg Raises',
        description: 'Lower ab focused movement',
        muscleGroups: ['Lower Abs', 'Core'],
        equipment: 'None',
        difficulty: 'Beginner',
        type: 'Core',
        sets: '3',
        reps: '15',
        videoUrl: 'https://www.youtube.com/watch?v=l4kQd9eWclE'
      }
    ]
  }
];

const mockIndividualExercisesData = [
  {
    _id: 'ie1',
    name: 'Push-ups',
    description: 'Classic bodyweight exercise for upper body strength',
    type: 'Strength',
    category: 'Upper Body',
    difficulty: 'Beginner',
    targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipmentNeeded: ['Bodyweight'],
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4'
  },
  {
    _id: 'ie2',
    name: 'Pull-ups',
    description: 'Upper body pulling movement',
    type: 'Strength',
    category: 'Upper Body',
    difficulty: 'Intermediate',
    targetMuscleGroups: ['Back', 'Biceps', 'Shoulders'],
    equipmentNeeded: ['Pull-up Bar'],
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g'
  },
  {
    _id: 'ie3',
    name: 'Bodyweight Squats',
    description: 'Fundamental lower body movement',
    type: 'Strength',
    category: 'Lower Body',
    difficulty: 'Beginner',
    targetMuscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipmentNeeded: ['Bodyweight'],
    videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ'
  }
];

// Export everything
module.exports = {
    // Enums for reference
    ExerciseCategories,
    ExerciseTypes,
    EquipmentTypes,
    DifficultyLevels,
    MuscleGroups,
    ForceVectors,
    MovementPatterns,
    
    // Main database
    mockExercisesDatabase,
    
    // Helper function for creating more exercises
    createExerciseId: (index) => new ObjectId(`60f1c7d0e8b7a83a4c8e${index.toString().padStart(4, '0')}`),

    mockWorkoutsData,
    mockIndividualExercisesData
}; 