var Config = require('./config');

module.exports = function(countryStatus) {
    console.log(countryStatus);
    let opts = {
        title: `Medal alert for ${countryStatus.country.name}`,
        options: {
            tag: `olympics-dashboard-${countryStatus.country.identifier}`,
            icon: 'https://www.stg.gdnmobilelab.com/data/primary-results/static-images/mobilelab_logo.png',
            data: {
                notificationID: `olympics-dashboard-${countryStatus.country.identifier}`,
                onTap: [
                    {
                        command: "browser.openURL",
                        options: {
                            url: "https://www.theguardian.com/sport/olympic-games"
                        }
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
                            url: "https://www.theguardian.com/sport/olympic-games"
                        }
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
                        command: "notification.close"
                    },
                    {
                        command: "browser.openURL",
                        options: {
                            url: Config.MANAGE_NOTIFICATIONS_WEBPAGE
                        }
                    }
                ],
                template: {
                    title: "Manage updates",
                    icon: "https://www.gdnmobilelab.com/data/primary-results/static-images/stop_icon_big.png"
                }
            }
        ]
    };

    opts.options.body = [
        `Medal count: ${countryStatus.total}`,
        `Rank: ${countryStatus.position}`,
        `${countryStatus.medals.gold} gold • ${countryStatus.medals.silver} silver • ${countryStatus.medals.bronze} bronze`
    ].join('\n');

    return [
        {
            command: "notification.show",
            options: opts
        }
    ];
}