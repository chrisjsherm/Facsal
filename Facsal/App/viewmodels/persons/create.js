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

            appointmentTypes: ko.observableArray(),
            facultyTypes: ko.observableArray(),
            leaveTypes: ko.observableArray(),
            person: ko.observable(),
            rankTypes: ko.observableArray(),
            salary: ko.observable(),
            statusTypes: ko.observableArray(),
            units: ko.observableArray(),

            cancelPerson: cancelPerson,
            savePerson: savePerson,
        };

        errorhandler.includeIn(vm);

        return vm;

        function activate() {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });

            return true;
        }

        function attached() {

            $('html,body').animate({ scrollTop: 0 }, 0);

            var appointmentTypes = unitofwork.appointmentTypes.all()
                    .then(function (response) {
                        vm.appointmentTypes(response);
                    }),

                facultyTypes = unitofwork.facultyTypes.all()
                    .then(function (response) {
                        vm.facultyTypes(response);
                    }),

                leaveTypes = unitofwork.leaveTypes.all()
                    .then(function (response) {
                        vm.leaveTypes(response);
                    }),

                rankTypes = unitofwork.rankTypes.all()
                    .then(function (response) {
                        vm.rankTypes(response);
                    }),

                statusTypes = unitofwork.statusTypes.all()
                    .then(function (response) {
                        vm.statusTypes(response);
                    });

            unitofwork.units.all()
                .then(function (response) {
                    vm.units(response);

                    Q.fcall(initializePerson)
                        .then(function () {
                            vm.errors = ko.validation.group([
                                vm.person().pid,
                                vm.person().firstName,
                                vm.person().lastName,
                                vm.person().homeDepartmentId
                            ]);
                        });
                });

            return true;
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

            vm.person(undefined);
        }

        function initializePerson() {
            var person = unitofwork.persons.create();

            person.salaries.push(unitofwork.salaries.create({
                personId: person.id(),
                cycleYear: config.currentCycleYear,
                meritAdjustmentTypeId: config.meritAdjustmentTypeIdIndicatesNotReviewed
            }));

            //person.employments.push(unitofwork.employments.create({
            //    isHomeDepartment: true
            //}));

            return vm.person(person);
        }

        function savePerson() {
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
                    logger.log('Transitioning to the view for assigning employing departments to the new employee', response, system.getModuleId(vm), true);

                    setTimeout(navigateToEmploymentsEditor, 1800);
                })
                .fail(self.handleError);

            return true;
        }

        function cancelPerson() {
            unitofwork.rollback();
        }

        function navigateToEmploymentsEditor () {
            router.navigate('/employments/edit/' + vm.person().id());
        }
    });