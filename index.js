// Root entry that delegates to the mobile workspace entry.
// This file is required because the Android bundler resolves './index.js' from the
// project root during a release build. We forward to the mobile app's entry.
module.exports = require('./mobile/index.js');
