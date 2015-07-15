var Constellation = Package["constellation:console"].API;
    
Constellation.addTab({
  name: 'Velocity',
  headerContentTemplate: 'Constellation_velocity_header',
  mainContentTemplate: 'Constellation_velocity_main',
  menuContentTemplate: 'Constellation_velocity_menu',
  subMenuContentTemplate: 'Constellation_velocity_subMenu'
});

Constellation.excludeSessionKeysContaining('constellationVelocity.');

Tracker.autorun(function () {
  // This causes the html reporter to remain hidden if running in a Velocity mirror
  var state = Session.equals('constellationVelocity.isEnabled', true) && Session.equals('constellationVelocity.isMirror', false);
  Package["constellation:console"].Constellation.TabStates.set('constellation_plugin_Velocity', state);
});

suiteHasFailed = function (suite) {
  return !!VelocityTestReports.findOne({
    framework: suite.framework,
    ancestors: suite.ancestors,
    result: "failed"
  });
};

frameworkStatus = function (name) {
  var hasTests = VelocityTestReports.find({framework: name}).count() > 0;
  if (!hasTests) return "empty";

  var frameworkExecStatus = VelocityAggregateReports.findOne({name: name});
  var isComplete = (frameworkExecStatus && frameworkExecStatus.result === "completed");
  var hasFailed = !!VelocityTestReports.findOne({framework: name, result: "failed"});

  if (hasFailed)
    return "failed";
  else if (isComplete)
    return "passed";
  else
    return "pending";
};

function mochaPresent () {
  //XXX hard-coding mocha iframe support for now
  return !!VelocityAggregateReports.findOne({'name': 'mocha'});
}
function nightwatchPresent () {
  return !!VelocityAggregateReports.findOne({'name': 'nightwatch'});
}

Template.constellationVelocity.created = function () {
  // Only show widget when we know we are NOT running in a Velocity Mirror
  Session.setDefault('constellationVelocity.isMirror', true);
  // Determine if user has disabled velocity
  Meteor.call('velocity/isEnabled', function (error, result) {
    if (error) {
      // Log error. HTML Reporter will not be shown
      console.error(error);
    } else {
      Session.set('constellationVelocity.isEnabled', result);
    }
  });

  // Determine if session is running in a Velocity mirror or not
  Meteor.call('velocity/isMirror', function (error, result) {
    if (error) {
      // Log error. HTML Reporter will not be shown
      console.error(error);
    } else {
      Session.set('constellationVelocity.isMirror', result);
    }
  })
};

Template.constellationVelocity.helpers({
  resetting: function () {
    return Session.get('resettingVelocity')
  },
  frameworks: function () {
    return VelocityAggregateReports.find({name: {$nin: ["aggregateResult", "aggregateComplete"]}});
  },
  active: function (id) {
    return reamplify.store(id);
  },
  mochaPresent: mochaPresent,
  nightwatchPresent: nightwatchPresent
});

Template.constellationVelocityStatusWidget.helpers({
  isPassedOrPending: function () {
    var aggregateResult = VelocityAggregateReports.findOne({name: 'aggregateResult'});
	return (aggregateResult && aggregateResult.result === 'failed') ? false : true;
  }
});

Template.constellationVelocityReports.helpers({
  frameworkStatus: function () {
    return frameworkStatus(this.name)
  },
  isPassed: function (status) {
    return status === 'passed'
  },
  frameworkTotalTestCount: function () {
    return VelocityTestReports.find({framework: this.name}).count();
  },
  frameworkPassedTestCount: function () {
    return VelocityTestReports.find({framework: this.name, result: 'passed'}).count();
  },
  noFrameworkFiles: function () {
    // XXX presence of VelocityAggregateReports is a stand-in for
    // Velocity being loaded. This is a bit brittle. It breaks
    // if you call the Velocity "reset" method.
    var velocityIsLoaded = !!VelocityAggregateReports;
    return !velocityIsLoaded ? false : !VelocityTestFiles.findOne({targetFramework: this.name});
  },
  suites: function () {
    var result = [];
    var allReports = VelocityTestReports.find({framework: this.name}).fetch();
    // XXX for now, ancestors get reduced to a single-tier suite
    // Should we do fancier indenting, etc. for nested suites?
    // If not, forcing packages to concatenate their own "suite" string
    // instead of ancestors array would clean this up.
    if (allReports.length > 0) {

      var reports = _.map(allReports, function (report) {
        //must clone report.ancestors to not mutate report.ancestors with .reverse()
        var ancestors = report.ancestors ? _.clone(report.ancestors) : [];
        report.suite = ancestors.reverse().join(".");
        return report;
      });

      _.each(reports, function (report) {
        if (!_.findWhere(result, {suite: report.suite}))
          result.push({
            framework: report.framework,
            ancestors: report.ancestors, //needed for future queries
            suite: report.suite
          })
      });

      return result;
    }
  },
  suiteStatus: function () {
    return suiteHasFailed(this) ? 'failed' : 'passed';
  },
  suiteNotHidden: function () {
    if (!reamplify.store('showSuccessful'))
      return suiteHasFailed(this);
    return true;
  },
  reports: function () {
    return VelocityTestReports.find({
      framework: this.framework,
      ancestors: this.ancestors
    });
  }
});

