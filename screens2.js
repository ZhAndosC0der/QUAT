import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, ScrollView, Pressable, Image, Share, Switch, Linking, Alert,
  ActionSheetIOS, ActivityIndicator, Platform, StyleSheet, Dimensions, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import Checkbox from 'expo-checkbox';
import { BlurView } from 'expo-blur';
import { Accelerometer } from 'expo-sensors';
import Constants from 'expo-constants';
import * as DB from './db';
import { AuthCtx, C, Btn } from './screens';
import TrainerCard from './components/TrainerCard';

const IOS_BLUE = '#0A84FF'; // системный синий iOS (HIG, тёмная тема)

/* ============ СЕМИНАР 6 · лаба 9: экран под iOS (HIG) ============ */
const Group = ({ children }) => <View style={st.group}>{children}</View>;
const Item = ({ icon, label, right, last, onPress }) => (
  <Pressable onPress={onPress} disabled={!onPress}
    style={({ pressed }) => [st.item, !last && st.sep, pressed && { backgroundColor: C.s2 }]}>
    <Ionicons name={icon} size={20} color={IOS_BLUE} style={{ width: 32 }} />
    <Text style={st.itemT}>{label}</Text>
    {right}
  </Pressable>
);

// Кнопка по образцу supportedURL из документации RN
function OpenURL({ url, t }) {
  const go = useCallback(async () => {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert('Не удалось открыть ссылку', url);
  }, [url]);
  return <Btn t={t} ghost onPress={go} style={{ marginTop: 10 }} />;
}

