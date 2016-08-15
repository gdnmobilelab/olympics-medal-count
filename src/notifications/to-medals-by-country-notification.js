var Config = require('./../config');
var util = require('../util/util');
var flags = require('../country-flags');
var longCountryNames = require('../long-country-names');
var moment = require('moment-timezone');

var medalsIcons = {
    'bronze': 'https://www.gdnmobilelab.com/images/olympics/bronze.png',
    'silver': 'https://www.gdnmobilelab.com/images/olympics/silver.png',
    'gold': 'https://www.gdnmobilelab.com/images/olympics/gold.png'
};

module.exports = function(medal, countryResults) {
    let body = '',
        entrant = medal.entrant,
        event = medal.event,
        country = countryResults.country,
        discipline = event.discipline,
        eventDescription = '',
        entrantMedal = entrant.medal.toLowerCase();

    if (discipline.identifier === 'athletics'
        || discipline.identifier === 'swimming') {
        eventDescription = event.event.description;
    } else if (discipline.identifier === 'gymnastics-artistic') {
        if (event.event.description === 'Men\'s Team'
            || event.event.description === 'Women\'s Team') {
            eventDescription = event.event.description + ' all-around';
        } else {
            eventDescription = event.event.description
        }
    } else {
        if (event.discipline.identifier === 'gymnastics-rhythmic') {
            eventDescription = 'Rhythmic Gymnastics';
        } else if (event.discipline.identifier === 'gymnastics-trampoline') {
            eventDescription = 'Trampoline';
        } else if (event.discipline.identifier.startsWith('cycling')) {
            eventDescription = event.discipline.description.substring(8) + ' Cycling';
        } else {
            eventDescription = `${event.discipline.description}`
        }
    }

    eventDescription = eventDescription.toLowerCase();

    if (eventDescription.startsWith('men') || eventDescription.startsWith('women')) {
        eventDescription = util.capitalizeFirstLetter(eventDescription);
    }

    if (entrant.type.toLowerCase() === 'individual') {
        body = `${entrant.competitors[0].fullName} of ${country.longName} just won a ${entrantMedal} medal in ${eventDescription}.`;
    } else if (entrant.type.toLowerCase() === 'team' && entrant.competitors.length === 2) {
        body = `${entrant.competitors[0].lastName}/${entrant.competitors[1].lastName} of ${country.longName} just won a ${entrantMedal} medal in ${eventDescription}.`;
    } else {
        body = `Team ${country.longName} just won a ${entrantMedal} medal in ${eventDescription}.`;
    }

    //Object of medal to count;
    var medalsTable = countryResults.medals.reduce((coll, m) => {
        let medals = coll[m.entrant.medal] || 0;

        medals += 1;
        coll[m.entrant.medal] = medals;

        return coll;
    }, {});

    let gold = medalsTable['Gold'] || 0,
        silver = medalsTable['Silver'] || 0,
        bronze = medalsTable['Bronze'] || 0,
        total = countryResults.medals.length,
        maybeFlag = flags[country.identifier] ? flags[country.identifier] + ' ' : '',
        maybeFlagOrTotalMetalCount = `${flags[country.identifier] ? `${flags[country.identifier]} ${country.identifier}` : country.identifier} total medal count: ${total}`,
        medalResults = `${maybeFlag} ${country.identifier} medal count: ${gold} gold | ${silver} silver | ${bronze} bronze \n\n${maybeFlagOrTotalMetalCount}`;

    body += `\n\n${medalResults}`;


    //Handle countries
    let countryTitle = country.longName,
        maybeTooLong = longCountryNames[country.identifier];
    if (maybeTooLong) {
        countryTitle = maybeTooLong;
    }

    var hour = parseInt(moment().tz('America/New_York').format("HH"), 10);

    var isSilent = false;
    if (hour > 21 && hour < 6) {
        isSilent = true;
    }

    let opts = {
        title: `${countryTitle} wins ${entrant.medal.toUpperCase()}!`,
        options: {
            silent: isSilent,
            tag: `olympics-dashboard-${country.identifier}-${Date.now()}`,
            body: body,
            icon: medalsIcons[entrantMedal],
            data: {
                notificationID: `olympics-dashboard-${country.identifier}`,
                onTap: [
                    {
                        command: "browser.openURL",
                        options: {
                            url: 'https://www.theguardian.com/sport/rio-2016'
                        }
                    },
                    {
                        command: "notification.close"
                    }
                ]
            }
        },
        actionCommands: [
            {
                commands: [

                    {
                        command: "browser.openURL",
                        options: {
                            url: 'https://www.theguardian.com/sport/rio-2016'
                        }
                    },
                    {
                        command: "notification.close"
                    }
                ],
                template: {
                    title: "More news",
                    icon: "https://www.gdnmobilelab.com/data/primary-results/static-images/stop_icon_big.png"
                }
            },
            {
                commands: [
                    {
                        command: "browser.openURL",
                        options: {
                            url: Config.MANAGE_NOTIFICATIONS_WEBPAGE
                        }
                    },
                    {
                        command: "notification.close"
                    }
                ],
                template: {
                    title: "Manage updates",
                    icon: "https://www.gdnmobilelab.com/data/primary-results/static-images/stop_icon_big.png"
                }
            }
        ]
    };

    return [
        {
            command: "notification.show",
            options: opts
        }
    ];
};