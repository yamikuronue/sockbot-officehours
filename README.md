# sockbot-officehours

Office Hours plugin for sockbot

## Usage
_This plugin requires [SockBot](https://github.com/SockDrawer/SockBot)_

1. Create a config file, like:
```
---
core:
  provider: sockbot-slack
  username: sockbot
  password: none
  apiToken: tokenGoesHere
  owner: yourNickHere
plugins:
  sockbot-officehours: 
    startOfBusiness: 07:00 am
    endOfBusiness: 05:00 pm
    msg: We are currently out of the office.
```
2. Run `sockbot config.yml`
3. Observe bot behavior

