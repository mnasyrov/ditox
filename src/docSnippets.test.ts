/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import {createContainer, injectable, token} from './index';

describe('Usage', () => {
  test('Workflow example', () => {
    type LoggerConfig = {level: string};

    class Logger {
      constructor(config: LoggerConfig) {}
    }

    class UserService {
      constructor(logger: Logger) {}
    }

    const TOKENS = {
      LoggerConfig: token<LoggerConfig>(),
      Logger: token<Logger>(),
      UserService: token<UserService>(),
    };

    const container = createContainer();
    container.bindValue(TOKENS.LoggerConfig, {level: 'debug'});
    container.bindFactory(
      TOKENS.Logger,
      injectable(
        (config: LoggerConfig) => new Logger(config),
        TOKENS.LoggerConfig,
      ),
    );
    container.bindFactory(
      TOKENS.UserService,
      injectable(
        (logger: Logger) => new UserService(logger),
        TOKENS.LoggerConfig,
      ),
    );

    const logger = container.resolve(TOKENS.Logger);
    const userService = container.resolve(TOKENS.UserService);
  });
});
