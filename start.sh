#!/bin/bash

/usr/local/bin/node /Users/markgable/Sites/production/collectorsDB-collect/fetch_data.js

/usr/local/bin/node /Users/markgable/Sites/production/collectorsDB-collect/save_diff.js

/usr/local/bin/node /Users/markgable/Sites/production/collectorsDB-collect/save_store.js

/usr/local/bin/node /Users/markgable/Sites/production/collectorsDB-collect/fetch_additional_images.js

/usr/local/bin/node /Users/markgable/Sites/production/collectorsDB-collect/save_index.js

/Users/markgable/Sites/production/collectorsDB-collect/prime_elasticsearch.sh