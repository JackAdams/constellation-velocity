Package.describe({
  name: 'constellation:velocity',
  summary: 'Reactive Velocity test reports in Constellation',
  version: '0.2.3',
  documentation: 'README.md',
  git: 'https://github.com/JackAdams/constellation-velocity.git',
  debugOnly: true
});

Package.onUse(function(api) {
  api.versionsFrom('1.1');
  api.use('velocity:core@0.6.3', 'client');

  api.use(['underscore', 'templating','amplify@1.0.0', 'less', 'tracker', 'session'], 'client');
  
  api.use('constellation:console@1.1.3');

  api.addFiles('lib/reamplify.js', 'client');

  api.addFiles('lib/velocity.js', 'client');
  api.addFiles('lib/client-report.html', 'client');
  api.addFiles('lib/client-report.js', 'client');
  api.addFiles('lib/client-report.less', 'client');
  
  api.imply('constellation:console');
});
