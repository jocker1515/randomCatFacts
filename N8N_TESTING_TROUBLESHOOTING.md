# N8N Roblox Shorts - Тестирование и отладка

## 🧪 Тестирование workflow пошагово

### Этап 1: Подготовка

1. **Отключите Schedule/Trigger**
   - Перейдите в Cron Trigger узел
   - Нажмите "Deactivate" (дезактивируйте)
   - Это позволяет вам запускать workflow вручную для тестирования

2. **Подготовьте данные для тестирования**
   - Убедитесь, что у вас есть валидные API ключи
   - Проверьте, что аккаунты имеют доступ (YouTube, OpenAI, HeyGen)

3. **Откройте Debug view**
   - Внизу n8n интерфейса нажмите "Debug"
   - Это поможет видеть ошибки в реальном времени

---

### Этап 2: Тестирование каждой ноды по отдельности

#### Тест 1: YouTube Search

```
1. Нажмите на узел YouTube Search
2. Нажмите кнопку Execute Node (выполнить только этот узел)
3. Проверьте Output:
   - Должно быть: items > [0] > id > videoId
   - Если пусто: проверьте API ключ YouTube
   - Если ошибка 403: может потребоваться включить YouTube Data API в Google Cloud
```

**Ожидаемый результат:**
```json
{
  "items": [
    {
      "id": {"videoId": "dQw4w9WgXcQ"},
      "snippet": {"title": "..."}
    }
  ]
}
```

#### Тест 2: Get Video Stats

```
1. Перейдите к Get Video Stats узлу
2. Нажмите Execute Node
3. Проверьте:
   - items[0].statistics.viewCount > 0
   - items[0].contentDetails.duration существует
   - Если ошибка: проверьте что YouTube Search вернула videoId
```

#### Тест 3: Check Views Filter

```
1. Выполните узел Check Views (IF узел)
2. Проверьте:
   - Нажимает на ветку True, если viewCount > 500000
   - Должно быть видно в output какую ветку выбрало
```

#### Тест 4: Generate Script (GPT)

```
1. Выполните Generate Script узел
2. Проверьте:
   - choices[0].message.content содержит текст
   - Текст имеет смысл для реакции на Roblox видео
   - Если ошибка: проверьте OpenAI API ключ
```

#### Тест 5: Prepare for Processing

```
1. Выполните Prepare for Processing
2. Проверьте Output:
   {
     "videoId": "...",
     "url": "https://www.youtube.com/watch?v=...",
     "script": "...",
     "has_background_video": true
   }
3. ГЛАВНОЕ: проверьте что "url" не пустой!
```

#### Тест 6: Setup Heygen (Function Node)

```
1. Выполните Setup Heygen узел
2. Проверьте вывод консоли (Debug tab внизу):
   - "Background URL: https://www.youtube.com/watch?v=..."
   - "Has Background: true"
3. Проверьте что background_video_url не null и не undefined
```

---

## 🐛 Типичные ошибки и решения

### Ошибка 1: "Cannot read property 'items' of undefined"

**Причина:** Предыдущий узел не выполнился или вернул null

**Решение:**
```javascript
// Проверьте в Debug что вернула предыдущая нода
console.log("YouTube Search output:", 
  JSON.stringify($node["YouTube Search"].json, null, 2));

// Если undefined - значит нода не выполнилась вообще
// Проверьте её ошибки отдельно
```

---

### Ошибка 2: "background_video_url is empty"

**Причина:** Setup Heygen получает пустой URL из Prepare for Processing

**Диагностика:**
```javascript
// В Setup Heygen Function Node добавьте:
const preparedData = $node["Prepare for Processing"].json;
console.log("1. Prepare data exists:", !!preparedData);
console.log("2. URL value:", preparedData.url);
console.log("3. URL is string:", typeof preparedData.url === "string");
console.log("4. URL starts with https:", preparedData.url?.startsWith("https"));

if (!preparedData.url) {
  throw new Error("URL is missing! Prepare for Processing didn't set it properly");
}
```

**Исправление:**
- Проверьте что Prepare for Processing включает YouTube URL formation
- Убедитесь: `"url": "https://www.youtube.com/watch?v=" + videoId`

---

