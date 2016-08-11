var Config = require('./../config');
var moment = require('moment-timezone');
var flags = require('../country-flags');

module.exports = function(medalTables) {
    let start = parseInt(moment('20160805').format('D'), 10),
        current = parseInt(moment().format('D')),
        day = moment().tz('America/New_York').format("MMM. D");
            // `Day ${current - start}`;
            //moment().format("MMM Do");
    let opts = {
        title: `Rio 2016 Standings: ${day}`,
        options: {
            silent: true,
            tag: `olympics-dashboard-medal-count`,
            icon: 'https://www.gdnmobilelab.com/images/olympics/rio-logo.png',
            data: {
                notificationID: `olympics-dashboard-medal-count`,
                onTap: [
                    {
                        command: "browser.openURL",
                        options: {
                            url: 'http://www.theguardian.com/sport/ng-interactive/2016/aug/05/rio-olympics-2016-medal-table-and-results-in-full'
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
                            url: 'http://www.theguardian.com/sport/ng-interactive/2016/aug/05/rio-olympics-2016-medal-table-and-results-in-full'
                        }
                    },
                    {
                        command: "notification.close"
                    }
                ],
                template: {
                    title: "Leaderboard",
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
                    icon: "https://www.gdnmobilelab.com/data/primary-results/static-images/settings_icon.png"
                }
            }
        ]
    };

    opts.options.body = medalTables.map((table, index) => {
        let gold = table.medals.gold || 0,
            silver = table.medals.silver || 0,
            bronze = table.medals.bronze || 0,
            total = table.total,
            maybeFlag = flags[table.country.identifier] ? flags[table.country.identifier] : '';

        return `${index + 1}. ${maybeFlag} ${table.country.identifier}: ${gold} gold | ${silver} silver | ${bronze} bronze | ${total} Total`
    }).join('\n');

    return [
        {
            command: "notification.show",
            options: opts
        }
    ];
};
