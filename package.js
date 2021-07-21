Package.describe({
  name: 'constellation:velocity',
  summary: 'Reactive Velocity test reports in Constellation',
  version: '0.4.11',
  documentation: 'README.md',
  git: 'https://github.com/JackAdams/constellation-velocity.git',
  debugOnly: true
});

Package.onUse(function (api) {
  api.versionsFrom(['1.8.2', '2.3']);
  api.use('velocity:core@0.10.0', 'client');

  api.use(['underscore', 'templating@1.3.2', 'amplify@1.0.0', 'less@2.5.0_3', 'tracker', 'session'], 'client');
  
  api.use('constellation:console@1.4.11');

  api.addFiles('lib/reamplify.js', 'client');

  api.addFiles('lib/velocity.less', 'client');
  api.addFiles('lib/velocity.js', 'client');
  api.addFiles('lib/client-report.html', 'client');
  api.addFiles('lib/client-report.js', 'client');
  api.addFiles('lib/client-report.less', 'client');
  
  api.imply('constellation:console');
});
