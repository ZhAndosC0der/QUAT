import React, { useState, useEffect, useRef, useContext, createContext, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Animated, Alert, StyleSheet, ImageBackground, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXERCISES, MUSCLES, MICON, SLIDES } from './data';
import * as DB from './db';
import { clearToken, saveToken } from './auth/session';

export const AuthCtx = createContext();
// Палитра QUAT: глубокая бирюза + золото
export const C = { bg: '#08181E', s1: '#0E2630', s2: '#143642', line: '#1F4452', tx: '#EAF2F4', mut: '#7F9CA6', gold: '#E8C36A', ink: '#1A1405', err: '#FF8A7A' };

export const Btn = ({ t, onPress, style, ghost }) => (
  <TouchableOpacity activeOpacity={0.8} style={[s.btn, ghost && s.ghost, style]} onPress={onPress}>
    <Text style={[s.bt, ghost && { color: C.tx }]}>{t}</Text>
  </TouchableOpacity>
);
const Logo = ({ size = 64 }) => (
  <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: size * 0.55, fontWeight: '900', color: C.ink }}>Q</Text>
  </View>
);
export function Screen({ children, title, sub }) {
  const i = useSafeAreaInsets();
  return (
    <View style={[s.c, { paddingTop: i.top + 12 }]}>
      {title && <View style={{ paddingHorizontal: 20, marginBottom: 12 }}><Text style={s.title}>{title}</Text>{sub && <Text style={s.mut}>{sub}</Text>}</View>}
      {children}
    </View>
  );
}