export function IosSettings() {
  const [remind, setRemind] = useState(true);
  const [sound, setSound] = useState(false);
  const [unit, setUnit] = useState(0);
  const [fav, setFav] = useState(false);

  // ActionSheetIOS есть только на iOS; на остальных платформах — Alert
  const sheet = () => {
    const opts = ['Начать тренировку', fav ? 'Убрать из избранного' : 'Добавить в избранное', 'Отмена'];
    const pick = (i) => { if (i === 1) setFav(!fav); if (i === 0) Alert.alert('Поехали!', 'Тренировка начата'); };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: opts, cancelButtonIndex: 2, title: 'Тренировка' }, pick);
    } else {
      Alert.alert('Тренировка', '', [
        { text: opts[0], onPress: () => pick(0) }, { text: opts[1], onPress: () => pick(1) }, { text: 'Отмена', style: 'cancel' },
      ]);
    }
  };
  const sw = (v, f) => <Switch value={v} onValueChange={f} trackColor={{ true: '#30D158' }} />;

  return (
    <ScrollView style={st.c} contentContainerStyle={{ padding: 20 }}>
      <Text style={st.large}>Настройки</Text>
      <Text style={st.cap}>УВЕДОМЛЕНИЯ</Text>
      <Group>
        <Item icon="notifications" label="Напоминания" right={sw(remind, setRemind)} />
        <Item icon="volume-high" label="Звук таймера" right={sw(sound, setSound)} last />
      </Group>
      <Text style={st.cap}>ЕДИНИЦЫ ВЕСА</Text>
      <View style={st.seg}>
        {['кг', 'фунты'].map((x, k) => (
          <Pressable key={x} onPress={() => setUnit(k)} style={[st.segI, unit === k && st.segOn]}>
            <Text style={{ color: unit === k ? C.tx : C.mut, fontWeight: '600' }}>{x}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={st.cap}>ДЕЙСТВИЯ</Text>
      <Group>
        <Item icon="ellipsis-horizontal-circle" label="Меню тренировки" onPress={sheet}
          right={<Ionicons name="chevron-forward" size={18} color={C.mut} />} last />
      </Group>
      <Text style={st.cap}>ПЛАТФОРМА</Text>
      <Group>
        <Item icon="phone-portrait" label="Platform.OS" right={<Text style={st.val}>{Platform.OS}</Text>} />
        <Item icon="information-circle" label="Версия ОС" right={<Text style={st.val}>{String(Platform.Version)}</Text>} />
        <Item icon="cube" label="Expo SDK" right={<Text style={st.val}>{Constants.expoConfig?.sdkVersion || '54'}</Text>} />
        <Item icon="construct" label="Приложение" right={<Text style={st.val}>{Constants.expoConfig?.name || 'QUAT'}</Text>} last />
      </Group>
      <View style={{ marginTop: 20 }}>
        <OpenURL url="https://developer.apple.com/design/human-interface-guidelines/" t="Human Interface Guidelines" />
        <OpenURL url="https://reactnative.dev/docs/components-and-apis" t="Компоненты React Native" />
      </View>
    </ScrollView>
  );
}

/* ============ СЕМИНАР 6 · лаба 10: галерея GIF + файловая система ============ */
const KEY = 'ВСТАВЬ_СВОЙ_GIPHY_API_KEY'; // бесплатный ключ: developers.giphy.com
const DIR = FileSystem.documentDirectory + 'gifs/';

export function Gallery() {
  const { width } = useWindowDimensions(); const sz = (width - 48) / 2;
  const [mode, setMode] = useState('find'); const [q, setQ] = useState('workout');
  const [res, setRes] = useState([]); const [saved, setSaved] = useState([]); const [busy, setBusy] = useState(false);

  const loadSaved = useCallback(async () => {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    setSaved((await FileSystem.readDirectoryAsync(DIR)).map((f) => DIR + f));
  }, []);
  useEffect(() => { loadSaved(); }, [loadSaved]);

  const search = async () => {
    if (KEY.startsWith('ВСТАВЬ')) return Alert.alert('Нужен ключ', 'Получи бесплатный ключ на developers.giphy.com и вставь его в константу KEY');
    setBusy(true);
    try {
      const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${KEY}&q=${encodeURIComponent(q)}&limit=14&rating=g`);
      const j = await r.json();
      setRes(j.data.map((g) => ({ id: g.id, url: g.images.fixed_height.url })));
    } catch { Alert.alert('Ошибка сети', 'Проверь интернет и попробуй ещё раз'); }
    setBusy(false);
  };
  const save = async (g) => {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    await FileSystem.downloadAsync(g.url, DIR + g.id + '.gif');
    loadSaved();
  };
  const del = (uri) => Alert.alert('Удалить GIF?', '', [{ text: 'Нет' }, { text: 'Удалить', style: 'destructive',
    onPress: async () => { await FileSystem.deleteAsync(uri, { idempotent: true }); loadSaved(); } }]);

  const data = mode === 'find' ? res.map((g) => ({ key: g.id, uri: g.url, g })) : saved.map((u) => ({ key: u, uri: u }));
  return (
    <View style={st.c}>
      <View style={[st.seg, { margin: 20, marginBottom: 12 }]}>
        {[['find', 'Найти'], ['saved', `Сохранённые (${saved.length})`]].map(([k, l]) => (
          <Pressable key={k} onPress={() => setMode(k)} style={[st.segI, mode === k && st.segOn]}>
            <Text style={{ color: mode === k ? C.tx : C.mut, fontWeight: '600' }}>{l}</Text>
          </Pressable>))}
      </View>
      {mode === 'find' && (
        <View style={[st.field, { marginHorizontal: 20 }]}>
          <TextInput style={st.input} value={q} onChangeText={setQ} placeholder="Поиск GIF" placeholderTextColor={C.mut} onSubmitEditing={search} returnKeyType="search" />
          <Pressable onPress={search} hitSlop={10}><Ionicons name="search" size={20} color={C.gold} /></Pressable>
        </View>)}
      {busy && <ActivityIndicator color={C.gold} style={{ margin: 12 }} />}
      <FlatList data={data} numColumns={2} keyExtractor={(i) => i.key} contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={[st.val, { textAlign: 'center', marginTop: 30 }]}>{mode === 'find' ? 'Введи запрос и нажми поиск. Нажми на GIF, чтобы сохранить.' : 'Пока ничего не сохранено. Долгое нажатие удаляет GIF.'}</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => item.g && save(item.g)} onLongPress={() => !item.g && del(item.uri)}
            style={[st.gif, { width: sz, height: sz }]}>
            <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            {item.g && saved.includes(DIR + item.key + '.gif') && <Ionicons name="checkmark-circle" size={22} color={C.gold} style={st.badge} />}
          </Pressable>)} />
    </View>
  );
}

/* ============ СЕМИНАР 7 · лаба 11: лента как в соцсети ============ */
const POSTS = [
  { id: 1, u: 'Айдана К.', ago: '2 минуты назад', t: 'Закрыла 4×8 в жиме лёжа. Новый рекорд!', likes: 128 },
  { id: 2, u: 'Максим Юркин', ago: '15 минут назад', t: 'Утренняя планка: 3×60 секунд. Пресс горит.', likes: 94 },
  { id: 3, u: 'Ирина Веселова', ago: '1 час назад', t: 'День ног закончен, лестницу пока не осилю.', likes: 211 },
  { id: 4, u: 'Данияр С.', ago: '3 часа назад', t: 'Подтягивания: впервые 12 раз подряд.', likes: 167 },
  { id: 5, u: 'Алия М.', ago: 'вчера', t: 'Пробежка 5 км и растяжка. Лучшее начало дня.', likes: 76 },
];
const pic = (id) => `https://picsum.photos/seed/quat${id}/700/420`;

export function Feed() {
  const [tab, setTab] = useState('pop'); const [q, setQ] = useState(''); const [liked, setLiked] = useState({});
  const list = POSTS.filter((p) => (p.u + ' ' + p.t).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (tab === 'pop' ? b.likes - a.likes : b.id - a.id));
  const share = (p) => Share.share({ message: `${p.u}: ${p.t}`, url: pic(p.id) });
  return (
    <View style={st.c}>
      <View style={[st.field, { margin: 20, marginBottom: 8 }]}>
        <Ionicons name="search" size={18} color={C.mut} />
        <TextInput style={st.input} placeholder="Поиск по постам и людям" placeholderTextColor={C.mut} value={q} onChangeText={setQ} />
      </View>
      <View style={st.tabs}>
        {[['pop', 'ПОПУЛЯРНЫЕ'], ['new', 'ПОСЛЕДНИЕ']].map(([k, l]) => (
          <Pressable key={k} onPress={() => setTab(k)}><Text style={[st.tabT, tab === k && { color: C.gold, borderBottomColor: C.gold }]}>{l}</Text></Pressable>))}
      </View>
      <FlatList data={list} keyExtractor={(p) => String(p.id)} contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={[st.val, { textAlign: 'center' }]}>Ничего не найдено</Text>}
        renderItem={({ item: p }) => (
          <View style={st.post}>
            <View style={st.phead}>
              <View style={st.ava}><Text style={{ color: C.gold, fontWeight: '800' }}>{p.u[0]}</Text></View>
              <View style={{ flex: 1 }}><Text style={st.itemT}>{p.u}</Text><Text style={st.val}>{p.ago}</Text></View>
            </View>
            <Image source={{ uri: pic(p.id) }} style={st.pimg} />
            <Text style={[st.itemT, { margin: 12 }]}>{p.t}</Text>
            <View style={st.acts}>
              <Pressable style={st.act} onPress={() => setLiked({ ...liked, [p.id]: !liked[p.id] })}>
                <Ionicons name={liked[p.id] ? 'heart' : 'heart-outline'} size={22} color={liked[p.id] ? '#FF5A6E' : C.mut} />
                <Text style={st.val}> {p.likes + (liked[p.id] ? 1 : 0)}</Text>
              </Pressable>
              <Pressable style={st.act} onPress={() => share(p)}><Ionicons name="share-outline" size={22} color={C.gold} /><Text style={st.val}> Поделиться</Text></Pressable>
            </View>
          </View>)} />
    </View>
  );
}

/* ============ СЕМИНАР 7 · лаба 12: телефонная книга тренеров ============ */
const TRAINERS = [
  { id: 1, name: 'Андрей Волков', spec: 'Силовые тренировки', phone: '+77010000001' },
  { id: 2, name: 'Мадина Сейт', spec: 'Йога и растяжка', phone: '+77010000002' },
  { id: 3, name: 'Олег Петров', spec: 'Кроссфит', phone: '+77010000003' },
  { id: 4, name: 'Камила Нур', spec: 'Кардио и похудение', phone: '+77010000004' },
  { id: 5, name: 'Тимур Аман', spec: 'Бокс', phone: '+77010000005' },
];

export function Trainers({ navigation }) {
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setRows(TRAINERS), 700);
    return () => clearTimeout(timer);
  }, []);
  if (!rows) return <View style={[st.c, st.mid]}><ActivityIndicator size="large" color={C.gold} /><Text style={[st.val, { marginTop: 12 }]}>Загружаем контакты…</Text></View>;
  const search = query.trim().toLowerCase();
  const matches = rows.filter((trainer) =>
    [trainer.name, trainer.spec, trainer.phone].some((value) => value.toLowerCase().includes(search))
  );
  return (
    <View style={st.c}>
      <View style={[st.field, { marginHorizontal: 20, marginTop: 16 }]}>
        <Ionicons name="search" size={18} color={C.mut} />
        <TextInput style={st.input} accessibilityLabel="Поиск тренера" placeholder="Имя, направление или телефон"
          placeholderTextColor={C.mut} value={query} onChangeText={setQuery} />
      </View>
      <FlatList data={matches} keyExtractor={(trainer) => String(trainer.id)}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={{ color: C.mut }}>Тренер не найден. Попробуй другое имя или направление.</Text>}
        renderItem={({ item }) => (
          <TrainerCard trainer={item} onPress={() => navigation.navigate('TrainerDetail', { t: item })} />
        )} />
    </View>
  );
}

