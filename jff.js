$(document).ready(function () {
    init();
    listener = new Listener({
        events: {
            'keyup input[data-pedal-index]'  : 'changePedalSettings',
            'click button[data-pedal-index]' : 'bypassPedal',
            'click button#user-media'        : 'getUserMedia',
            'click #test'                    : 'test',
            'click #off'                     : 'stopSamples',
            'click .track-select'            : 'changeActiveBoard'
        },
        functions: {
            bypassPedal: function (event) {
                var $button    = $(event.currentTarget),
                    index      = $button.data('pedal-index'),
                    pedalboard = window.activeBoard,
                    pedal      = pedalboard.pedals[index],
                    bypass     = $button.data('bypass'),
                    settings   = { bypass: bypass };

                $button.data('bypass', !bypass);
                if (bypass) {
                    $button.removeClass('btn-success');
                } else {
                    $button.addClass('btn-success');
                }
                pedalboard.changePedalSettings(pedal, settings);
            },
            changeActiveBoard: function (event) {
                var $button = $(event.currentTarget);
                window.boards[$button.val()].hookup();
            },
            changePedalSettings: function (event) {
                var $input     = $(event.currentTarget),
                    pedalIndex = $input.data('pedal-index'),
                    pedalboard = window.activeBoard,
                    pedal      = pedalboard.pedals[pedalIndex],
                    key        = $input.prop('name'),
                    value      = (pedal[key].value === undefined) ? pedal[key] : pedal[key].value,
                    settings   = {},
                    inc        = ((value * 10) % 10 === 0) ? 1 : 0.1;

                if (event.which === 38 && inc) {
                    value += inc;
                    settings[key] = value;
                    value = (parseFloat(value) && (value * 10000) % 10000 !== 0) ? value.toFixed(4) : value;
                    $input.val(value);
                } else if (event.which === 40 && inc) {
                    value -= inc;
                    settings[key] = value;
                    value = (parseFloat(value) && (value * 10000) % 10000 !== 0) ? value.toFixed(4) : value;
                    $input.val(value);
                }
                pedalboard.changePedalSettings(pedal, settings);
            },
            getUserMedia: function (event) {
                var $button = $(event.currentTarget);

                $button.remove();
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                navigator.getUserMedia({ audio: true }, gotStream, dontGotStream);
            },
            stopSamples: function (event) {
                var $button = $(event.currentTarget);

                $button.remove();
                for (var board in window.boards) {
                    if (window.boards[board].source.stop) {
                        window.boards[board].source.stop(0);
                    }
                }
            },
            test: function () {
                console.log('test');
            }
        }
    }).delegateEvents();
});

function init() {
    var files           = [
            '/samples/guitar_1.mp3',
            '/samples/guitar_2.mp3',
            '/samples/vocal.mp3',
        ];

    window.boards       = {};
    window.AudioContext = window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.context      = new AudioContext();
    window.tuna         = new Tuna(context);
    bufferLoader        = new BufferLoader(
        context,
        files,
        finishedLoading
    );

    bufferLoader.load();

    function finishedLoading(bufferList) {
        for (var buffer in bufferList) {
            var sample    = context.createBufferSource();
            var boardName = files[buffer].split('/')[2].split('.')[0];
            sample.buffer = bufferList[buffer];
            sample.loop = true;
            new Pedalboard(sample, boardName);
            sample.start(0);
            $('#track-selector').html(_.template($('#track-selector-template').html()));
        }
        window.boards.guitar_1.hookup();
    }
}

