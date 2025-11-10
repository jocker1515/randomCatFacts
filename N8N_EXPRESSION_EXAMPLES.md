# N8N Expression Mode - Примеры для Roblox Shorts Workflow

## 🎯 Основные выражения для нашего workflow

### 1. Получение YouTube Video ID

**Где использовать:** В Get Video Stats, Prepare for Processing

```javascript
// Простое получение
$node["YouTube Search"].json.items[0].id.videoId

// С проверкой
$node["YouTube Search"].json?.items?.[0]?.id?.videoId || "ERROR"

// В цикле (если обрабатываете несколько видео)
$node["YouTube Search"].json.items[item.index].id.videoId
```

---

### 2. Формирование YouTube URL

**Где использовать:** В Prepare for Processing

```javascript
// Базовое формирование
"https://www.youtube.com/watch?v=" + $node["YouTube Search"].json.items[0].id.videoId

// С использованием template literals (более чистый синтаксис)
`https://www.youtube.com/watch?v=${$node["YouTube Search"].json.items[0].id.videoId}`

// Через функцию
(() => {
  const videoId = $node["YouTube Search"].json.items[0].id.videoId;
  return `https://www.youtube.com/watch?v=${videoId}`;
})()

// С параметрами (например, начало с определенной позиции)
`https://www.youtube.com/watch?v=${$node["YouTube Search"].json.items[0].id.videoId}&t=0s`
```

---

### 3. Получение статистики видео

**Где использовать:** В Check Views, Prepare for Processing

```javascript
// Просмотры
Number($node["Get Video Stats"].json.items[0].statistics.viewCount)

// Лайки
Number($node["Get Video Stats"].json.items[0].statistics.likeCount)

// Комментарии (если доступно)
$node["Get Video Stats"].json.items[0].statistics.commentCount || "0"

// Проверка threshold (500k+ просмотров)
Number($node["Get Video Stats"].json.items[0].statistics.viewCount) > 500000

// Отношение лайков к просмотрам
(Number($node["Get Video Stats"].json.items[0].statistics.likeCount) / 
 Number($node["Get Video Stats"].json.items[0].statistics.viewCount) * 100).toFixed(2)
```

---

### 4. Работа со скриптом из GPT

**Где использовать:** В Setup Heygen, Create Avatar Video

```javascript
// Простое получение текста
$node["Generate Script"].json.choices[0].message.content

// Получение с проверкой пустоты
$node["Generate Script"].json?.choices?.[0]?.message?.content || "Failed to generate script"

// Обработка для JSON (экранирование кавычек)
JSON.stringify($node["Generate Script"].json.choices[0].message.content)

// Обрезка по количеству символов
$node["Generate Script"].json.choices[0].message.content.substring(0, 500)

// Подсчет слов
$node["Generate Script"].json.choices[0].message.content.split(" ").length

// Замена текста
$node["Generate Script"].json.choices[0].message.content.replace(/\[PAUSE\]/g, "...")
```

---

### 5. Проверка статуса видео HeyGen

**Где использовать:** В If Video Done ноде

```javascript
// Простая проверка статуса
$node["Get Avatar Video"].json.data.status === "completed"

// С учетом возможных ошибок
($node["Get Avatar Video"].json?.data?.status || "unknown") === "completed"

// Проверка нескольких возможных статусов
["completed", "success", "done"].includes($node["Get Avatar Video"].json.data.status)

// Получение video_id для использования дальше
$node["Get Avatar Video"].json.data.video_id

// Проверка на ошибку
$node["Get Avatar Video"].json.data.status === "failed" ? throw new Error("Video generation failed") : true

// Получение URL готового видео
$node["Get Avatar Video"].json.data.video_url || null

// Время создания видео
new Date($node["Get Avatar Video"].json.data.created_at).toLocaleString()
```

---

### 6. Условные выражения

**Где использовать:** В IF нодах

```javascript
// Простое условие
$node["Setup Heygen"].json.has_background_video === true

// Множественное условие (AND)
$node["Setup Heygen"].json.has_background_video === true && 
$node["Get Video Stats"].json.items[0].statistics.viewCount > 500000

// Множественное условие (OR)
$node["Get Avatar Video"].json.data.status === "completed" ||
$node["Get Avatar Video"].json.data.status === "success"

// Тернарный оператор
{{ $node["Setup Heygen"].json.has_background_video ? "with_background" : "without_background" }}

// Проверка существования
$node["Prepare for Processing"].json?.url !== undefined && 
$node["Prepare for Processing"].json.url !== null

