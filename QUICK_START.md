# N8N Roblox Shorts Workflow - Быстрый старт

**Это краткий гайд. Для полной информации смотрите другие документы в этой папке.**

---

## 🚀 За 5 минут

### 1. Главная проблема решена ✅

**Проблема:** Setup Heygen не получает YouTube URL

**Решение:** Используйте **Function Node** вместо Set Node

```javascript
const preparedData = $node["Prepare for Processing"].json;
return {
  background_video_url: preparedData.url,  // ← YouTube URL здесь!
  avatar_id: "4798c598a7d048e0b314e0cb5f2261a2",
  voice_id: "f38a635bee7a4d1f9b0a654a31d050d2",
  script: preparedData.script,
  has_background_video: true
};
```

### 2. Ноды в правильном порядке

```
YouTube Search → Get Video Stats → Check Views (IF) → 
Generate Script (GPT) → Prepare for Processing → 
Setup Heygen (FUNCTION) → If (WITH/WITHOUT) → 
Create Avatar Video → Merge → Wait → Get Status → 
If Done → YT Description → Upload → Done!
```

### 3. Три ключевых узла

| Узел | Тип | Назначение |
|------|-----|-----------|
| **Setup Heygen** | Function | Получает URL из Prepare, передает в Create Avatar |
| **Create Avatar Video** | HTTP POST | Создает видео с HeyGen API |
| **If Video Done** | IF | Проверяет статус (completed?) |

---

## 📋 Контрольный список (5 шагов)

- [ ] **Step 1:** Удалить старую Setup Heygen ноду (если была)
- [ ] **Step 2:** Добавить новую Function Node, назвать "Setup Heygen"
- [ ] **Step 3:** Вставить код из раздела выше
- [ ] **Step 4:** Соединить с "Prepare for Processing" входом
- [ ] **Step 5:** Выполнить (Execute) и проверить Output

---

## 🔍 Как проверить что работает

### После добавления Setup Heygen:

1. Нажмите **Execute Workflow**
2. Посмотрите **Output Setup Heygen** узла
3. Должно быть в JSON:
   ```json
   {
     "background_video_url": "https://www.youtube.com/watch?v=...",
     "avatar_id": "4798c598a7d048e0b314e0cb5f2261a2",
     ...
   }
   ```
4. Если `background_video_url` пустой → Check "Prepare for Processing" output

---

## 📝 Копирование с остальных нод

Для каждой ноды вот где взять конфигурацию:

| Файл | Нода | Раздел |
|------|------|--------|
| `N8N_NODES_COPY_PASTE.md` | Create Avatar WITH BG | "Create Avatar Video WITH Background" |
| `N8N_NODES_COPY_PASTE.md` | Create Avatar WITHOUT BG | "Create Avatar Video WITHOUT Background" |
| `N8N_NODES_COPY_PASTE.md` | Prepare for Processing | "Prepare for Processing - Set Node" |
| `N8N_NODES_COPY_PASTE.md` | Generate YT Description | "Generate YT Description - OpenAI Chat" |
| `N8N_NODES_COPY_PASTE.md` | Upload to YouTube | "Upload to YouTube" |

---

## 🐛 Если что-то не работает

### Ошибка 1: `background_video_url is null`
```
→ Проверьте Prepare for Processing output
→ Должно быть: "url": "https://www.youtube.com/watch?v=..."
→ Если не туда - исправьте Prepare for Processing
```

### Ошибка 2: `{{ }} отображается как текст`
```
→ Нажмите кнопку fx рядом с полем
→ Должна стать синяя
→ Тогда выражения будут работать
```

### Ошибка 3: HeyGen возвращает 401
```
→ Проверьте API Key (не должно быть пробелов)
→ Убедитесь что это Bearer token
→ Использование: "Authorization: Bearer sk_V2_hgu_..."
```

### Ошибка 4: Ноду не видит на других нодах
```
→ Проверьте что имя ноды совпадает
→ Наример: $node["Setup Heygen"] - имя должно быть "Setup Heygen"
→ Без опечаток!
```

---

## 📚 Для подробной информации

1. **N8N_ROBLOX_SHORTS_GUIDE.md** - Полный гайд всех нод (90% вероятно найдете там ответ)
2. **SETUP_HEYGEN_SOLUTION.md** - Только про Setup Heygen (3 варианта решения)
3. **N8N_NODES_COPY_PASTE.md** - Готовые конфиги для копирования каждой ноды
4. **N8N_TESTING_TROUBLESHOOTING.md** - Как тестировать и отлаживать
5. **N8N_EXPRESSION_EXAMPLES.md** - Примеры выражений

