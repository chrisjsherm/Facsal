define(['global/session', 'services/errorhandler',
    'services/logger', 'services/config', 'durandal/system',
    'plugins/router'],
    function (session, errorhandler, logger, config, system,
        router) {

        var unitofwork = session.unitofwork();

        var vm = {
            activate: activate,
            attached: attached,
            canDeactivate: canDeactivate,
            deactivate: deactivate,

            department: ko.observable(),
            units: ko.observableArray(),

            cancelDepartment: cancelDepartment,
            saveDepartment: saveDepartment,
        };

        errorhandler.includeIn(vm);

        return vm;

        function activate() {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });

            return true;
        }

        function attached() {

            $('html,body').animate({ scrollTop: 0 }, 0);

            return unitofwork.units.all()
                .then(function (response) {
                    vm.units(response);

                    Q.fcall(initializeDepartment)
                        .then(function (department) {
                            vm.errors = ko.validation.group([
                                vm.department().name,
                                vm.department().id,
                                vm.department().unitId,
                                vm.department().sequenceValue
                            ]);
                        })
                });
        }

        function canDeactivate() {
            if (unitofwork.hasChanges()) {
                return confirm('You have unsaved changes. Do you want to discard them?');
            }

            return true;
        }

        function deactivate() {
            if (unitofwork.hasChanges()) {
                unitofwork.rollback();
            }

            vm.department(undefined);
        }

        function initializeDepartment() {
            console.log('Initializing department.');
            var department = unitofwork.departments.create({
            });

            vm.department(department);
            return vm.department().unitId(vm.units()[0].id());
        }

        function saveDepartment() {
            var self = this;

            if (vm.errors().length !== 0) {
                vm.errors.showAllMessages();
                logger.logError('Errors detected.', null, system.getModuleId(vm), true);
                return;
            }
            if (!unitofwork.hasChanges()) {
                return logger.log('No changes were detected.', null, system.getModuleId(vm), true);
            }
            unitofwork.commit()
                .then(function (response) {
                    logger.logSuccess('Save successful', response, system.getModuleId(vm), true);
                })
                .fail(self.handleError);
        }

        function cancelDepartment() {
            var rejectedChanges = unitofwork.rollback();

            return logger.log('Changes were discarded.', rejectedChanges, system.getModuleId(vm), true);
        }
    });