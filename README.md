# callsigns

This is the code that powers [callsigns.ca](http://callsigns.ca).
It started with the simple desire for a simple mobile friendly way of
searching the Canadian Callsign Database and ended with me developing
my own website.

## Requirements

* systemd
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

Here's a list of features I'm thinking of adding:

* i18n/l10n (initially English and French).
* Full text search, pagination of results, etc.

## License

Code License:

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

Data License: see [Terms and Conditions](http://www.ic.gc.ca/eic/site/icgc.nsf/eng/h_07033.html)
on the Industry Canada website.