### Ошибка 3: "{{ }} renders as plain text"

**Причина:** Expression Mode не включен

**Решение:**
1. Нажмите на поле, где должно быть выражение
2. Справа внизу найдите кнопку `fx`
3. Нажмите её (должна стать синяя/активная)
4. Теперь вводите выражение

**Проверка:**
```
Неправильно:
"url": "{{ $node['Prepare for Processing'].json.url }}"

Правильно (с fx включенным):
"url": {{ $node['Prepare for Processing'].json.url }}
```

---

### Ошибка 4: "HeyGen API returns 401 Unauthorized"

**Причина:** Неправильный API ключ

**Решение:**
```javascript
// Проверьте в Setup Heygen:
console.log("API Key starts with 'sk_':", 
  "sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD".startsWith("sk_"));

// Убедитесь что:
// 1. Ключ не истек
// 2. Ключ скопирован полностью без пробелов
// 3. Используете Bearer токен правильно в Headers
```

---

### Ошибка 5: "HeyGen API returns 400 Bad Request"

**Причина:** Неправильная структура JSON для HeyGen

**Проверка:**
```javascript
// Валидируйте JSON перед отправкой
const requestBody = {
  "video_inputs": [{...}],
  "background": {...},
  "dimension": {
    "width": 720,      // Проверьте: число, не строка
    "height": 1280     // Проверьте: число, не строка
  }
};

// Убедитесь:
// 1. Все обязательные поля присутствуют
// 2. avatar_id существует и валиден
// 3. voice_id совместим с avatar
// 4. URL видео доступен (проверьте через curl/Postman)
```

---

## 🔍 Отладка Setup Heygen специально

### Способ 1: Пошаговая отладка

```javascript
// Добавьте эту версию в Setup Heygen для отладки

const preparedData = $node["Prepare for Processing"].json;

console.log("=== SETUP HEYGEN DEBUG ===");
console.log("Step 1 - Prepare data received:", !!preparedData);
console.log("  - videoId:", preparedData.videoId);
console.log("  - title:", preparedData.title);
console.log("  - url:", preparedData.url);
console.log("  - script length:", preparedData.script?.length);

// Формирование URL
const youtubeUrl = preparedData.url;
console.log("Step 2 - YouTube URL:", youtubeUrl);
console.log("  - Starts with https://", youtubeUrl?.startsWith("https://"));
console.log("  - Contains youtube.com:", youtubeUrl?.includes("youtube.com"));
console.log("  - Contains watch?v=:", youtubeUrl?.includes("watch?v="));

// Все параметры
const setup = {
  heygen_api_key: "sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD",
  avatar_id: "4798c598a7d048e0b314e0cb5f2261a2",
  voice_id: "f38a635bee7a4d1f9b0a654a31d050d2",
  background_video_url: youtubeUrl,
  has_background_video: true,
  script: preparedData.script,
  dimension: { width: 720, height: 1280 }
};

console.log("Step 3 - Final config:", JSON.stringify(setup, null, 2));
console.log("=== END DEBUG ===");

return setup;
```

### Способ 2: Проверка через Postman

1. **Откройте Postman**
2. **Создайте новый запрос:**
   - Method: POST
   - URL: https://api.heygen.com/v2/video/generate
   - Header: Authorization: Bearer sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD
   - Header: Content-Type: application/json

3. **Body (raw JSON):**
```json
{
  "video_inputs": [{
    "character": {
      "type": "avatar",
      "avatar_id": "4798c598a7d048e0b314e0cb5f2261a2"
    },
    "voice": {
      "type": "text",
      "input_text": "Test script",
      "voice_id": "f38a635bee7a4d1f9b0a654a31d050d2"
    }
  }],
  "background": {
    "type": "video",
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  "dimension": {"width": 720, "height": 1280}
}
```

4. **Отправьте и проверьте результат**

---

## 📊 Тестирование: Полный workflow

### Сценарий 1: Быстрый тест (5 минут)

```
1. Отключите Schedule
2. Выполните только YouTube Search и Get Video Stats
3. Убедитесь что есть видео с 500k+ просмотрами
4. Тестируйте остальные ноды по отдельности
5. Только потом включайте Schedule
```

### Сценарий 2: Полный тест (30 минут)

