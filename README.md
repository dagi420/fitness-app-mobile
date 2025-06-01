# Fitness App Mobile (DubDub Fit)

A React Native and Expo mobile application designed for a gym company, enabling users to get personalized workout and diet plans, track progress, and browse exercises. This application integrates with a backend ERP system (simulated via a Node.js/Express server in this project) and uses MongoDB as its database.

## Features

*   **User Authentication:** Secure registration and login for users.
*   **Personalized User Data Collection:** Gathers user details like age, gender, height, weight, workout goals, activity level, health conditions, and dietary restrictions during onboarding.
*   **Workout & Diet Planning (Foundation):**
    *   Manual Workout Plan Creation: Users can create their own workout routines by selecting from a list of available exercises.
    *   AI-Powered Planning (Future): Hooks in place for future AI-based workout and diet suggestions.
*   **Workout Browsing:** Display all available workouts from an admin-managed list.
*   **Workout Details:** View detailed information for each workout, including exercises, sets, reps, and descriptions.
*   **User-Created Plan Display:** Users can see their saved custom workout plans separately from general workouts.
*   **Progress Tracking (Future):** Infrastructure planned for tracking user progress.
*   **Profile Management:** View user profile information and logout.
*   **Intuitive UI:** Organized navigation with a bottom tab bar and a central "Create Plan" button.
*   **Clear Data Flow:** Uses React Context for global state management (e.g., authentication) and services for API interactions.
*   **Active Workout Session (Future):** A dedicated screen for guiding users through an active workout with timers, exercise videos, etc.
*   **Sharing Plans (Future):** Functionality to share workout/diet plans with peers.

## Folder Structure

The project follows a standard React Native structure with a focus on modularity:

```
fitness-app-mobile/
├── fitness-app-server/     # Node.js/Express backend server
│   ├── node_modules/
│   ├── .env                  # Environment variables (MongoDB URI, PORT, etc.)
│   └── server.js             # Main server file
├── node_modules/             # Frontend dependencies
├── src/                      # Main source code for the mobile app
│   ├── api/                  # API service files for interacting with the backend
│   │   ├── apiConfig.ts
│   │   ├── authService.ts
│   │   ├── exerciseService.ts
│   │   ├── planService.ts
│   │   └── workoutService.ts
│   ├── assets/               # Static assets (images, fonts)
│   ├── components/           # Reusable UI components (shared across screens)
│   │   └── CustomTabBarButton.tsx
│   ├── navigation/           # React Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   ├── WorkoutsStackNavigator.tsx
│   │   └── types.ts
│   ├── screens/              # Screen components
│   │   ├── Auth/
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   ├── Dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── Diet/
│   │   │   └── DietPlanScreen.tsx
│   │   ├── Onboarding/
│   │   │   ├── GoalSelectionScreen.tsx
│   │   │   └── UserDetailsScreen.tsx
│   │   ├── Planner/
│   │   │   ├── CreatePlanScreen.tsx
│   │   │   ├── ExercisePickerScreen.tsx
│   │   │   └── ManualPlanCreatorScreen.tsx
│   │   ├── Profile/
│   │   │   └── ProfileScreen.tsx
│   │   ├── Progress/
│   │   │   └── ProgressScreen.tsx
│   │   └── Workouts/
│   │       ├── WorkoutDetailScreen.tsx
│   │       └── WorkoutListScreen.tsx
│   ├── store/                # Global state management (e.g., React Context)
│   │   └── AuthContext.tsx
│   └── styles/               # Global styles or theme files (if any)
├── .expo/
├── .gitignore
├── App.tsx                   # Main entry point of the application
├── app.json                  # Expo configuration file
├── babel.config.js
├── package.json
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
*   [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall) (for macOS users)
*   [Git](https://git-scm.com/)
*   An emulator/simulator (Android Studio for Android, Xcode for iOS) or a physical device with the Expo Go app.
*   [MongoDB](https://www.mongodb.com/try/download/community) instance (local or cloud-hosted like MongoDB Atlas) for the backend.

## Setup and Installation

1.  **Clone the repository (if applicable, otherwise skip if already in the project):**
    ```bash
    git clone <repository-url>
    cd fitness-app-mobile
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Setup Backend Server (`fitness-app-server`):**
    *   Navigate to the server directory:
        ```bash
        cd fitness-app-server
        ```
    *   Install backend dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file in the `fitness-app-server` directory. Refer to `server.js` for required variables like:
        ```env
        MONGODB_URI=your_mongodb_connection_string
        DB_NAME=your_database_name
        PORT=3000
        # Add any other JWT secrets or API keys if implemented later
        ```
    *   Ensure your MongoDB server is running and accessible.

## Running the Application

1.  **Start the Backend Server:**
    *   Open a terminal in the `fitness-app-server` directory.
    *   Run:
        ```bash
        node server.js
        # or use nodemon for development:
        # nodemon server.js
        ```
    *   The server should typically start on `http://localhost:3000` (or the port specified in your `.env`).

2.  **Start the Mobile App (Frontend):**
    *   Open another terminal in the root `fitness-app-mobile` directory.
    *   Run:
        ```bash
        expo start
        ```
    *   This will open the Metro Bundler in your web browser. You can then:
        *   Scan the QR code with the Expo Go app on your physical device.
        *   Press `a` to run on an Android emulator/device.
        *   Press `i` to run on an iOS simulator/device (macOS only).

## API Configuration

The mobile app connects to the backend API. The base URL for the API is configured in:
`fitness-app-mobile/src/api/apiConfig.ts`

Ensure the `API_BASE_URL` in this file points to your running backend server (e.g., `http://<YOUR_LOCAL_NETWORK_IP>:3000/api` if running on a physical device, or `http://localhost:3000/api` for simulators).

## Key Technologies Used

*   **Frontend (Mobile App):**
    *   React Native
    *   Expo
    *   TypeScript
    *   React Navigation (for routing and navigation)
    *   React Context (for global state management)
    *   `expo-secure-store` (for secure storage of tokens)
*   **Backend Server:**
    *   Node.js
    *   Express.js
    *   MongoDB (with `mongodb` Node.js driver)
    *   `bcryptjs` (for password hashing)
    *   `cors` (for Cross-Origin Resource Sharing)
    *   `dotenv` (for environment variables)
*   **Database:**
    *   MongoDB

## Available Scripts

In the `fitness-app-mobile` directory:

*   `npm start` or `expo start`: Starts the Metro Bundler for development.
*   `npm run android` or `expo run:android`: Runs the app on a connected Android device or emulator.
*   `npm run ios` or `expo run:ios`: Runs the app on an iOS simulator or connected device (macOS only).
*   `npm run web` or `expo web`: Runs the app in a web browser (experimental, UI may differ).

In the `fitness-app-server` directory:

*   `node server.js`: Starts the backend server.
*   Consider adding a script for `nodemon server.js` in `fitness-app-server/package.json` for easier development.

## Future Enhancements / To-Do

*   Implement AI-powered workout and diet planning.
*   Complete Progress Tracking functionality.
*   Build out the Diet Plan section.
*   Develop the Active Workout Session screen (timer, exercise videos, completion tracking).
*   Add functionality to share plans with peers.
*   Implement visual descriptions/videos for each exercise.
*   Unit and integration tests.
*   Refine UI/UX across the application.
*   Error handling and reporting improvements.

## Contributing

Contributions are welcome! Please follow standard coding practices and ensure any new features or fixes are well-tested. (Further details can be added here, e.g., branching strategy, pull request process).

## License

This project is currently unlicensed. (Or specify a license, e.g., MIT). 