define(['global/session', 'services/errorhandler', 'services/logger',
    'plugins/router', 'durandal/system'],
    function (session, errorhandler, logger, router, system) {

        var unitofwork = session.unitofwork(),

            appointmentTypes = ko.observableArray(),

            facultyTypes = ko.observableArray(),

            leaveTypes = ko.observableArray(),

            meritAdjustmentTypes = ko.observableArray(),

            rankTypes = ko.observableArray(),

            adjustmentTypes = ko.observableArray(),

            statusTypes = ko.observableArray(),

            units = ko.observableArray();

        var vm = {
            activate: activate,
            attached: attached,
            deactivate: deactivate,

            adjustmentVMs: ko.observableArray(),
            appointmentTypes: appointmentTypes,
            employments: ko.observableArray(),
            employmentVMs: ko.observableArray(),
            facultyTypes: facultyTypes,
            leaveTypes: leaveTypes,
            meritAdjustmentTypes: meritAdjustmentTypes,
            rankTypes: rankTypes,
            salary: ko.observable(),
            salaryId: ko.observable(),

            adjustmentTypes: adjustmentTypes,
            statusTypes: statusTypes,
            units: units,

            cancelChanges: cancelChanges,
            saveChanges: saveChanges,
        };

        errorhandler.includeIn(vm);
        
        return vm;

        function activate(salaryId) {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });
            vm.salaryId(salaryId);
            return true;
        }

        function attached(view) {

            var self = this;
            
            $('html,body').animate({ scrollTop: 0 }, 0);

            var appointmentTypes = unitofwork.appointmentTypes.all()
                .then(function (response) {
                    self.appointmentTypes(response);
                });

            var facultyTypes = unitofwork.facultyTypes.all()
                .then(function (response) {
                    self.facultyTypes(response);
                });

            var leaveTypes = unitofwork.leaveTypes.all()
                .then(function (response) {
                    self.leaveTypes(response);
                });

            var meritAdjustmentTypes = unitofwork.meritAdjustmentTypes.all()
                .then(function (response) {
                    self.meritAdjustmentTypes(response);
                });

            var rankTypes = unitofwork.rankTypes.all()
                .then(function (response) {
                    self.rankTypes(response);
                });

            var adjustmentTypes = unitofwork.specialAdjustmentTypes.all()
                .then(function (response) {
                    self.adjustmentTypes(response);
                });

            var statusTypes = unitofwork.statusTypes.all()
                .then(function (response) {
                    self.statusTypes(response);
                });

            var units = unitofwork.units.all()
                .then(function (response) {
                    vm.units(response);
                });

            var predicate = new breeze.Predicate('id', '==', vm.salaryId());
            var expansionProperties = 'person, specialSalaryAdjustments, ' +
                'leaveType';
            var salary = unitofwork.salaries.find(predicate, expansionProperties)
                .then(function (response) {
                    if (response.length > 0)
                    {
                        var salary = response[0];

                        var adjustmentHash = createSalaryAdjustmentHash(salary);

                        var adjustmentMapVMs = $.map(self.adjustmentTypes(), function (adjustment) {
                            return {
                                adjustment: adjustment,
                                isSelected: ko.observable(!!adjustmentHash[adjustment.id()])
                            };
                        });

                        vm.adjustmentVMs(adjustmentMapVMs);

                        vm.salary(salary);

                        var p1 = new breeze.Predicate('personId', '==', vm.salary().person().id()),
                            expansionProperties = 'department';

                        unitofwork.employments.find(p1, expansionProperties)
                            .then(function (response) {
                                vm.employments(response);
                            });

                        vm.errors = ko.validation.group([
                            vm.salary().meritAdjustmentTypeId,
                            vm.salary().meritAdjustmentNote,
                            vm.salary().specialAdjustmentNote,
                            vm.salary().specialSalaryAdjustments
                        ]);
                    }
                });

            Q.all([
                appointmentTypes,
                facultyTypes,
                leaveTypes,
                meritAdjustmentTypes,
                rankTypes,
                salary,
                adjustmentTypes,
                statusTypes
            ]).fail(self.handleError);

            return true;
        }

        function deactivate() {
            vm.salary(undefined);
            vm.employments(undefined);
            vm.employmentVMs(undefined);

            return true;
        }

        function saveChanges() {
            applySelectionsToSalaryAdjustmentMap();

            if (vm.errors().length !== 0) {
                vm.errors.showAllMessages();
                logger.logError('Errors detected.', null, system.getModuleId(vm), true);
                return;
            }

            if (!unitofwork.hasChanges()) {
                return logger.log('No changes were detected.', null, system.getModuleId(vm), true);
            }

            return unitofwork.commit()
                .then(function (response) {
                    logger.logSuccess('Save successful', response, system.getModuleId(vm), true);
                    return router.navigateBack();
                });
        }

        function cancelChanges() {
            unitofwork.rollback();
            return router.navigateBack();
        }

        function createSalaryAdjustmentHash(salary) {
            var adjustmentHash = {};

            $.each(salary.specialSalaryAdjustments(), function (index, map) {
                adjustmentHash[map.specialAdjustmentTypeId()] = map;
            });

            return adjustmentHash;
        }

        function applySelectionsToSalaryAdjustmentMap() {
            var salary = vm.salary(),

                mapVMs = vm.adjustmentVMs(),

                adjustmentHash = createSalaryAdjustmentHash(salary);

            $.each(mapVMs, function (index, mapVM) {
                var map = adjustmentHash[mapVM.adjustment.id()];

                if (mapVM.isSelected()) {
                    // User selected this adjustment.
                    if (!map) {
                        // No existing map, so create one.
                        map = unitofwork.specialSalaryAdjustments.create({
                            salaryId: salary.id(),
                            specialAdjustmentTypeId: mapVM.adjustment.id()
                        });
                    }
                } else {
                    // User unselected this adjustment.
                    if (map) {
                        // If map exists, delete it.
                        map.entityAspect.setDeleted();
                    }
                }
            });
        }
    });