// Проверка массива
Array.isArray($node["YouTube Search"].json.items) && 
$node["YouTube Search"].json.items.length > 0

// Проверка числового диапазона
Number($node["Get Video Stats"].json.items[0].statistics.viewCount) >= 500000 &&
Number($node["Get Video Stats"].json.items[0].statistics.viewCount) <= 100000000
```

---

### 7. Трансформации данных

**Где использовать:** В Set нодах с JSON

```javascript
// Конкатенация объектов
Object.assign({}, $node["Node1"].json, $node["Node2"].json)

// Выборочное копирование полей
{
  videoId: $node["Get Video Stats"].json.items[0].id,
  title: $node["Get Video Stats"].json.items[0].snippet.title,
  channel: $node["Get Video Stats"].json.items[0].snippet.channelTitle
}

// Преобразование массива
$node["YouTube Search"].json.items.map(item => ({
  videoId: item.id.videoId,
  title: item.snippet.title
}))

// Фильтрация массива
$node["YouTube Search"].json.items
  .filter(item => Number(item.statistics?.viewCount || 0) > 500000)
  .map(item => item.id.videoId)

// Группировка (если нужно)
$node["Get Video Stats"].json.items.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {})

// Формирование JSON из частей
JSON.stringify({
  backgroundUrl: $node["Prepare for Processing"].json.url,
  script: $node["Generate Script"].json.choices[0].message.content,
  timestamp: new Date().toISOString()
})
```

---

### 8. Обработка дат и времени

**Где использовать:** Для логирования, имена файлов, и т.д.

```javascript
// Текущая дата/время в ISO формате
new Date().toISOString()
// Output: "2024-01-15T10:30:45.123Z"

// Текущая дата/время в локальном формате
new Date().toLocaleString()
// Output: "1/15/2024, 10:30:45 AM"

// Только дата (YYYY-MM-DD)
new Date().toISOString().split('T')[0]
// Output: "2024-01-15"

// Unix timestamp (миллисекунды)
new Date().getTime()
// Output: 1705321845123

// Форматированное время для имени файла
new Date().toISOString().replace(/[:.]/g, "-").split(".")[0]
// Output: "2024-01-15T10-30-45"

// Добавить 1 час
new Date(Date.now() + 3600000).toISOString()

// Добавить 1 день
new Date(Date.now() + 86400000).toISOString()
```

---

### 9. Работа с JSON и строками

**Где использовать:** Когда нужна трансформация формата

```javascript
// Конвертировать объект в JSON строку
JSON.stringify($node["NodeName"].json)

// Распарсить JSON строку
JSON.parse($node["NodeName"].json.stringField)

// Красиво отформатировать JSON
JSON.stringify($node["NodeName"].json, null, 2)

// Получить ключи объекта
Object.keys($node["NodeName"].json)
// Output: ["field1", "field2", "field3"]

// Получить значения объекта
Object.values($node["NodeName"].json)
// Output: [value1, value2, value3]

// Проверить наличие ключа
"videoId" in $node["NodeName"].json

// Удалить undefined значения
Object.fromEntries(
  Object.entries($node["NodeName"].json).filter(([k,v]) => v !== undefined)
)

// Создать объект из массива пар
Object.fromEntries(
  $node["YouTube Search"].json.items.map(item => [item.id.videoId, item.snippet.title])
)
```

---

### 10. Вычисления и логика

**Где использовать:** Для сложных операций

```javascript
// Вычисление процента
(Number($node["Get Video Stats"].json.items[0].statistics.likeCount) / 
 Number($node["Get Video Stats"].json.items[0].statistics.viewCount) * 100)

// Округление
Math.round(value * 100) / 100

// Максимальное значение
Math.max(100, 200, 150)

// Минимальное значение
Math.min(100, 200, 150)

// Абсолютное значение
Math.abs(-15)

// Возведение в степень
Math.pow(2, 3) // 2^3 = 8

// Квадратный корень
Math.sqrt(16) // = 4

// Логарифм
Math.log10(1000) // = 3

// Случайное число от 0 до 1
Math.random()

// Случайное число от min до max
Math.floor(Math.random() * (max - min + 1)) + min
```

---

### 11. Специфичные для нашего workflow

#### Setup Heygen - Главное выражение

```javascript
// ГЛАВНОЕ ВЫРАЖЕНИЕ: Передача YouTube URL
// Используется в Setup Heygen Function Node

