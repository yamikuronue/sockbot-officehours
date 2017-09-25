const moment = require('moment');

const defaultConfig = {
    startOfBusiness: '8am',
    endOfBusiness: '5pm',
    sleep: '10m',
    channels: [],
    msg: 'We are out of the office right now.'
}

/**
 * Plugin generation function.
 *
 * Returns a plugin object bound to the provided forum provider
 *
 * @param {Provider} forum Active forum Provider
 * @param {object|Array} config Plugin configuration
 * @returns {Plugin} An instance of the OfficeHours plugin
 */
module.exports = function officeHours(forum, cfg) {
   
   const config = {
       startOfBusiness: cfg.startOfBusiness || defaultConfig.startOfBusiness,
       endOfBusiness: cfg.endOfBusiness || defaultConfig.endOfBusiness,
       sleep: cfg.sleep || defaultConfig.sleep,
       channels: cfg.channels || defaultConfig.channels,
       msg: cfg.msg || defaultConfig.msg
   };
   const timeFormats  = ['h:m a', 'h:ma', 'H:m'];

    /**
     * Handle a mention notification.
     *
     * Choose a random message and reply with it
     *
     * @param {Notification} notification Notification event to handle
     * @returns {Promise} Resolves when event is processed
     */
    function handler(notification) {
        //Ignore bots and myself
        if (notification.userId == forum.username || !notification.userId) {
            return Promise.resolve();
        }
        
        //Stay silent during business hours
        if (moment().isBetween(moment(config.startOfBusiness, timeFormats), moment(config.endOfBusiness, timeFormats), null, '[)')) {
            return Promise.resolve();
        }
        
        //Whitelisting
        if (config.channels.length > 0) {
            return forum.Topic.get(notification.topicId).then((topic) => {
                if (config.channels.indexOf(topic.name) <= -1) {
                    return Promise.resolve();
                }
                
                return respond(notification);
            });
        }
        
        //If we haven't blocked, respond.
        return respond(notification);
    }
    
    function respond(notification) {
        return forum.Post.reply(notification.topicId, notification.postId, config.msg);
    }

    /**
     * Activate the plugin
     */
    function activate() {
        forum.on('notification', handler);
    }

    /**
     * Deactivate the plugin
     */
    function deactivate() {
        forum.off('notification', handler);
    }

    return {
        activate: activate,
        deactivate: deactivate,
        handler: handler,
        cfg: config
    };
};