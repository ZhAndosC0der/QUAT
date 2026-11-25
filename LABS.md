# Лабы 15–18 (семинары 9–10)

## Установка новых зависимостей
    npx expo install @react-native-async-storage/async-storage expo-linear-gradient react-native-svg axios

## Что где лежит
- Лаба 15 (AsyncStorage, JSON, JWT): `auth/session.js`, экран «Сессия (JWT)` в Профиле.
  Вход сохраняет токен, при запуске приложения сессия восстанавливается, выход удаляет токен.
- Лаба 16 (вёрстка через StyleSheet): экран «Дашборд» в Профиле.
- Лаба 17 (собственные компоненты и props): `components/` (ProgressRing, StatCard, GradientTile, ActivityRow, ArticleCard), данные в `mock/dashboard.js`.
- Лаба 18 (загрузка с сервера): `api/articles.js` (axios), экраны «Статьи» и «Статья» в Профиле.

## Настройка mockapi.io
1. Создай проект на mockapi.io, скопируй адрес вида https://xxxxxxxx.mockapi.io
2. Вставь его в `api/config.js` в константу API_URL.
3. Создай ресурс `articles` с полями: title (string), date (string), amag (string), text (string).
4. Добавь 5 записей из `mock/articles.json` (можно вручную или через импорт).
Пока API_URL не настроен, экран статей показывает локальные данные из `mock/articles.json`.

## Семинар 12 — жизненный цикл React и Redux
- Лабораторная №21: `seminar12/LifecycleDemo.js`. Кнопки обновления и размонтирования показывают события в консоли Expo.
- Лабораторная №22: `seminar12/store.js` и `seminar12/ReduxTimer.js`. Таймер использует Redux, стартует с 6 секунд; длительность можно задать вручную или выбрать 1500 секунд.
- Экран добавлен в меню профиля как «Семинар №12»; Redux Provider подключён только к этому экрану.
- Запуск: `npx expo start`, затем открыть проект в Expo Go. Для лабораторной №21 смотри консоль Metro/Expo и нажми обе кнопки управления компонентом. Для лабораторной №22 нажми «Старт», проверь остановку по окончании, «Сбросить» и установку другой длительности.
