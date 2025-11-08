Качаем аккаунты Github для Gitcoin Passport

https://t.me/ponquitter

1. Форкаем этот репозиторий.

2. [Создаем API ключ](https://github.com/settings/tokens/new), нажимаем Generate new token (classic). Выставляем "No 
Expiration" и прожимаем все галочки. Копируем ключ и сохраняем для дальнейшего
использования.
![telegram-cloud-photo-size-4-5894089822413369445-w](https://github.com/hhermesa/randomCatFacts/assets/56301001/4186ea57-a5c0-439f-8ad2-fae44f83f903)

3. Повторяем первые два шага для каждого GitHub аккаунта.
4. Переходим на [PipeDream](https://pipedream.com), регистрируемся и создаем Workspace.

5. Далее создаем Workflow и создаем временной триггер:
![telegram-cloud-photo-size-4-5894173484081328383-w](https://github.com/hhermesa/randomCatFacts/assets/56301001/63009e98-5ab8-4fbf-8028-a66c92292f08)

6. Выставляем нужный вам график commit`ов в гитхабе. Я выставил один раз в cутки, но можно и чаще.
![telegram-cloud-photo-size-4-5894349564855562514-w](https://github.com/hhermesa/randomCatFacts/assets/56301001/d87905d0-877d-4e8f-a134-e6ddc58ea861)

7. Далее генерируем и выбираем ивент, как показано на скрине ниже.
![telegram-cloud-photo-size-4-5894297806204678292-w](https://github.com/hhermesa/randomCatFacts/assets/56301001/81d25973-5b78-49e4-8772-258add5f89cc)

8. Вставляем код из файла [main.js](https://github.com/hhermesa/randomCatFacts/blob/main/main.js), который будет активироваться по временному 
триггеру.
![telegram-cloud-photo-size-4-5894513155864899953-w](https://github.com/hhermesa/randomCatFacts/assets/56301001/1d3709d6-992b-4f8f-aec4-32ed91457250)

В коде меняем token и name на ваш API ключ и юзернейм аккаунта Github, 
соответственно. Через запятую указываем любое кол-во аккаунтов, сохраняя при 
этом порядок ввода (если API ключ введен третьим по счету, то и юзернейм должен 
быть третьим). Я привел пример с двумя аккаунтами.
![telegram-cloud-photo-size-4-5894181966641737981-w](https://github.com/hhermesa/randomCatFacts/assets/56301001/1962142c-a89f-4ce6-a189-c55dd1560e79)

9. Жмем Deploy и сохраняем Workflow.

## Автоматическая загрузка товаров на Styxmarket

Скрипт `scripts/styxmarketUploader.js` автоматизирует загрузку товара через личный кабинет маркетплейса.

### Предварительные требования

1. Установите зависимости проекта: `npm install`.
2. Запустите Chrome с нужным аккаунтом и включенной удалённой отладкой, например:
   ```
   chrome.exe --remote-debugging-port=9222
   ```
3. Убедитесь, что Excel файл (`mega_full_report1.xlsx`) доступен по указанному пути.

### Запуск

```
node scripts/styxmarketUploader.js --excel "D:\\gemini\\Telegram-shop-main\\Telegram-shop-main\\test script\\mega_full_report1.xlsx"
```

Дополнительно можно указать каталог для txt файлов `--output "./styxmarket_files"` и собственный адрес удалённой отладки `--chrome "http://127.0.0.1:9222"`.

### Что делает скрипт

- считывает первый товар из Excel (колонки `file name`, `Price`, `textarea`, `link`);
- создаёт txt-файл с содержимым из `link` и сохраняет его в выбранной папке;
- подключается к уже запущенному Chrome через DevTools Protocol;
- заполняет форму на https://styxmarket.com/shop/my/ и загружает созданный файл.

В консоли выводятся шаги выполнения и результат загрузки.
