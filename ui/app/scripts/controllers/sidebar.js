'use strict';

angular.module('app').controller('SidebarCtrl', ['$rootScope', '$scope', '$location', 'User', 'ReportService', 'WidgetDefinitions',
  function($rootScope, $scope, $location, user, ReportService, WidgetDefinitions) {

  setupWizard();

  $scope.user = user;
  $scope.search = {};
  $scope.showLoading = false;
  $scope.widgetDefs = WidgetDefinitions;
  $scope.reports = [];

  // The report selected for update or delete.
  $scope.report = {};

  var editReportDialogId = '#edit-report-dialog';
  var deleteReportDialogId = '#delete-report-dialog';

  // Retrieve reports when the user logs in
  $scope.$watch('user.authenticated', function() {
    if ($scope.user.authenticated) {
      $scope.getReports();
    } else {
      $scope.reports = [];
    }
  });

  $scope.getReports = function() {
    $scope.showLoading = true;
    ReportService.getReports().then(function(response) {
      var contentType = response.headers('content-type');
      var page = MarkLogic.Util.parseMultiPart(response.data, contentType);
      $scope.reports = page.results;
      $scope.showLoading = false;
    }, function() {
      $scope.showLoading = false;
    });
  };

  $scope.addWidget = function(widgetDef) {
    ReportService.getDashboardOptions($scope.reportDashboardOptions).addWidget({
      name: widgetDef.name
    });
  };

  $scope.gotoDashboard = function(uri) {
    $location.path('/reportdash/' + encodeURIComponent(uri));
  };

  $scope.createReport = function() {
    $location.path('/newreport');
  };

  $scope.showReportRemover = function(report) {
    $scope.report.uri = report.uri;
    MarkLogic.Util.showModal(deleteReportDialogId);
  };

  $scope.showReportEditor = function(report) {
    $scope.report.uri = report.uri;

    MarkLogic.Util.showLoader();

    ReportService.getReport($scope.report.uri).then(function(response) {
      MarkLogic.Util.hideLoader();

      if (response.status === 200) {
        $scope.setReport(response.data);
        MarkLogic.Util.showModal(editReportDialogId);
      } else {
        MessageCenter.showMessage(response.data.message);
      }
    });
  };

  $scope.setReport = function(report) {
    angular.extend($scope.report, report);
  };

  $scope.setOption = function(option) {
    $scope.report.privacy = option;
  };

  $scope.isActive = function(option) {
    return option === $scope.report.privacy;
  };

  $scope.deleteReport = function() {
    MarkLogic.Util.showLoader();

    ReportService.deleteReport($scope.report.uri).then(function(response) {
      MarkLogic.Util.hideLoader();
      MarkLogic.Util.hideModal(deleteReportDialogId);

      $rootScope.$broadcast('ReportDeleted', $scope.report.uri);

      $scope.getReports();
    });
  };

  $scope.updateReport = function() {
    //if ($scope.editReportForm.$valid) {
      MarkLogic.Util.showLoader();

      ReportService.updateReport($scope.report).then(function(response) {
        MarkLogic.Util.hideLoader();
        MarkLogic.Util.hideModal(editReportDialogId);

        if (response.data.success) {
          $scope.updateTableRow();
        }
      });
    //}
  };

  $scope.updateTableRow = function() {
    for (var i = 0; i < $scope.reports.length; i++) {
      var report = $scope.reports[i];
      if (report.uri === $scope.report.uri) {
        report.name = $scope.report.name;
        report.description = $scope.report.description;
        break;
      }
    }
  };

  $scope.$on('ReportCreated', function(event, report) { 
    $scope.reports.push(report);
  });

  $scope.$on('ReportDeleted', function(event, reportUri) {
    for (var i = 0; i < $scope.reports.length; i++) {
      if (reportUri === $scope.reports[i].uri) {
        // The first parameter is the index, the second 
        // parameter is the number of elements to remove.
        $scope.reports.splice(i, 1);
        break;
      }
    }
  });
}]);
