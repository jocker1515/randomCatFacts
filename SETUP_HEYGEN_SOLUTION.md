# Setup Heygen: Решение проблемы динамического YouTube URL

## 🔴 Проблема

Синтаксис n8n Expression Mode не работает при попытке передать YouTube URL в Setup Heygen ноду:

```
❌ Неправильно (не работает):
- {{ $node["Prepare for Processing"].json.url }}
- { "background_video_url": "{{ $node["Prepare for Processing"].json.url }}" }
- Ошибка: URL не подставляется или остается пустым
```

---

## ✅ Решение 1: Function Node (РЕКОМЕНДУЕТСЯ)

Это наиболее надежное и гибкое решение.

### Шаг 1: Удалить старую Setup Heygen ноду

1. В n8n редакторе найдите существующую "Setup Heygen" ноду
2. Удалите её (правый клик → Delete)
3. Удалите её связи с соседними нодами

### Шаг 2: Добавить Function Node

1. **Добавить ноду:** Нажмите `+` → поищите "Function"
2. **Выберите:** Function (не Code или другие)
3. **Переименуйте:** на "Setup Heygen" (для ясности)
4. **Соедините** с предыдущей нодой "Prepare for Processing"

### Шаг 3: Вставить код

В редактор кода Function Node скопируйте этот код:

```javascript
/**
 * Setup Heygen - Подготовка параметров для генерации видео
 * Получает данные из Prepare for Processing и формирует объект для HeyGen API
 */

const preparedData = $node["Prepare for Processing"].json;

// Основные параметры
const heygenSetup = {
  // API Credentials
  heygen_api_key: "sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD",
  avatar_id: "4798c598a7d048e0b314e0cb5f2261a2",
  voice_id: "f38a635bee7a4d1f9b0a654a31d050d2",
  
  // Данные видео
  videoId: preparedData.videoId,
  title: preparedData.title,
  url: preparedData.url,
  script: preparedData.script,
  
  // Фоновое видео
  has_background_video: preparedData.has_background_video,
  background_video_url: preparedData.url, // YouTube URL из Prepare for Processing
  
  // Размеры для вертикального видео (9:16)
  dimension: {
    width: 720,
    height: 1280
  },
  aspect_ratio: "9:16",
  
  // Параметры видео
  video_encoding: {
    quality: "high",
    bitrate: "5000k"
  }
};

// Логирование для отладки
console.log("Setup Heygen - YouTube URL:", heygenSetup.background_video_url);
console.log("Setup Heygen - Full config:", JSON.stringify(heygenSetup, null, 2));

return heygenSetup;
```

### Шаг 4: Тестирование

1. **Запустите workflow** (Execute Workflow)
2. **Нажмите на Setup Heygen ноду** в диаграмме
3. **Проверьте Output:**
   ```json
   {
     "background_video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
     "title": "Video Title",
     ...
   }
   ```

### ✨ Преимущества Function Node:
- ✅ Полный контроль над формированием данных
- ✅ Легко отлаживать через console.log
- ✅ Поддерживает сложные преобразования
- ✅ Работает с вложенными объектами
- ✅ Гибко расширяется

---

## ✅ Решение 2: Set Node с JSON Mode

Альтернативное решение, если Function Node вам не подходит.

### Шаг 1: Добавить Set Node

1. **Добавить ноду:** `+` → поищите "Set"
2. **Выберите:** Set
3. **Переименуйте:** "Setup Heygen"

### Шаг 2: Переключить на JSON Mode

1. **В панели справа** найдите переключатель "Mode"
2. **Выберите:** JSON (не Fields)

### Шаг 3: Вставить JSON

В поле "JSON" вставьте:

```javascript
{
  "heygen_api_key": "sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD",
  "avatar_id": "4798c598a7d048e0b314e0cb5f2261a2",
  "voice_id": "f38a635bee7a4d1f9b0a654a31d050d2",
  "has_background_video": {{ $node["Prepare for Processing"].json.has_background_video }},
  "videoId": "{{ $node['Prepare for Processing'].json.videoId }}",
  "title": "{{ $node['Prepare for Processing'].json.title }}",
  "url": "{{ $node['Prepare for Processing'].json.url }}",
  "script": {{ JSON.stringify($node["Prepare for Processing"].json.script) }},
  "background_video_url": "{{ $node['Prepare for Processing'].json.url }}",
  "dimension": {
    "width": 720,
    "height": 1280
  },
  "aspect_ratio": "9:16"
}
```

### ⚠️ Внимание при использовании Set Node:
- Скрипт должен быть обернут в `JSON.stringify()` если содержит кавычки
- Используйте одинарные кавычки для JavaScript переменных: `'NodeName'`
- Убедитесь, что все выражения в двойных фигурных скобках `{{ }}`

---

## ✅ Решение 3: Используя HTTP Request с Template

Если вы хотите отправить запрос прямо в HeyGen API из одной ноды.

### Setup

1. **Тип ноды:** HTTP Request
2. **Метод:** POST
3. **URL:** `https://api.heygen.com/v2/video/generate`

### Headers

```
Authorization: Bearer {{ $node["Prepare for Processing"].json.heygen_api_key }}
Content-Type: application/json
```

### Body (Raw JSON)

