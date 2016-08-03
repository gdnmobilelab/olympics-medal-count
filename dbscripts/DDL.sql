create database if not exists olympics2016;

use olympics2016;

create table options (
    option_key VARCHAR(200) PRIMARY KEY,
    option_value VARCHAR(1000),
    created_on TIMESTAMP DEFAULT now(),
    modified_on TIMESTAMP DEFAULT now() ON UPDATE now()
);
