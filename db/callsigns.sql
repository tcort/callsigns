CREATE DATABASE IF NOT EXISTS callsigns DEFAULT CHARACTER SET utf8;
USE callsigns;

CREATE TABLE IF NOT EXISTS callsigns (
    callsign CHAR(6) not null primary key,
    first_name VARCHAR(70),
    surname VARCHAR(70),
    address_line VARCHAR(70),
    city VARCHAR(35),
    prov_cd VARCHAR(2),
    postal_code CHAR(10),
    qual_a CHAR(1) COMMENT 'Basic',
    qual_b CHAR(1) COMMENT '5 WPM',
    qual_c CHAR(1) COMMENT '12 WPM',
    qual_d CHAR(1) COMMENT 'Advanced',
    qual_e CHAR(1) COMMENT 'Basic with Honours',
    club_name VARCHAR(70),
    club_name_2 VARCHAR(70),
    club_address VARCHAR(70),
    club_city VARCHAR(35),
    club_prov_cd VARCHAR(2),
    club_postal_code VARCHAR(7),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT(callsign, first_name, surname, address_line, city, prov_cd, postal_code, club_name, club_name_2, club_address, club_city, club_prov_cd, club_postal_code)
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS sync (
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL PRIMARY KEY
);

LOAD DATA LOCAL INFILE 'amateur_delim.txt' REPLACE INTO TABLE callsigns CHARACTER SET latin1 FIELDS TERMINATED BY ';' LINES TERMINATED BY '\r\n' IGNORE 1 LINES;
INSERT INTO sync () VALUES ();
DELETE FROM callsigns WHERE last_update < (SELECT last_update FROM sync ORDER BY last_update DESC LIMIT 1,1);

GRANT SELECT ON callsigns.* TO '@@MYSQL_USER@@'@'localhost' IDENTIFIED BY '@@MYSQL_PASSWORD@@';
FLUSH PRIVILEGES;