```
1. Выполните весь workflow вручную от начала до конца
2. Отслеживайте каждый шаг в Debug view
3. Сохраните результаты каждого узла (для проверки позже)
4. Проверьте что видео загружено на YouTube
```

### Сценарий 3: Stress test

```
1. Запустите workflow 10 раз подряд
2. Мониторьте потребление API quotas
3. Проверьте стабильность каждого шага
4. Убедитесь что нет race conditions
```

---

## 📈 Мониторинг и логирование

### Добавьте логирование в каждый Function Node

```javascript
// В начале каждой ноды Function
const timestamp = new Date().toISOString();
console.log(`[${timestamp}] Node started: ${$node.name}`);

// В конце перед return
console.log(`[${timestamp}] Node completed: ${$node.name}`);
console.log("Output:", JSON.stringify(return_data, null, 2));
```

### Сохраняйте логи

1. **Включите n8n logging:**
   - Перейдите в Settings → Logs
   - Посмотрите историю выполнений

2. **Экспортируйте результаты:**
   - Нажмите на завершенный workflow в Executions
   - Скопируйте весь JSON output
   - Сохраните для анализа

---

## ✅ Чек-лист перед production

- [ ] Все API ключи скопированы правильно (без пробелов)
- [ ] YouTube Search находит видео с 500k+ просмотрами
- [ ] Generate Script создает разумный текст
- [ ] Setup Heygen выводит правильный background_video_url
- [ ] Create Avatar Video успешно создает видео в HeyGen
- [ ] Get Avatar Video показывает статус "completed"
- [ ] Generate YT Description создает привлекательное описание
- [ ] Upload to YouTube загружает видео (публичное)
- [ ] Все выражения ({{ }}) включены в Expression Mode
- [ ] Нет ошибок в Debug консоли
- [ ] Workflow выполняется без ошибок end-to-end
- [ ] Schedule/Trigger активирован (если нужен автоматический запуск)

---

## 🚨 Что делать если workflow падает

### Шаг 1: Получить точную ошибку
```
1. Нажмите на ошибку в Execution history
2. Посмотрите Full error message
3. Найдите node_id который упал
4. Перейдите к той ноде
```

### Шаг 2: Отладить конкретный узел
```
1. Выполните узел отдельно (Execute Node)
2. Проверьте Input (что получил)
3. Проверьте Output (что вернул)
4. Если на шаге Input - ошибка в предыдущем узле
5. Если на шаге Output - ошибка в текущем узле
```

### Шаг 3: Получить минимальный рабочий пример
```
1. Отключите части workflow
2. Найдите минимальную конфигурацию которая работает
3. Постепенно добавляйте функциональность
4. На каком шаге сломается - тот нужно фиксить
```

---

## 📞 Когда обращаться за помощью

**Соберите эту информацию:**
1. Полное сообщение об ошибке (скриншот или текст)
2. Какая нода упала (имя и номер)
3. Какой Input получила та нода
4. Что вы ожидали vs что получили
5. Все значения параметров (кроме API ключей!)
6. Версию n8n (`Settings → About`)

**Ссылки на помощь:**
- n8n Docs: https://docs.n8n.io/
- n8n Community: https://community.n8n.io/
- HeyGen Docs: https://docs.heygen.com/
- OpenAI Help: https://platform.openai.com/help

---

## 🔄 Циклы и повторы

### Если нужен цикл повтора (например, для чекинга статуса видео)

```
[Get Avatar Video Node 1]
        ↓
[IF status === "completed"]
  ├─ True → Continue
  └─ False:
      ↓
    [Wait 30sec]
      ↓
    [Set counter++]
      ↓
    [IF counter < 10]
      ├─ True → Loop to [Get Avatar Video]
      └─ False → Error: Video not processed
```

### Code для цикла в Function Node

```javascript
let counter = $node["Set Counter"]?.json?.counter || 0;
const maxRetries = 10;

if (counter >= maxRetries) {
  throw new Error(`Video processing timeout. Retried ${maxRetries} times.`);
}

return {
  counter: counter + 1,
  shouldRetry: counter < maxRetries
};
```

---

**Версия:** 1.0  
**Последнее обновление:** 2024  
**Статус:** Complete Guide ✅
