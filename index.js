const config = require('./config');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs-promise');
const url = require('url');
const cron =  require('node-cron');
const moment = require('moment-timezone');

var medalsByCountryNotification = require('./notifications/to-medals-by-country-notification');
var medalsTableNotification = require('./notifications/to-medal-table-notification');

const DEBUG_ENABLED = false;
const SEND_NOTIFICATION = !DEBUG_ENABLED;
const LOGGING_ENABLED = DEBUG_ENABLED;

function log() {
    var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

    if (LOGGING_ENABLED) {
        console.log(args.join(','));
    }
}

class RemoteFeed {
    constructor(path) {
        this.remoteFeedPath = path;
    }

    get() {
        return fetch(this.remoteFeedPath)
            .then((feed) => feed.json())
    }
}

class LocalFeed {
    constructor(path) {
        this.localFeedPath = path;
    }

    save(feed) {
        let dirname = path.dirname(this.localFeedPath);
        return fs.mkdirs(dirname)
            .then(() => {
                return fs.writeFile(this.localFeedPath, JSON.stringify(feed))
            })
    }

    get() {
        return fs.readFile(this.localFeedPath, 'UTF-8')
            .then((feed) => JSON.parse(feed))
            .catch((err) => {
                if (err.code === 'ENOENT'){
                    return null;
                }
                throw err;
            })
    }
}

class PushyClient {
    sendNotification(topic, notification) {
        console.log(JSON.stringify(notification));

        if (!SEND_NOTIFICATION) {
           return;
        }

        return fetch(`${config.PUSHY_HOST}/topics/${topic}`, {
            method: 'POST',
            body: JSON.stringify({
                ttl: 60, // 30 mins
                payload: notification
            }),
            headers: {
                'Content-Type': 'application/json',
                'X-api-key': config.PUSHY_KEY
            }
        })
        .then((res) => res.json())
        .then((json) => {
            if (!json.success) {
                console.error(JSON.stringify(json));
            } else {
                log(JSON.stringify(json));
            }
        })
	.catch((err) => {
		console.log(err);
	});
    }
}

class MedalsByCountry {
    constructor() {
        this._DEBUG_ALWAYS_NEW_FEED = DEBUG_ENABLED;
        this.pushy = new PushyClient();
	this.alreadySentFeed = new LocalFeed('/tmp/medalsSent.json');
    }

    init() {
        setTimeout(() => {
            this.monitorFeed(config.FEEDS.MEDALS_BY_COUNTRY).then((feeds) => {
                if (feeds) {
                    console.log('Medals by country feed changed');
		    this.alreadySentFeed.get().then((alreadySent) => {
			    var maybeSent = alreadySent || {},
				howManySent = Object.keys(maybeSent);

			    var newMedals = this.findMedalsByCountryFeedDelta(feeds.previousFeed, feeds.nextFeed);
	
			    for (var countryId in newMedals) {
				(newMedals[countryId].medals || []).forEach((medal) => {
			   	    if (maybeSent[medal.entrant.code] || howManySent < 20) {
					console.log('Medal already sent...');
					return;
				    } else {
				        this.sendMedalsByCountryNotification(medal, newMedals[countryId].results);
				        maybeSent[medal.entrant.code] = true;
				   } 
				})
			    }

			   this.alreadySentFeed.save(maybeSent); 
		     });
                }
            }).catch((err) => {
                console.log(err);
            });

            this.init();
        }, 10 * 1000);
    }

    monitorFeed(feed) {
        let feedName = url.parse(feed).pathname.split('/')[3],
            localFeedService = new LocalFeed('/tmp/' + feedName),
            remoteFeedService = new RemoteFeed(feed);

        return remoteFeedService.get()
            .then((remoteFeed) => {
                return localFeedService.get().then((localFeed) => {
                    if (!localFeed || localFeed.timestamp !== remoteFeed.timestamp
                        || this._DEBUG_ALWAYS_NEW_FEED) {
                        return localFeedService.save(remoteFeed).then((saved) => {
                            //Don't send out a slew of notifications when we first load
                            //the remote feed
                            if (localFeed) {
                                return {
                                    previousFeed: localFeed.data,
                                    nextFeed: remoteFeed.data
                                }
                            } else {
                                return null;
                            }
                        })
                    } else {
                        return null;
                    }
                })
            }).catch((err) => {
                log(err);
            });
    }

    sendMedalsByCountryNotification(result, countryResults) {
        var toSend = medalsByCountryNotification(result, countryResults);
        log(JSON.stringify(toSend));
        this.pushy.sendNotification(`olympics_${countryResults.country.identifier}`, toSend)
    }

    findMedalsByCountryFeedDelta(oldFeed, newFeed) {
        var countriesWithNewMedals = {};

        for(var countryId in newFeed) {
            let oldFeedMedals = oldFeed[countryId] ? oldFeed[countryId].medals : [],
                newFeedMetals = newFeed[countryId] ? newFeed[countryId].medals : [];

            var newMedals = newFeedMetals.reduce((coll, newMedal) => {
                //If we have a new medals that's not in our old medal array,
                //send a notification.
                if (!oldFeedMedals.find((oldMedal) => newMedal.entrant.code === oldMedal.entrant.code)
                    || this._DEBUG_ALWAYS_NEW_FEED) {
                    coll.push(newMedal);
                }

                return coll;
            }, []);

            countriesWithNewMedals[countryId] = {
                medals: newMedals,
                results: newFeed[countryId]
            }
        }

        return countriesWithNewMedals;
    }
}

var medals = new MedalsByCountry();
medals.init();

console.log(new Date());
console.log(moment().tz('America/New_York').format('YYYY-MM-DD HH:mm'));
console.log(JSON.stringify(config));

cron.schedule('30 3 * * *', function(){
     console.log('Sending notification for medals table');

     let MedalsTableFeed = new RemoteFeed(config.FEEDS.MEDALS_TABLE);

     MedalsTableFeed.get().then((feed) => {
         return feed.data.sort((tableA, tableB) => {
             if (tableA.position > tableB.position) {
                 return 1
             } else if (tableA.position < tableB.position) {
                 return -1;
             } else {
                 return 0;
             }
         }).slice(0, 3);
     }).then((topThreeCountries) => {
         let Pushy = new PushyClient();

         let notification = medalsTableNotification(topThreeCountries);
         console.log(JSON.stringify(notification));
         Pushy.sendNotification(`olympics_notifications`, notification)
     }).catch((err) => {
         console.log(err);
     });
 });
