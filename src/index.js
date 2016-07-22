const Config = require('./config');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs-promise');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var notification = require('./to-notification');

const LOGGING_ENABLED = true;

function log() {
    var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

    if (LOGGING_ENABLED) {
        console.log(args.join(','));
    }
}

class OlympicsFeed {
    fetch() {
        return fetch(Config.OLYMPICS_FEED)
            .then((feed) => feed.json())
    }
}

class LocalOlympicsFeed {
    constructor() {
        this.localFeedPath = 'data/olympics-feed.json';
    }

    save(feedJSON) {
        let dirname = path.dirname(this.localFeedPath);
        return fs.mkdirs(dirname)
            .then(() => {
                return fs.writeFile(this.localFeedPath, feedJSON)
            })
    }

    get() {
        return fs.readFile(this.localFeedPath, 'UTF-8')
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
        return fetch(`${Config.PUSHY_HOST}/topics/${topic}`, {
            method: 'POST',
            body: JSON.stringify({
                ttl: 60, // 30 mins
                payload: notification
            }),
            headers: {
                'Content-Type': 'application/json',
                'X-api-key': Config.PUSHY_KEY
            }
        })
            .then((res) => res.json())
            .then((json) => {
                if (!json.success) {
                    console.error(json)
                }
            })
    }
}

class BareMetalOlympics {
    constructor() {
        this.remoteFeed = new OlympicsFeed();
        this.localFeed = new LocalOlympicsFeed();
        this.pushy = new PushyClient();
        this._DEBUG_ALWAYS_NEW_FEED = true;
        this._DEBUG_SEND_NOTIFICATION_FOR_COUNTRIES = ['USA'];

        eventEmitter.on('feedChanged', this.findFeedDelta.bind(this));
        eventEmitter.on('sendNotification', this.sendNotification.bind(this));
        eventEmitter.eventNames().forEach((eventName) => {
            eventEmitter.on(eventName, () => {
                log(`Triggered: ${eventName}`);
            })
        })
    }

    sendNotification(results) {
        var toSend = notification(results);
        this.pushy.sendNotification(`olympics_${results.country.identifier}`, toSend)
    }

    findFeedDelta(oldFeed, newFeed) {
        //In case indices are out of alignment between
        //feed updates, reduce to an object by country identifier
        oldFeed = oldFeed.filter((c) => c.country).reduce((coll, c) => {
            coll[c.country.identifier] = c;
            return coll;
        }, {});

        newFeed = newFeed.filter((c) => c.country).reduce((coll, c) => {
            coll[c.country.identifier] = c;
            return coll;
        }, {});

        Object.keys(newFeed).forEach((key) => {
            if (newFeed[key].total !== oldFeed[key].total || this._DEBUG_SEND_NOTIFICATION_FOR_COUNTRIES.indexOf(key) !== -1) {
                eventEmitter.emit('sendNotification', newFeed[key])
            }
        })
    }

    monitorOlympicsFeed() {
        this.remoteFeed.fetch()
            .then((remoteFeed) => {
                return this.localFeed.get().then((localFeed) => {
                    var parsedLocalFeed = JSON.parse(localFeed);
                    if (localFeed && parsedLocalFeed.timestamp !== remoteFeed.timestamp || this._DEBUG_ALWAYS_NEW_FEED) {
                        var stringifyRemote = JSON.stringify(remoteFeed);
                        return this.localFeed.save(stringifyRemote).then((saved) => {
                            //Don't send out a slew of notifications when we first load
                            //the remote feed
                            if (localFeed) {
                                eventEmitter.emit('feedChanged', parsedLocalFeed.data || [], remoteFeed.data);
                            }
                        })
                    }
                })
            }).then(() => {
                log('Triggered: setTimeout');
                setTimeout(this.monitorOlympicsFeed.bind(this), 1000 * (10));
            }).catch((err) => {
                log(err);
            });
    }
}

var Olympics = new BareMetalOlympics();
Olympics.monitorOlympicsFeed();