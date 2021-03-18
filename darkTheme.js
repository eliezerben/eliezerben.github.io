/*
    THINGS TO WORK ON:
    
    The first song is skipped after pausing and resuming.
    
    Problem when play is pressed after player is reset
    
    Problems when both repeat and shuffle are on. Shuffle has no effect (Cannot reproduce this behaviour anymore. It might have been a coincidence)
    
    When fastForward is pressed, even though repeat is off, when shuffle is on, media is repeated i.e already played items are played again.(Intended - Might need to fine tune)
*/

/*

options: {
    
    next,
    previous,
    play,
    seekBar,
    curTime,
    totTime,
    repeat,
    shuffle,
    volume,
    playlist,
    preload,
    autoplay,
}

*/

(function(global){

    var 
        // Wrapper to eliminate the need to use 'new' everytime a player has to be created.
        darkTheme = function (id, options, playlist) {
            return new darkTheme.init(id, options, playlist);
        },

        // List of all valid controls
        optionsList = {
            playlist: true,
            previous: true,
            next: true,
            play: true,
            curTime: true,
            seekBar: true,
            totTime: true,
            repeat: true,
            shuffle: true,
            volume: true,
            preload: true,
            autoplay: true
        },
        
        // List of data roles used by html elements ('data-ep-role' attribute values)
        dataRolesList = [
            'controls',
            'fastRewind',
            'fastForward',
            'play',
            'curTime',
            'seekSlider',
            'seekComp',
            'seekTrack',
            'totTime',
            'repeat',
            'shuffle',
            'volume',
            'volSlider',
            'volComp',
            'volTrack',
            'playlist'
        ],
        
        // Properties of all controls
        controlProps = {},
        
        // Properties of playlist Items
        playlistProps = {},
        
        // Holds list of ids of already created instances
        ids = {}

     /*These are not used currently.
        // Stores setInterval ids used for buffer progress update
        buffId = {},
        
        // Holds data relevant to a specific instance
        data = {}
    */

    ;

    controlProps.isStateValid = function(control, state){
        if(control === 'volume'){
            if(typeof state === 'number' && state>=0 && state<=1)
                return true;
        }
        if(controlProps[control].states.hasOwnProperty(state)){
            return true;
        }
        else{
            //throw "Invalid state: '"+state+"' for control: '"+control+"'";
            return false;
        }
    };

    // Initialise player
    darkTheme.init = function(id, options, playlist){

        if(ids[id]){
            throw 'An player instance already exists with this id: '+id;
            return;
        }
        this.id = id;
        this.html = {};
        this.recs = {};
        
        setHtml.call(this);
        
        var ePlayerOpt = {};
        setOptions.call(this, options, ePlayerOpt, playlist);
        this.api = ePlayer(ePlayerOpt);
        
        initControls.call(this);
        
        setPlaylist.call(this);
        
        setViewEvents.call(this);
        
        setControlEvents.call(this);
        setSeekSliderEvents.call(this);
        setVolSliderEvents.call(this);
        setPlaylistEvents.call(this);
        
        this.api.init();
        this.volSlider.init();
        this.seekSlider.init();
        
    }

    function setHtml(){
        this.html.player = document.getElementById(this.id);
        var playerHtml = this.html.player;
        for(var i=0; i<dataRolesList.length; i++){
            this.html[dataRolesList[i]]=playerHtml.querySelector('[data-ep-role='+dataRolesList[i]+']');
        }
    }
    
    function setPlaylist(){
        this.html.playlistList=[];
        var len = this.api.playlist.length;
        for(var i=0; i<len; i++){
            var plElem = createElem('li', null, playlistProps.listItem.states.normal.class);
            plElem.setAttribute('data-ep-role', 'pl'+i);
            //plElem.setAttribute('data-ep-itemActive', 'false');
            plElem.innerHTML = this.api.playlist[i].name;
            this.html.playlistList[i]=plElem;
            this.html.playlist.appendChild(plElem);
        }
    }
    
    function setOptions(options, epOp, playlist){

        if(typeof options != 'object'){
            throw 'Type of options is invalid!. Using default Options';
            options = {};
        }

        for(var opt in options){
            if(!options.hasOwnProperty(opt))
                continue;
            if(!optionsList[opt]){
                throw 'Invalid option: '+opt+'!';
                return;
            }
        }

        this.controls = {};
        this.controls.previous = this.html.previous ? true : false;
        this.controls.play = this.html.play ? true : false;
        this.controls.next = this.html.next ? true : false;
        this.controls.curTime = this.html.curTime ? true : false;
        this.controls.seekSlider = this.html.seekBar ? true : false;
        this.controls.totTime = this.html.totTime ? true : false;
        this.controls.playlist = options.playlist ? true : false;
        this.controls.repeat = this.html.repeat ? true : false;
        this.controls.shuffle = this.html.shuffle ? true : false;
        this.controls.volume = this.html.volume ? true : false;
        /*  /--- ePlayer Api options ---/
            playlist: false,
            repeat: 'off',
            shuffle: 'off',
            volume: 0.5,
            preload: 'metadata',
            autoplay: true,        
        */
        if(options.repeat!==undefined)
            epOp.repeat=options.repeat;
        if(options.shuffle!==undefined)
            epOp.shuffle=options.shuffle;
        if(options.volume!==undefined)
            epOp.volume=options.volume;
        if(options.preload!==undefined)
            epOp.preload=options.preload;
        if(options.autoplay!==undefined)
            epOp.autoplay=options.autoplay;
        epOp.playlist = playlist;
    }
    
    function initControls(){
        for(var i=0; i<dataRolesList.length; i++){
            if(!controlProps.hasOwnProperty(dataRolesList[i]))
                continue;
            if(controlProps[dataRolesList[i]].init){
                controlProps[dataRolesList[i]].init.call(this);
            }
        }
    }
    
    // Create elements with given id and class
    function createElem(type, id, cl){
        var elem = document.createElement(type);
        if(id)
            elem.setAttribute('id', id);
        if(cl)
            elem.setAttribute('class', cl);
        return elem;
    }

// ---- Play ----
    controlProps.play = {
        defState: 'pause',
        states: {
            pause: {
                class: 'ep-dt-controlIcon ep-dt-play',
            },
            play: {
                class: 'ep-dt-controlIcon ep-dt-pause'
            }
        },
        setState: function(state){
            if(!controlProps.isStateValid('play', state)){
                return;
            }
            this.html.play.setAttribute('class', controlProps.play.states[state].class);
        }
    };

// ---- Fast Forward ----
    controlProps.fastForward = {
        states: {
            fastForward: {
                class: 'ep-dt-controlIcon ep-dt-fastForward',
            },
        },
        setState: function(state){
        }
    };
    
// ---- Fast Rewind ----
    controlProps.fastRewind = {
        states: {
            fastRewind: {
                class: 'ep-dt-controlIcon ep-dt-fastRewind',
            },
        },
        setState: function(state){
        }
    };
    
// ---- Current Time ----
    controlProps.curTime = {
        states: {
            curTime: {
                class: 'ep-dt-curTime'
            }
        },
        reset: function(){
            this.html.curTime.innerHTML='00:00';
        }
    };

// ---- Seek Slider ----
    controlProps.seekSlider = {
        states: {
            slider: {
                class: null
            }
        },
        init: function(){
            //Make seek slider using eSlider library
            this.seekSlider = eSlider( this.html.seekTrack, {
                max: 0,
                value: 0,
                orientation: 'h'
            });
        }
    };

// ---- Total Time ----
    controlProps.totTime = {
        states: {
            totTime: {
                class: 'ep-dt-totTime'
            }
        },
        reset: function(){
            this.html.totTime.innerHTML='00:00';
        }
    };

// ---- Shuffle ----
    controlProps.shuffle = {
        states: {
            on: {
                class: 'ep-dt-controlIcon ep-dt-shuffleOn'
            },
            off: {
                class: 'ep-dt-controlIcon ep-dt-shuffleOff'
            }
        },
        setState: function(state){
            if(!controlProps.isStateValid('shuffle', state)){
                return;
            }
            this.html.shuffle.setAttribute('class', controlProps.shuffle.states[state].class);                    
        },
        getNextState: function(current){
            if(current==='on')
                return 'off';
            else if(current==='off')
                return 'on';
        },
        init: function(){
        }
    };

// ---- Repeat ----
    controlProps.repeat = {
        states: {
            on: {
                class: 'ep-dt-controlIcon ep-dt-repeatOn'
            },
            one: {
                class: 'ep-dt-controlIcon ep-dt-repeatOne'
            },
            off: {
                class: 'ep-dt-controlIcon ep-dt-repeatOff'
            }
        },
        setState: function(state){
            if(!controlProps.isStateValid('repeat', state)){
                return;
            }
            this.html.repeat.setAttribute('class', controlProps.repeat.states[state].class);
        },
        getNextState: function(current){
            if(current==='on')
                return 'one';
            else if(current==='one')
                return 'off';
            else if(current==='off')
                return 'on';
        },
        init: function(){

        }
    };

// ---- Volume ----
    controlProps.volume = {
        defState: 'full',
        states: {
            full: {
                class: 'ep-dt-controlIcon ep-dt-volumeFull'
            },
            mid: {
                class: 'ep-dt-controlIcon ep-dt-volumeMid'
            },
            low: {
                class: 'ep-dt-controlIcon ep-dt-volumeLow'
            },
            mute: {
                class: 'ep-dt-controlIcon ep-dt-volumeMute'
            },
        },
        init: function(initState){
            var self=this;
            // Create volume slider using eSlider library
            this.volSlider = eSlider(this.html.volTrack, {
                max: 1,
                value: self.api.state.volume,
                orientation: 'h'
            });
            this.recs.prevVolume = 0;
        },
        getStateForVal: function(val){
            if(val === 0)
                return 'mute';
            else if(val > 0 && val <= 0.333)
                return 'low';
            else if(val > 0.333 && val <= 0.666)
                return 'mid';
            else if(val > 0.666 && val <= 1)
                return 'full';
            else
                throw 'Volume cannot be less than 0 or greater than 1';
        },
        setState: function(state){
            if(!controlProps.isStateValid('volume', state)){
                return;
            }
            this.html.volume.setAttribute('class', controlProps.volume.states[controlProps.volume.getStateForVal(state)].class);
        }
    };

    playlistProps.listItem = {
        states: {
            normal: {
                class: 'ep-dt-playlistItem'
            },
            active: {
                class: 'ep-dt-playlistItem ep-dt-playlistItemActive'
            }
        }
    };

    function addPlaylistDom(){
        this.playlistDom = {};
        this.playlistDom.playlistContainer = createElem('ol', this.id+'_playlist', 'darkThemePlaylist');
        this.playerDom.appendChild(this.playlistDom.playlistContainer);
        this.playlistDom.listDom = [];
        for(var item=0; item<this.playlist.list.length; item++){
            var itemElem = createElem('li', this.id+'_pl_item_'+item, 'darkThemePlaylistItem');
            itemElem.epId = item;
            this.playlistDom.listDom.push(itemElem);
            itemElem.innerHTML = this.playlist.list[item].name;
            this.playlistDom.playlistContainer.appendChild(itemElem);
        }
    }

    function setControlEvents(){
        
        var self = this;
        
        console.log(this.api);
        
        // --- play ---
        this.api.addEventListener('activatemedia', function(){
            controlProps.play.setState.call(self, 'play');
        })
        
        this.api.addEventListener('play', function(){
            controlProps.play.setState.call(self,'play');
        });
        
        this.api.addEventListener('pause', function(){
            controlProps.play.setState.call(self,'pause');
        });
        
        // --- Current Time ---
        this.api.addEventListener('timeupdate', function(){
            self.html.curTime.innerHTML = self.api.state.curMedia.curMin+':'+self.api.state.curMedia.curSec;
        });
        
        // --- Total Time ---
        this.api.addEventListener('loadedmetadata', function(){
            self.html.totTime.innerHTML = self.api.state.curMedia.durMin+':'+self.api.state.curMedia.durSec;
            self.seekSlider.setMax(self.api.state.curMedia.duration);
        });
        
        this.api.addEventListener('repeatchanged', function(){
            controlProps.repeat.setState.call(self, self.api.state.repeat);
        });
        
        this.api.addEventListener('shufflechanged', function(){
            controlProps.shuffle.setState.call(self, self.api.state.shuffle);
        });
        
        this.api.addEventListener('volumechanged', function(){
            controlProps.volume.setState.call(self, self.api.state.volume);
            self.html.volComp.style.width = self.api.state.volume*100 + '%';
        });
        
        this.api.addEventListener('stop', function(){
            self.html.seekComp.style.width = '0%';
            controlProps.curTime.reset.call(self);
            controlProps.totTime.reset.call(self);
        });
    }

    function setViewEvents(){
        var self = this;
        
        this.html.play.addEventListener('click', function(){
            self.api.togglePlay();
        });
        
        this.html.repeat.addEventListener('click', function(){
            self.api.setRepeat(controlProps.repeat.getNextState(self.api.state.repeat));
        });
        
        this.html.shuffle.addEventListener('click', function(){
            self.api.setShuffle(controlProps.shuffle.getNextState(self.api.state.shuffle));
        });
        
        this.html.volume.addEventListener('click', function(){
            var vol = 0;
            if(self.api.state.volume == 0)
                vol = (self.recs.prevVolume<0.333) ? 0.333 : self.recs.prevVolume;
            else
                self.recs.prevVolume = self.api.state.volume;
            
            self.api.setVolume(vol);
        });
        
        this.html.fastForward.addEventListener('click', function(){
            
            self.api.playNext();
        });
        
        this.html.fastRewind.addEventListener('click', function(){
            self.api.playPrev();
        });
    }
    
    function setSeekSliderEvents(){
        var self=this;
        this.api.addEventListener('timeupdate', function(){
            if(!self.seekSlider.dragState)
                self.html.seekComp.style.width = self.api.state.curMedia.curTime/self.api.state.curMedia.duration * 100 + '%';
        });
        
        this.seekSlider.addEventListener('change', function(){
            self.html.seekComp.style.width = self.seekSlider.percent + '%';
        });
        
        this.seekSlider.addEventListener('changeend', function(){
            self.html.seekComp.style.width = self.seekSlider.percent + '%';
            self.api.seek(self.seekSlider.value);
        });
    }
    
    function setVolSliderEvents(){
        var self = this;
        
        function changeCommon(){
            self.html.volComp.style.width = self.volSlider.percent + '%';
            self.api.setVolume(self.volSlider.value);
        }
        
        this.volSlider.addEventListener('change', changeCommon);
        this.volSlider.addEventListener('changeend', changeCommon);
    }
    
    function setPlaylistEvents(){
        var self = this;
        this.html.playlist.addEventListener('click', function(event){
            var itemRole = event.target.getAttribute('data-ep-role');
            var match = /pl(\d+)/.exec(itemRole);
            if(match){
                self.api.playMedia(Number(match[1]));
            }
        });
        
        this.api.addEventListener('activatemedia', function(){
            //Resetting style of previous item to normal;
            var prev = self.html.playlist.querySelector('[data-ep-itemActive=true]');
            if(prev){
                prev.setAttribute('class', playlistProps.listItem.states.normal.class);
                prev.removeAttribute('data-ep-itemActive');
            }
            //Changing style of current item to active;
            var item = self.html.playlistList[self.api.state.curMedia.id];
            item.setAttribute('class', playlistProps.listItem.states.active.class);
            item.setAttribute('data-ep-itemActive', 'true');
        });
                
        this.api.addEventListener('stop', function(){
            //Resetting style of previous item to normal;
            var prev = self.html.playlist.querySelector('[data-ep-itemActive=true]');
            if(prev){
                prev.setAttribute('class', playlistProps.listItem.states.normal.class);
                prev.removeAttribute('data-ep-itemActive');
            }
        });
    }
    
    ePlayer.darkTheme = darkTheme;

})(window);