---

## 🎬 Примеры выражений

```javascript
// Получить YouTube URL
$node["Prepare for Processing"].json.url

// Проверить статус видео
$node["Get Avatar Video"].json.data.status === "completed"

// Текущее время
new Date().toISOString()

// Получить скрипт от GPT
$node["Generate Script"].json.choices[0].message.content

// Объединить два объекта
Object.assign({}, $node["Node1"].json, $node["Node2"].json)
```

---

## 🎯 Оптимальная архитектура

```
Prepare for Processing
  ↓
Setup Heygen [FUNCTION] ← YouTube URL: data.url
  ↓
If has_background_video?
  ├─ YES → Create Avatar WITH Background [HTTP POST]
  └─ NO  → Create Avatar WITHOUT Background [HTTP POST]
  ↓
Merge [объединить обе ветки]
  ↓
Wait [60 сек для обработки HeyGen]
  ↓
Get Avatar Video [HTTP GET - проверить статус]
  ↓
If status === "completed"?
  ├─ YES → Generate YT Description
  └─ NO  → Wait 30sec → проверить снова (max 10 раз)
```

---

## 💾 Сохранение workflow

После настройки всех нод:

1. **Нажмите Save** (Ctrl+S или кнопка внизу)
2. **Назовите:** "Roblox Shorts - AI Avatar Reaction"
3. **Добавьте описание:** "Automated workflow for creating AI avatar reactions to trending Roblox videos"
4. **Нажмите** "Create Workflow"

---

## ⚙️ API ключи и параметры

```
HeyGen:
- API Key: sk_V2_hgu_kNnLjncEJhB_1qVIMbQNr4XSn0sitR4avTe9hFBQ1SsD
- Avatar ID: 4798c598a7d048e0b314e0cb5f2261a2
- Voice ID: f38a635bee7a4d1f9b0a654a31d050d2

Video Size (YouTube Shorts):
- Width: 720px
- Height: 1280px
- Aspect Ratio: 9:16
```

---

## 🧪 Быстрый тест

```javascript
// Вставьте в Function Node и выполните, чтобы проверить что всё работает:

console.log("Test 1 - Data received:", !!$node["Prepare for Processing"].json);
console.log("Test 2 - URL exists:", !!$node["Prepare for Processing"].json.url);
console.log("Test 3 - Script exists:", !!$node["Prepare for Processing"].json.script);
console.log("Test 4 - URL format:", $node["Prepare for Processing"].json.url.includes("youtube.com"));

return $node["Prepare for Processing"].json;
```

---

## 🚀 Когда будет готово

Workflow выполнится если:
- ✅ Найдено Roblox видео с 500k+ просмотрами
- ✅ GPT создал сценарий реакции
- ✅ Setup Heygen правильно передал все параметры
- ✅ HeyGen создал видео (может занять 2-5 минут)
- ✅ Видео готово и загружено на YouTube
- ✅ Описание и теги добавлены

---

## 📊 Статистика

```
Время на создание одного видео:
- YouTube поиск: 5 сек
- Статистика: 5 сек
- GPT сценарий: 30-60 сек
- HeyGen обработка: 2-5 минут
- YouTube загрузка: 30-60 сек
─────────────────────────────
ИТОГО: ~3-6 минут на видео
```

---

## 🆘 Нужна помощь?

1. **Читайте ошибку:** Скопируйте точный текст ошибки
2. **Смотрите Debug:** Внизу n8n есть Debug tab - там подробнее
3. **Проверяйте Input/Output:** Каждой ноды - понять где сломалось
4. **Ищите в гайдах:** Может быть раздел про вашу проблему
5. **Тестируйте API:** Используйте Postman или curl отдельно

---

## 📞 Документы в этой папке

```
/home/engine/project/
├── QUICK_START.md ← Вы здесь (краткий гайд)
├── N8N_ROBLOX_SHORTS_GUIDE.md ← Полный гайд всех нод
├── SETUP_HEYGEN_SOLUTION.md ← Подробно про главную проблему
├── N8N_NODES_COPY_PASTE.md ← Готовые конфиги для копирования
├── N8N_EXPRESSION_EXAMPLES.md ← Примеры выражений
└── N8N_TESTING_TROUBLESHOOTING.md ← Тестирование и отладка
```

---

**Готово к использованию: ✅**
- Setup Heygen Fix: ✅ (Function Node)
- Copy-Paste конфиги: ✅ (Для каждой ноды)
- Примеры выражений: ✅ (Полный набор)
- Отладка и тестирование: ✅ (Подробный гайд)

**Начните с Setup Heygen - это главное!**
