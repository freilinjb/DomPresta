import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeInUp,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// ─── Theme igual que HomeScreen ──────────────────────────────────
const C = {
  primary: '#5b21b6',
  primary2: '#7c3aed',
  primary3: '#a78bfa',
  primary4: '#ddd6fe',
  primary5: '#f5f3ff',
  white: '#ffffff',
  text: '#1e1b4b',
  textMuted: '#94a3b8',
};

interface TabItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screen?: string;
  active?: boolean;
  big?: boolean;
  badge?: number;
}

const BottomTabBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeScreen, setActiveScreen] = useState('Home');

  const indicatorX = useSharedValue(0);
  const tabWidth = width / 5;

  // Detecta pantalla activa
  useEffect(() => {
    const state = navigation.getState();
    const mainTabState = state?.routes?.find((r) => r.name === 'MainTabs')?.state;
    if (mainTabState?.routes && mainTabState.index!== undefined) {
      const currentRoute = mainTabState.routes[mainTabState.index];
      setActiveScreen(currentRoute.name);
      const idx = ['Home', 'Loans', 'AddLoan', 'Clients', 'Settings'].indexOf(currentRoute.name);
      if (idx!== -1 && idx!== 2) {
        indicatorX.value = withSpring(idx * tabWidth, { damping: 20, stiffness: 180 });
      }
    }
  }, [route]);

  const go = (screenName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (screenName === 'AddLoan') {
      navigation.navigate('AddLoan' as never);
    } else {
      navigation.navigate('MainTabs' as never, { screen: screenName } as never);
    }
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const tabs: TabItem[] = [
    { icon: 'grid-outline', label: 'Inicio', screen: 'Home', active: activeScreen === 'Home' },
    { icon: 'document-text-outline', label: 'Préstamos', screen: 'Loans', active: activeScreen === 'Loans', badge: 3 },
    { icon: 'add-circle', label: '', big: true, screen: 'AddLoan' },
    { icon: 'people-outline', label: 'Clientes', screen: 'Clients', active: activeScreen === 'Clients' },
    { icon: 'person-outline', label: 'Perfil11', screen: 'Settings', active: activeScreen === 'Settings' },
  ];

  const TabButton: React.FC<{ nav: TabItem; index: number }> = ({ nav, index }) => {
    const scale = useSharedValue(1);
    const isCenter = nav.big;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.85, { damping: 15 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15 });
    };

    if (isCenter) {
      return (
        <View style={s.centerWrapper}>
          <Animated.View style={animatedStyle}>
            <TouchableOpacity
              onPress={() => nav.screen && go(nav.screen)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[C.primary2, C.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.centerButton}
              >
                <Ionicons name="add" size={32} color={C.white} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    return (
      <Animated.View style={[s.navItem, animatedStyle]}>
        <TouchableOpacity
          style={s.navBtn}
          onPress={() => nav.screen && go(nav.screen)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <View style={s.iconWrap}>
            <Ionicons
              name={nav.active? (nav.icon.replace('-outline', '') as any) : nav.icon}
              size={22}
              color={nav.active? C.white : 'rgba(255,255,255,0.65)'}
            />
            {nav.badge && nav.badge > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{nav.badge}</Text>
              </View>
            )}
          </View>
          <Text style={[s.navLbl, nav.active && s.navLblActive]}>{nav.label}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={s.wrapper} entering={FadeInUp.delay(400).springify()}>
      <BlurView intensity={90} tint="dark" style={s.blurContainer}>
        {/* Gradiente morado idéntico al header del Home */}
        <LinearGradient
          colors={['#5b21b6', '#6d28d9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Overlay glass sutil */}
        <View style={s.glassOverlay} />

        {/* Indicador que se desliza */}
        <Animated.View style={[s.indicator, indicatorStyle]} />

        <View style={s.tabBar}>
          {tabs.map((nav, i) => (
            <TabButton key={i} nav={nav} index={i} />
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  blurContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#5b21b6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  glassOverlay: {
  ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabBar: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  indicator: {
    position: 'absolute',
    top: 10,
    width: width / 5 - 16,
    height: 52,
    marginHorizontal: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    backgroundColor: '#f87171',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#5b21b6',
  },
  badgeText: {
    color: C.white,
    fontSize: 9,
    fontWeight: '900',
  },
  navLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.2,
  },
  navLblActive: {
    color: C.white,
    fontWeight: '900',
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    zIndex: 3,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5b21b6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 15,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.95)',
  },
});

export default BottomTabBar;