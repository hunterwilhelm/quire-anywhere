
## Stats
### 440-ish lines of code
```
$ git ls-files | grep -P ".*(js|php|html|json)" | xargs wc -l
    0 app/background.html
   29 app/background.js
   31 app/manifest.json
   11 app/modules/app.config.js
    6 app/modules/app.status.keys.js
    7 app/modules/app.utils.js
   24 app/modules/storage.service.js
   25 app/modules/translation.config.js
   20 app/modules/translation.service.js
   52 app/views/popup/login.data.service.js
   36 app/views/popup/login.http.service.js
   17 app/views/popup/popup.html
   36 app/views/popup/popup.js
    7 quire-anywhere/app.config.php
  130 quire-anywhere/callback.php
    0 quire-anywhere/index.html
    9 quire-anywhere/status.keys.php
    0 quire-anywhere/success.hatml
  440 total
```