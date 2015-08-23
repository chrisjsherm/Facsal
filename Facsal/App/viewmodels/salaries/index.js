define(['global/session', 'services/errorhandler',
    'services/config'],
    function (session, errorhandler, config) {
        var unitofwork = session.unitofwork(),

            units = ko.observableArray(),
            
            selectedDepartmentId = ko.observable(),

            attached = function () {
                var self = this;

                if (units() == false) {
                    unitofwork.units.all()
                        .then(function (response) {
                            self.units(response);
                            selectedDepartmentId(response[0].departments()[0].id())
                        });
                }

                return true;
            };

        var vm = {
            activate: activate,
            attached: attached,

            salaries: ko.observableArray(),
            selectedDepartmentId: selectedDepartmentId,
            selectedStatusTypeId: ko.observable(config.activeStatusTypeId),
            statusTypes: ko.observableArray(),
            units: units,
        };

        vm.selectedDepartmentId.subscribe(function (newValue) {
            if (newValue === 'Select a department...' ||
                newValue === undefined ||
                newValue === '') {
                return vm.salaries([]);
            }

            getSalaries(newValue, vm.selectedStatusTypeId());
        });

        vm.selectedStatusTypeId.subscribe(function (newValue) {
            getSalaries(vm.selectedDepartmentId(), newValue);
        })

        errorhandler.includeIn(vm);

        return vm;

        function activate() {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });

            unitofwork.statusTypes.all()
                .then(function (response) {
                    vm.statusTypes(response);
                });

            return true;
        }

        function getSalaries(departmentId, statusTypeId) {
            if (departmentId !== undefined &&
                departmentId !== 'Select a department...' &&
                statusTypeId !== undefined) {
                var predicate = breeze.Predicate
                    .create('person.employments', 'any', 'departmentId', '==', departmentId)
                    .and('cycleYear', '==', config.currentCycleYear)
                    .and('person.statusTypeId', '==', statusTypeId);
                var expansionProperty = 'person';

                return unitofwork.salaries.find(predicate, expansionProperty)
                    .then(function (response) {
                        vm.salaries(response);
                    });
            }
        }
    });