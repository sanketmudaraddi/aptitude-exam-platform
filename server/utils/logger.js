// logger.js
const winston = require('winston');

// Create a custom log format
const logFormat = winston.format.combine(
  winston.format.colorize(),  // Colorizes the logs in the console
  winston.format.simple()     // Outputs simple log format (level: message)
);

// Create a logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',  // Default level is 'info', can be overridden with env variable
  format: logFormat,
  transports: [
    // Console log transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()  // Output simple log format with colors
      )
    }),
    // File log transport for logging to app.log file
    new winston.transports.File({
      filename: 'app.log',
      level: 'info',  // Logs at 'info' level or higher will be logged to the file
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()  // Output logs as JSON for better structure and analysis
      )
    })
  ]
});

module.exports = logger;
