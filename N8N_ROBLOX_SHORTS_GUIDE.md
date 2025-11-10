# N8N Roblox Shorts Workflow - Полная настройка и отладка

## 📋 Содержание
1. [Архитектура воркфлоу](#архитектура-воркфлоу)
2. [Принципы n8n Expression Mode](#принципы-n8n-expression-mode)
3. [Пошаговая настройка каждой ноды](#пошаговая-настройка-каждой-ноды)
4. [Главная проблема и решение: Setup Heygen](#главная-проблема-и-решение-setup-heygen)
5. [Тестирование и отладка](#тестирование-и-отладка)
6. [Альтернативные решения](#альтернативные-решения)

---

## Архитектура воркфлоу

```
Cron Trigger (3 часа)
    ↓
YouTube Search (поиск Roblox видео)
    ↓
Get Video Stats (статистика)
    ↓
Check Views (фильтр 500k+)
    ↓
Generate Script (GPT - сценарий)
    ↓
Prepare for Processing (подготовка данных)
    ↓
Setup Heygen ⚠️ ГЛАВНАЯ ПРОБЛЕМА ЗДЕСЬ
    ↓
If (проверка has_background_video)
    ├─→ Create Avatar Video WITH Background
    └─→ Create Avatar Video WITHOUT Background
    ↓
Merge (объединение веток)
    ↓
Wait (1 минута)
    ↓
Get Avatar Video (статус)
    ↓
If Video Done (проверка завершения)
    ↓
Generate YT Description (GPT)
    ↓
Upload to YouTube (финальная загрузка)
```

---

## Принципы n8n Expression Mode

### Основной синтаксис для ссылки на данные

**Общий формат:**
```
$node["NodeName"].data.json.fieldName
$node["NodeName"].json.fieldName
$node["NodeName"].item.json.fieldName
```

**Примеры:**
```javascript
// Получить videoId из ноды "Prepare for Processing"
$node["Prepare for Processing"].json.videoId

// Получить URL
$node["Prepare for Processing"].json.url

// Получить значение из массива (первый элемент)
$node["Prepare for Processing"].json.items[0].id

// Текущий элемент в loop
$node["Prepare for Processing"].item.json.url

// Если данные вложены глубже
$node["YouTube Search"].json.items[0].id
```

### Конкатенация строк
```javascript
// Объединение строк
"https://www.youtube.com/watch?v=" + $node["Prepare for Processing"].json.videoId

// Или используя template literals
`https://www.youtube.com/watch?v=${$node["Prepare for Processing"].json.videoId}`
```

### Проверка существования
```javascript
// Безопасная проверка
$node["Prepare for Processing"].json?.url || "default_value"
```

---

## Пошаговая настройка каждой ноды

### 1. ⏰ Cron Trigger

**Назначение:** Запуск воркфлоу каждые 3 часа

**Конфигурация:**
- **Trigger type:** Cron
- **Cron expression:** `0 */3 * * *` (каждые 3 часа)
- Или выберите из предложенных: "Every 3 hours"

**Output:** `{}`

---

### 2. 🔍 YouTube Search

**Назначение:** Поиск популярных Roblox видео

**Конфигурация:**
- **Node type:** HTTP Request
- **Method:** GET
- **URL:** 
  ```
  https://www.googleapis.com/youtube/v3/search
  ```
- **Query Parameters:**
  ```
  q: "popular roblox videos"
  part: "snippet"
  maxResults: 5
  order: "viewCount"
  type: "video"
  key: YOUR_YOUTUBE_API_KEY
  ```

**Output:**
```json
{
  "items": [
    {
      "id": {"videoId": "xyz123"},
      "snippet": {
        "title": "Video Title",
        "description": "Description"
      }
    }
  ]
}
```

---

### 3. 📊 Get Video Stats

**Назначение:** Получение детальной статистики видео

**Конфигурация:**
- **Node type:** HTTP Request
- **Method:** GET
- **URL:**
  ```
  https://www.googleapis.com/youtube/v3/videos
  ```
- **Query Parameters:**
  ```
  id: {{ $node["YouTube Search"].json.items[0].id.videoId }}
  part: "statistics,snippet,contentDetails"
  key: YOUR_YOUTUBE_API_KEY
  ```

**Output:**
```json
{
  "items": [
    {
      "id": "videoId",
      "statistics": {
        "viewCount": "1500000",
        "likeCount": "50000"
      },
      "contentDetails": {
        "duration": "PT10M30S"
      },
      "snippet": {
        "title": "Title"
      }
    }
  ]
}
```

---

### 4. 🔐 Check Views (Filter)

**Назначение:** Фильтр видео с минимум 500k просмотров

**Конфигурация:**
- **Node type:** IF (Conditional)
- **Condition:**
  ```
  {{ Number($node["Get Video Stats"].json.items[0].statistics.viewCount) > 500000 }}
  ```
- **True branch:** Продолжить в Generate Script
- **False branch:** Прекратить выполнение или перейти к следующему видео

---

### 5. 🤖 Generate Script (GPT)

**Назначение:** Создание сценария реакции AI-аватара

**Конфигурация:**
- **Node type:** OpenAI (Chat)
- **API Key:** YOUR_OPENAI_API_KEY
- **Model:** gpt-4 или gpt-3.5-turbo
- **System Prompt:**
  ```
  You are a creative content writer specializing in short-form video reactions. 
  Create an engaging script for an AI avatar reacting to a Roblox video.
  ```
- **User Message:**
  ```
  Create a reaction script for a Roblox video titled: "{{ $node["Get Video Stats"].json.items[0].snippet.title }}"
  Description: {{ $node["Get Video Stats"].json.items[0].snippet.description }}
  
  Script should be:
  - 30-60 seconds of dialogue
  - Natural and entertaining
  - Include emotional reactions (wow, that's cool, can't believe this, etc)
  ```

**Output:**
```json
{
  "choices": [
    {
      "message": {
        "content": "Your reaction script here..."
      }
    }
  ]
}
```

---

### 6. 📝 Prepare for Processing

**Назначение:** Подготовка данных для передачи в HeyGen

**Конфигурация:**
- **Node type:** Set (или Edit Fields)
- **Mode:** Add Field

**Fields to set:**

| Field Name | Value | Expression? |
|-----------|-------|-------------|
| videoId | `{{ $node["Get Video Stats"].json.items[0].id }}` | Yes |
| title | `{{ $node["Get Video Stats"].json.items[0].snippet.title }}` | Yes |
| url | `{{ "https://www.youtube.com/watch?v=" + $node["Get Video Stats"].json.items[0].id }}` | Yes |
| viewCount | `{{ $node["Get Video Stats"].json.items[0].statistics.viewCount }}` | Yes |
| likeCount | `{{ $node["Get Video Stats"].json.items[0].statistics.likeCount }}` | Yes |
| duration | `{{ $node["Get Video Stats"].json.items[0].contentDetails.duration }}` | Yes |
| script | `{{ $node["Generate Script"].json.choices[0].message.content }}` | Yes |
| has_background_video | `{{ true }}` | Yes |

**Output:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Amazing Roblox Video",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "viewCount": "1500000",
  "likeCount": "50000",
  "duration": "PT10M30S",
  "script": "Wow, this Roblox video is incredible!...",
  "has_background_video": true
}
```

---

## 🎯 ГЛАВНОЕ: Решение для Setup Heygen

### ✅ Решение: Используя Function Node (РЕКОМЕНДУЕТСЯ)

**Конфигурация:**
- **Node type:** Function
- **Language:** JavaScript
- **Code:**

```javascript
const preparedData = $node["Prepare for Processing"].json;

const heygenSetup = {
  heygen_api_key: "sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD",
  avatar_id: "4798c598a7d048e0b314e0cb5f2261a2",
  voice_id: "f38a635bee7a4d1f9b0a654a31d050d2",
  has_background_video: preparedData.has_background_video,
  background_video_url: preparedData.url,
  script: preparedData.script,
  video_title: preparedData.title,
  dimension: {
    width: 720,
    height: 1280
  },
  aspect_ratio: "9:16"
};

return heygenSetup;
```

**Output:** 
```json
{
  "background_video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "avatar_id": "4798c598a7d048e0b314e0cb5f2261a2",
  ...
}
```

---

### 7. 🔄 If (проверка has_background_video)

**Конфигурация:**
- **Node type:** IF
- **Condition:**
  ```
  {{ $node["Setup Heygen"].json.has_background_video === true }}
  ```
- **True branch:** → Create Avatar Video WITH Background Video
- **False branch:** → Create Avatar Video WITHOUT Background Video

---

### 8.1 🎥 Create Avatar Video WITH Background Video

**Конфигурация:**
- **Node type:** HTTP Request
- **Method:** POST
- **URL:**
  ```
  https://api.heygen.com/v2/video/generate
  ```
- **Headers:**
  ```
  Authorization: Bearer {{ $node["Setup Heygen"].json.heygen_api_key }}
  Content-Type: application/json
  ```
- **Body (Raw JSON):**

```json
{
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "{{ $node['Setup Heygen'].json.avatar_id }}",
        "position": {
          "x": 0.8,
          "y": 0.5
        }
      },
      "voice": {
        "type": "text",
        "input_text": "{{ $node['Setup Heygen'].json.script }}",
        "voice_id": "{{ $node['Setup Heygen'].json.voice_id }}"
      }
    }
  ],
  "background": {
    "type": "video",
    "video_url": "{{ $node['Setup Heygen'].json.background_video_url }}",
    "play_style": "loop",
    "fit": "cover"
  },
  "aspect_ratio": "{{ $node['Setup Heygen'].json.aspect_ratio }}",
  "dimension": {
    "width": {{ $node['Setup Heygen'].json.dimension.width }},
    "height": {{ $node['Setup Heygen'].json.dimension.height }}
  }
}
```

---

### 8.2 🎥 Create Avatar Video WITHOUT Background Video

**Body (Raw JSON):**

```json
{
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "{{ $node['Setup Heygen'].json.avatar_id }}"
      },
      "voice": {
        "type": "text",
        "input_text": "{{ $node['Setup Heygen'].json.script }}",
        "voice_id": "{{ $node['Setup Heygen'].json.voice_id }}"
      }
    }
  ],
  "background": {
    "type": "color",
    "color": "#000000"
  },
  "aspect_ratio": "{{ $node['Setup Heygen'].json.aspect_ratio }}",
  "dimension": {
    "width": {{ $node['Setup Heygen'].json.dimension.width }},
    "height": {{ $node['Setup Heygen'].json.dimension.height }}
  }
}
```

---

### 9. 🔗 Merge

**Node type:** Merge
**Mode:** Merge by Index

---

### 10. ⏳ Wait

**Node type:** Wait
**Wait Time:** 60 seconds

---

### 11. 🔎 Get Avatar Video

**Node type:** HTTP Request
**Method:** GET
**URL:** `https://api.heygen.com/v2/video/{{ $node["Merge"].json.data.video_id }}`

---

### 12. 🔄 If Video Done

**Node type:** IF
**Condition:** `{{ $node["Get Avatar Video"].json.data.status === "completed" }}`

---

### 13. 📄 Generate YT Description

**Node type:** OpenAI Chat
**Model:** gpt-3.5-turbo

---

### 14. 📤 Upload to YouTube

**Node type:** HTTP Request
**Method:** POST
**URL:** `https://www.googleapis.com/youtube/v3/videos?part=snippet,status`

---

## Итоговый чек-лист

- [ ] Setup Heygen использует Function Node
- [ ] Background video URL правильно передается
- [ ] Create Avatar Video имеет правильную структуру JSON
- [ ] If Video Done имеет механизм повтора
- [ ] Все ноды правильно соединены
- [ ] Протестирован весь workflow

---

**Версия:** 2.0  
**Последнее обновление:** 2024  
**Статус:** Production Ready ✅
