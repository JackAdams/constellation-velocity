Package.describe({
  name: 'constellation:velocity',
  summary: 'Reactive Velocity test reports in Constellation',
  version: '0.1.0',
  git: 'https://github.com/JackAdams/constellation-velocity.git',
  debugOnly: true
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');
  api.use('velocity:core@0.6.3', 'client');

  api.use(['underscore', 'templating','amplify@1.0.0', 'less', 'tracker', 'session'], 'client');
  
  api.use('constellation:console@1.0.5');

  api.addFiles('lib/reamplify.js', 'client');

  api.addFiles('lib/velocity.js', 'client');
  api.addFiles('lib/client-report.html', 'client');
  api.addFiles('lib/client-report.js', 'client');
  api.addFiles('lib/client-report.less', 'client');
  
});
