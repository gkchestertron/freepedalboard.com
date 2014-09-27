$(document).ready(function () {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    navigator.getUserMedia({ audio: true }, gotStream, dontGotStream);
    $('body').on('change', 'input[data-pedal-index]', function (event) {
        var $input     = $(event.currentTarget),
            pedalIndex = $input.data('pedal-index'),
            pedal      = pedalboard.pedals[pedalIndex],
            key        = $input.prop('name'),
            value      = $input.val();

        pedalboard.changePedalSettings(pedal, { key: value });
    });
});

function gotStream(stream) {
    window.AudioContext      = window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.context           = new AudioContext();
    window.tuna              = new Tuna(context);
    pedalboard               = new Pedalboard();
    window.mediaStreamSource = context.createMediaStreamSource(stream);
}

function dontGotStream() {
    alert('Get a real Web Browser, moron');
}

Pedalboard = function () {};
$.extend(Pedalboard.prototype, {
    addPedal: function (pedal) {
        this.disconnectPedals();
        this.pedals.push(new tuna[pedal](this.defaults[pedal]));
        this.hookup();
    },
    changePedalSettings: function (pedal, settings) {
        $.each(settings, function (key, value) {

            if (pedal[key] !== undefined) {
                pedal[key] = value;
            }
        });
    },
    defaults : {
        Chorus: {
            rate                    : 1.5,                           // 0.01 to 8+
            feedback                : 0.2,                           // 0 to 1+
            delay                   : 0.0045,                        // 0 to 1
            bypass                  : 0                              // the value 1 starts the effect as bypassed, 0 or 1
        },
        Delay: {
            feedback                : 0.45,                          // 0 to 1+
            delayTime               : 150,                           // how many milliseconds should the wet signal be delayed?
            wetLevel                : 0.25,                          // 0 to 1+
            dryLevel                : 1,                             // 0 to 1+
            cutoff                  : 20,                            // cutoff frequency of the built in highpass-filter. 20 to 22050
            bypass                  : 0
        },
        Phaser: {
            rate                    : 1.2,                           // 0.01 to 8 is a decent range, but higher values are possible
            depth                   : 0.3,                           // 0 to 1
            feedback                : 0.2,                           // 0 to 1+
            stereoPhase             : 30,                            // 0 to 180
            baseModulationFrequency : 700,                           // 500 to 1500
            bypass                  : 0
        },
        Overdrive: {
            outputGain              : 0.7,                           // 0 to 1+
            drive                   : 1,                             // 0 to 1
            curveAmount             : 0.7,                           // 0 to 1
            algorithmIndex          : 0,                             // 0 to 5, selects one of our drive algorithms
            bypass                  : 0
        },
        Compressor: {
            threshold               : 0.5,                           // -100 to 0
            makeupGain              : 1,                             // 0 and up
            attack                  : 1,                             // 0 to 1000
            release                 : 0,                             // 0 to 3000
            ratio                   : 4,                             // 1 to 20
            knee                    : 5,                             // 0 to 40
            automakeup              : true,                          // true/false
            bypass                  : 0
        },
        Convolver: {
            highCut                 : 22050,                         // 20 to 22050
            lowCut                  : 20,                            // 20 to 22050
            dryLevel                : 1,                             // 0 to 1+
            wetLevel                : 1,                             // 0 to 1+
            level                   : 1,                             // 0 to 1+, adjusts total output of both wet and dry
            impulse                 : "impulses/impulse_rev.wav",    // the path to your impulse response
            bypass                  : 0
        },
        Filter: {
            frequency               : 20,                            // 20 to 22050
            Q                       : 1,                             // 0.001 to 100
            gain                    : 0,                             // -40 to 40
            filterType              : 0,                             // 0 to 7, corresponds to the filter types in the native filter node         : lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
            bypass                  : 0
        },
        Cabinet: {
            makeupGain              : 1,                             // 0 to 20
            impulsePath             : "impulses/impulse_guitar.wav", // path to your speaker impulse
            bypass                  : 0
        },
        Tremolo: {
            intensity               : 0.3,                           // 0 to 1
            rate                    : 0.1,                           // 0.001 to 8
            stereoPhase             : 0,                             // 0 to 180
            bypass                  : 0
        },
        Wahwah: {
            automode                : true,                          // true/false
            baseFrequency           : 0.5,                           // 0 to 1
            excursionOctaves        : 2,                             // 1 to 6
            sweep                   : 0.2,                           // 0 to 1
            resonance               : 10,                            // 1 to 100
            sensitivity             : 0.5,                           // -1 to 1
            bypass                  : 0
        }
    },
    disconnectPedals: function () {
        $.each(this.pedals, function (i, pedal) {
            pedal.disconnect(0);
        });
    },
    hookup: function () {
        var length = this.pedals.length,
            template,
            pedal,
            $div,
            $pedals = $('#pedals');

        $pedals.html('');
        if (!length) return;
        this.disconnectPedals();
        for (var i = 0; i < length; i++) {
            pedal = this.pedals[i];
            if (i === length - 1) {
                pedal.connect(context.destination);
            }
            if (i === 0) {
                window.mediaStreamSource.connect(pedal.input);
            }
            if (i < length - 1) {
                pedal.connect(this.pedals[i + 1].input);
            }
            template = $('#pedal-template').html();
            
            $div = $('<div></div>');
            $div.html(_.template(template)({ pedal: pedal, index: i }));
            $pedals.append($div);
        }
    },
    pedals: []
});
