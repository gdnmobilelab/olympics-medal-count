DELIMITER $$
    create procedure p_GetOption(
        IN p_option_key VARCHAR(200)
    )

    BEGIN

        IF p_option_key IS NOT NULL THEN
            select option_value from `options` where option_key = p_option_key;
        ELSE
            select option_key, option_value from `options`;
        END IF;

    END $$
DELIMITER ;