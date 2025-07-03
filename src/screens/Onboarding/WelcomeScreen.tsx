import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet, ImageBackground, Dimensions, Animated } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonSlideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatingElements = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const [titleText, setTitleText] = useState('');
  const fullTitle = 'Transform';
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Looping typewriter effect
    const typeWriterLoop = () => {
      let index = 0;
      let isDeleting = false;
      
      const typeEffect = () => {
        if (!isDeleting && index <= fullTitle.length) {
          setTitleText(fullTitle.slice(0, index));
          index++;
        } else if (!isDeleting && index > fullTitle.length) {
          // Pause at full text
          setTimeout(() => {
            isDeleting = true;
          }, 2000);
        } else if (isDeleting && index > 0) {
          setTitleText(fullTitle.slice(0, index - 1));
          index--;
        } else if (isDeleting && index === 0) {
          // Reset for next cycle
          isDeleting = false;
          index = 0;
        }
        
        const speed = isDeleting ? 100 : 150;
        setTimeout(typeEffect, speed);
      };
      
      typeEffect();
    };

    // Floating elements animation (simplified)
    const startFloatingAnimations = () => {
      floatingElements.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000 + (index * 800),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 3000 + (index * 800),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    };

    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Main animation sequence
    const animationSequence = Animated.sequence([
      // Logo animation
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      // Main content fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      // Buttons slide up
      Animated.spring(buttonSlideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]);

    setTimeout(() => {
      typeWriterLoop();
      setShowContent(true);
      startFloatingAnimations();
      animationSequence.start();
    }, 800);
  }, []);

  const handleSignUp = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Signup');
    });
  };

  const handleLogin = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Login');
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={require('../../../assets/fitness-poster.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.1)',
            'rgba(25, 30, 41, 0.7)',
            'rgba(25, 30, 41, 0.95)',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          {/* Minimal Floating Elements */}
          {floatingElements.map((anim, index) => {
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [height, -80],
            });
            const opacity = anim.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 0.6, 0.6, 0],
            });
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.floatingElement,
                  {
                    left: (width / 5) * (index + 1),
                    transform: [{ translateY }],
                    opacity,
                  }
                ]}
              >
                <View style={styles.floatingDot} />
              </Animated.View>
            );
          })}

          {/* Minimal Logo Section */}
          <Animated.View 
            style={[
              styles.logoSection,
              {
                transform: [{ scale: logoScaleAnim }]
              }
            ]}
          >
            <Text style={styles.brandText}>FitnessApp</Text>
          </Animated.View>

          {/* Main Content */}
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {titleText}
                <Text style={styles.cursor}>|</Text>
              </Text>
              
              {showContent && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <Text style={styles.subtitle}>
                    Your fitness journey starts here
                  </Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* Minimal Buttons */}
          <Animated.View 
            style={[
              styles.buttonContainer,
              {
                transform: [{ translateY: buttonSlideAnim }]
              }
            ]}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSignUp}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#01D38D', '#00B377']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.primaryButtonText}>
                    Get Started
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineButtonText}>
                Sign In
              </Text>
            </TouchableOpacity>

            {/* Minimal Stats */}
            <View style={styles.statsContainer}>
              <Animated.View style={[styles.statItem, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.statNumber}>50K+</Text>
                <Text style={styles.statLabel}>Members</Text>
              </Animated.View>
              <View style={styles.statDivider} />
              <Animated.View style={[styles.statItem, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.statNumber}>4.9★</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </Animated.View>
            </View>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  floatingElement: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  floatingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(1, 211, 141, 0.4)',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '200',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  cursor: {
    color: '#01D38D',
    opacity: 1,
  },
  subtitle: {
    color: '#B8C0CC',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  button: {
    width: '100%',
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButton: {
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 1,
  },
  outlineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 17,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 30,
  },
  outlineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#01D38D',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  statLabel: {
    color: '#B8C0CC',
    fontSize: 12,
    fontWeight: '300',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 30,
  },
});

export default WelcomeScreen; 