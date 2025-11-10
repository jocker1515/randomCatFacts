# N8N Roblox Shorts Workflow - Готовые конфигурации для копирования

Этот документ содержит готовые конфигурации для каждой ноды. Просто скопируйте и вставьте нужный код.

---

## 📋 Содержание

1. [Setup Heygen - Function Node](#setup-heygen---function-node)
2. [Create Avatar Video WITH Background](#create-avatar-video-with-background)
3. [Create Avatar Video WITHOUT Background](#create-avatar-video-without-background)
4. [Get Avatar Video](#get-avatar-video)
5. [Generate YT Description](#generate-yt-description)
6. [Upload to YouTube](#upload-to-youtube)
7. [Prepare for Processing - Set Node](#prepare-for-processing---set-node)

---

## Setup Heygen - Function Node

**Тип ноды:** Function

**Код для копирования:**

```javascript
/**
 * Setup Heygen - Формирование параметров для HeyGen API
 * Получает данные из "Prepare for Processing" и подготавливает для передачи
 */

const data = $node["Prepare for Processing"].json;

// Валидация входных данных
if (!data.url || !data.script) {
  throw new Error("Missing required data: url or script from Prepare for Processing");
}

// Основной объект конфигурации
const setup = {
  // HeyGen API Credentials
  heygen_api_key: "sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD",
  avatar_id: "4798c598a7d048e0b314e0cb5f2261a2",
  voice_id: "f38a635bee7a4d1f9b0a654a31d050d2",
  
  // Данные видео
  videoId: data.videoId || "",
  title: data.title || "Roblox Video Reaction",
  url: data.url, // YouTube URL
  script: data.script,
  viewCount: data.viewCount || "0",
  likeCount: data.likeCount || "0",
  
  // Параметры фонового видео
  has_background_video: data.has_background_video === true,
  background_video_url: data.url, // ← ГЛАВНАЯ ПОДСТАНОВКА URL
  
  // Размеры для Shorts (9:16 vertical)
  dimension: {
    width: 720,
    height: 1280
  },
  aspect_ratio: "9:16",
  
  // Параметры качества видео
  quality: {
    bitrate: "5000k",
    fps: 30,
    codec: "h264"
  },
  
  // Background видео параметры
  background_style: {
    play_style: "loop",
    fit: "cover",
    opacity: 1
  },
  
  // Avatar параметры
  avatar_position: {
    x: 0.8,
    y: 0.5,
    width: 0.35,
    height: 0.35
  }
};

// Debug логирование
console.log("=== Setup Heygen Config ===");
console.log("Video ID:", setup.videoId);
console.log("Background URL:", setup.background_video_url);
console.log("Has Background:", setup.has_background_video);
console.log("Script length:", setup.script?.length, "chars");
console.log("========================");

return setup;
```

---

## Create Avatar Video WITH Background

**Тип ноды:** HTTP Request

**Метод:** POST

**URL:**
```
https://api.heygen.com/v2/video/generate
```

**Headers (Raw):**
```
Authorization: Bearer sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD
Content-Type: application/json
```

**Body (Raw JSON) - для копирования:**

```json
{
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "4798c598a7d048e0b314e0cb5f2261a2",
        "scale": 1,
        "position": {
          "x": {{ $node["Setup Heygen"].json.avatar_position.x }},
          "y": {{ $node["Setup Heygen"].json.avatar_position.y }}
        }
      },
      "voice": {
        "type": "text",
        "input_text": {{ JSON.stringify($node["Setup Heygen"].json.script) }},
        "voice_id": "f38a635bee7a4d1f9b0a654a31d050d2"
      }
    }
  ],
  "background": {
    "type": "video",
    "video_url": "{{ $node['Setup Heygen'].json.background_video_url }}",
    "play_style": "loop",
    "fit": "cover",
    "opacity": 1,
    "mute": true
  },
  "aspect_ratio": "9:16",
  "dimension": {
    "width": 720,
    "height": 1280
  },
  "quality": "high"
}
```

---

## Create Avatar Video WITHOUT Background

**Тип ноды:** HTTP Request

**Метод:** POST

**URL:**
```
https://api.heygen.com/v2/video/generate
```

**Headers (Raw):**
```
Authorization: Bearer sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD
Content-Type: application/json
```

**Body (Raw JSON) - для копирования:**

```json
{
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "4798c598a7d048e0b314e0cb5f2261a2",
        "scale": 1,
        "position": {
          "x": 0.5,
          "y": 0.5
        }
      },
      "voice": {
        "type": "text",
        "input_text": {{ JSON.stringify($node["Setup Heygen"].json.script) }},
        "voice_id": "f38a635bee7a4d1f9b0a654a31d050d2"
      }
    }
  ],
  "background": {
    "type": "color",
    "color": "#1F1F1F",
    "opacity": 1
  },
  "aspect_ratio": "9:16",
  "dimension": {
    "width": 720,
    "height": 1280
  },
  "quality": "high"
}
```

---

## Get Avatar Video

**Тип ноды:** HTTP Request

**Метод:** GET

**URL:**
```
https://api.heygen.com/v2/video/{{ $node["Merge"].json.data.video_id }}
```

**Headers (Raw):**
```
Authorization: Bearer sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD
Content-Type: application/json
```

**Send Query with the Body:** OFF

**Return Full Response:** ON

---

## Generate YT Description

**Тип ноды:** OpenAI Chat

**Model:** gpt-3.5-turbo

**Temperature:** 0.7

**System Prompt:**
```
You are a professional YouTube content creator specializing in short-form vertical videos and Roblox reactions. 
Create engaging YouTube Shorts descriptions that are catchy, SEO-optimized, and include relevant hashtags.
Keep descriptions under 5000 characters.
```

**Messages (User Message):**
```
Create an engaging YouTube Shorts description for a viral reaction video:

Title: {{ $node["Prepare for Processing"].json.title }}
Video Type: Roblox Video Reaction
Original Views: {{ $node["Prepare for Processing"].json.viewCount }}
Duration: 60 seconds (Shorts format)

Requirements:
1. Start with hook that makes people want to watch
2. Include 2-3 relevant hashtags at the end
3. Add call-to-action (like, subscribe, comment)
4. Mention it's an AI-generated reaction
5. Add the fact that it's a Roblox video reaction

Make it viral-friendly and engaging!
```

---

## Upload to YouTube

**Тип ноды:** HTTP Request

**Метод:** POST

**URL:**
```
https://www.googleapis.com/youtube/v3/videos?part=snippet,status,processingDetails
```

**Headers (Raw):**
```
Authorization: Bearer YOUR_YOUTUBE_ACCESS_TOKEN
Content-Type: application/json
```

**Body (Raw JSON) - для копирования:**

```json
{
  "snippet": {
    "title": "{{ $node['Prepare for Processing'].json.title }} 🤖 AI Reaction",
    "description": {{ JSON.stringify($node["Generate YT Description"].json.choices[0].message.content) }},
    "tags": [
      "roblox",
      "shorts",
      "reaction",
      "ai",
      "viral",
      "gaming"
    ],
    "categoryId": "20",
    "defaultLanguage": "en",
    "defaultAudioLanguage": "en"
  },
  "status": {
    "privacyStatus": "public",
    "selfDeclaredMadeForKids": false,
    "embeddable": true,
    "publicStatsViewable": true
  },
  "processingDetails": {
    "processingStatus": "processing"
  }
}
```

---

## Prepare for Processing - Set Node

**Тип ноды:** Set

**Mode:** Add Field (или JSON)

**Поля для установки:**

### Вариант 1: Add Field Mode (проще)

Нажмите "Add Field" для каждого:

1. **videoId**
   - Value: `{{ $node["Get Video Stats"].json.items[0].id }}`
   - Type: String

2. **title**
   - Value: `{{ $node["Get Video Stats"].json.items[0].snippet.title }}`
   - Type: String

3. **url**
   - Value: `{{ "https://www.youtube.com/watch?v=" + $node["Get Video Stats"].json.items[0].id }}`
   - Type: String

4. **viewCount**
   - Value: `{{ $node["Get Video Stats"].json.items[0].statistics.viewCount }}`
   - Type: String

5. **likeCount**
   - Value: `{{ $node["Get Video Stats"].json.items[0].statistics.likeCount }}`
   - Type: String

6. **duration**
   - Value: `{{ $node["Get Video Stats"].json.items[0].contentDetails.duration }}`
   - Type: String

7. **script**
   - Value: `{{ $node["Generate Script"].json.choices[0].message.content }}`
   - Type: String

8. **has_background_video**
   - Value: `{{ true }}`
   - Type: Boolean

### Вариант 2: JSON Mode

**Mode:** JSON

**JSON:**
```javascript
{
  "videoId": "{{ $node['Get Video Stats'].json.items[0].id }}",
  "title": "{{ $node['Get Video Stats'].json.items[0].snippet.title }}",
  "url": "{{ 'https://www.youtube.com/watch?v=' + $node['Get Video Stats'].json.items[0].id }}",
  "viewCount": "{{ $node['Get Video Stats'].json.items[0].statistics.viewCount }}",
  "likeCount": "{{ $node['Get Video Stats'].json.items[0].statistics.likeCount }}",
  "duration": "{{ $node['Get Video Stats'].json.items[0].contentDetails.duration }}",
  "script": {{ JSON.stringify($node["Generate Script"].json.choices[0].message.content) }},
  "has_background_video": true,
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## YouTube Search - HTTP Request

**Тип ноды:** HTTP Request

**Метод:** GET

**URL:**
```
https://www.googleapis.com/youtube/v3/search
```

**Query Parameters:**

```
q = popular roblox videos
part = snippet
maxResults = 5
order = viewCount
type = video
key = YOUR_YOUTUBE_API_KEY
relevanceLanguage = en
region = US
```

---

## Get Video Stats - HTTP Request

**Тип ноды:** HTTP Request

**Метод:** GET

**URL:**
```
https://www.googleapis.com/youtube/v3/videos
```

**Query Parameters:**

```
id = {{ $node["YouTube Search"].json.items[0].id.videoId }}
part = statistics,snippet,contentDetails
key = YOUR_YOUTUBE_API_KEY
```

---

## Check Views - IF Node

**Тип ноды:** IF

**Condition:**
```
{{ Number($node["Get Video Stats"].json.items[0].statistics.viewCount) > 500000 }}
```

**True:** Продолжить в Generate Script

**False:** Прекратить (или использовать Error Trigger)

---

## Generate Script (GPT) - OpenAI Chat

**Тип ноды:** OpenAI Chat

**Model:** gpt-4

**Temperature:** 0.8

**System Prompt:**
```
You are a creative scriptwriter specializing in AI avatar reactions for Roblox videos.
Create engaging, entertaining reaction scripts that are 40-60 seconds of spoken dialogue.
The avatar will be placed in the corner of the original Roblox video.
Include natural reactions: "Wow!", "No way!", "That's insane!", etc.
Mix technical observations with emotional responses.
```

**User Message:**
```
Write a reaction script for an AI avatar reacting to this Roblox video:

Title: {{ $node["Get Video Stats"].json.items[0].snippet.title }}

Video Description: {{ $node["Get Video Stats"].json.items[0].snippet.description }}

Requirements:
- 40-60 seconds of dialogue when spoken at normal pace
- Natural reactions and expressions
- Mix of amazement, humor, and observations
- Suitable for YouTube Shorts
- No background music needed (will be added separately)

Write only the dialogue, no stage directions or descriptions.
```

---

## If Video Done - Cycle Check

**Тип ноды:** IF

**Condition:**
```
{{ $node["Get Avatar Video"].json.data.status === "completed" }}
```

**Если нужен цикл с повторами:**

1. **True branch:** → Continue to Generate YT Description
2. **False branch:** 
   - Add **Wait** node (30 seconds)
   - Add **Set** node to increment counter
   - Add another **IF** to check counter < 10
   - Loop back to "Get Avatar Video"

---

## Merge Node

**Тип ноды:** Merge

**Mode:** Merge by Index

Это объединит результаты обеих веток (WITH Background и WITHOUT Background)

---

## Wait Node

**Тип ноды:** Wait

**Wait Time:** 60 (seconds)

Это позволит HeyGen обработать видео перед проверкой статуса.

---

## 🔍 Проверка работы каждого узла

### Для YouTube Search
Expected Output:
```json
{
  "items": [
    {
      "id": {
        "videoId": "dQw4w9WgXcQ"
      },
      "snippet": {
        "title": "Video Title",
        "description": "..."
      }
    }
  ]
}
```

### Для Get Video Stats
Expected Output:
```json
{
  "items": [
    {
      "id": "dQw4w9WgXcQ",
      "statistics": {
        "viewCount": "1234567",
        "likeCount": "50000"
      },
      "contentDetails": {
        "duration": "PT10M30S"
      }
    }
  ]
}
```

### Для Setup Heygen
Expected Output:
```json
{
  "background_video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "avatar_id": "4798c598a7d048e0b314e0cb5f2261a2",
  "script": "Wow! This is incredible!...",
  ...
}
```

### Для Create Avatar Video
Expected Output:
```json
{
  "data": {
    "video_id": "vid_123456789abcdef",
    "status": "processing",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## ⚙️ Полезные n8n Expressions

```javascript
// Получить только первый видеоID
$node["YouTube Search"].json.items[0].id.videoId

// Преобразовать число
Number($node["Get Video Stats"].json.items[0].statistics.viewCount)

// Условие
$node["Get Avatar Video"].json.data.status === "completed"

// Объединить строки
"Prefix_" + $node["NodeName"].json.field + "_Suffix"

// Условный оператор
{{ $condition1 ? "value1" : "value2" }}

// Проверить наличие
{{ $node["NodeName"].json?.field || "default" }}

// Фильтр массива
{{ $node["NodeName"].json.items.filter(i => i.status === "active") }}

// Map функция
{{ $node["NodeName"].json.items.map(i => i.id) }}

// Длина массива
{{ $node["NodeName"].json.items.length }}

// Текущая дата
{{ new Date().toISOString() }}
```

---

## 📝 Примечания при копировании

1. **Замените YOUR_API_KEY на ваши реальные ключи:**
   - `YOUR_YOUTUBE_API_KEY` → ваш YouTube API ключ
   - `YOUR_OPENAI_API_KEY` → ваш OpenAI ключ
   - `YOUR_YOUTUBE_ACCESS_TOKEN` → токен для загрузки на YouTube

2. **Проверьте имена нод:**
   - Если вы переименовали ноду, обновите и в выражениях
   - Например: `$node["Prepare for Processing"]` → `$node["Your Node Name"]`

3. **Используйте правильные кавычки:**
   - В JavaScript: одинарные `'` или обратные апострофы `` ` ``
   - В JSON: только двойные `"`

4. **Expression Mode:**
   - Нажмите кнопку `fx` рядом с полем для включения Expression Mode
   - Только тогда выражения будут интерпретированы

---

**Версия:** 1.0  
**Последнее обновление:** 2024  
**Статус:** Ready to Copy-Paste ✅