function gotStream(stream) {
    window.mediaStreamSource = context.createMediaStreamSource(stream);
    new Pedalboard(window.mediaStreamSource, 'live');
}
function dontGotStream() {
    alert('You must allow access to an input to use use a live feed.');
}
Pedalboard = function (source, name) {
    this.source         = source;
    this.name           = name;
    this.pedals         = [];
    window.boards[name] = this;
    this.defaults = {
        Chorus: {
            rate                    : 1.5,                           // 0.01 to 8+
            feedback                : 0.2,                           // 0 to 1+
            delay                   : 0.0045,                        // 0 to 1
            bypass                  : 1                              // the value 1 starts the effect as bypassed, 0 or 1
        },
        Delay: {
            feedback                : 0.45,                          // 0 to 1+
            delayTime               : 150,                           // how many milliseconds should the wet signal be delayed?
            wetLevel                : 0.25,                          // 0 to 1+
            dryLevel                : 1,                             // 0 to 1+
            cutoff                  : 20,                            // cutoff frequency of the built in highpass-filter. 20 to 22050
            bypass                  : 1
        },
        Phaser: {
            rate                    : 1.2,                           // 0.01 to 8 is a decent range, but higher values are possible
            depth                   : 0.3,                           // 0 to 1
            feedback                : 0.2,                           // 0 to 1+
            stereoPhase             : 30,                            // 0 to 180
            baseModulationFrequency : 700,                           // 500 to 1500
            bypass                  : 1
        },
        Overdrive: {
            outputGain              : 0.7,                           // 0 to 1+
            drive                   : 1,                             // 0 to 1
            curveAmount             : 0.7,                           // 0 to 1
            algorithmIndex          : 0,                             // 0 to 5, selects one of our drive algorithms
            bypass                  : 1
        },
        Compressor: {
            threshold               : 0.5,                           // -100 to 0
            makeupGain              : 1,                             // 0 and up
            attack                  : 1,                             // 0 to 1000
            release                 : 0,                             // 0 to 3000
            ratio                   : 4,                             // 1 to 20
            knee                    : 5,                             // 0 to 40
            automakeup              : true,                          // true/false
            bypass                  : 1
        },
        Convolver: {
            highCut                 : 22050,                         // 20 to 22050
            lowCut                  : 20,                            // 20 to 22050
            dryLevel                : 1,                             // 0 to 1+
            wetLevel                : 1,                             // 0 to 1+
            level                   : 1,                             // 0 to 1+, adjusts total output of both wet and dry
            impulse                 : "impulses/impulse_rev.wav",    // the path to your impulse response
            bypass                  : 1
        },
        Filter: {
            frequency               : 20,                            // 20 to 22050
            Q                       : 1,                             // 0.001 to 100
            gain                    : 0,                             // -40 to 40
            filterType              : 0,                             // 0 to 7, corresponds to the filter types in the native filter node         : lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
            bypass                  : 1
        },
        Cabinet: {
            makeupGain              : 1,                             // 0 to 20
            impulsePath             : "impulses/impulse_guitar.wav", // path to your speaker impulse
            bypass                  : 1
        },
        Tremolo: {
            intensity               : 0.3,                           // 0 to 1
            rate                    : 0.1,                           // 0.001 to 8
            stereoPhase             : 0,                             // 0 to 180
            bypass                  : 1
        },
        WahWah: {
            automode                : true,                          // true/false
            baseFrequency           : 0.5,                           // 0 to 1
            excursionOctaves        : 2,                             // 1 to 6
            sweep                   : 0.2,                           // 0 to 1
            resonance               : 10,                            // 1 to 100
            sensitivity             : 0.5,                           // -1 to 1
            bypass                  : 1
        }
    }
    this.init();
}
$.extend(Pedalboard.prototype, {
    addPedal: function (pedal) {
        this.disconnectPedals();
        this.pedals.push(new tuna[pedal](this.defaults[pedal]));
        this.hookup();
    },
    changePedalSettings: function (pedal, settings) {
        $.each(settings, function (key, value) {

            if (pedal[key] !== undefined) {
                if (typeof(pedal[key]) === 'object') {
                    pedal[key].value = value;
                } else {
                    pedal[key] = value;
                }
            }
        });
    },
    
    disconnectPedals: function () {
        $.each(this.pedals, function (i, pedal) {
            pedal.disconnect(0);
        });
    },
    hookup: function () {
        var length    = this.pedals.length,
            template,
            pedal,
            $div,
            $row1     = $('<div class = "row"></div>'),
            $row2     = $('<div class = "row"></div>'),
            $row3     = $('<div class = "row"></div>'),
            $pedals   = $('#pedals'),
            $button;

        if (!length) return;
        $pedals.html('').append($row1).append($row2).append($row3);
        this.disconnectPedals();
        for (var i = 0; i < length; i++) {
            pedal = this.pedals[i];
            if (i === length - 1) {
                pedal.connect(context.destination);
            }
            if (i === 0) {
                this.source.connect(pedal.input);
            }
            if (i < length - 1) {
                pedal.connect(this.pedals[i + 1].input);
            }
            template = $('#pedal-template').html();
            
            $div = $('<div></div>');
            $div.html(_.template(template)({ pedal: pedal, index: i, boardName: this.name }));
            if (i < 4) {
                $row1.append($div);
            } else if (i < 8) {
                $row2.append($div);
            } else {
                $row3.append($div);
            }
        }
        window.activeBoard = this;
        $button = $('button[value="' + this.name + '"]');
        $('button.track-select').removeClass('active');
        $button.addClass('active');
    },
    init: function () {
        var self = this,
            pedals = [
            'Chorus', 'Delay', 'Phaser', 'Overdrive', 'Compressor', 'Convolver',
            'Filter', 'Cabinet', 'Tremolo', // 'WahWah' //the sweep property blows this up in FF
        ];

        $.each(pedals, function (i, pedal) {
            self.addPedal(pedal);
        });
    }
});

// Listener class
function Listener(options) {
    this.events = options.events;
    for (var func in options.functions) {
        this[func] = options.functions[func];
    }
    return this;
}
Listener.prototype.delegateEvents = function() {
    for (var event in this.events) {
        var split    = event.split(' '),
            trigger  = split[0],
            selector = split.slice(1).join(' '),
            func     = this.events[event];

        $('body').on(trigger, selector, this[func]);
    }
}

// BufferLoader class
function BufferLoader(context, urlList, callback) {
    this.context    = context;
    this.urlList    = urlList;
    this.onload     = callback;
    this.bufferList = new Array();
    this.loadCount  = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    }

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
}

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
    this.loadBuffer(this.urlList[i], i);
}
