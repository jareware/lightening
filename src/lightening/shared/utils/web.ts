import { NO_LOGGING } from 'lightening/shared/utils/logging';
import { Config } from 'lightening/shared/utils/config';
import Static from 'node-static';
import { createServer } from 'http';

export function createWebServer(config: Config, log = NO_LOGGING) {
  log.info(`Starting static file server`, config);

  var file = new Static.Server(config.LIGHTENING_WEB_ROOT, {
    // https://www.npmjs.com/package/node-static
    cache: false,
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });

  createServer((request, response) =>
    request
      .addListener('end', () =>
        // Handle all requests as requests for static files
        file.serve(request, response),
      )
      .resume(),
  ).listen(config.LIGHTENING_WEB_PORT);
}
