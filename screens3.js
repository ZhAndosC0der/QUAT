/* ============ СЕМИНАР 9 · лаба 15: токен в AsyncStorage и JWT ============ */
/* ============ СЕМИНАР 9 · лаба 16: вёрстка через StyleSheet ============ */
/* ============ СЕМИНАР 10 · лаба 17: собственные компоненты, props ============ */
/* ============ СЕМИНАР 10 · лаба 18: загрузка данных с сервера ============ */
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, ScrollView, FlatList, Image, RefreshControl, ActivityIndicator, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthCtx, C, Btn } from './screens';
import ProgressRing from './components/ProgressRing';
import StatCard from './components/StatCard';
import GradientTile from './components/GradientTile';
import ActivityRow from './components/ActivityRow';
import ArticleCard from './components/ArticleCard';
import { clearToken, getToken, decodeJwt } from './auth/session';
import { fetchArticles } from './api/articles';
import { isApiConfigured } from './api/config';
import { TODAY_PLAN, DASH_STATS, DASH_TILES, DASH_ACTIVITY } from './mock/dashboard';
import LOCAL_ARTICLES from './mock/articles.json';

// ---------- Лаба 15: сессия и токен ----------
export function SessionScreen({ navigation }) {
  const { setUser } = useContext(AuthCtx);
  const [token, setToken] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setToken(await getToken());
    setLoaded(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  const decoded = token ? decodeJwt(token) : null;
  const exp = decoded?.payload?.exp ? new Date(decoded.payload.exp * 1000).toLocaleString('ru-RU') : '—';

  const logout = () => {
    clearToken();
    setUser(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={s.sec}>Токен в AsyncStorage</Text>
      <View style={s.codeBox}>
        <Text selectable style={s.code}>{loaded ? (token ?? 'Токена нет — войди заново') : 'Загрузка…'}</Text>
      </View>

      <Text style={s.sec}>Данные из JWT (header / payload)</Text>
      <View style={s.codeBox}>
        <Text selectable style={s.code}>{decoded ? JSON.stringify(decoded, null, 2) : '—'}</Text>
      </View>

      <Text style={s.sec}>Разбор JSON</Text>
      <View style={s.codeBox}>
        <Text style={s.codeT}>Имя: {decoded?.payload?.name ?? '—'}</Text>
        <Text style={s.codeT}>Email: {decoded?.payload?.email ?? '—'}</Text>
        <Text style={s.codeT}>Истекает: {exp}</Text>
      </View>

      <Btn t="Перечитать из хранилища" ghost onPress={load} style={{ marginTop: 16 }} />
      <Btn t="Удалить токен и выйти" onPress={logout} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

// ---------- Лабы 16 и 17: левый вариант дашборда ----------
export function Dashboard({ navigation }) {
  const { user } = useContext(AuthCtx);
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.25;
  const firstName = (user?.name || '').trim().split(/\s+/)[0];
  const percent = Math.round(TODAY_PLAN.completed * 100 / TODAY_PLAN.total);

  const open = (route) => {
    if (route === 'Exercises' || route === 'Bookings') {
      navigation.navigate('Main', { screen: route });
    } else {
      navigation.navigate(route);
    }
  };

  return (
    <ScrollView style={s.c} contentContainerStyle={s.dashboard}>
      <View style={s.hero}>
        <View style={s.avatar}><Text style={s.initial}>{firstName.slice(0, 1) || 'Q'}</Text></View>
        <Text style={s.greeting}>{firstName ? `Привет, ${firstName}!` : 'Привет!'}</Text>
        <Text style={s.heroTitle}>Твой план на сегодня</Text>
        <View style={s.summary}>
          <View style={s.plan}>
            <ProgressRing percent={percent} size={compact ? 86 : 108} color="#83DAC8" />
            <Text style={s.caption}>{TODAY_PLAN.completed} из {TODAY_PLAN.total} упражнений</Text>
          </View>
          <View style={s.metrics}>
            {DASH_STATS.map((stat) => <StatCard key={stat.id} {...stat} />)}
          </View>
        </View>
      </View>

      <Text style={s.sec}>Разделы</Text>
      <View style={s.grid}>
        {DASH_TILES.map((tile) => (
          <GradientTile key={tile.id} title={tile.title} icon={tile.icon}
            colors={tile.colors} onPress={() => open(tile.route)} />
        ))}
      </View>

      <Text style={s.sec}>Недавняя активность</Text>
      {DASH_ACTIVITY.map((activity) => <ActivityRow key={activity.id} {...activity} />)}
    </ScrollView>
  );
}

// ---------- Лаба 18: список статей с сервера ----------
export function News({ navigation }) {
  const [feed, setFeed] = useState(isApiConfigured ? null : { source: 'demo', items: LOCAL_ARTICLES });
  const [refreshing, setRefreshing] = useState(false);
  const active = useRef(null);

  const load = useCallback(async () => {
    if (!isApiConfigured) return;
    active.current?.abort();
    const request = new AbortController();
    active.current = request;
    setRefreshing(true);
    try {
      const items = await fetchArticles(request.signal);
      if (!request.signal.aborted) setFeed({ source: 'server', items });
    } catch (error) {
      if (!request.signal.aborted) {
        setFeed({ source: 'demo', items: LOCAL_ARTICLES, error: error.message || 'Не удалось загрузить статьи.' });
      }
    } finally {
      if (active.current === request && !request.signal.aborted) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    return () => active.current?.abort();
  }, [load]));

  if (!feed) {
    return (
      <View style={[s.c, s.mid]}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={s.loading}>Загружаем статьи…</Text>
      </View>
    );
  }

  return (
    <FlatList style={s.c} contentContainerStyle={s.articles} data={feed.items}
      keyExtractor={(article) => article.id}
      refreshControl={isApiConfigured ? (
        <RefreshControl refreshing={refreshing} tintColor={C.gold} onRefresh={load} />
      ) : undefined}
      ListHeaderComponent={(
        <View style={s.sourceBox}>
          <Text style={s.cardT}>{feed.source === 'server' ? 'Статьи с сервера' : 'Демонстрационные статьи'}</Text>
          {!!feed.error && <Text accessibilityRole="alert" style={s.error}>{feed.error} Показана локальная подборка.</Text>}
          {!isApiConfigured && <Text style={s.detail}>Сейчас открыта локальная подборка. Сервер не подключён.</Text>}
          {isApiConfigured && <Btn ghost t={refreshing ? 'Обновляем…' : feed.error ? 'Повторить загрузку' : 'Обновить'}
            onPress={refreshing ? undefined : load} style={s.reload} />}
        </View>
      )}
      ListEmptyComponent={<Text style={s.detail}>Пока нет опубликованных статей.</Text>}
      renderItem={({ item }) => (
        <ArticleCard article={item} onPress={() => navigation.navigate('Article', { article: item })} />
      )} />
  );
}

export function ArticleDetails({ route }) {
  const { article: a } = route.params;
  return (
    <ScrollView style={s.c} contentContainerStyle={{ paddingBottom: 40 }}>
      {!!a.amag && <Image source={{ uri: a.amag }} style={{ width: '100%', height: 240, backgroundColor: C.s2 }} />}
      <View style={{ padding: 20 }}>
        <Text style={s.mut}>{a.date}</Text>
        <Text style={[s.hTitle, { marginVertical: 8 }]}>{a.title}</Text>
        <Text style={{ color: C.tx, fontSize: 16, lineHeight: 25 }}>{a.text}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  dashboard: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36, width: '100%', maxWidth: 600, alignSelf: 'center' },
  hero: { paddingVertical: 17, paddingHorizontal: 12, backgroundColor: C.s1, borderRadius: 18,
    borderWidth: 1, borderColor: C.line, alignItems: 'center' },
  avatar: { height: 36, width: 36, borderRadius: 18, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center' },
  initial: { fontSize: 20, fontWeight: '800', color: C.ink },
  greeting: { color: '#B7CFD2', marginTop: 7, textAlign: 'center' },
  heroTitle: { color: C.tx, fontWeight: '700', fontSize: 17, textAlign: 'center' },
  summary: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  plan: { flex: 1, alignItems: 'center', paddingHorizontal: 3 },
  caption: { fontSize: 12, color: '#BCD0D4', textAlign: 'center', marginTop: 7 },
  metrics: { flex: 1, paddingLeft: 8 },
  articles: { padding: 16, paddingBottom: 36, width: '100%', maxWidth: 650, alignSelf: 'center' },
  sourceBox: { padding: 16, borderRadius: 15, backgroundColor: C.s1, marginBottom: 14 },
  detail: { color: '#B6C9CC', lineHeight: 21, marginTop: 5 },
  error: { color: '#FFC1A8', marginTop: 8, lineHeight: 21 },
  reload: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 18 },
  loading: { color: C.mut, marginTop: 12 },
  c: { flex: 1, backgroundColor: C.bg },
  mid: { justifyContent: 'center', alignItems: 'center' },
  mut: { color: C.mut, fontSize: 15 },
  hTitle: { color: C.tx, fontSize: 26, fontWeight: '800', marginTop: 4 },
  cardT: { color: C.tx, fontSize: 17, fontWeight: '700' },
  sec: { color: C.tx, fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  codeBox: { backgroundColor: C.s1, borderRadius: 14, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: C.line },
  code: { color: C.tx, fontSize: 12, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  codeT: { color: C.tx, fontSize: 14, marginBottom: 4 },
});