const data = $node["Prepare for Processing"].json;

return {
  background_video_url: data.url, // ← ОСНОВНОЕ: YouTube URL передается здесь
  script: data.script,
  videoId: data.videoId,
  avatar_id: "4798c598a7d048e0b314e0cb5f2261a2",
  voice_id: "f38a635bee7a4d1f9b0a654a31d050d2"
};
```

#### Create Avatar Video - Используемые выражения

```javascript
// Для HTTP Body (Raw JSON mode)

{
  "video_inputs": [{
    "character": {
      "avatar_id": "{{ $node['Setup Heygen'].json.avatar_id }}"
    },
    "voice": {
      "input_text": {{ JSON.stringify($node["Setup Heygen"].json.script) }},
      "voice_id": "{{ $node['Setup Heygen'].json.voice_id }}"
    }
  }],
  "background": {
    "type": "video",
    "video_url": "{{ $node['Setup Heygen'].json.background_video_url }}"
  }
}
```

#### If Video Done - Проверка статуса

```javascript
// Условие для IF ноды
$node["Get Avatar Video"].json.data.status === "completed"

// Или с вариантами:
["completed", "done", "success"].includes(
  $node["Get Avatar Video"].json?.data?.status
)
```

---

## 🔧 Полезные функции

### Функция: Безопасное получение значения

```javascript
// Используйте эту функцию чтобы избежать ошибок "Cannot read property"
const getValue = (obj, path, defaultValue = null) => {
  const paths = path.split(".");
  return paths.reduce((current, prop) => current?.[prop], obj) ?? defaultValue;
};

// Использование:
getValue($node["NodeName"].json, "data.items[0].id", "NOT_FOUND")
```

### Функция: Валидация URL

```javascript
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Использование в Setup Heygen:
if (!isValidUrl($node["Prepare for Processing"].json.url)) {
  throw new Error("Invalid YouTube URL");
}
```

### Функция: Форматирование текста для скрипта

```javascript
const formatScript = (text) => {
  return text
    .trim()
    .replace(/\n\n+/g, "\n") // Убрать двойные переносы
    .replace(/\s+/g, " ")     // Убрать лишние пробелы
    .substring(0, 500);        // Обрезать до 500 символов
};

// Использование:
formatScript($node["Generate Script"].json.choices[0].message.content)
```

---

## 📊 Таблица с примерами

| Задача | Выражение | Результат |
|--------|-----------|-----------|
| Получить videoId | `$node["YouTube Search"].json.items[0].id.videoId` | "dQw4w9WgXcQ" |
| Сформировать URL | `` `https://youtube.com/watch?v=${id}` `` | "https://youtube.com/watch?v=dQw4w9WgXcQ" |
| Проверить просмотры | `Number($node["..."].json.items[0].statistics.viewCount) > 500000` | true/false |
| Получить статус видео | `$node["Get Avatar Video"].json.data.status` | "completed" |
| Текущее время | `new Date().toISOString()` | "2024-01-15T10:30:45.123Z" |
| Проверить условие | `$node["..."].json.field !== undefined && $node["..."].json.field !== null` | true/false |

---

## ⚠️ Важные замечания

### 1. Expression Mode должен быть включен
```
❌ Неправильно (Expression Mode OFF):
"url": "{{ $node['NodeName'].json.url }}"
→ Вернет буквально: "{{ $node['NodeName'].json.url }}"

✅ Правильно (Expression Mode ON - нажата кнопка fx):
"url": "{{ $node['NodeName'].json.url }}"
→ Вернет: "https://youtube.com/watch?v=123"
```

### 2. Кавычки в JSON
```javascript
// Неправильно:
{ "url": "{{ $node["NodeName"].json.url }}" }

// Правильно (одинарные кавычки внутри):
{ "url": "{{ $node['NodeName'].json.url }}" }

// Или так (с экранированием):
{ "url": {{ $node["NodeName"].json.url }} }
```

### 3. Безопасный доступ к вложенным свойствам
```javascript
// Может вернуть ошибку если items пусто:
$node["YouTube Search"].json.items[0].id.videoId

// Безопаснее использовать optional chaining:
$node["YouTube Search"].json?.items?.[0]?.id?.videoId

// И с fallback значением:
$node["YouTube Search"].json?.items?.[0]?.id?.videoId || "ERROR_NO_VIDEO"
```

---

**Версия:** 1.0  
**Последнее обновление:** 2024  
**Статус:** Expression Syntax Complete ✅
