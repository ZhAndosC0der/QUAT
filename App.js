import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AuthCtx, C, Splash, Onboarding, Login, Register, Welcome, Home, Exercises, Details, Book, Bookings, Profile } from './screens';
import { IosSettings, Gallery, Feed, Trainers, TrainerDetail, Checklist, Reps } from './screens2';
import { SessionScreen, Dashboard, News, ArticleDetails } from './screens3';
import Seminar12Screen from './seminar12/Seminar12Screen';
import * as DB from './db';
import { decodeJwt, getToken } from './auth/session';
import Seminar13Screen from './seminar13/Seminar13Screen';
import FinanceScreen from './finance/FinanceScreen';
import { FoodMenuScreen, FoodCategoryScreen, FoodProductScreen } from './food/screens';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.s1, border: C.line, primary: C.gold, text: C.tx },
};

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: C.s1, borderTopColor: C.line },
      tabBarActiveTintColor: C.gold,
      tabBarInactiveTintColor: C.mut,
      tabBarIcon: ({ color, size }) => {
        const icons = { Home: 'home', Exercises: 'barbell', Bookings: 'calendar', Profile: 'person' };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}>
      <Tabs.Screen name="Home" component={Home} options={{ title: 'Главная' }} />
      <Tabs.Screen name="Exercises" component={Exercises} options={{ title: 'Упражнения' }} />
      <Tabs.Screen name="Bookings" component={Bookings} options={{ title: 'Записи' }} />
      <Tabs.Screen name="Profile" component={Profile} options={{ title: 'Профиль' }} />
    </Tabs.Navigator>
  );
}

function AppNavigation() {
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    DB.initDb();
    getToken().then((token) => {
      const session = token ? decodeJwt(token)?.payload : null;
      if (session?.id && session?.name && session?.email) setUser(session);
    }).catch((error) => console.warn('Не удалось восстановить сессию', error)).finally(() => setSessionReady(true));
  }, []);

  if (!sessionReady) {
    return <SafeAreaProvider><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}><ActivityIndicator color={C.gold} /></View></SafeAreaProvider>;
  }

  return (
    <AuthCtx.Provider value={{ user, setUser }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator initialRouteName={user ? 'Main' : 'Splash'} screenOptions={{ headerStyle: { backgroundColor: C.s1 }, headerTintColor: C.tx, contentStyle: { backgroundColor: C.bg } }}>
            <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />
            <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={Register} options={{ title: 'Регистрация' }} />
            <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Details" component={Details} options={{ title: 'Упражнение' }} />
            <Stack.Screen name="Book" component={Book} options={{ title: 'Запись' }} />
            <Stack.Screen name="Feed" component={Feed} options={{ title: 'Лента' }} />
            <Stack.Screen name="Trainers" component={Trainers} options={{ title: 'Тренеры' }} />
            <Stack.Screen name="TrainerDetail" component={TrainerDetail} options={{ title: 'Тренер' }} />
            <Stack.Screen name="Gallery" component={Gallery} options={{ title: 'GIF' }} />
            <Stack.Screen name="Checklist" component={Checklist} options={{ title: 'Чек-лист' }} />
            <Stack.Screen name="Reps" component={Reps} options={{ title: 'Повторы' }} />
            <Stack.Screen name="IosSettings" component={IosSettings} options={{ title: 'Настройки' }} />
            <Stack.Screen name="Session" component={SessionScreen} options={{ title: 'Сессия (JWT)' }} />
            <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'Дашборд' }} />
            <Stack.Screen name="News" component={News} options={{ title: 'Статьи' }} />
            <Stack.Screen name="Article" component={ArticleDetails} options={{ title: 'Статья' }} />
            <Stack.Screen name="Seminar12" component={Seminar12Screen} options={{ title: 'Семинар №12' }} />
            <Stack.Screen name="Seminar13" component={Seminar13Screen} options={{ title: 'Семинар №13' }} />
            <Stack.Screen name="Finance" component={FinanceScreen} options={{ title: 'Финансы' }} />
            <Stack.Screen name="FoodMenu" component={FoodMenuScreen} options={{ title: 'Вкусно — и точка' }} />
            <Stack.Screen name="FoodCategory" component={FoodCategoryScreen} options={{ title: 'Категория' }} />
            <Stack.Screen name="FoodProduct" component={FoodProductScreen} options={{ title: 'Блюдо' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthCtx.Provider>
  );
}

export default function App() {
  return <GestureHandlerRootView style={{ flex: 1 }}><AppNavigation /></GestureHandlerRootView>;
}