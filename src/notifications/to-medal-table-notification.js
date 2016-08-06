var Config = require('./../config');
var moment = require('moment');
var flags = require('../country-flags');

module.exports = function(medalTables) {
    let day = moment().format("MMM Do");

    console.log(day);
    let opts = {
        title: `Rio 2016 Medal Count: ${day}`,
        options: {
            tag: `olympics-dashboard-medal-count`,
            icon: 'http://www.gdnmobilelab.com/images/olympics/rio-logo.png',
            data: {
                notificationID: `olympics-dashboard-medal-count`,
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
            maybeFlag = flags[table.country.identifier] ? ' ' + flags[table.country.identifier] : '';

        return `${index + 1}. ${maybeFlag} ${table.country.identifier}: ${gold} gold | ${silver} silver | ${bronze} bronze | ${total} Total`
    }).join('\n');

    return [
        {
            command: "notification.show",
            options: opts
        }
    ];
};