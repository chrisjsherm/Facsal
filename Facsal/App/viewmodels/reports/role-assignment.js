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
        };

        errorhandler.includeIn(vm);

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

            return true;
        }

        function getData(departments) {
            var self = this;

            return $.each(departments, function (index, department) {
                //var predicate = breeze.Predicate.create(
                //    'roleAssignments', 'any', 'role.departmentId', '==', department.id()),

                //    expansionCondition = 'roleAssignments.Role',

                //    users = unitofwork.users.find(predicate, expansionCondition)
                //        .then(function (response) {
                //            return vm.departmentData.push({
                //                department: department,
                //                users: response
                //            });
                //        });

                var predicate = breeze.Predicate.create(
                    'departmentId', '==', department.id()),

                    expansionCondition = 'roleAssignments, roleAssignments.User',

                    roles = unitofwork.roles.find(predicate, expansionCondition)
                        .then(function (response) {
                            return vm.departmentData.push({
                                department: department,
                                roles: response
                            });
                        });

                Q.all([
                    roles
                ]).fail(self.handleError);
            });
        }
    });