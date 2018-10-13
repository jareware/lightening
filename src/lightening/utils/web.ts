import { NO_LOGGING } from 'lightening/utils/logging';
import { Config } from 'lightening/utils/config';
import Static from 'node-static';
import { createServer } from 'http';

export function createWebServer(config: Config, log = NO_LOGGING) {
  log.info(`Starting static file server`, config);

  var file = new Static.Server(config.LIGHTENING_WEB_ROOT, { cache: false });

  createServer((request, response) =>
    request
      .addListener('end', () =>
        // Handle all requests as requests for static files
        file.serve(request, response),
      )
      .resume(),
  ).listen(config.LIGHTENING_WEB_PORT);
}