/* Sample HTML

    <div id='p1' class='ep-dt-container' >
        <div data-ep-role='controls' class='ep-dt-controls'>
            <div data-ep-role='fastRewind' class='ep-dt-controlIcon ep-dt-fastRewind'></div>
            <div data-ep-role='play' class='ep-dt-controlIcon ep-dt-play'></div>
            <div data-ep-role='fastForward' class='ep-dt-controlIcon ep-dt-fastForward'></div>
            <p data-ep-role='curTime' class='ep-dt-curTime'>00:00</p>
            <div data-ep-role='seekSlider' class='ep-dt-seekSlider'>
                <div data-ep-role='seekComp' class='ep-dt-seekComp'></div>
                <div data-ep-role='seekTrack' class='ep-dt-seekTrack'></div>
            </div>
            <p data-ep-role=totTime class='ep-dt-totTime'>00:00</p>
            <div data-ep-role='repeat' class='ep-dt-controlIcon ep-dt-repeatOff'></div>
            <div data-ep-role='shuffle' class='ep-dt-controlIcon ep-dt-shuffleOff'></div>
            <div data-ep-role='volume' class='ep-dt-controlIcon ep-dt-volumeFull'></div>
            <div data-ep-role='volSlider' class='ep-dt-volSlider'>
                <div data-ep-role='volComp' class='ep-dt-volComp'></div>
                <div data-ep-role='volTrack' class='ep-dt-volTrack'></div>
            </div>
        </div>
        <ol data-ep-role='playlist' class='ep-dt-playlist'></ol>
    </div>
    
*/