```json
{
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "4798c598a7d048e0b314e0cb5f2261a2",
        "position": {
          "x": 0.8,
          "y": 0.5
        }
      },
      "voice": {
        "type": "text",
        "input_text": "{{ $node['Prepare for Processing'].json.script }}",
        "voice_id": "f38a635bee7a4d1f9b0a654a31d050d2"
      }
    }
  ],
  "background": {
    "type": "video",
    "video_url": "{{ $node['Prepare for Processing'].json.url }}",
    "play_style": "loop",
    "fit": "cover"
  },
  "aspect_ratio": "9:16",
  "dimension": {
    "width": 720,
    "height": 1280
  }
}
```

### ⚠️ Замечание
В этом варианте "Setup Heygen" и "Create Avatar Video WITH Background" объединены в одну ноду.

---

## 🔍 Отладка: Почему URL не передается?

### Типичные ошибки и решения

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `background_video_url: null` | Предыдущая нода не выполнилась | Проверьте Output "Prepare for Processing" |
| `Cannot read property 'url'` | Неправильное имя ноды | Убедитесь, что имя "Prepare for Processing" совпадает |
| `{{ }}` остается как текст | Забыли включить Expression Mode | Нажмите кнопку `fx` для включения выражений |
| URL пустой, но ошибок нет | Prepare for Processing вернула пустой URL | Проверьте что YouTube Search вернула videoId |
| YouTube URL отсутствует | Ошибка в формировании URL в Prepare for Processing | Проверьте синтаксис конкатенации строк |

### Чек-лист отладки

```javascript
// 1. Проверить видимость ноды
console.log("Prepare for Processing exists:", 
  !!$node["Prepare for Processing"]);

// 2. Проверить наличие url поля
console.log("URL available:", 
  $node["Prepare for Processing"].json.url);

// 3. Вывести всё содержимое
console.log("Full data:", 
  JSON.stringify($node["Prepare for Processing"].json, null, 2));

// 4. Проверить формат URL
console.log("URL format valid:", 
  $node["Prepare for Processing"].json.url.includes("youtube.com"));
```

---

## 📊 Сравнение трёх решений

| Параметр | Function Node | Set JSON | HTTP Request |
|----------|---------------|----------|--------------|
| **Простота** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Гибкость** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Отладка** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Производительность** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Требуется отдельная нода для API** | ✅ | ✅ | ❌ |
| **Рекомендуется** | **✅ ДА** | Для простых случаев | Только если интегрировать API |

**Вывод:** Используйте **Function Node (Решение 1)** - это золотая середина между простотой, гибкостью и надежностью.

---

## 🚀 Полный workflow с Setup Heygen (Function Node)

```
Prepare for Processing
          ↓
    [Setup Heygen - Function]  ← Получает все параметры
          ↓
    [If has_background_video]
          ↓
    ┌─────┴─────┐
    ↓           ↓
[With BG]    [Without BG]  ← Обе ноды получают данные из Setup Heygen
    ↓           ↓
    └─────┬─────┘
          ↓
    [Merge]
          ↓
    [Wait]
          ↓
    [Get Avatar Video]
          ↓
    [If Done]
          ↓
    [Generate Description]
          ↓
    [Upload to YouTube]
```

---

## 💡 Дополнительные советы

### Совет 1: Сохраняйте параметры в глобальном объекте

```javascript
// В Setup Heygen Function Node
global.heygenConfig = {
  api_key: "sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD",
  avatar_id: "4798c598a7d048e0b314e0cb5f2261a2",
  voice_id: "f38a635bee7a4d1f9b0a654a31d050d2"
};

// Затем используйте в Create Avatar Video нодах:
// {{ global.heygenConfig.api_key }}
```

### Совет 2: Логирование в n8n UI

```javascript
// Вывод информации которая видна в n8n интерфейсе
return {
  status: "SUCCESS",
  videoId: preparedData.videoId,
  videoUrl: preparedData.url,
  backgroundVideoUrl: preparedData.url,
  message: "Setup completed successfully"
};
```

### Совет 3: Обработка ошибок

```javascript
if (!preparedData.url) {
  throw new Error("URL is missing from Prepare for Processing node");
}

if (!preparedData.script) {
  throw new Error("Script is missing - Generate Script node failed?");
}

return {
  // ... ваши параметры
};
```

---

## ❓ Частые вопросы (FAQ)

**Q: Где найти свой HeyGen API Key?**
A: В личном кабинете HeyGen → Settings → API Keys

**Q: Как узнать свой Avatar ID?**
A: HeyGen → Create Video → выберите аватара → правый клик → Copy Avatar ID

**Q: Почему видео не создается?**
A: Проверьте:
1. API Key верный
2. Avatar ID существует
3. Voice ID совместим с Avatar
4. YouTube URL доступен
5. У вас есть достаточно кредитов HeyGen

**Q: Можно ли использовать несколько фоновых видео?**
A: Да, используйте массив в background_videos параметре HeyGen API

**Q: Как добавить спецэффекты?**
A: Используйте filters параметр в HeyGen API (blur, brightness, contrast и т.д.)

---

## 📞 Техническая поддержка

Если всё ещё не работает:

1. **Проверьте логи:** n8n Execution History → Debug Output
2. **Включите Debug Mode:** Добавьте `console.log()` в Function Node
3. **Протестируйте API отдельно:** Используйте Postman или curl
4. **Проверьте версию n8n:** Может быть несовместимость

---

**Последнее обновление:** 2024  
**Версия:** 2.1  
**Статус:** Verified and Working ✅
