define(['global/session', 'services/errorhandler',
    'services/logger', 'plugins/router', 'durandal/system'],
    function (session, errorhandler, logger, router, system) {

        var unitofwork = session.unitofwork(),

            vm = {
                activate: activate,
                attached: attached,

                selectedDepartmentId: ko.observable(),
                units: ko.observableArray(),
                users: ko.observableArray(),
            };

        errorhandler.includeIn(vm);

        vm.selectedDepartmentId.subscribe(function (newValue) {
            if (newValue === '' ||
                newValue === 'Choose...' ||
                newValue === undefined) {
                return vm.users([]);
            }

            var users = unitofwork.usersByDepartment(newValue)
                .then(function (response) {
                    $.each(response, function (index) {
                        response[index].formattedCreatedDate = ko.computed(function () {
                            return moment(response[index].createdDate).format('MM/DD/YYYY');
                        });
                    });
                    vm.users(response);
                })
                .fail(function (response) {
                    logger.logError(response.statusText, response, system.getModuleId(vm), true);
                });

            return true;
        });

        return vm;

        function activate() {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });
            return true;
        }

        function attached() {
            var self = this;

            if (session.userIsInRole('manage-all')) {
                unitofwork.units.all()
                    .then(function (response) {
                        vm.units(response);
                        vm.selectedDepartmentId(response[0].departments()[0].id());
                    });
            } else {
                var units = unitofwork.manageableUnits.all()
                    .then(function (response) {
                        vm.units(response);
                        vm.selectedDepartmentId(response[0].departments()[0].id());
                    });

                Q.all([units]).fail(self.handleError);
            }

            return true;
        }
    });