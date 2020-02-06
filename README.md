
## Stats
### 989-ish lines of code
```
$ git ls-files | grep -P ".*(js|php|html|json)" | xargs wc -l
       0 app/background.html
      73 app/background.js
       6 app/libraries/bootstrap.min.js
       2 app/libraries/jquery.min.js
      32 app/manifest.json
      43 app/models/task.model.js
      14 app/modules/api.config.js
      96 app/modules/api.data.service.js
      42 app/modules/api.http.service.js
      12 app/modules/app.config.js
       6 app/modules/app.status.keys.js
       7 app/modules/app.utils.js
      49 app/modules/login.data.service.js
      38 app/modules/login.http.service.js
      65 app/modules/storage.service.js
      31 app/modules/translation.config.js
      20 app/modules/translation.service.js
      67 app/views/popup/popup.html
      89 app/views/popup/popup.js
      80 app/views/settings/settings.html
      78 app/views/settings/settings.js
       7 quire-anywhere/app.config.php
     130 quire-anywhere/callback.php
       0 quire-anywhere/index.html
       9 quire-anywhere/status.keys.php
       0 quire-anywhere/success.html
     996 total

```
