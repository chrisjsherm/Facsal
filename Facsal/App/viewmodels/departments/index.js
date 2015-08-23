define(['global/session', 'services/errorhandler',
    'services/config', 'services/logger', 'durandal/system'],
    function (session, errorhandler, config, logger, system) {
        var unitofwork = session.unitofwork(),

            units = ko.observableArray(),

            selectedDepartmentId = ko.observable(),

            attached = function () {
                var self = this;

                if (units() == false) {
                    unitofwork.units.all()
                        .then(function (response) {
                            self.units(response);
                            selectedDepartmentId(response[0].departments()[0].id());
                        });
                }

                return true;
            };

        var vm = {
            activate: activate,
            attached: attached,

            employeeCount: ko.observable(),
            selectedDepartment: ko.observable(),
            selectedDepartmentId: selectedDepartmentId,
            units: units,

            cancelChanges: cancelChanges,
            deleteDepartment: deleteDepartment,
            saveChanges: saveChanges,
        };

        vm.selectedDepartmentId.subscribeChanged(function (newValue, oldValue) {
            console.log('selectedDepartmentId change: ' + newValue);
            if (newValue === 'Select a department...' ||
                newValue === undefined ||
                newValue === '') {
                return;
            }

            return getEmployeeCount(newValue);
        });

        errorhandler.includeIn(vm);

        return vm;

        function activate() {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });

            return true;
        }

        function saveChanges() {

            if (!unitofwork.hasChanges()) {
                return logger.log('No changes were detected.', null, system.getModuleId(vm), true);
            }

            logger.log('Attempting save.', null, system.getModuleId(vm), true);

            return unitofwork.commit()
                .then(function (response) {
                    return logger.logSuccess('Save successful', response, system.getModuleId(vm), true);
                })
                .fail(function (error) {
                    var rejectedChanges = unitofwork.rollback();
                    vm.handleError(error);
                });
        }

        function cancelChanges() {

            if (!unitofwork.hasChanges()) {
                return logger.log('No changes were detected.', null, system.getModuleId(vm), true);
            }

            var rejectedChanges = unitofwork.rollback();

            return logger.log('Changes were discarded.', rejectedChanges, system.getModuleId(vm), true);
        }

        function getEmployeeCount(departmentId) {
            if (departmentId !== undefined &&
                departmentId !== 'Select a department...') {
                var predicate = breeze.Predicate
                    .create('departmentId', '==', departmentId)

                console.log('Getting employee count for departmentId: ' + departmentId);
                vm.employeeCount('Loading...');
                return unitofwork.employments.count(predicate)
                    .then(function (response) {
                        console.log('getEmployeeCount response: ' + response);
                        vm.employeeCount(parseInt(response, 10));

                        var predicate = new breeze.Predicate('id', '==', departmentId);
                        return unitofwork.departments.find(predicate)
                            .then(function (data) {
                                console.log('Department query response: ' + data[0].name());
                                vm.selectedDepartment(data[0]);
                            });

                    });
            }
        }

        function deleteDepartment() {
            if (vm.employeeCount > 0) {
                return logger.logError('Cannot delete departments with employees.', null, system.getModuleId(vm), true);
            }

            var predicate = new breeze.Predicate('departmentId', '==', vm.selectedDepartment().id());
            return unitofwork.roles.find(predicate)
                .then(function (response) {
                    return $.each(response, function (index, value) {
                        unitofwork.roles.delete(value);
                    });
                }).then(function () {
                    unitofwork.departments.delete(vm.selectedDepartment());
                    return logger.log('Department marked for deletion. Click save to continue.', null, system.getModuleId(vm), true);
                });
        }
    });