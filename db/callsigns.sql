create database if not exists callsigns default character set utf8;
use callsigns;

create table if not exists callsigns (
    callsign char(6) not null primary key,
    first_name varchar(70),
    surname varchar(70),
    address_line varchar(70),
    city varchar(35),
    prov_cd varchar(2),
    postal_code char(10),
    qual_a char(1) COMMENT 'Basic',
    qual_b char(1) COMMENT '5 WPM',
    qual_c char(1) COMMENT '12 WPM',
    qual_d char(1) COMMENT 'Advanced',
    qual_e char(1) COMMENT 'Basic with Honours',
    club_name varchar(70),
    club_name_2 varchar(70),
    club_address varchar(70),
    club_city varchar(35),
    club_prov_cd varchar(2),
    club_postal_code varchar(7),
    FULLTEXT(callsign, first_name, surname, address_line, city, prov_cd, postal_code, club_name, club_name_2, club_address, club_city, club_prov_cd, club_postal_code)
) ENGINE=InnoDB;

create table if not exists sync (
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP not null primary key
);

BEGIN;
DELETE FROM callsigns;
LOAD DATA LOCAL INFILE 'amateur_delim.txt' INTO TABLE callsigns CHARACTER SET latin1 FIELDS TERMINATED BY ';' LINES TERMINATED BY '\r\n' IGNORE 1 LINES;
insert into sync () values ();
COMMIT;

GRANT SELECT ON callsigns.* TO '@@MYSQL_USER@@'@'localhost' IDENTIFIED BY '@@MYSQL_PASSWORD@@';
FLUSH PRIVILEGES;