Template.constellationVelocitySummary.helpers({
  anyFailed: function () {
    var aggregateResult = VelocityAggregateReports.findOne({name: 'aggregateResult'});
    if (aggregateResult && aggregateResult.result === 'failed') {
      return true;
    }
    return false;
  },
  totalTime: function () {
    var results = VelocityTestReports.find().fetch();

    var firstTimeStamp, lastTimestamp, lastDuration;
    _.each(results, function (result) {
      if (!firstTimeStamp || firstTimeStamp > result.timestamp.getTime()) {
        firstTimeStamp = result.timestamp.getTime();
      }
      if (!lastTimestamp || lastTimestamp < result.timestamp.getTime()) {
        lastTimestamp = result.timestamp.getTime();
        lastDuration = result.duration;
      }
    });

    //var ms = results
    //  .reduce(function (tot, i) { return tot + (i.duration || 0) }, 0);

    var ms = lastTimestamp + lastDuration - firstTimeStamp;

    if (ms >= 1000) return Math.round(ms / 1000) + ' s';

    return (ms ? ms : 0) + ' ms';
  },
  regularPlural: function (count, word, suffix) {
    if (count === 1) return word;
    return word + suffix;
  },
  totalFailedTestCount: function () {
    return VelocityTestReports.find({result: 'failed'}).count();
  },
  totalTestCount: function () {
    return VelocityTestReports.find().count();
  },
  totalPassedTestCount: function () {
    return VelocityTestReports.find({result: 'passed'}).count();
  }
});

Template.constellationVelocityControlPanel.helpers({
  mochaPresent: mochaPresent,
  nightwatchPresent: nightwatchPresent,
  showActive: function (self) {
    return reamplify.store(self) ? 'constellation-menu-button-active' : ''
  }
});

Template.constellationVelocityControlPanel.events({
  'click .runNightwatchTests': function () {
    Meteor.call('nightwatch/run');
  },
  'click button.control-toggle': function (e) {
    var $target = $(e.target);
    $(e.target).toggleClass('constellation-menu-button-active');
    reamplify.store($target.attr('data-velocity'), $target.hasClass('constellation-menu-button-active'));
	/*Tracker.flush();
	if (reamplify.store($target.attr('data-velocity'))) {
      window.location = '#constellationVelocityTestFiles';
	}*/
  }
});

Template.constellationVelocityTestReport.helpers({
  reportNotHidden: function () {
    if (this.result === "failed")
      return true;
    else {
      return (reamplify.store('showSuccessful'));
    }
  },
  failed: function () {
    return (this.result === "failed");
  }
});

Template.constellationVelocityTestFiles.helpers({
  testFiles: function () {
    return VelocityTestFiles.find();
  },
  isVisible: function () {
    return amplify.store('constellationVelocityTestFilesIsVisible') ? 'block' : 'none';
  }
});

Template.constellationVelocityLogs.helpers({
  logs: function () {
    return VelocityLogs.find();
  },
  isVisible: function () {
    return amplify.store('constellationVelocityLogsIsVisible') ? 'block' : 'none';
  }
});

Template.constellationVelocity.events({

});

Template.constellationVelocityReports.events({
  'click .copy-sample-tests': function (e) {
    Meteor.call('velocity/copySampleTests', {framework: this.name}, function () {
      // XXX This method for getting the new files to register is slow, but it
      // works. The reset method gets Velocity to see the new files.
      // We then disconnect altogether to prevent flapping of reactive
      // template elements (& overlay a notification to show the user
      // what's happening). Then we simply reload. Is there a way to do this
      // with a lighter touch?

      // make sure the user can see the demo tests, which generally pass.
      reamplify.store('showSuccessful', true);
      Session.set('resettingVelocity', true);
      Meteor.call('velocity/reset');
      Meteor.disconnect();
      location.reload();
    });
  }
});

Meteor.startup(function () {

  $(document).keydown(function (e) {
    if (e.keyCode === 86 && e.ctrlKey) {
      var state = Session.get('constellationVelocity.isEnabled');
      Session.set('constellationVelocity.isEnabled', !state);
    }
  });

});
