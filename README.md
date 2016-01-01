# callsigns

This is the code that powers [callsigns.ca](https://www.callsigns.ca).
It started with the simple desire for a simple mobile friendly way of
searching the Canadian Callsign Database and ended with me developing
my own website.

## Features

* mobile friendly design that also works on the desktop and in the terminal
* bilingual user interface (English and French)
* no advertisements nor any form of monetization (strictly non-commercial)
* no login required to access any part of the site
* no social media buttons to distract you
* no tracking/analytics beyond standard HTTP server access logs
* no cookies beyond an ephemeral session cookie for language preference
* free and open source code

## Requirements

* systemd
* iptables
* nginx
* openssl
* mysql
* wget
* unzip
* node.js
* npm
* letsencrypt

## Installation

Grab the source code:

    mkdir -p /var/node && cd /var/node
    git clone git://github.com/tcort/callsigns.git && cd callsigns

Install the dependencies:

    npm install

Configure iptables:

    iptables-restore < ./etc/iptables/rules.v4
    ip6tables-restore < ./etc/iptables/rules.v6
    apt-get install iptables-persistent

Configure:

    $EDITOR config.json

Populate the database:

    /var/node/callsigns/db/refresh.sh

Add a cron job to refresh the database:

    crontab -e
    15 1   *   *   *   /var/node/callsigns/db/refresh.sh >/dev/null 2>&1

Get SSL Certificates:

    git clone https://github.com/letsencrypt/letsencrypt
    cd letsencrypt
    ./letsencrypt-auto --agree-dev-preview --server \
        https://acme-v01.api.letsencrypt.org/directory certonly

Generate DHE Parameters:

    openssl dhparam -out /etc/ssl/certs/dhparam.pem 4096

Configure nginx:

    cp /var/node/callsigns/etc/nginx/sites-available/callsigns.ca /etc/nginx/sites-available/callsigns.ca
    $EDITOR /etc/nginx/sites-available/callsigns.ca
    systemctl restart nginx

Configure the service:

    cp /var/node/callsigns/etc/systemd/system/callsigns.service /etc/systemd/system/callsigns.service
    systemctl enable callsigns
    systemctl start callsigns

## Testing

Once the service is up and running, execute `npm test` to perform some end-to-end tests.

## License

Code License: see [LICENSE.md](https://github.com/tcort/callsigns/blob/master/LICENSE.md)

Data License: see [Terms and Conditions](http://www.ic.gc.ca/eic/site/icgc.nsf/eng/h_07033.html)
on the Industry Canada website.
