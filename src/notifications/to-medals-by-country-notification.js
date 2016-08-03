var Config = require('./../config');

module.exports = function(medal, countryResults, {olympicsURL, liveblogURL}) {
    let body = '',
        entrant = medal.entrant,
        event = medal.event,
        country = countryResults.country,
        discipline = event.discipline,
        eventDescription = '';

    if (discipline.identifier === 'athletics'
        || discipline.identifier === 'swimming') {
        eventDescription = event.event.description;
    } else {
        eventDescription = `${event.discipline.description}`
    }

    if (entrant.type.toLowerCase() === 'individual') {
        body = `${entrant.competitors[0].fullName} from ${country.longName} just won a ${entrant.medal} medal in ${eventDescription}`;
    } else if (entrant.type.toLowerCase() === 'team' && entrant.competitors.length === 2) {
        body = `${entrant.competitors[0].lastName}/${entrant.competitors[1].lastName} from ${country.longName} just won a ${entrant.medal} medal in ${eventDescription}`;
    } else {
        body = `${country.longName} just won a ${entrant.medal} medal in ${eventDescription}`;
    }

    //Object of medal to count;
    var medalsTable = countryResults.medals.reduce((coll, m) => {
        let medals = coll[m.entrant.medal] || 0;

        medals += 1;
        coll[m.entrant.medal] = medals;

        return coll;
    }, {});

    body += `\n${country.longName} medal count: `;

    if (medalsTable['Gold']) {
        body += `${medalsTable['Gold']} gold`;

        if (medalsTable['Silver'] || medalsTable['Bronze']) {
            body += ' • ';
        }
    }

    if (medalsTable['Silver']) {
        body += `${medalsTable['Silver']} silver`;

        if (medalsTable['Bronze']) {
            body += ' • ';
        }
    }

    if (medalsTable['Bronze']) {
        body += `${medalsTable['Bronze']} bronze`;
    }

    let opts = {
        title: `Medal alert for ${country.name}`,
        options: {
            tag: `olympics-dashboard-${country.identifier}`,
            body: body,
            icon: 'https://www.stg.gdnmobilelab.com/data/primary-results/static-images/mobilelab_logo.png',
            data: {
                notificationID: `olympics-dashboard-${country.identifier}`,
                onTap: [
                    {
                        command: "browser.openURL",
                        options: {
                            url: liveblogURL
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
                            url: liveblogURL
                        }
                    },
                    {
                        command: "notification.close"
                    }
                ],
                template: {
                    title: "Open Olympics blog",
                    icon: "https://www.gdnmobilelab.com/data/primary-results/static-images/chart_icon_big.png"
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
}