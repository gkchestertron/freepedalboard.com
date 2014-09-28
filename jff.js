$(document).ready(function () {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    navigator.getUserMedia({ audio: true }, gotStream, dontGotStream);

    $('body').on('keyup', 'input[data-pedal-index]', function (event) {
        var $input     = $(event.currentTarget),
            pedalIndex = $input.data('pedal-index'),
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
    });

    $('body').on('click', 'button[data-pedal-index]', function (event) {
        var $button  = $(event.currentTarget),
            index    = $button.data('pedal-index'),
            pedal    = pedalboard.pedals[index],
            bypass   = $button.data('bypass'),
            settings = { bypass: bypass };

        $button.data('bypass', !bypass);
        if (bypass) {
            $button.removeClass('btn-success');
        } else {
            $button.addClass('btn-success');
        }
        pedalboard.changePedalSettings(pedal, settings);
    });
});

function gotStream(stream) {
    var pedals = [
        'Chorus',
        'Delay',
        'Phaser',
        'Overdrive',
        'Compressor',
        'Convolver',
        'Filter',
        'Cabinet',
        'Tremolo',
        'WahWah'
    ];

    window.AudioContext      = window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.context           = new AudioContext();
    window.tuna              = new Tuna(context);
    pedalboard               = new Pedalboard();
    window.mediaStreamSource = context.createMediaStreamSource(stream);
    $.each(pedals, function (i, pedal) {
        pedalboard.addPedal(pedal);
    });

}

function dontGotStream() {
    alert('Web Audio not supported in your browser. Please Download the latest Chrome or FireFox.');
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
                if (typeof(pedal[key]) === 'object') {
                    pedal[key].value = value;
                } else {
                    pedal[key] = value;
                }
            }
        });
    },
    defaults : {
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
            $row1 = $('<div class="row"></div>'), 
            $row2 = $('<div class="row"></div>'), 
            $row3 = $('<div class="row"></div>'),
            $pedals = $('#pedals');

        if (!length) return;
        $pedals.html('').append($row1).append($row2).append($row3);
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
            if (i < 4) {
                $row1.append($div);
            } else if (i < 8) {
                $row2.append($div);
            } else {
                $row3.append($div);
            }
        }
    },
    pedals: []
});
