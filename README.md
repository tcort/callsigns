# callsigns

## Requirements

* nginx
* mysql
* wget
* unzip
* node.js
* npm
* bower

## Installation

Grab the source code:

    mkdir -p /var/node && cd /var/node
    git clone git://github.com/tcort/callsigns.git && cd callsigns

Install the dependencies:

    bower install
    npm install

Configure:

    $EDITOR config.json

Populate the database:

    /var/node/callsigns/db/refresh.sh

Add a cron job to refresh the database:

    crontab -e
    15 1   *   *   *   /var/node/callsigns/db/refresh.sh >/dev/null 2>&1

Configure nginx:

    cp /var/node/callsigns/etc/nginx/sites-available/callsigns.ca /etc/nginx/sites-available/callsigns.ca
    $EDITOR /etc/nginx/sites-available/callsigns.ca
    systemctl restart nginx

Configure the service:

    cp /var/node/callsigns/etc/systemd/system/callsigns.service /etc/systemd/system/callsigns.service
    systemctl enable callsigns
    systemctl start callsigns


## TODO

* Finish `README.md`
* Github!
* i18n/l10n
* Full text search, pagination, etc.

## License

ISC License:

```
Copyright (c) 2015 Thomas Cort <linuxgeek@gmail.com>

Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
