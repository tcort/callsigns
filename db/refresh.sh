#!/bin/sh
set -e

# run this script to refresh the database.

# ensure PATH is setup correctly
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games

# ensure this script runs from the callsigns/db directory
cd $(dirname $(readlink -f $0))

# quietly download the callsign zip archive if it has been updated
wget -q -N http://apc-cap.ic.gc.ca/datafiles/amateur_delim.zip

# quietly extract the callsign list, overwrite an existing txt file
unzip -qq -o amateur_delim.zip amateur_delim.txt

# load password from config file
MYSQL_ROOT_PASSWD=$(node -e "console.log(require('../config').root_password);")

MYSQL_USER=$(node -e "console.log(require('../config').user);")
MYSQL_PASSWORD=$(node -e "console.log(require('../config').password);")

# load the callsign list into the database
cat callsigns.sql | sed -e 's/@@MYSQL_USER@@/'${MYSQL_USER}'/g' | sed -e 's/@@MYSQL_PASSWORD@@/'${MYSQL_PASSWORD}'/g' | mysql --local-infile -u root --password="${MYSQL_ROOT_PASSWD}"