// ---------- Лаунчскрин (анимация) ----------
export function Splash({ navigation }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let timer;
    const animation = Animated.timing(a, { toValue: 1, duration: 1300, useNativeDriver: Platform.OS !== 'web' });
    animation.start(({ finished }) => {
      if (finished) timer = setTimeout(() => navigation.replace('Onboarding'), 500);
    });
    return () => { clearTimeout(timer); animation.stop(); };
  }, [a, navigation]);
  return (
    <View style={[s.c, s.center]}>
      <Animated.View style={{ alignItems: 'center', opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
        <Logo size={88} />
        <Text style={s.word}>QUAT</Text>
        <Text style={s.mut}>Тренируйся в ритме</Text>
      </Animated.View>
    </View>
  );
}

// ---------- Слайдер ----------
export function Onboarding({ navigation }) {
  const x = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const i = useSafeAreaInsets();
  return (
    <View style={[s.c, { paddingTop: i.top + 12 }]}>
      <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 16 }} onPress={() => navigation.replace('Login')}><Text style={s.mut}>Пропустить</Text></TouchableOpacity>
      <Animated.ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={1}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: false })}>
        {SLIDES.map((sl, k) => (
          <View key={k} style={{ width, paddingHorizontal: 24 }}>
            <View style={[s.slide, { backgroundColor: sl.c }]}>
              <Ionicons name={sl.i} size={72} color={C.gold} />
              <Text style={[s.title, { marginTop: 24 }]}>{sl.t}</Text>
              <Text style={[s.mut, { marginTop: 8 }]}>{sl.d}</Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>
      <View style={s.dots}>
        {SLIDES.map((_, k) => (
          <Animated.View key={k} style={[s.dot, { width: x.interpolate({ inputRange: [width * (k - 1), width * k, width * (k + 1)], outputRange: [8, 24, 8], extrapolate: 'clamp' }) }]} />
        ))}
      </View>
      <Btn t="Начать" style={{ margin: 24, marginBottom: i.bottom + 24 }} onPress={() => navigation.replace('Login')} />
    </View>
  );
}

// ---------- Вход / регистрация ----------
function Field({ icon, secure, ...p }) {
  const [f, setF] = useState(false); const [h, setH] = useState(!!secure);
  return (
    <View style={[s.field, f && { borderColor: C.gold }]}>
      <Ionicons name={icon} size={20} color={f ? C.gold : C.mut} />
      <TextInput style={s.input} placeholderTextColor={C.mut} autoCapitalize="none" secureTextEntry={h}
        onFocus={() => setF(true)} onBlur={() => setF(false)} {...p} />
      {secure && <TouchableOpacity onPress={() => setH(!h)}><Ionicons name={h ? 'eye-off' : 'eye'} size={20} color={C.mut} /></TouchableOpacity>}
    </View>
  );
}
function Shell({ children }) {
  return (
    <KeyboardAvoidingView style={s.c} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 28, paddingTop: 90 }}>{children}</ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Login({ navigation }) {
  const { setUser } = useContext(AuthCtx);
  const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [err, setErr] = useState('');
  const go = async () => {
    const u = DB.loginUser(email.trim().toLowerCase(), pass);
    if (!u) return setErr('Неверный email или пароль');
    setUser(u);
    await saveToken(u);
    Alert.alert('Готово', 'Авторизация прошла успешно');
    navigation.replace('Welcome', { name: u.name });
  };
  return (
    <Shell>
      <Logo />
      <Text style={[s.title, { marginTop: 28 }]}>С возвращением</Text>
      <Text style={[s.mut, { marginBottom: 28 }]}>Войди, чтобы увидеть свои записи</Text>
      <Field icon="mail" placeholder="Email" value={email} onChangeText={(v) => { setEmail(v); setErr(''); }} keyboardType="email-address" />
      <Field icon="lock-closed" placeholder="Пароль" secure value={pass} onChangeText={(v) => { setPass(v); setErr(''); }} />
      {!!err && <Text style={s.err}>{err}</Text>}
      <Btn t="Войти" onPress={go} style={{ marginTop: 12 }} />
      <TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={s.link}>Нет аккаунта? Зарегистрироваться</Text></TouchableOpacity>
    </Shell>
  );
}

export function Register({ navigation }) {
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [err, setErr] = useState('');
  const go = () => {
    if (!name.trim() || !email.includes('@')) return setErr('Укажи имя и корректный email');
    if (p1.length < 4) return setErr('Пароль: минимум 4 символа');
    if (p1 !== p2) return setErr('Пароли не совпадают');
    if (!DB.registerUser(name.trim(), email.trim().toLowerCase(), p1)) return setErr('Этот email уже занят');
    Alert.alert('Готово', 'Регистрация прошла успешно');
    navigation.goBack();
  };
  return (
    <Shell>
      <Text style={s.title}>Создать аккаунт</Text>
      <Text style={[s.mut, { marginBottom: 28 }]}>Это нужно один раз, чтобы сохранять твои записи</Text>
      <Field icon="person" placeholder="Имя" value={name} onChangeText={setName} />
      <Field icon="mail" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field icon="lock-closed" placeholder="Пароль" secure value={p1} onChangeText={setP1} />
      <Field icon="lock-closed" placeholder="Пароль ещё раз" secure value={p2} onChangeText={setP2} />
      {!!err && <Text style={s.err}>{err}</Text>}
      <Btn t="Зарегистрироваться" onPress={go} style={{ marginTop: 12 }} />
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.link}>Уже есть аккаунт? Войти</Text></TouchableOpacity>
    </Shell>
  );
}

// ---------- Приветствие (данные из параметров) ----------
export function Welcome({ route, navigation }) {
  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900' }} style={[s.c, { justifyContent: 'flex-end' }]}>
      <View style={s.shade}>
        <Text style={s.mut}>Рады видеть</Text>
        <Text style={[s.title, { fontSize: 36 }]}>{route.params?.name}</Text>
        <Text style={[s.mut, { marginBottom: 24 }]}>Готов к тренировке?</Text>
        <Btn t="Поехали" onPress={() => navigation.replace('Main')} />
      </View>
    </ImageBackground>
  );
}

