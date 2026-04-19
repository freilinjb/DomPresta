  import React, { useEffect, useState } from 'react';
  import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native';
  import { useNavigation, useRoute } from '@react-navigation/native';
  import { Ionicons } from '@expo/vector-icons';
  import { LinearGradient } from 'expo-linear-gradient';
  import * as Haptics from 'expo-haptics';
  import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    FadeInUp,
    interpolate,
    Extrapolation,
  } from 'react-native-reanimated';

  const { width } = Dimensions.get('window');

  // ─── Tokens ──────────────────────────────────────────────────
  const C = {
    primary:   '#4c1d95',
    primary2:  '#5b21b6',
    primary3:  '#6d28d9',
    primary4:  '#7c3aed',
    accent:    '#a78bfa',
    white:     '#ffffff',
    inactive:  'rgba(255,255,255,0.50)',
    badge:     '#f87171',
    badgeBorder: '#5b21b6',
  };

  // ─── Tipos ───────────────────────────────────────────────────
  interface TabItem {
    /** Nombre del ícono en Ionicons */
    icon: keyof typeof Ionicons.glyphMap;
    /** Ícono cuando está activo (relleno) */
    iconActive?: keyof typeof Ionicons.glyphMap;
    label: string;
    screen?: string;
    big?: boolean;
    badge?: number;
  }

  // ─── Tabs ────────────────────────────────────────────────────
  const TABS: TabItem[] = [
    { icon: 'grid-outline',         iconActive: 'grid',            label: 'Inicio',     screen: 'Home'     },
    { icon: 'document-text-outline',iconActive: 'document-text',   label: 'Préstamos',  screen: 'Loans',   badge: 3 },
    { icon: 'add',                  label: '',    big: true,        screen: 'AddLoan'  },
    { icon: 'people-outline',       iconActive: 'people',          label: 'Clientes',   screen: 'Clients'  },
    { icon: 'person-outline',       iconActive: 'person',          label: 'Perfil',     screen: 'Profile' },
  ];

  const SCREEN_NAMES = TABS.map(t => t.screen).filter(Boolean) as string[];
  const TAB_WIDTH    = width / TABS.length;

  // ─── Sub-componente: botón central flotante ───────────────────
  const CenterButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
    const scale  = useSharedValue(1);
    const rotate = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
    }));

    const handlePressIn  = () => {
      scale.value  = withSpring(0.88, { damping: 15, stiffness: 300 });
      rotate.value = withSpring(45,   { damping: 12, stiffness: 200 });
    };
    const handlePressOut = () => {
      scale.value  = withSpring(1,  { damping: 12, stiffness: 200 });
      rotate.value = withSpring(0,  { damping: 12, stiffness: 200 });
    };

    return (
      <View style={s.centerWrapper}>
        <Animated.View style={animStyle}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            accessibilityLabel="Nuevo préstamo"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[C.primary4, C.primary2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.centerButton}
            >
              {/* Reflejo interior */}
              <View style={s.centerButtonShine} />
              <Ionicons name="add" size={30} color={C.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // ─── Sub-componente: tab normal ───────────────────────────────
  const TabButton: React.FC<{
    nav: TabItem;
    isActive: boolean;
    onPress: () => void;
  }> = ({ nav, isActive, onPress }) => {
    const scale    = useSharedValue(1);
    const iconAnim = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
      iconAnim.value = withSpring(isActive ? 1 : 0, { damping: 18, stiffness: 220 });
    }, [isActive]);

    const iconStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: interpolate(iconAnim.value, [0, 1], [1, 1.12], Extrapolation.CLAMP),
        },
        {
          translateY: interpolate(iconAnim.value, [0, 1], [0, -1], Extrapolation.CLAMP),
        },
      ],
    }));

    const wrapStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn  = () => scale.value = withSpring(0.84, { damping: 15 });
    const handlePressOut = () => scale.value = withSpring(1,    { damping: 15 });

    const iconName = (isActive && nav.iconActive) ? nav.iconActive : nav.icon;

    return (
      <Animated.View style={[s.navItem, wrapStyle]}>
        <TouchableOpacity
          style={s.navBtn}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={nav.label}
          accessibilityState={{ selected: isActive }}
        >
          {/* Ícono */}
          <Animated.View style={[s.iconWrap, iconStyle]}>
            <Ionicons
              name={iconName as any}
              size={22}
              color={isActive ? C.white : C.inactive}
            />
            {/* Badge */}
            {!!nav.badge && nav.badge > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{nav.badge > 99 ? '99+' : nav.badge}</Text>
              </View>
            )}
          </Animated.View>

          {/* Label */}
          <Text
            style={[s.navLbl, isActive && s.navLblActive]}
            numberOfLines={1}
          >
            {nav.label}
          </Text>

          {/* Punto activo */}
          {isActive && <View style={s.activeDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ─── Componente principal ─────────────────────────────────────
  const BottomTabBar: React.FC = () => {
    const navigation  = useNavigation();
    const route       = useRoute();
    const [activeIdx, setActiveIdx] = useState(0);

    // Posición del indicador deslizante
    const indicatorX = useSharedValue(0);

    const moveIndicator = (idx: number) => {
      // El botón central (idx 2) no tiene indicador
      if (idx === 2) return;
      const targetIdx = idx > 2 ? idx - 1 : idx; // ajusta por el centro
      indicatorX.value = withSpring(idx * TAB_WIDTH, {
        damping: 22,
        stiffness: 200,
        mass: 0.8,
      });
    };

    // Sincroniza con la navegación real
    useEffect(() => {
      const state = navigation.getState?.();
      const mainTabState = state?.routes?.find((r: any) => r.name === 'MainTabs')?.state;
      if (mainTabState?.routes && mainTabState.index !== undefined) {
        const currentName = mainTabState.routes[mainTabState.index].name;
        const idx = SCREEN_NAMES.indexOf(currentName);
        if (idx !== -1) {
          setActiveIdx(idx);
          moveIndicator(idx);
        }
      }
    }, [route]);

    const go = (tab: TabItem, idx: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveIdx(idx);
      moveIndicator(idx);

      if (tab.screen === 'AddLoan') {
        navigation.navigate('AddLoan' as never);
      } else {
        navigation.navigate(
          'MainTabs' as never,
          { screen: tab.screen } as never,
        );
      }
    };

    const indicatorStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: indicatorX.value }],
    }));

    return (
      <Animated.View
        style={s.wrapper}
        entering={FadeInUp.delay(300).springify().damping(18)}
      >
        {/* Contenedor principal con gradiente */}
        <LinearGradient
          colors={[C.primary, C.primary2, C.primary3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.container}
        >
          {/* Línea de brillo superior */}
          <View style={s.topShine} />

          {/* Overlay glass */}
          <View style={s.glassOverlay} />

          {/* Indicador deslizante */}
          <Animated.View style={[s.indicator, indicatorStyle]} />

          {/* Tabs */}
          <View style={s.tabRow}>
            {TABS.map((tab, i) => {
              if (tab.big) {
                return (
                  <CenterButton
                    key={i}
                    onPress={() => go(tab, i)}
                  />
                );
              }
              return (
                <TabButton
                  key={i}
                  nav={tab}
                  isActive={activeIdx === i}
                  onPress={() => go(tab, i)}
                />
              );
            })}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // ─── Estilos ──────────────────────────────────────────────────
  const TAB_BAR_HEIGHT = 64;
  const BOTTOM_SAFE   = Platform.OS === 'ios' ? 20 : 12;

  const s = StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 12,
      paddingBottom: BOTTOM_SAFE,
    },

    // ── Contenedor con gradiente
    container: {
      borderRadius: 28,
      overflow: 'hidden',
      // Borde externo sutil
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.20)',
      // Sombra profunda morada
      shadowColor: '#5b21b6',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.45,
      shadowRadius: 28,
      elevation: 22,
    },

    // ── Línea de brillo en el borde superior
    topShine: {
      position: 'absolute',
      top: 0,
      left: '8%',
      right: '8%',
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.45)',
      zIndex: 10,
    },

    // ── Overlay glass tenue
    glassOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },

    // ── Indicador deslizante
    indicator: {
      position: 'absolute',
      top: 8,
      width: TAB_WIDTH - 20,
      height: TAB_BAR_HEIGHT - 16,
      marginHorizontal: 10,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      zIndex: 0,
    },

    // ── Row de tabs
    tabRow: {
      flexDirection: 'row',
      height: TAB_BAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 4,
    },

    // ── Tab normal
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    navBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      gap: 3,
    },
    iconWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navLbl: {
      fontSize: 10,
      fontWeight: '700',
      color: C.inactive,
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    navLblActive: {
      color: C.white,
      fontWeight: '800',
    },

    // ── Punto indicador debajo del ícono activo
    activeDot: {
      position: 'absolute',
      bottom: -2,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.9)',
      alignSelf: 'center',
    },

    // ── Badge
    badge: {
      position: 'absolute',
      top: -5,
      right: -9,
      backgroundColor: C.badge,
      borderRadius: 9,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: C.badgeBorder,
    },
    badgeText: {
      color: C.white,
      fontSize: 9,
      fontWeight: '900',
      lineHeight: 11,
    },

    // ── Botón central
    centerWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -24,
      zIndex: 5,
    },
    centerButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      // Borde blanco grueso para efecto flotante
      borderWidth: 3.5,
      borderColor: 'rgba(255,255,255,0.92)',
      // Sombra profunda
      shadowColor: '#4c1d95',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.55,
      shadowRadius: 18,
      elevation: 18,
      overflow: 'hidden',
    },
    // Reflejo interno en la esquina superior izquierda
    centerButtonShine: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '60%',
      height: '50%',
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderTopLeftRadius: 29,
    },
  });

  export default BottomTabBar;