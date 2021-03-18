/*

    @ Author: Eliezer Benjamin

*/

/* --- CustomEvent constructor Polyfill for IE9 --- */
(function() {
    if (typeof window.CustomEvent === "function") return false;

    function CustomEvent(event, params) {
        params = params || {
            bubbles: false,
            cancelable: false,
            detail: undefined
        };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
})();
/* --- CustomEvent constructor Polyfill for IE9 --- */

(function(global) {
    var
        // Wrapper to eliminate the need to use 'new' everytime a player has to be created.
        ePlayer = function(options) {
            return new ePlayer.init(options);
        },
        
        ids = ePlayer.ids = [],

        // Holds data specific to each player
        data = {},

        // Holds references to callbacks for events
        listeners = {}
    ;

    // Initialise player
    ePlayer.init = function(options) {
        
        this.id = ids.length;
        ids[ids.length] = true;
        
        // A place to store data specific to this player
        data[this.id] = {};
        
        // Holds references to callbacks for events
        listeners[this.id] = {};
        
        // Set options based on 'options' argument
        initState.call(this, options);
        
        // Creating HTML5 audio element
        this.audElem = new Audio();
        this.audElem.preload = this.state.preload;
        
        // Set event listners for 'loadedmetadata', 'ended', 'timeupdate'
        setGeneralEvents.call(this);
        this.dispatchEvent(this.events.setupcomplete());
    }

    function initState(options) {

        // Initializing with default values.
        this.playlist = [];
        this.state = {
            repeat: 'off',
            shuffle: 'off',
            volume: 0.5,
            preload: 'metadata',
            autoplay: false,
            curMedia: {
                    id: null,
                    curTime: null,
                    curMin: null,
                    curSec: null,
                    duration: null,
                    durMin: null,
                    durSec: null,
                    src: null
                },
            prevMedia: null
        }

        if (typeof options === 'object') {
            for (var option in options) {
                if (!options.hasOwnProperty(option) || option === 'playlist') continue;
                if (option in this.validOptions) {
                    if (isOptionValid(option, options[option]))
                        this.state[option] = options[option];
                    else
                        throw "'" + options[option] + "' is not a valid value for option '" + option + "'!";
                }
                else
                    throw "Invalid option: '" + option + "'!";
            }
        }

        initPlaylist.call(this, options.playlist);
    }

    function initPlaylist(playlist) {
        this.playlist = [];

        // If options does not contain 'playlist' option
        if (playlist === undefined || playlist.length === 0) {
            throw "Playlist not found or is empty!";
        }

        // Make a copy of 'options.playlist' in 'this'.
        var len = playlist.length;
        for (var i = 0; i < len; i++) {
            this.playlist.push({
                url: playlist[i].url,
                name: playlist[i].name
            });
        }

        // Initially list of played items is empty and previous state of shuffle is off
        data[this.id].played = [];
        data[this.id].prevState = { shuffle: 'off' };
    }

    function resetPlayer() {
        
        this.audElem.pause();
        this.audElem.currentTime = 0;
        
        this.state.curMedia.id = null;
        this.state.curMedia.curTime = null;
        this.state.curMedia.curMin = null;
        this.state.curMedia.curSec = null;
        this.state.curMedia.duration = null;
        this.state.curMedia.durMin = null;
        this.state.curMedia.durSec = null;
        this.state.curMedia.src = null;
        
        this.state.play = 'pause';
        
        data[this.id].prevState.shuffle = 'off'; //Resets played list
        this.dispatchEvent(this.events.stop());
        this.state.prevMedia = null;
    }

    ePlayer.isOptionValid = isOptionValid;
    function isOptionValid(option, value) {
        switch (option) {
            case 'play':
                if (typeof value === 'string' && (value === 'play' || value === 'pause')) {
                    return true;
                } else return false;
                break;
            case 'repeat':
                if (typeof value === 'string' && (value === 'on' || value === 'one' || value === 'off')) {
                    return true;
                } else return false;
                break;
            case 'shuffle':
                if (typeof value === 'string' && (value === 'on' || value === 'off')) {
                    return true;
                } else return false;
                break;
            case 'volume':
                if (typeof value === 'number' && value >= 0 && value <= 1) {
                    return true;
                } else return false;
                break;
            case 'preload':
                if (typeof value === 'string' && (value === 'none' || value === 'auto' || value === 'metadata' || value === '')) {
                    return true;
                } else return false;
                break;
            case 'autoplay':
                if (typeof value === 'boolean') {
                    return true;
                } else return false;
                break;
            default:
                throw 'Invalid option!';
                return false;
        }
    }

    var playlist = {
        getNextInd: function(repeat, shuffle) {
            var newInd;
            // If player has just been initialised
            if (this.state.curMedia.id === null) {
                if (shuffle === 'off') {
                    newInd = 0;
                } else if (shuffle === 'on') {
                    newInd = playlist.getRandomInd.call(this);
                    playlist.played.add.call(this, newInd)
                }
            }
            // If repeat = 'one', no matter what shuffle is set to, play current item again
            else if (repeat === 'one') {
                newInd = this.state.curMedia.id;
            }
            // If shuffle = 'off' and end of playlist reached,
            //      If repeat is on, play first item else stop player. 
            else if (shuffle === 'off') {
                if (this.state.curMedia.id !== this.playlist.length - 1) newInd = this.state.curMedia.id + 1;
                else {
                    newInd = (repeat === 'on') ? 0 : null;
                }
            }
            // data.played keeps track of played items if shuffle is on
            // If shuffle = 'on' and prevState of shuffle = 'on', dont empty played list otherwise empty
            // If played list is full, empty it
            // If played is full, and repeat is on, select a random id otherwise stop player
            else if (shuffle === 'on') {
                if (data[this.id].prevState.shuffle === 'off') {
                    data[this.id].played = [];
                    // If there is only one item in the playlist, stop player.
                    if (this.playlist.length === 1 && this.state.curMedia.id !== null) return null;
                }
                if (playlist.played.isFull.call(this)) {
                    playlist.played.clear.call(this);
                    newInd = (repeat === 'on') ? playlist.getRandomInd.call(this) : null;
                } else {
                    newInd = playlist.getRandomInd.call(this);
                }
                if (newInd !== null) playlist.played.add.call(this, newInd);
            }
            data[this.id].prevState.shuffle = shuffle;
            return newInd;
        },
        getPrevInd: function(shuffle) {
            var newInd;
            if (this.state.curMedia.id === null) {
                if (shuffle === 'off') {
                    newInd = this.playlist.length - 1;
                }
                // If shuffle is on, prev and next does the same thing.
                else if (shuffle === 'on') {
                    newInd = playlist.getNextInd.call(this, repeat, shuffle);
                }
            } else if (shuffle === 'off') {
                if (this.state.curMedia.id !== 0) newInd = this.state.curMedia.id - 1;
                else {
                    newInd = this.playlist.length - 1;
                }
            }
            // If shuffle is on, prev and next does the same thing.
            else if (shuffle === 'on') {
                newInd = playlist.getNextInd.call(this, repeat, shuffle);
            }
            data[this.id].prevState.shuffle = shuffle;
            return newInd;
        },
        getRandomInd: function() {
            var newRandInd;
            do {
                newRandInd = parseInt(Math.random() * this.playlist.length);
            }
            while (playlist.played.contains.call(this, newRandInd));
            return newRandInd;
        },
        played: {
            clear: function() {
                data[this.id].played = [];
            },
            isFull: function() {
                for (var i = 0; i < this.playlist.length; i++) {
                    //console.log('i:'+i+' played[i]: '+data[this.id].played[i]);
                    if (!data[this.id].played[i]) return false;
                }
                return true;
            },
            contains: function(ind) {
                return data[this.id].played[ind] ? true : false;
            },
            add: function(ind) {
                data[this.id].played[ind] = true;
            }
        },
        setMedia: function(index) {
            this.audElem.src = this.state.curMedia.src = this.playlist[index].url;
            this.state.prevMedia = this.state.curMedia.id;
            this.state.curMedia.id = index;
            this.audElem.load();
        }
    };

    function setGeneralEvents() {
        var self = this;
        this.audElem.addEventListener('loadedmetadata', function(event) {
            var dur = self.state.curMedia.duration = self.audElem.duration;
            if (!Number.isFinite(dur)) {
                throw 'Duration infinite';
            }
            var durMin = parseInt(dur / 60);
            var durSec = parseInt(dur % 60);
            if (durMin < 10) durMin = '0' + durMin;
            if (durSec < 10) durSec = '0' + durSec;
            self.state.curMedia.durMin = durMin;
            self.state.curMedia.durSec = durSec;
            self.dispatchEvent(event);
        });
        this.audElem.addEventListener('timeupdate', function(event) {
            var curTime = self.state.curMedia.curTime = self.audElem.currentTime;
            var curTimeMin = parseInt(curTime / 60);
            var curTimeSec = parseInt(curTime % 60);
            if (curTimeMin < 10) curTimeMin = '0' + curTimeMin;
            if (curTimeSec < 10) curTimeSec = '0' + curTimeSec;
            self.state.curMedia.curMin = curTimeMin;
            self.state.curMedia.curSec = curTimeSec;
            self.dispatchEvent(event);
        });
        this.audElem.addEventListener('ended', function(event) {
            self.dispatchEvent(event);
            var nextMediaIndex = playlist.getNextInd.call(self, self.state.repeat, self.state.shuffle);
            //getNextInd() may return 0 which evaluates to false. Hence check null explicitly
            if (nextMediaIndex === null) {
                resetPlayer.call(self);
            } else {
                playlist.setMedia.call(self, nextMediaIndex);
                self.dispatchEvent(self.events.activatemedia());
                self.state.play = 'play';
                self.audElem.play();
            }
        });
        var otherNativeEvents = ['play', 'pause', 'canplay', 'canplaythrough', 'durationchange', 'loadstart', 'loadeddata', 'playing', 'progress', 'ratechange', 'seeked', 'seeking'];
        // Users can subscribe to AudioElement's events directly by subscribing to ePlayer object  
        for (var i = 0; i < otherNativeEvents.length; i++) {
            self.audElem.addEventListener(otherNativeEvents[i], function(event) {
                self.dispatchEvent(event);
            });
        }
    }

    ePlayer.init.prototype = {
        play: function() {
            if (this.state.curMedia.id === null) {
                var nextMediaIndex = playlist.getNextInd.call(this, this.state.repeat, this.state.shuffle);
                if (nextMediaIndex !== null) {
                    playlist.setMedia.call(this, nextMediaIndex);
                    this.dispatchEvent(this.events.activatemedia());
                }
            }
            this.audElem.play();
            this.state.play = 'play';
            return this;
        },
        pause: function() {
            this.audElem.pause();
            this.state.play = 'pause';
            return this;
        },
        togglePlay: function() {
            if (this.state.play === 'play') {
                this.pause();
            } else {
                this.play();
            }
            return this;
        },
        seek: function(timeInSec) {
            if (timeInSec < 0 || timeInSec > this.audElem.duration) {
                throw 'Invalid value for seek(). Time not within limit!';
            }
            this.audElem.currentTime = timeInSec;
            return this;
        },
        setRepeat: function(newState) {
            if (!isOptionValid('repeat', newState)) {
                throw 'Invalid state for setRepeat()!';
            }
            this.state.repeat = newState;
            this.dispatchEvent(this.events.repeatchanged());
            return this;
        },
        setShuffle: function(newState) {
            if (!isOptionValid('shuffle', newState)) {
                throw 'Invalid state for setShuffle()!';
            }
            this.state.shuffle = newState;
            this.dispatchEvent(this.events.shufflechanged());
            return this;
        },
        setVolume: function(newVol) {
            if (!isOptionValid('volume', newVol)) {
                throw 'Invalid state' + newVol + 'for setVolume()!';
            }
            this.state.volume = newVol;
            this.audElem.volume = newVol;
            this.dispatchEvent(this.events.volumechanged());
            return this;
        },
        stop: function() {
            resetPlayer.call(this);
            return this;
        },
        playNext: function() {
            // When playNext() is invoked, even if repeat is 'off' or 'one', act as if repeat is 'on' 
            var nextMediaIndex = playlist.getNextInd.call(this, 'on', this.state.shuffle);
            playlist.setMedia.call(this, nextMediaIndex);
            this.dispatchEvent(this.events.activatemedia());
            this.state,play = 'play';
            this.audElem.play();
            return this;
        },
        playPrev: function() {
            var prevMediaIndex = playlist.getPrevInd.call(this, this.state.shuffle);
            playlist.setMedia.call(this, prevMediaIndex);
            this.dispatchEvent(this.events.activatemedia());
            this.state.play = 'play';
            this.audElem.play();
            return this;
        },
        playMedia: function(itemInd) {
            if (itemInd < 0 || itemInd >= this.playlist.length) {
                throw 'Invalid playlist index. Given index is not within limit';
            }
            playlist.setMedia.call(this, itemInd);
            this.dispatchEvent(this.events.activatemedia());
            this.state.play = 'play';
            this.audElem.play();
            return this;
        },
        init: function() {
            this.dispatchEvent(this.events.repeatchanged());
            this.dispatchEvent(this.events.shufflechanged());
            this.setVolume(this.state.volume);
            if(this.state.autoplay)
                this.play.call(this);
            return this;
        }, // EventTarget Implementation
        addEventListener: function(type, callback) {
            if (!this.events[type]) {
                throw "'" + type + "' is not a valid event type!";
            }
            if (!listeners[this.id][type]) listeners[this.id][type] = [];
            if (listeners[this.id][type].indexOf(callback) === -1) listeners[this.id][type].push(callback);
            return this;
        },
        removeEventListener: function(type, callback) {
            if (!this.events[type]) {
                throw "'" + type + "' is not a valid event type!";
            }
            if (listeners[this.id][type]) {
                var index = listeners[this.id][type].indexOf(callback);
            }
            if (!listeners[this.id][type] || index === -1) {
                throw "Given callback not registered";
            }
            listeners[this.id][type].splice(index, 1);
            return this;
        },
        dispatchEvent: function(event) {
            console.log('Event Dispatched! '+event.type);
            var type = event.type;
            if (listeners[this.id] && listeners[this.id][type]) {
                for (var i = 0; i < listeners[this.id][type].length; i++) {
                    listeners[this.id][type][i].call(this, event);
                }
            }
        },
        validOptions : {
            playlist: true,
            repeat: true,
            shuffle: true,
            volume: true,
            preload: true, 
            // Should the first item be played automatically on page load.
            autoplay: true
        },
        events : {
            // Native Events of AudioElement
            play: true,
            pause: true,
            timeupdate: true,
            canplay: true,
            canplaythrough: true,
            durationchange: true,
            loadstart: true,
            loadeddata: true,
            loadedmetadata: true,
            playing: true,
            progress: true,
            ratechange: true,
            seeked: true,
            seeking: true,
            ended: true, // Extra Events
            stop: function() {
                return new CustomEvent('stop');
            },

            /* Dispatched when for example, the next media in the playlist is activated
            Difference between 'play' and 'activatemedia' is 'play' is fired only after the media is loaded so that it can start playing whereas activatemedia is fired as soon as the next media to be played is selected */
            activatemedia: function() {
                return new CustomEvent('activatemedia');
            },
            setupcomplete: function() {
                return new CustomEvent('setupcomplete');
            },
            repeatchanged: function() {
                return new CustomEvent('repeatchanged');
            },
            shufflechanged: function() {
                return new CustomEvent('shufflechanged');
            },
            volumechanged: function() {
                return new CustomEvent('volumechanged');
            }
        }
    }
    global.ePlayer = ePlayer;
})(window);