// ---------- Главная ----------
export function Home({ navigation }) {
  const { user } = useContext(AuthCtx); const [next, setNext] = useState(null);
  useFocusEffect(useCallback(() => { setNext(DB.getBookings(user.id)[0] || null); }, [user]));
  return (
    <Screen title={`Привет, ${user.name}`} sub="Что тренируем сегодня?">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={s.hero}>
          <Text style={s.mut}>Ближайшая тренировка</Text>
          {next ? (<>
            <Text style={s.heroT}>{next.time}</Text>
            <Text style={{ color: C.tx, fontSize: 16 }}>{next.exercise} · {next.date}</Text>
          </>) : (<>
            <Text style={[s.cardT, { marginVertical: 8 }]}>Пока ничего не запланировано</Text>
            <Btn t="Выбрать упражнение" onPress={() => navigation.navigate('Exercises')} style={{ alignSelf: 'flex-start', paddingHorizontal: 20, marginTop: 4 }} />
          </>)}
        </View>
        <Text style={s.sec}>Группы мышц</Text>
        <View style={s.grid}>
          {MUSCLES.slice(1).map((m) => (
            <TouchableOpacity key={m} style={s.tile} activeOpacity={0.8} onPress={() => navigation.navigate('Exercises', { muscle: m })}>
              <Ionicons name={MICON[m]} size={24} color={C.gold} />
              <Text style={s.tileT}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.sec}>Рекомендуем</Text>
        {EXERCISES.slice(0, 3).map((e) => <Row key={e.id} e={e} onPress={() => navigation.navigate('Details', { ex: e })} />)}
      </ScrollView>
    </Screen>
  );
}
const Row = ({ e, onPress }) => (
  <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
    <View style={s.ico}><Ionicons name={e.icon} size={22} color={C.gold} /></View>
    <View style={{ flex: 1 }}><Text style={s.cardT}>{e.name}</Text><Text style={s.mut}>{e.muscle} · {e.sets}</Text></View>
    <Ionicons name="chevron-forward" size={18} color={C.mut} />
  </TouchableOpacity>
);

// ---------- Каталог ----------
export function Exercises({ navigation, route }) {
  const [q, setQ] = useState(''); const [m, setM] = useState('Все');
  useEffect(() => { if (route.params?.muscle) setM(route.params.muscle); }, [route.params]);
  const list = EXERCISES.filter((e) => (m === 'Все' || e.muscle === m) && e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen title="Упражнения">
      <View style={[s.field, { marginHorizontal: 20, marginBottom: 12 }]}>
        <Ionicons name="search" size={18} color={C.mut} />
        <TextInput style={s.input} placeholder="Поиск" placeholderTextColor={C.mut} value={q} onChangeText={setQ} />
      </View>
      <View style={{ height: 44 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {MUSCLES.map((x) => (
            <TouchableOpacity key={x} onPress={() => setM(x)} style={[s.chip, m === x && s.chipOn]}>
              <Text style={{ color: m === x ? C.ink : C.tx, fontWeight: '600' }}>{x}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList data={list} keyExtractor={(e) => String(e.id)} contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={[s.mut, { textAlign: 'center' }]}>Ничего не найдено. Измени запрос или группу мышц.</Text>}
        renderItem={({ item }) => <Row e={item} onPress={() => navigation.navigate('Details', { ex: item })} />} />
    </Screen>
  );
}

// ---------- Детали ----------
export function Details({ route, navigation }) {
  const { ex } = route.params;
  const p = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 1.04, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(p, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' })]));
    l.start(); return () => l.stop();
  }, [p]);
  return (
    <View style={[s.c, { padding: 24 }]}>
      <View style={s.heroIco}><Ionicons name={ex.icon} size={64} color={C.gold} /></View>
      <Text style={s.title}>{ex.name}</Text>
      <View style={{ flexDirection: 'row', marginVertical: 14 }}>
        <View style={s.tag}><Text style={s.tagT}>{ex.muscle}</Text></View>
        <View style={s.tag}><Text style={s.tagT}>{ex.sets}</Text></View>
      </View>
      <Text style={{ color: C.tx, fontSize: 16, lineHeight: 25, opacity: 0.9 }}>{ex.desc}</Text>
      <View style={{ flex: 1 }} />
      <Animated.View style={{ transform: [{ scale: p }] }}><Btn t="Записаться" onPress={() => navigation.navigate('Book', { ex })} /></Animated.View>
      <Btn t="К списку" ghost style={{ marginTop: 12, marginBottom: 12 }} onPress={() => navigation.popToTop()} />
    </View>
  );
}

// ---------- Бронирование ----------
const mk = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  const wd = d.toLocaleDateString('ru-RU', { weekday: 'short' }); const num = d.getDate();
  const mo = d.toLocaleDateString('ru-RU', { month: 'short' });
  return { wd, num, key: `${wd}, ${num} ${mo}` };
});
const TIMES = ['09:00', '11:00', '14:00', '17:00', '19:00', '20:30'];

export function Book({ route, navigation }) {
  const { ex } = route.params; const { user } = useContext(AuthCtx);
  const D = mk(); const [d, setD] = useState(D[0].key); const [t, setT] = useState(null);
  const save = () => {
    if (!t) return Alert.alert('Выбери время', 'Нужно указать время тренировки');
    DB.addBooking(user.id, ex.name, d, t);
    Alert.alert('Готово', `${ex.name}\n${d}, ${t}`);
    navigation.navigate('Main', { screen: 'Bookings' });
  };
  return (
    <View style={[s.c, { padding: 24 }]}>
      <Text style={s.title}>{ex.name}</Text>
      <Text style={s.sec}>День</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {D.map((x) => (
          <TouchableOpacity key={x.key} onPress={() => { setD(x.key); setT(null); }} style={[s.day, d === x.key && s.chipOn]}>
            <Text style={{ color: d === x.key ? C.ink : C.mut }}>{x.wd}</Text>
            <Text style={{ color: d === x.key ? C.ink : C.tx, fontSize: 20, fontWeight: '700' }}>{x.num}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={s.sec}>Время</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {TIMES.map((x) => {
          const busy = DB.isBusy(d, x);
          return (
            <TouchableOpacity key={x} disabled={busy} onPress={() => setT(x)} style={[s.slot, t === x && s.chipOn, busy && { opacity: 0.3 }]}>
              <Text style={{ color: t === x ? C.ink : C.tx, fontWeight: '600' }}>{x}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <Btn t={t ? `Подтвердить · ${t}` : 'Подтвердить'} onPress={save} style={{ marginBottom: 12 }} />
    </View>
  );
}

// ---------- Записи ----------
export function Bookings() {
  const { user } = useContext(AuthCtx); const [rows, setRows] = useState([]);
  const load = useCallback(() => setRows(DB.getBookings(user.id)), [user]);
  useFocusEffect(load);
  const del = (id) => Alert.alert('Отменить запись?', '', [{ text: 'Нет' }, { text: 'Отменить', style: 'destructive', onPress: () => { DB.delBooking(id); load(); } }]);
  return (
    <Screen title="Мои записи" sub={`Всего: ${rows.length}`}>
      <FlatList data={rows} keyExtractor={(r) => String(r.id)} contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={[s.mut, { textAlign: 'center' }]}>Записей пока нет. Выбери упражнение и запишись.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.time}><Text style={{ color: C.gold, fontWeight: '800', fontSize: 16 }}>{item.time}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.cardT}>{item.exercise}</Text><Text style={s.mut}>{item.date}</Text></View>
            <TouchableOpacity onPress={() => del(item.id)} hitSlop={12}><Ionicons name="close-circle" size={24} color={C.mut} /></TouchableOpacity>
          </View>
        )} />
    </Screen>
  );
}

// ---------- Профиль ----------
const MENU = [
  ['Лента', 'Feed', 'newspaper'], ['Тренеры', 'Trainers', 'people'], ['GIF', 'Gallery', 'images'],
  ['Чек-лист', 'Checklist', 'checkbox'], ['Повторы', 'Reps', 'pulse'], ['iOS', 'IosSettings', 'settings'], ['Сессия', 'Session', 'key'], ['Семинар №12', 'Seminar12', 'school'], ['Дашборд', 'Dashboard', 'grid'], ['Статьи', 'News', 'reader'],
  ['Семинар №13', 'Seminar13', 'move'], ['Финансы', 'Finance', 'wallet'],
['Вкусно и точка', 'FoodMenu', 'restaurant'],
];
export function Profile({ navigation }) {
  const { user, setUser } = useContext(AuthCtx); const [n, setN] = useState(0);
  useFocusEffect(useCallback(() => { setN(DB.getBookings(user.id).length); }, [user]));
  return (
    <Screen title="Профиль">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={s.hero}>
          <View style={[s.heroIco, { width: 64, height: 64, marginBottom: 12 }]}><Text style={{ fontSize: 28, fontWeight: '800', color: C.gold }}>{user.name[0].toUpperCase()}</Text></View>
          <Text style={s.cardT}>{user.name}</Text><Text style={s.mut}>{user.email}</Text>
        </View>
        <View style={[s.card, { justifyContent: 'space-between', marginTop: 12 }]}><Text style={s.cardT}>Запланировано тренировок</Text><Text style={{ color: C.gold, fontSize: 22, fontWeight: '800' }}>{n}</Text></View>
        <View style={[s.grid, { marginTop: 8 }]}>
          {MENU.map(([l, r, ic]) => (
            <TouchableOpacity key={r} style={s.tile} activeOpacity={0.8} onPress={() => navigation.navigate(r)}>
              <Ionicons name={ic} size={24} color={C.gold} /><Text style={s.tileT}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Btn t="Выйти" ghost style={{ marginTop: 12 }} onPress={async () => { await clearToken(); setUser(null); navigation.getParent().reset({ index: 0, routes: [{ name: 'Login' }] }); }} />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { color: C.tx, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  word: { color: C.tx, fontSize: 34, fontWeight: '800', letterSpacing: 10, marginTop: 20, marginBottom: 6 },
  mut: { color: C.mut, fontSize: 15 },
  sec: { color: C.tx, fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  err: { color: C.err, marginBottom: 6, marginLeft: 4 },
  link: { color: C.gold, textAlign: 'center', marginTop: 22, fontSize: 15 },
  btn: { backgroundColor: C.gold, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  bt: { color: C.ink, fontWeight: '800', fontSize: 16 },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.line },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingHorizontal: 16, marginBottom: 12 },
  input: { flex: 1, color: C.tx, paddingVertical: 15, paddingHorizontal: 10, fontSize: 16 },
  chip: { backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginRight: 8 },
  chipOn: { backgroundColor: C.gold, borderColor: C.gold },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.s1, borderRadius: 18, padding: 14, marginBottom: 10 },
  cardT: { color: C.tx, fontSize: 17, fontWeight: '600' },
  ico: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.s2, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  time: { backgroundColor: C.s2, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, marginRight: 14 },
  hero: { backgroundColor: C.s1, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: C.line },
  heroT: { color: C.gold, fontSize: 44, fontWeight: '800', marginVertical: 4 },
  heroIco: { width: 112, height: 112, borderRadius: 32, backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '31%', backgroundColor: C.s1, borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 10 },
  tileT: { color: C.tx, marginTop: 8, fontSize: 13, fontWeight: '600' },
  tag: { backgroundColor: C.s2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  tagT: { color: C.tx, fontSize: 13 },
  day: { width: 58, backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginRight: 10 },
  slot: { width: '30%', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginRight: '3%', marginBottom: 10 },
  slide: { height: 380, borderRadius: 28, alignItems: 'center', justifyContent: 'center', padding: 28, borderWidth: 1, borderColor: C.line },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  dot: { height: 8, borderRadius: 4, backgroundColor: C.gold, marginHorizontal: 4 },
  shade: { backgroundColor: 'rgba(8,24,30,0.88)', padding: 28, paddingBottom: 48, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
});