export function TrainerDetail({ route }) {
  const { t } = route.params; const W = Dimensions.get('window').width;
  const cover = `https://picsum.photos/seed/trainer${t.id}/600/400`;
  const round = (icon, color, onPress) => (
    <Pressable onPress={onPress} style={({ pressed }) => [st.round, { backgroundColor: color, opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={22} color="#fff" />
    </Pressable>);
  return (
    <View style={st.c}>
      <View style={{ height: W * 0.6 }}>
        <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />
        <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFill, st.mid]}>
          <Image source={{ uri: cover }} style={st.bigAva} />
        </BlurView>
      </View>
      <Text style={[st.large, { textAlign: 'center', fontSize: 24, marginTop: 16 }]}>{t.name}</Text>
      <Text style={[st.val, { textAlign: 'center' }]}>{t.spec} · {t.phone}</Text>
      <View style={st.btns}>
        {round('call', '#30D158', () => Linking.openURL(`tel:${t.phone}`))}
        {round('chatbubble', '#0A84FF', () => Linking.openURL(`sms:${t.phone}`))}
        {round('share', '#8E6BE8', () => Share.share({ message: `${t.name} (${t.spec})\n${t.phone}` }))}
      </View>
      <View style={st.btns}>
        <Text style={st.val}>Позвонить</Text><Text style={st.val}>Написать</Text><Text style={st.val}>Поделиться</Text>
      </View>
    </View>
  );
}

/* ============ СЕМИНАР 8 · лаба 13: чек-лист (SQLite + Checkbox) ============ */
export function Checklist() {
  const { user } = useContext(AuthCtx); const [rows, setRows] = useState([]); const [t, setT] = useState('');
  const load = useCallback(() => setRows(DB.getTasks(user.id)), [user]);
  useFocusEffect(load);
  const add = () => { if (!t.trim()) return; DB.addTask(user.id, t.trim()); setT(''); load(); };
  const toggle = (r) => { DB.toggleTask(r.id, r.done ? 0 : 1); load(); };
  const del = (r) => { DB.delTask(r.id); load(); };
  const sec = (title, items) => (
    <>
      <Text style={st.cap}>{title.toUpperCase()} ({items.length})</Text>
      {items.length === 0 && <Text style={st.val}>Пусто</Text>}
      {items.map((r) => (
        <View key={r.id} style={[st.task, !!r.done && { backgroundColor: '#1D8A5C' }]}>
          <Checkbox value={!!r.done} onValueChange={() => toggle(r)} color={r.done ? '#fff' : C.gold} style={{ marginRight: 12 }} />
          <Text style={[st.itemT, { flex: 1 }, !!r.done && { textDecorationLine: 'line-through' }]}>{r.title}</Text>
          <Pressable onPress={() => del(r)} hitSlop={10}><Ionicons name="close" size={20} color={C.mut} /></Pressable>
        </View>))}
    </>);
  return (
    <ScrollView style={st.c} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <View style={st.field}>
        <TextInput style={st.input} placeholder="Что нужно сделать?" placeholderTextColor={C.mut} value={t} onChangeText={setT} onSubmitEditing={add} returnKeyType="done" />
        <Pressable onPress={add} hitSlop={10}><Ionicons name="add-circle" size={26} color={C.gold} /></Pressable>
      </View>
      {sec('Что сделать', rows.filter((r) => !r.done))}
      {sec('Завершённые', rows.filter((r) => r.done))}
    </ScrollView>
  );
}

/* ============ СЕМИНАР 8 · лаба 14: счётчик повторений (Accelerometer) ============ */
export function Reps() {
  const [on, setOn] = useState(false); const [n, setN] = useState(0); const [ok, setOk] = useState(true);
  const last = useRef(0);
  useEffect(() => { Accelerometer.isAvailableAsync().then(setOk).catch(() => setOk(false)); }, []);
  useEffect(() => {
    if (!on) return;
    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const m = Math.sqrt(x * x + y * y + z * z); const now = Date.now();
      if (m > 1.4 && now - last.current > 600) { last.current = now; setN((v) => v + 1); }
    });
    return () => sub.remove();
  }, [on]);
  return (
    <View style={[st.c, st.mid, { padding: 24 }]}>
      <Text style={st.val}>Держи телефон в руке и делай повторения</Text>
      <Text style={st.big}>{n}</Text>
      <Text style={st.val}>повторений</Text>
      {!ok && <Text style={{ color: C.err, marginTop: 12 }}>Акселерометр недоступен (открой на телефоне)</Text>}
      <Btn t={on ? 'Стоп' : 'Старт'} onPress={() => setOn(!on)} style={{ alignSelf: 'stretch', marginTop: 32 }} />
      <Btn t="Сбросить" ghost onPress={() => setN(0)} style={{ alignSelf: 'stretch', marginTop: 12 }} />
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: C.bg },
  mid: { justifyContent: 'center', alignItems: 'center' },
  large: { color: C.tx, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  cap: { color: C.mut, fontSize: 13, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  group: { backgroundColor: C.s1, borderRadius: 14, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  sep: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  itemT: { color: C.tx, fontSize: 17, flex: 0 },
  val: { color: C.mut, fontSize: 15, marginLeft: 'auto' },
  seg: { flexDirection: 'row', backgroundColor: C.s1, borderRadius: 10, padding: 3 },
  segI: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  segOn: { backgroundColor: C.s2 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingHorizontal: 16 },
  input: { flex: 1, color: C.tx, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16 },
  gif: { margin: 4, borderRadius: 14, overflow: 'hidden', backgroundColor: C.s1 },
  badge: { position: 'absolute', top: 8, right: 8 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20 },
  tabT: { color: C.mut, fontWeight: '700', fontSize: 13, marginRight: 22, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  post: { backgroundColor: C.s1, borderRadius: 18, marginBottom: 16, overflow: 'hidden' },
  phead: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  ava: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.s2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pimg: { width: '100%', height: 200, backgroundColor: C.s2 },
  acts: { flexDirection: 'row', padding: 12, paddingTop: 0 },
  act: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  round: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  bigAva: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: C.gold },
  btns: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  task: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 14, marginBottom: 6 },
  big: { color: C.gold, fontSize: 120, fontWeight: '900', marginVertical: 8 },
});