var Config = require('./../config');
var moment = require('moment');
var flags = require('../country-flags');

module.exports = function(medalTables, {olympicsURL, liveblogURL}) {
    let opts = {
        title: `Rio 2016 Medal Count: ${moment().format("ddd, M/YY")}`,
        options: {
            tag: `olympics-dashboard-medal-count`,
            icon: 'https://www.stg.gdnmobilelab.com/data/primary-results/static-images/mobilelab_logo.png',
            data: {
                notificationID: `olympics-dashboard-medal-count`,
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

    opts.options.body = medalTables.map((table, index) => {
        let gold = table.medals.gold || 0,
            silver = table.medals.silver || 0,
            bronze = table.medals.bronze || 0,
            total = table.total,
            maybeFlag = flags[table.country.identifier] ? ' ' + flags[table.country.identifier] : '';

        return `${index + 1}. ${table.country.identifier}${maybeFlag}: ${gold} [gold] * ${silver} [silver] * ${bronze} [bronze] * ${total} Total`
    }).join('\n');

    return [
        {
            command: "notification.show",
            options: opts
        }
    ];
};