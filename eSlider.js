/*

Structure of data:
{
    // List of all html elements created
    html: {
        container
        buffered
        completed
        track
        thumb
    },
    // Holds current state of the player. 
    * can only be set once through the constructor.

        value
        percent
        buffValue
        max
        orientation*
        drag

    // Callback function to be executed when slider value is changed.
    onChange
}
*/

/* ---- CustomEvent constructor Polyfill for IE9---- */
(function () {

    if ( typeof window.CustomEvent === "function" ) return false;

    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();
/* ---- CustomEvent constructor Polyfill for IE9---- */

(function (global) {

    'use strict';

    var
        eSlider = function (id, options) {
            return new eSlider.init(id, options);
        },

        // List of all valid options
        validOptions = [
            'max',
            'value',
            'orientation'
        ],

        events = {
            //Example: Mouse down on slider
            changestart: function(){
                return new CustomEvent('changestart');  
            },
            //Example: Mouse drag on slider
            change: function(){
                return new CustomEvent('change');
            },
            //Example: Mouse down on slider after drag
            changeend: function(){
                return new CustomEvent('changeend');
            }
        },

        idCount = 1,
        
        ids = [],
        
        // Holds references to callbacks for events
        listeners = {}        
    ;

    // Actual constructor
    // eSlider() calls eSlider.init() so that users don't have to use 'new' to create a slider.
    eSlider.init = function (id, options) {
        // id can be either an id or an html element
        if(!id || ( typeof id !== 'string' && !id.nodeType )){
            throw "Invalid id!"
            return;
        }
        
        // Create entry for this player
        if(!ids[idCount]){
            this.id=idCount;
            ids[idCount]=true;
            idCount++;
        }

        this.html = {};
        
        if(typeof id === 'string'){
            var el = document.getElementById(id);
            if(el){
                this.html.track = el;
            }
            else{
                throw "No element found with id: "+id
                return;
            }
        }
        else if(id.nodeType){
            this.html.track = id;
        }
        
        // Validate and set options
        setOptions.call(this, options);
        
        // Initialize drag status to false
        this.dragState = false;
        
        listeners[this.id] = {};
        
        // Set Default EventListeners
        setDefaultEventListeners.call(this);
    };

    // Validate and set options from the constructor
    function setOptions(options){
        
        // If options is not an object assign a new object to it
        if(!options || typeof options !== 'object'){
            throw "Expected type of 'options': object. Creating slider with default options";
            options = {};
        }
        
        var newOptions={};
        for(var thisOption in options){
            if(options.hasOwnProperty(thisOption)){
                newOptions[thisOption] = options[thisOption];
            }
        }

        // Remove invalid options from newOptions
        for(var thisOption in newOptions){
            if(newOptions.hasOwnProperty(thisOption)){
                if(!isOptionValid(thisOption)){
                    throw "Invalid option: '"+thisOption+"'. Option ignored";
                    delete newOptions[thisOption];
                }
            }
        }

        // If an option doesn't exist or type doesn't match set it to defaults 
        if(!newOptions.max || typeof newOptions.max !== 'number'){
            newOptions.max = 100;
        }
        if(!newOptions.value || typeof newOptions.value !== 'number'){
            newOptions.value = 0;
        }      
        if(!newOptions.orientation || !(newOptions.orientation === 'h' || newOptions.orientation === 'v') ){
            newOptions.orientation = 'h';
        }
        
        // Add validated options to and 'this'
        for(var thisOption in newOptions){
            if(newOptions.hasOwnProperty(thisOption)){
                this[thisOption] = newOptions[thisOption];
            }
        }
        
        // Set initial percent
        this.percent = (this.value / this.max) * 100;

        var pos = this.html.track.getBoundingClientRect();
        if(this.orientation === 'h' && pos.width > 0){
            this.pixelOffset = ( this.percent / 100 ) * pos.width;
        }
        else if(this.orientation === 'v' && pos.height > 0){
            this.pixelOffset = ( this.percent / 100 ) * pos.height;
        }
    }

    // Checks if an option is valid (Checks in 'validOptions')
    function isOptionValid(option){
        for( var i = 0; i < validOptions.length; i++){
            if(validOptions[i] === option){
                return true;
            }
        }
        return false;
    }

    // Get pixel offset of a mouse event relative to track
    function getOffset(ev, pos){
        var offset;
        if(this.orientation === 'h') {
            if(ev.clientX < pos.left)
                offset = 0;
            else if(ev.clientX > pos.right)
                offset = pos.width;
            else
                offset = ev.clientX - pos.left;
        }
        else if(this.orientation === 'v'){
            if(ev.clientY > pos.bottom)
                offset = 0;
            else if(ev.clientY < pos.top)
                offset = pos.height;
            else
                offset = pos.bottom - ev.clientY;
        }
        return offset;
    }

    // Set thumb's position to coordinates specified by a mouse event object and update the value accordingly.
    // It uses getOffset() and setThumbToPer()
    function setValFromEvent(ev){
        var pos = this.html.track.getBoundingClientRect(),
            offset,
            fraction,
            percent
        ;

        // If slider is hidden ex: display:none, return
        if(pos.height <= 0 || pos.width <=0)
            return;

        offset = getOffset.call(this, ev, pos);
        fraction = offset / pos[(this.orientation==='h')?'width':'height'];
        this.pixelOffset =  offset;
        this.percent = fraction * 100;
        this.value = fraction * this.max;
    }

    // MouseMove's event listener attached to track
    function mouseMoveListener(ev){
        setValFromEvent.call(this, ev);
        this.dispatchEvent(events.change());
    }

    // MouseMove's event listener attached to window
    function mouseUpListener(ev){
        setValFromEvent.call(this, ev);
        this.dispatchEvent(events.changeend());
    }

    // Set default event listeners
    function setDefaultEventListeners(){

        var self = this
        //    , global = document.querySelector('body')
        ;

        // On mousedown, listen for 'mouseup' and 'mousemove' events and update thumb position. 
        // On mousedown, remove 'mouseup' and 'mousemove' listeners.
        this.html.track.addEventListener(
            'mousedown',
            function (event) {
                self.dispatchEvent(events.changestart());
                self.dragState = true;
                global.addEventListener('mouseup', mouseUpListenerWrapper);
                global.addEventListener('mousemove', mouseMoveListenerWrapper);
            }
        );

        // Use wrappers to make 'this' point to the eSlider object.
        function mouseUpListenerWrapper(event){
            self.dragState = false;
            // Remove 'mousemove' listener
            global.removeEventListener('mousemove', mouseMoveListenerWrapper);
            // Call actual mouseUpListener
            mouseUpListener.call(self, event);
            // Remove 'mouseup' listener
            global.removeEventListener('mouseup', mouseUpListenerWrapper);
        }
        
        function mouseMoveListenerWrapper(event){
            mouseMoveListener.call(self, event);
        }        
    }

    // Prototype of objects created by eSlider.init()
    eSlider.init.prototype = eSlider.prototype = {

        setMax: function (max) {
            if(typeof max !== 'number'){
                throw "Invalid argument type for setMax(). Expected 'number' type!";
                return;
            }
            this.max = max;
        },
        init: function () {
            // Fire first change event;
            this.dispatchEvent(events.change());
            return this;
        },
        // EventTarget Implementation
        addEventListener: function(type, callback){
            if(!events[type]){
                throw "'"+type+"' is not a valid event type!";
                return;
            }
            if(!listeners[this.id][type])
                listeners[this.id][type] = [];
            if(listeners[this.id][type].indexOf(callback) === -1)
                listeners[this.id][type].push(callback);
            return this;
        },
        removeEventListener: function(type, callback){
            if(!events[type]){
                throw "'"+type+"' is not a valid event type!";
                return;
            }
            if(listeners[this.id][type]){
                var index = listeners[this.id][type].indexOf(callback);
            }
            if(!listeners[this.id][type] || index === -1){
                throw "Given callback not registered";
                return;
            }
            listeners[this.id][type].splice(index, 1);
            return this;
        },
        dispatchEvent: function(event){
            var type = event.type;
            if(listeners[this.id][type]){
                for(var i=0; i<listeners[this.id][type].length; i++){
                    listeners[this.id][type][i].call(this, event);
                }
            }
        }
    };

    global.eSlider = eSlider;
    //ePlayer.eSlider = eSlider;

}(window));