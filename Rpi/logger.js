var winston = require('winston');

const time=function(){
    return new Date(Date.now()).toString();
}

const myFormat = function (options) {
    return options.timestamp() + ' ' +
        winston.config.colorize(options.level, options.level.toUpperCase()) + ': ' +
        (options.message ? options.message : '');
}


const customlevel={
    levels:{
        error:0,
        warn:1,
        debug:2,
        verbose:3
    },
    colors:{
        error:'red',
        warn:'yellow',
        debug:'blue',
        verbose:'green'
    }
}

var logger = new (winston.Logger)({

    levels:customlevel.levels,
    transports: [
        new (winston.transports.File)({
            name: 'error',
            filename: './logs/error.log',
            level: 'error',
            json: false,
            timestamp:time,
            formatter: myFormat

        }),
        new (winston.transports.File)({
            name: 'warn',
            filename: './logs/warn.log',
            level: 'warn',
            json: false,
            timestamp:time,
            formatter: myFormat
        }),
        new (winston.transports.File)({
            name: 'verbose',
            filename: './logs/verbose.log',
            level: 'verbose',
            json: false,
            timestamp:time,
            formatter: myFormat
        }),
        new (winston.transports.File)({
            name: 'debug',
            filename: './logs/debug.log',
            level: 'debug',
            timestamp:time,
            json: false,
            formatter: myFormat
        }),
    ]
});


module.exports = logger;

