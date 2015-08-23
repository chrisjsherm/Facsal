define(['global/session', 'services/errorhandler',
    'services/config'],
    function (session, errorhandler, config) {

        var unitofwork = session.unitofwork();

        var vm = {
            activate: activate,
            deactivate: deactivate,

            departmentData: ko.observableArray(),
            departmentId: ko.observable(),
            unitId: ko.observable(),

            downloadExcel: dowloadExcel,

            summaryMerit: ko.observableArray(),

        };

        errorhandler.includeIn(vm);
        vm.departmentData.subscribe(function (newValue) {

            ko.utils.arrayForEach(newValue, function (row) {
                var i = newValue.indexOf(row);
                if (i == newValue.length - 1) {
                    salariesSorted = row.salaries.sort(function (left, right) {
                        return left.meritIncrease() === right.meritIncrease() ? 0 : (left.meritIncrease() > right.meritIncrease() ? -1 : 1)
                    });
                    var total = 0;
                    ko.utils.arrayForEach(salariesSorted, function (salary) {
                        total += salary.meritIncrease();
                    });
                    var mean = total / salariesSorted.length;
                    var median = getMedian(salariesSorted);

                    vm.summaryMerit.push({
                        department: row.department.name(),
                        highestMerit: salariesSorted[0],
                        lowestMerit: salariesSorted[salariesSorted.length - 1],
                        meanMerit: ko.observable(mean).extend({ currency: [0] }),
                        medianMerit: ko.observable(median).extend({ currency: [0] })
                    });
                }
            });

        });

        return vm;


        function activate(unitId, departmentId) {
            var self = this;

            vm.unitId(unitId);
            vm.departmentId(departmentId);

            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });

            if (departmentId) {
                var department = unitofwork.departments.withId(departmentId)
                    .then(function (response) {
                        getData([response.entity]);

                    });

                Q.all([
                    department
                ]).fail(self.handleError);


            } else {
                var predicate = breeze.Predicate.create(
                    'toLower(unitId)', '==', unitId),

                    departments = unitofwork.departments.find(predicate)
                        .then(function (response) {
                            getData(response);
                        });

                Q.all([
                    departments
                ]).fail(self.handleError);
            }

            return true;
        }

        function deactivate() {
            vm.departmentData([]);
            vm.summaryMerit([]);
            return true;
        }

        function dowloadExcel() {
            if (vm.departmentId()) {
                window.location.assign('/ReportFile/DepartmentMeritSummary/' + vm.departmentId());
            } else if (vm.unitId()) {
                window.location.assign('/ReportFile/UnitMeritSummary/' + vm.unitId());
            }
        }

        function getData(departments) {
            var self = this;

            return $.each(departments, function (index, department) {
                var p1 = breeze.Predicate.create(
                    'person.employments', 'any', 'departmentId', '==', department.id()),

                    p2 = breeze.Predicate.create(
                    'cycleYear', '==', config.currentCycleYear),

                    predicate = breeze.Predicate.and([p1, p2]),
                    expansionCondition = 'person';

                var salaries = unitofwork.salaries.find(predicate, expansionCondition)
                    .then(function (response) {
                        return vm.departmentData.push({
                            department: department,
                            salaries: response
                        });
                    });

                Q.all([
                    salaries
                ]).fail(self.handleError);
            });
        }

        function getMedian(array) {
            var half = Math.floor(array.length / 2);

            if (array.length % 2)
                return array[half].meritIncrease();
            else
                return (array[half - 1].meritIncrease() + array[half].meritIncrease()) / 2.0;
        }

    });