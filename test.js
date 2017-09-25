const OH = require('.');
const Sinon = require('sinon');
const moment = require('moment');
const Chai = require('chai');
Chai.use(require('sinon-chai'));
Chai.should();

const fakeForum = {
    Post: {
        reply: () => Promise.resolve()
    },
    Topic: {
        get: (id) => Promise.resolve({
            name: id
        })
    }
};

const fakeNotification = {
    userId: 'U18MLACHZ',
    topicId: '#general',
    postId: 456
};

describe('Office Hours', () => {
    
    
    it('should be a factory', () => OH.should.be.a('function'));
    it('should return an object', () => OH(fakeForum, {}).should.be.an('object'));
    
    describe('configuration', () => {
        const config1 = {
            startOfBusiness: '7am',
            endOfBusiness: '3pm',
            sleep: '2m',
            channels: ['#general'],
            msg: 'Haha sucker!'
        };
        
        it('should accept a config', () => OH(fakeForum, config1).cfg.should.deep.equal(config1));
        it('should have a default config', () => OH(fakeForum, {}).cfg.should.deep.equal({
            startOfBusiness: '8am',
            endOfBusiness: '5pm',
            sleep: '10m',
            channels: [],
            msg: 'We are out of the office right now.'
        }));
        
        it('should merge configs', () => OH(fakeForum, {
            startOfBusiness: '4am',
            channels: ['#general'],
            msg: 'Call back later'
        }).cfg.should.deep.equal({
            startOfBusiness: '4am',
            endOfBusiness: '5pm',
            channels: ['#general'],
            sleep: '10m',
            msg: 'Call back later'
        }));
    });
    
    describe('handler', () => {
        let oot, clock;
        
        beforeEach(() => {
            oot = OH(fakeForum, {
                startOfBusiness: '7:00am',
                endOfBusiness: '3:00pm',
                sleep: '2m',
                msg: 'We are out of the office'
            });
            
            Sinon.spy(fakeForum.Post, 'reply');
        });
        
        afterEach(() => {
            if (clock) clock.restore();
            fakeForum.Post.reply.restore();
        });
        
        it('should return a promise', () => oot.handler(fakeNotification).should.be.a('Promise'));
        
        it('should ignore all bots', () => oot.handler({
            userId: undefined
        }).then(() => fakeForum.Post.reply.should.not.have.been.called));
        
        it('should not respond during office hours', () => {
            clock = Sinon.useFakeTimers(moment('2013-02-08 13:00').toDate());
            
            return oot.handler(fakeNotification).then(() => fakeForum.Post.reply.should.not.have.been.called);
        });
        
        it('should respond outside office hours', () => {
            clock = Sinon.useFakeTimers(moment('2013-02-08 16:00').toDate());
            
            return oot.handler(fakeNotification).then(() => fakeForum.Post.reply.should.have.been.called);
        });
        
        it('should reply exactly at the end of the day', () => {
            clock = Sinon.useFakeTimers(moment('2013-02-08 15:00').toDate());
            
            return oot.handler(fakeNotification).then(() => fakeForum.Post.reply.should.have.been.called);
        });
        
        it('should not reply a minute before end of day', () => {
            clock = Sinon.useFakeTimers(moment('2013-02-08 14:59').toDate());
            
            return oot.handler(fakeNotification).then(() => fakeForum.Post.reply.should.not.have.been.called);
        });
        
        it('should reply a minute before start of day', () => {
            clock = Sinon.useFakeTimers(moment('2013-02-08 06:59').toDate());
            
            return oot.handler(fakeNotification).then(() => fakeForum.Post.reply.should.have.been.called);
        });
        
        it('should not reply at start of day', () => {
            clock = Sinon.useFakeTimers(moment('2013-02-08 07:00').toDate());
            
            return oot.handler(fakeNotification).then(() => fakeForum.Post.reply.should.not.have.been.called);
        });
    });
    
    describe('whitelist', () => {
        let oot, clock;
        
        const fakeNotification_onList = {
            userId: 'U18MLACHZ',
            topicId: '#chan1',
            postId: 456
        };        
        const fakeNotification_offList = {
            userId: 'U18MLACHZ',
            topicId: '#general',
            postId: 456
        };
        
        beforeEach(() => {
            clock = Sinon.useFakeTimers(moment('2013-02-08 06:00').toDate());
            oot = OH(fakeForum, {
                startOfBusiness: '7:00am',
                endOfBusiness: '3:00pm',
                sleep: '2m',
                channels: ['#chan1'],
                msg: 'We are out of the office'
            });
            
            Sinon.spy(fakeForum.Post, 'reply');
        });
        
        afterEach(() => {
            fakeForum.Post.reply.restore();
            clock.restore();
        });
        
        it('should respond if on the whitelist', () => oot.handler(fakeNotification_onList)
            .then(() => fakeForum.Post.reply.should.have.been.called));
        
        it('should not respond if not on the whitelist', () => oot.handler(fakeNotification_offList)
            .then(() => fakeForum.Post.reply.should.not.have.been.called));
    });
});