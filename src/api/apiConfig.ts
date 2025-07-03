// API Configuration for different environments
// This configuration supports development, testing, and production builds

// Environment detection
const isDevelopment = __DEV__;
const isProduction = !__DEV__;

// ⚠️  IMPORTANT: REPLACE THE NGROK URL BELOW WITH YOUR ACTUAL NGROK URL
// After running "ngrok http 3000", copy the https URL and replace the placeholder below
// Example: 'https://abc123def456.ngrok-free.app/api'
const NGROK_URL = 'https://your-ngrok-url.ngrok-free.app/api'; // 👈 UPDATE THIS!

// Configuration options
const API_CONFIG = {
  // Development - use your local network IP for testing on physical devices
  // or use localhost for emulator testing
  DEVELOPMENT: {
    // Use 10.0.2.2 for Android emulator (maps to localhost on host machine)
    EMULATOR: 'http://10.0.2.2:3000/api',
    // Use your actual network IP for physical device testing
    PHYSICAL_DEVICE: 'http://192.168.100.29:3000/api',
    // Use localhost for web testing
    LOCALHOST: 'http://localhost:3000/api'
  },
  
  // Production - for APK builds, you have several options:
  PRODUCTION: {
    // Option 1: Use ngrok for public access to local server (recommended for testing)
    NGROK: NGROK_URL,
    
    // Option 2: Use a cloud service (recommended for production)
    CLOUD: 'https://fitness-app-server-f4i6.onrender.com/api',    // Render
    // CLOUD: 'https://your-app.netlify.app/api',   // Netlify
    
    // Option 3: Use your public IP (if you have static IP and proper port forwarding)
    // PUBLIC_IP: 'http://your-public-ip:3000/api',
    
    // Fallback to localhost (will only work in very specific scenarios)
    FALLBACK: 'http://localhost:3000/api'
  }
};

// Auto-detect the best API URL based on environment
function getApiUrl(): string {
  if (isDevelopment) {
    // For development, prioritize physical device testing
    return API_CONFIG.DEVELOPMENT.PHYSICAL_DEVICE;
  } else {
    // For production builds, use the cloud URL
    return API_CONFIG.PRODUCTION.CLOUD;
  }
}

export const API_BASE_URL = getApiUrl();

// Export configuration for debugging
export const DEBUG_CONFIG = {
  isDevelopment,
  isProduction,
  currentApiUrl: API_BASE_URL,
  availableOptions: API_CONFIG
};

// Log current configuration in development
if (isDevelopment) {
  console.log('API Configuration:', DEBUG_CONFIG);
} 